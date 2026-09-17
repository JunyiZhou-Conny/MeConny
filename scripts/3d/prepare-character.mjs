import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [sourceArg, outputArg, targetsArg = '40000,80000,140000', regionsArg] = process.argv.slice(2);
if (!sourceArg || !outputArg) throw new Error('Usage: node scripts/3d/prepare-character.mjs input.glb output-directory [triangle-counts] [--regions=skin,hair,shirt]');
const source = resolve(sourceArg);
const outputDirectory = resolve(outputArg);
const targets = targetsArg.split(',').map(Number);
assert(targets.length && targets.every((value) => Number.isSafeInteger(value) && value > 0), 'Triangle counts must be positive integers');
const regionBudgets = regionsArg?.startsWith('--regions=') ? regionsArg.slice(10).split(',').map(Number) : null;
assert(!regionsArg || (regionBudgets?.length === 3 && regionBudgets.every((value) => Number.isSafeInteger(value) && value > 0)), 'Regional budgets must be --regions=skin,hair,shirt triangle counts');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const align = (value) => Math.ceil(value / 4) * 4;
const bytesOf = (array) => Buffer.from(array.buffer, array.byteOffset, array.byteLength);

function readGlb(input) {
  assert.equal(input.toString('ascii', 0, 4), 'glTF');
  assert.equal(input.readUInt32LE(4), 2);
  assert.equal(input.readUInt32LE(8), input.length);
  const chunks = new Map();
  for (let offset = 12; offset < input.length;) {
    const length = input.readUInt32LE(offset);
    const type = input.readUInt32LE(offset + 4);
    assert(offset + 8 + length <= input.length && !chunks.has(type), 'Invalid GLB chunk');
    chunks.set(type, input.subarray(offset + 8, offset + 8 + length));
    offset += 8 + length;
  }
  return { json: JSON.parse(chunks.get(0x4e4f534a).toString()), binary: chunks.get(0x004e4942) };
}

function writeGlb(json, binary) {
  const jsonBytes = Buffer.from(JSON.stringify(json));
  const paddedJson = Buffer.alloc(align(jsonBytes.length), 0x20);
  jsonBytes.copy(paddedJson);
  const output = Buffer.alloc(12 + 8 + paddedJson.length + 8 + align(binary.length));
  output.write('glTF');
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(paddedJson.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  paddedJson.copy(output, 20);
  const offset = 20 + paddedJson.length;
  output.writeUInt32LE(align(binary.length), offset);
  output.writeUInt32LE(0x004e4942, offset + 4);
  binary.copy(output, offset + 8);
  return output;
}

function readAccessor(document, index, type, componentType) {
  const accessor = document.json.accessors[index];
  assert(accessor && accessor.type === type && accessor.componentType === componentType && !accessor.sparse && !accessor.normalized, 'Unsupported accessor');
  const view = document.json.bufferViews[accessor.bufferView];
  assert(view && view.buffer === 0 && !view.extensions, 'Expected an uncompressed embedded buffer');
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3 }[type];
  const stride = view.byteStride ?? components * 4;
  const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const ArrayType = componentType === 5126 ? Float32Array : Uint32Array;
  const array = new ArrayType(accessor.count * components);
  assert(offset + (accessor.count - 1) * stride + components * 4 <= (view.byteOffset ?? 0) + view.byteLength, 'Accessor exceeds buffer view');
  for (let i = 0; i < accessor.count; i++) for (let c = 0; c < components; c++) {
    const position = offset + i * stride + c * 4;
    array[i * components + c] = componentType === 5126 ? document.binary.readFloatLE(position) : document.binary.readUInt32LE(position);
  }
  assert(array.every(Number.isFinite), 'Non-finite attribute');
  return array;
}

function weld(primitive) {
  const count = primitive.positions.length / 3;
  const vertices = new Float32Array(count * 8);
  for (let i = 0; i < count; i++) {
    vertices.set(primitive.positions.subarray(i * 3, i * 3 + 3), i * 8);
    vertices.set(primitive.normals.subarray(i * 3, i * 3 + 3), i * 8 + 3);
    vertices.set(primitive.uvs.subarray(i * 2, i * 2 + 2), i * 8 + 6);
  }
  const bits = new Uint32Array(vertices.buffer);
  const table = new Int32Array(2 ** Math.ceil(Math.log2(count * 2))).fill(-1);
  const next = new Int32Array(count).fill(-1);
  const remap = new Uint32Array(count);
  const representatives = [];
  for (let i = 0; i < count; i++) {
    let hash = 2166136261;
    for (let c = 0; c < 8; c++) hash = Math.imul(hash ^ bits[i * 8 + c], 16777619);
    const bucket = hash & (table.length - 1);
    let existing = table[bucket];
    while (existing !== -1) {
      let equal = true;
      for (let c = 0; c < 8; c++) if (bits[i * 8 + c] !== bits[existing * 8 + c]) { equal = false; break; }
      if (equal) break;
      existing = next[existing];
    }
    if (existing !== -1) remap[i] = remap[existing];
    else {
      remap[i] = representatives.length;
      representatives.push(i);
      next[i] = table[bucket];
      table[bucket] = i;
    }
  }
  const positions = new Float32Array(representatives.length * 3);
  const attributes = new Float32Array(representatives.length * 5);
  for (let i = 0; i < representatives.length; i++) {
    const sourceOffset = representatives[i] * 8;
    positions.set(vertices.subarray(sourceOffset, sourceOffset + 3), i * 3);
    attributes.set(vertices.subarray(sourceOffset + 3, sourceOffset + 8), i * 5);
  }
  return { positions, attributes, indices: primitive.indices.map((index) => remap[index]) };
}

function compact(primitive, indices) {
  const [remap, count] = MeshoptEncoder.reorderMesh(indices, true, true);
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  for (let i = 0; i < remap.length; i++) if (remap[i] !== 0xffffffff) {
    const destination = remap[i];
    positions.set(primitive.positions.subarray(i * 3, i * 3 + 3), destination * 3);
    normals.set(primitive.attributes.subarray(i * 5, i * 5 + 3), destination * 3);
    uvs.set(primitive.attributes.subarray(i * 5 + 3, i * 5 + 5), destination * 2);
  }
  return { positions, normals, uvs, indices: count <= 65535 ? Uint16Array.from(indices) : indices };
}

async function partition(document, primitive) {
  const material = document.json.materials[document.json.meshes[0].primitives[0].material];
  const texture = document.json.textures[material.pbrMetallicRoughness.baseColorTexture.index];
  const image = document.json.images[texture.source];
  const view = document.json.bufferViews[image.bufferView];
  const bytes = document.binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
  const { data, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const linear = Array.from({ length: 256 }, (_, value) => value / 255 <= 0.04045 ? value / 255 / 12.92 : ((value / 255 + 0.055) / 1.055) ** 2.4);
  const positions = primitive.positions;
  const min = [Infinity, Infinity, Infinity]; const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i++) { min[i % 3] = Math.min(min[i % 3], positions[i]); max[i % 3] = Math.max(max[i % 3], positions[i]); }
  const height = max[1] - min[1];
  const centerZ = (min[2] + max[2]) / 2;
  const regions = [{ name: 'skin', indices: [] }, { name: 'hair', indices: [] }, { name: 'shirt', indices: [] }];
  for (let i = 0; i < primitive.indices.length; i += 3) {
    const triangle = primitive.indices.subarray(i, i + 3);
    let u = 0, v = 0, y = 0, z = 0;
    for (const index of triangle) {
      u += primitive.attributes[index * 5 + 3] / 3;
      v += primitive.attributes[index * 5 + 4] / 3;
      y += positions[index * 3 + 1] / 3;
      z += positions[index * 3 + 2] / 3;
    }
    const pixel = (Math.floor(Math.min(1, Math.max(0, v)) * (info.height - 1)) * info.width + Math.floor(Math.min(1, Math.max(0, u)) * (info.width - 1))) * info.channels;
    const [r, g, b] = [linear[data[pixel]], linear[data[pixel + 1]], linear[data[pixel + 2]]];
    const normalizedY = (y - min[1]) / height;
    const normalizedZ = (z - centerZ) / height;
    const cloth = b > r * 1.12 && b > g * 1.06 && normalizedY < 0.56;
    const hair = Math.max(r, g, b) < 0.23 && normalizedY > 0.57 && normalizedZ < 0.19;
    regions[cloth ? 2 : hair ? 1 : 0].indices.push(...triangle);
  }
  return regions.map((region) => ({ name: region.name, indices: Uint32Array.from(region.indices) }));
}

function encode(document, primitive, compressed) {
  const json = structuredClone(document.json);
  const chunks = [];
  let length = 0;
  let fallbackLength = 0;
  const append = (bytes) => {
    const offset = length;
    chunks.push(bytes, Buffer.alloc(align(bytes.length) - bytes.length));
    length += align(bytes.length);
    return offset;
  };
  json.bufferViews = [];
  json.accessors = [];
  const streams = [
    { array: primitive.positions, type: 'VEC3', components: 3, semantic: 'POSITION' },
    { array: primitive.normals, type: 'VEC3', components: 3, semantic: 'NORMAL' },
    { array: primitive.uvs, type: 'VEC2', components: 2, semantic: 'TEXCOORD_0' },
    { array: primitive.indices, type: 'SCALAR', components: 1, semantic: 'indices' },
  ];
  const attributes = {};
  for (const stream of streams) {
    const indices = stream.semantic === 'indices';
    const raw = bytesOf(stream.array);
    const count = stream.array.length / stream.components;
    const byteStride = stream.components * stream.array.BYTES_PER_ELEMENT;
    const mode = indices ? 'TRIANGLES' : 'ATTRIBUTES';
    const stored = compressed ? MeshoptEncoder.encodeGltfBuffer(raw, count, byteStride, mode) : raw;
    if (compressed) {
      const decoded = new Uint8Array(raw.length);
      MeshoptDecoder.decodeGltfBuffer(decoded, count, byteStride, stored, mode);
      if (indices) {
        const DecodedArray = stream.array.constructor;
        const decodedIndices = new DecodedArray(decoded.buffer);
        for (let i = 0; i < count; i += 3) {
          const rotation = [0, 1, 2].find((r) => decodedIndices[i] === stream.array[i + r]);
          assert(rotation !== undefined && [0, 1, 2].every((c) => decodedIndices[i + c] === stream.array[i + (c + rotation) % 3]), 'Index winding changed in compression');
        }
      } else assert.deepEqual(Buffer.from(decoded), raw, 'Attribute compression changed values');
    }
    const storedOffset = append(stored);
    const view = { buffer: compressed ? 1 : 0, byteOffset: compressed ? fallbackLength : storedOffset, byteLength: raw.length, target: indices ? 34963 : 34962 };
    if (compressed) {
      if (!indices) view.byteStride = byteStride;
      view.extensions = { EXT_meshopt_compression: { buffer: 0, byteOffset: storedOffset, byteLength: stored.length, byteStride, count, mode, filter: 'NONE' } };
      fallbackLength += align(raw.length);
    }
    const accessor = { bufferView: json.bufferViews.length, componentType: indices ? (stream.array.BYTES_PER_ELEMENT === 2 ? 5123 : 5125) : 5126, count, type: stream.type };
    if (stream.semantic === 'POSITION') {
      accessor.min = [Infinity, Infinity, Infinity]; accessor.max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < stream.array.length; i++) {
        accessor.min[i % 3] = Math.min(accessor.min[i % 3], stream.array[i]);
        accessor.max[i % 3] = Math.max(accessor.max[i % 3], stream.array[i]);
      }
    }
    if (!indices) attributes[stream.semantic] = json.accessors.length;
    json.bufferViews.push(view);
    json.accessors.push(accessor);
  }
  json.meshes[0].primitives[0] = { ...json.meshes[0].primitives[0], attributes, indices: 3 };
  for (const image of json.images ?? []) {
    const view = document.json.bufferViews[image.bufferView];
    assert(view && view.buffer === 0 && !image.uri, 'Expected embedded images');
    const bytes = document.binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    image.bufferView = json.bufferViews.length;
    json.bufferViews.push({ buffer: 0, byteOffset: append(bytes), byteLength: bytes.length });
  }
  json.buffers = [{ byteLength: length }];
  if (compressed) {
    json.extensionsUsed = ['EXT_meshopt_compression'];
    json.extensionsRequired = ['EXT_meshopt_compression'];
    json.buffers.push({ byteLength: fallbackLength, extensions: { EXT_meshopt_compression: { fallback: true } } });
  }
  return writeGlb(json, Buffer.concat(chunks));
}

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const input = await readFile(source);
const document = readGlb(input);
const { json } = document;
assert(json.asset.version === '2.0' && json.buffers.length === 1 && !json.buffers[0].uri, 'Expected a self-contained GLB 2.0');
assert(json.meshes?.length === 1 && json.meshes[0].primitives.length === 1 && !json.skins?.length && !json.animations?.length && !json.extensionsUsed?.length, 'Simplification supports one static, unextended primitive; prepare before rigging');
const definition = json.meshes[0].primitives[0];
assert((definition.mode ?? 4) === 4 && !definition.targets && Object.keys(definition.attributes).sort().join(',') === 'NORMAL,POSITION,TEXCOORD_0', 'Expected indexed triangles with positions, normals and UVs');
const original = {
  positions: readAccessor(document, definition.attributes.POSITION, 'VEC3', 5126),
  normals: readAccessor(document, definition.attributes.NORMAL, 'VEC3', 5126),
  uvs: readAccessor(document, definition.attributes.TEXCOORD_0, 'VEC2', 5126),
  indices: readAccessor(document, definition.indices, 'SCALAR', 5125),
};
const vertexCount = original.positions.length / 3;
assert(original.normals.length === vertexCount * 3 && original.uvs.length === vertexCount * 2 && original.indices.length % 3 === 0 && original.indices.every((index) => index < vertexCount));
const primitive = weld(original);
const settings = { normalWeight: 1, uvWeight: 2, targetError: 0.02 };
const report = {
  source, sourceSha256: sha256(input), sourceBytes: input.length,
  originalTriangles: original.indices.length / 3, originalVertices: vertexCount,
  weldedVertices: primitive.positions.length / 3, settings,
  errorMeaning: 'Meshoptimizer relative appearance error includes normals and UVs; not a measured maximum geometric distance.',
  retainedAttributes: 'Source float32 positions, normals and UVs; no relocation or quantization. Embedded images and material/scene metadata unchanged.',
  trials: [],
};
await mkdir(outputDirectory, { recursive: true });
const trials = targets.map((targetTriangles) => ({ name: String(targetTriangles), regions: [{ name: 'whole', targetTriangles, indices: primitive.indices, flags: [] }] }));
if (regionBudgets) {
  const regions = await partition(document, primitive);
  trials.push({ name: `regional-${regionBudgets.join('-')}`, regions: regions.map((region, index) => ({ ...region, targetTriangles: regionBudgets[index], flags: ['LockBorder', 'Sparse'] })) });
}
for (const trialDefinition of trials) {
  const started = performance.now();
  const simplified = trialDefinition.regions.map((region) => {
    const [indices, appearanceError] = MeshoptSimplifier.simplifyWithAttributes(region.indices, primitive.positions, 3, primitive.attributes, 5, [settings.normalWeight, settings.normalWeight, settings.normalWeight, settings.uvWeight, settings.uvWeight], null, Math.min(region.targetTriangles * 3, region.indices.length), settings.targetError, region.flags);
    return { ...region, indices, originalTriangles: region.indices.length / 3, appearanceError };
  });
  const indices = new Uint32Array(simplified.reduce((sum, region) => sum + region.indices.length, 0));
  let offset = 0;
  for (const region of simplified) { indices.set(region.indices, offset); offset += region.indices.length; }
  const compacted = compact(primitive, indices);
  const targetTriangles = simplified.reduce((sum, region) => sum + region.targetTriangles, 0);
  const trial = { name: trialDefinition.name, targetTriangles, triangles: indices.length / 3, vertices: compacted.positions.length / 3, regions: simplified.map(({ name, targetTriangles, originalTriangles, indices, flags, appearanceError }) => ({ name, targetTriangles, originalTriangles, triangles: indices.length / 3, flags, appearanceError })), files: {} };
  for (const compressed of [false, true]) {
    const kind = compressed ? 'meshopt' : 'raw';
    const filename = `character-${trialDefinition.name}-${kind}.glb`;
    const path = join(outputDirectory, filename);
    assert.notEqual(path, source, 'Refusing to overwrite the source');
    const output = encode(document, compacted, compressed);
    const check = readGlb(output);
    assert.deepEqual(check.json.materials, json.materials);
    for (let i = 0; i < json.images.length; i++) {
      const oldView = json.bufferViews[json.images[i].bufferView];
      const newView = check.json.bufferViews[check.json.images[i].bufferView];
      assert.deepEqual(check.binary.subarray(newView.byteOffset, newView.byteOffset + newView.byteLength), document.binary.subarray(oldView.byteOffset, oldView.byteOffset + oldView.byteLength));
    }
    await writeFile(path, output);
    trial.files[kind] = { path, bytes: output.length, sha256: sha256(output) };
  }
  trial.elapsedMs = Math.round(performance.now() - started);
  report.trials.push(trial);
  console.log(JSON.stringify(trial));
}
assert.equal(sha256(await readFile(source)), report.sourceSha256, 'Source changed during preparation');
await writeFile(join(outputDirectory, 'preparation-report.json'), `${JSON.stringify(report, null, 2)}\n`);
