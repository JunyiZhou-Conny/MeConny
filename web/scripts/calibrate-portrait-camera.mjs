import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import * as THREE from 'three'

const [inputPath, outputPath, configPath] = process.argv.slice(2)
assert(inputPath && outputPath && configPath,
  'Usage: node web/scripts/calibrate-portrait-camera.mjs input.glb output.glb calibration.json')
assert.notEqual(path.resolve(inputPath), path.resolve(outputPath), 'Preserve the source GLB')
if (fs.existsSync(outputPath)) {
  assert.notEqual(fs.realpathSync(inputPath), fs.realpathSync(outputPath), 'Preserve the source GLB')
}
const reportPath = `${outputPath}.report.json`
for (const destination of [outputPath, reportPath]) {
  assert(!fs.lstatSync(destination, { throwIfNoEntry: false }), `Output already exists: ${destination}; choose a new path`)
}

const source = fs.readFileSync(inputPath)
assert(source.length >= 28, 'GLB header is incomplete')
assert.equal(source.readUInt32LE(0), 0x46546c67, 'Expected GLB magic')
assert.equal(source.readUInt32LE(4), 2, 'Expected GLB version 2')
assert.equal(source.readUInt32LE(8), source.length, 'GLB length mismatch')
assert.equal(source.readUInt32LE(16), 0x4e4f534a, 'Expected the JSON chunk first')
const jsonLength = source.readUInt32LE(12)
assert.equal(jsonLength % 4, 0)
assert(28 + jsonLength <= source.length, 'JSON chunk exceeds the file')
assert.equal(source.readUInt32LE(24 + jsonLength), 0x004e4942, 'Expected one binary chunk')
assert.equal(source.readUInt32LE(20 + jsonLength), source.length - 28 - jsonLength)

const original = JSON.parse(source.subarray(20, 20 + jsonLength))
const json = structuredClone(original)
const sourceBin = source.subarray(28 + jsonLength)
const binary = Buffer.from(sourceBin)
const config = JSON.parse(fs.readFileSync(configPath))
const allowed = new Set()
const changes = []
const sha = value => createHash('sha256').update(value).digest('hex')

function track(index, bytes = binary) {
  const accessor = json.accessors[index]
  const view = json.bufferViews[accessor.bufferView]
  const components = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type]
  assert(components && accessor.componentType === 5126 && !accessor.sparse)
  assert(!view.extensions && view.buffer === 0, 'Camera tracks must use plain Float32 buffers')
  const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const stride = view.byteStride ?? components * 4
  assert(offset + (accessor.count - 1) * stride + components * 4 <= bytes.length)
  return {
    count: accessor.count,
    read: index => Array.from({ length: components }, (_, component) =>
      bytes.readFloatLE(offset + index * stride + component * 4)),
    write(index, values) {
      assert.equal(bytes, binary)
      assert.equal(values.length, components)
      values.forEach((value, component) => {
        assert(Number.isFinite(value))
        const address = offset + index * stride + component * 4
        bytes.writeFloatLE(value, address)
        for (let byte = 0; byte < 4; byte++) allowed.add(address + byte)
      })
    },
  }
}

for (const [name, id] of Object.entries(config.focusDecals ?? {})) {
  assert(/^focus-\d+$/.test(name), 'Only named story focus nodes may be repositioned')
  const node = json.nodes.find(node => node.name === name)
  const sticker = config.stickers.find(sticker => sticker.id === id)
  assert(node && sticker)
  node.translation = sticker.position.map((value, axis) =>
    value * config.fit.scale + config.fit.translation[axis])
  assert(node.translation.every(Number.isFinite))
  changes.push({ focus: name, sticker: id, translation: node.translation })
}

const cameraIndex = json.nodes.findIndex(node => node.name === 'Camera')
const animation = json.animations.find(animation => animation.name === 'CameraAction')
assert(cameraIndex >= 0 && animation)
for (const correction of config.cameraCorrections ?? []) {
  assert(correction.start < correction.frame && correction.frame < correction.end)
  assert(correction.position.length === 3 && correction.position.every(Number.isFinite))
  assert(correction.quaternion.length === 4 && correction.quaternion.every(Number.isFinite))
  const changed = []
  for (const channel of animation.channels) {
    if (channel.target.node !== cameraIndex ||
      !['translation', 'rotation'].includes(channel.target.path)) continue
    const sampler = animation.samplers[channel.sampler]
    const times = track(sampler.input)
    const values = track(sampler.output)
    assert.equal(sampler.interpolation, 'LINEAR')
    assert.equal(times.count, values.count)
    let center = -1
    for (let index = 0; index < times.count; index++) {
      if (Math.abs(times.read(index)[0] * 24 - correction.frame) < 0.001) center = index
    }
    assert(center >= 0, 'Correction frame is absent')
    const old = values.read(center)
    const positionDelta = channel.target.path === 'translation'
      ? correction.position.map((value, axis) => value - old[axis]) : null
    const rotationDelta = channel.target.path === 'rotation'
      ? new THREE.Quaternion().fromArray(correction.quaternion)
        .multiply(new THREE.Quaternion().fromArray(old).invert()).normalize() : null
    let count = 0
    for (let index = 0; index < times.count; index++) {
      const frame = times.read(index)[0] * 24
      if (frame <= correction.start + 0.001 || frame >= correction.end - 0.001) continue
      const phase = frame <= correction.frame
        ? (frame - correction.start) / (correction.frame - correction.start)
        : (correction.end - frame) / (correction.end - correction.frame)
      const weight = phase * phase * (3 - 2 * phase)
      const value = values.read(index)
      const next = positionDelta
        ? value.map((component, axis) => component + positionDelta[axis] * weight)
        : new THREE.Quaternion().slerp(rotationDelta, weight)
          .multiply(new THREE.Quaternion().fromArray(value)).normalize().toArray()
      values.write(index, next)
      count++
    }
    changed.push({ path: channel.target.path, samples: count })
  }
  assert.equal(changed.length, 2, 'Expected camera translation and rotation tracks')
  changes.push({ cameraFrame: correction.frame, window: [correction.start, correction.end], changed })
}

for (let byte = 0; byte < binary.length; byte++) {
  if (binary[byte] !== sourceBin[byte]) {
    assert(allowed.has(byte), 'Changed bytes outside camera correction')
  }
}
for (const sampler of json.animations.find(animation => animation.name === 'manAction').samplers) {
  for (const accessorIndex of [sampler.input, sampler.output]) {
    const before = track(accessorIndex, sourceBin)
    const after = track(accessorIndex)
    for (let index = 0; index < before.count; index++) {
      assert.deepEqual(after.read(index), before.read(index), 'manAction must remain exact')
    }
  }
}
assert.deepEqual(json.cameras, original.cameras)
assert.deepEqual(json.animations, original.animations)
for (const [index, node] of json.nodes.entries()) {
  if (!Object.hasOwn(config.focusDecals ?? {}, node.name)) {
    assert.deepEqual(node, original.nodes[index])
  }
}

const align = length => (length + 3) & ~3
const text = Buffer.from(JSON.stringify(json))
const padded = Buffer.alloc(align(text.length), 0x20)
padded.set(text)
const out = Buffer.alloc(28 + padded.length + binary.length)
out.writeUInt32LE(0x46546c67, 0)
out.writeUInt32LE(2, 4)
out.writeUInt32LE(out.length, 8)
out.writeUInt32LE(padded.length, 12)
out.writeUInt32LE(0x4e4f534a, 16)
padded.copy(out, 20)
out.writeUInt32LE(binary.length, 20 + padded.length)
out.writeUInt32LE(0x004e4942, 24 + padded.length)
binary.copy(out, 28 + padded.length)
fs.writeFileSync(outputPath, out, { flag: 'wx' })
assert.deepEqual(fs.readFileSync(inputPath), source, 'Source file changed during calibration')

const report = {
  source: { path: path.resolve(inputPath), sha256: sha(source) },
  output: { path: path.resolve(outputPath), sha256: sha(out), bytes: out.length },
  changes,
  checks: {
    fovAndLensExact: true,
    manActionBytesExact: true,
    cameraTimesAndInterpolationExact: true,
    cameraSamplesOutsideWindowsExact: true,
    windowBoundaryPosesExact: true,
    otherNodesExact: true,
    geometryMaterialTextureBytesExact: true,
    sourceFileUnchanged: true,
  },
}
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify(report, null, 2))
