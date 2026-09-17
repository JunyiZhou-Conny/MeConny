import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const repo = fileURLToPath(new URL('../../', import.meta.url));
const asset = path.resolve(process.env.PREPARED_ASSET || path.join(repo, 'public/3d/conny-character.glb'));
const base = process.env.TOUR_URL || 'http://localhost:3017';
const output = path.resolve(process.env.TOUR_EVIDENCE || path.join(repo, '../outputs/anime-resume-v1/rig-verification'), new Date().toISOString().replaceAll(':', '-'));
await mkdir(output, { recursive: true });
const bytes = await readFile(asset);
const hash = data => createHash('sha256').update(data).digest('hex');
const same = (a, b) => a.length === b.length && a.every((n, i) => Math.abs(n - b[i]) < 1e-6);
const results = { asset, sha256: hash(bytes), bytes: bytes.length, base, gates: {}, captures: [], evidenceKind: 'Actual skinning and production input; capture overhead excluded from performance claims' };
const errors = [];

function withoutNamedHead(source) {
  const chunks = [];
  for (let offset = 12; offset < source.length;) {
    const length = source.readUInt32LE(offset);
    const type = source.readUInt32LE(offset + 4);
    let body = source.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) {
      const json = JSON.parse(body.toString('utf8'));
      const head = json.nodes.find(node => node.name === 'Head');
      assert.ok(head, 'The negative fixture must start with a real Head node');
      head.name = 'UnnamedHeadFixture';
      const encoded = Buffer.from(JSON.stringify(json));
      body = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20);
      encoded.copy(body);
    }
    const header = Buffer.alloc(8);
    header.writeUInt32LE(body.length, 0);
    header.writeUInt32LE(type, 4);
    chunks.push(header, body);
    offset += 8 + length;
  }
  const header = Buffer.from(source.subarray(0, 12));
  header.writeUInt32LE(12 + chunks.reduce((sum, chunk) => sum + chunk.length, 0), 8);
  return Buffer.concat([header, ...chunks]);
}

function skinProof(root, bindQuaternion) {
  const head = root.getObjectByName('Head');
  const meshes = [];
  root.traverse(object => { if (object.isSkinnedMesh) meshes.push(object); });
  const posed = head.quaternion.clone();
  const point = head.position.clone();
  const refresh = () => { root.updateMatrixWorld(true); meshes.forEach(mesh => mesh.skeleton.update()); };
  head.quaternion.fromArray(bindQuaternion);
  refresh();
  const rest = meshes.map(mesh => {
    const position = mesh.geometry.attributes.position;
    const values = new Float64Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i);
      mesh.applyBoneTransform(i, point);
      point.toArray(values, i * 3);
    }
    return values;
  });
  head.quaternion.copy(posed);
  refresh();
  const groups = Object.fromEntries(['torso', 'hand', 'head'].map(name => [name, { vertices: 0, moved: 0, maxDelta: 0 }]));
  meshes.forEach((mesh, index) => {
    const position = mesh.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const y = position.getY(i), z = position.getZ(i);
      point.fromBufferAttribute(position, i);
      mesh.applyBoneTransform(i, point);
      const delta = Math.hypot(point.x - rest[index][i * 3], point.y - rest[index][i * 3 + 1], point.z - rest[index][i * 3 + 2]);
      const names = [];
      if (mesh.name === 'ConnyShirt') names.push('torso');
      if (y > 0.42 && z > 0.235) names.push('hand');
      if (y > 0.68 && z < 0.18) names.push('head');
      for (const name of names) {
        groups[name].vertices++;
        groups[name].moved += Number(delta > 1e-6);
        groups[name].maxDelta = Math.max(groups[name].maxDelta, delta);
      }
    }
  });
  return groups;
}

async function fixtureClient(T, GLTFLoader, MeshoptDecoder, proof) {
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(900, 1000);
  renderer.setPixelRatio(1);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  document.body.append(renderer.domElement);
  const scene = new T.Scene(); scene.background = new T.Color('#d2d0cd');
  scene.add(new T.HemisphereLight('#ffffff', '#888079', 1.6));
  for (const [color, intensity, position] of [['#fffaf3', 2.5, [-3, 4, 5]], ['#e7efff', 1.4, [4, 2, 3]], ['#ffffff', 1.4, [-2, 3, -3]]]) {
    const light = new T.DirectionalLight(color, intensity); light.position.fromArray(position); scene.add(light);
  }
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/asset.glb');
  const root = gltf.scene; scene.add(root);
  const head = root.getObjectByName('Head'); const bind = head.quaternion.clone();
  const camera = new T.PerspectiveCamera(32, 0.9, 0.01, 20);
  const inventory = { meshes: [], bones: [], animations: gltf.animations.map(a => a.name) };
  root.traverse(object => {
    if (object.isBone) inventory.bones.push({ name: object.name, position: object.position.toArray(), quaternion: object.quaternion.toArray() });
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    inventory.meshes.push({ name: object.name, skinned: Boolean(object.isSkinnedMesh), triangles: (object.geometry.index?.count || object.geometry.attributes.position.count) / 3, morphs: object.morphTargetDictionary || {}, materials: materials.map(material => ({ name: material.name, roughness: material.roughness, map: material.map?.uuid, image: [material.map?.image?.width, material.map?.image?.height] })) });
  });
  window.preparedFixture = {
    inventory, bind: bind.toArray(),
    render(angle, pose) {
      camera.position.set(Math.sin(angle) * 2.1, 0.58, Math.cos(angle) * 2.1); camera.lookAt(0, 0.5, 0);
      head.quaternion.copy(bind).multiply(new T.Quaternion().setFromEuler(new T.Euler(...pose, 'YXZ')));
      root.updateMatrixWorld(true); renderer.render(scene, camera);
      return proof(root, bind.toArray());
    },
  };
  window.preparedFixture.render(0, [0, 0, 0]);
}
const html = `<!doctype html><html><head><style>body{margin:0}</style><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script></head><body><script type="module">import * as T from 'three';import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';import{MeshoptDecoder}from'three/addons/libs/meshopt_decoder.module.js';(${fixtureClient.toString()})(T,GLTFLoader,MeshoptDecoder,${skinProof.toString()});</script></body></html>`;
const server = createServer(async (request, response) => {
  try {
    if (request.url === '/asset.glb') { response.setHeader('content-type', 'model/gltf-binary'); response.end(bytes); }
    else if (request.url.startsWith('/three/')) { response.setHeader('content-type', 'text/javascript'); response.end(await readFile(path.join(repo, 'node_modules/three', request.url.slice(7)))); }
    else { response.setHeader('content-type', 'text/html'); response.end(html); }
  } catch (error) { response.writeHead(500); response.end(error.message); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const fixture = await browser.newPage({ viewport: { width: 900, height: 1000 } });
  fixture.on('pageerror', error => errors.push(`fixture: ${error.message}`));
  await fixture.goto(`http://127.0.0.1:${server.address().port}`);
  await fixture.waitForFunction(() => Boolean(window.preparedFixture), { timeout: 60000 });
  results.inventory = await fixture.evaluate(() => window.preparedFixture.inventory);
  results.bindQuaternion = await fixture.evaluate(() => window.preparedFixture.bind);
  const materials = results.inventory.meshes.flatMap(mesh => mesh.materials);
  results.gates.namedHead = results.inventory.bones.some(bone => bone.name === 'Head');
  results.gates.namedParts = ['ConnySkin', 'ConnyHair', 'ConnyShirt'].every(name => results.inventory.meshes.some(mesh => mesh.name === name && mesh.skinned));
  results.gates.threeMaterials = new Set(materials.map(m => m.name)).size === 3;
  results.gates.shared2KTexture = new Set(materials.map(m => m.map)).size === 1 && materials.every(m => same(m.image, [2048, 2048]));
  results.gates.distinctFinish = new Set(materials.map(m => m.roughness)).size === 3;
  results.gates.noPretendEyeRig = results.inventory.animations.length === 0 && results.inventory.meshes.every(mesh => Object.keys(mesh.morphs).length === 0 && !/eye/i.test(mesh.name));
  results.fixture = [];
  for (const [label, angle, pose] of [
    ['front-rest', 0, [0, 0, 0]], ['front-left-extreme', 0, [0.032, -0.05, 0.006]], ['front-right-extreme', 0, [-0.032, 0.05, -0.006]],
    ['left-oblique-rest', -0.70, [0, 0, 0]], ['left-oblique-extreme', -0.70, [0.032, -0.05, 0.006]],
    ['right-oblique-rest', 0.70, [0, 0, 0]], ['right-oblique-extreme', 0.70, [-0.032, 0.05, -0.006]],
  ]) {
    const geometry = await fixture.evaluate(({ angle, pose }) => window.preparedFixture.render(angle, pose), { angle, pose });
    await fixture.screenshot({ path: path.join(output, `${label}.png`) });
    results.captures.push(`${label}.png`); results.fixture.push({ label, geometry });
  }
  results.gates.fixtureFixedBody = results.fixture.every(({ geometry }) => ['torso', 'hand'].every(name => geometry[name].vertices > 0 && geometry[name].maxDelta < 1e-6));
  results.gates.fixtureMovesHead = results.fixture.filter(frame => frame.label.includes('extreme')).every(frame => frame.geometry.head.maxDelta > 0.005);
  await fixture.close();

  if (process.env.PREPARED_SKIP_LIVE !== '1') {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(`production: ${error.message}`));
    const responseChecks = [];
    page.on('response', response => { if (new URL(response.url()).pathname === '/3d/conny-character.glb') responseChecks.push(response.body().then(body => { results.servedSha256 = hash(body); })); });
    await page.addInitScript(({ proofSource, bind }) => {
      const proof = (0, eval)(`(${proofSource})`);
      const data = window.preparedEvidence = { frames: [], renders: 0, rafScheduled: 0, unsupportedUniforms: [], phase: 'loading' };
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = function (callback) { data.rafScheduled++; return raf.call(this, callback); };
      const gl = WebGL2RenderingContext.prototype, uniform = gl.getUniformLocation;
      gl.getUniformLocation = function (program, name) { const location = uniform.call(this, program, name); if (location && ['connyGaze', 'connyBlink', 'connyHeadPose'].includes(name)) data.unsupportedUniforms.push(name); return location; };
      let scene, camera, head, shirt;
      data.snapshot = () => {
        if (!head) return null;
        const delta = head.quaternion.clone().fromArray(bind).invert().multiply(head.quaternion);
        const angles = head.rotation.clone().setFromQuaternion(delta, 'YXZ');
        const ancestors = [];
        for (let object = shirt; object && object !== scene; object = object.parent) ancestors.push(...object.matrix.elements);
        return { time: performance.now(), phase: data.phase, quaternion: head.quaternion.toArray(), angles: [angles.x, angles.y, angles.z], camera: [...camera.matrixWorld.elements, ...camera.projectionMatrix.elements], body: [...shirt.matrixWorld.elements], ancestors, rootBone: scene.getObjectByName('Root').quaternion.toArray() };
      };
      data.geometry = () => proof(scene, bind);
      window.__THREE_DEVTOOLS__ = new EventTarget();
      window.__THREE_DEVTOOLS__.addEventListener('observe', ({ detail }) => {
        if (!detail.isWebGLRenderer) return;
        const render = detail.render;
        detail.render = function (object, view) {
          const result = render.call(this, object, view);
          if (view.isPerspectiveCamera && object.background?.isColor && object.getObjectByName('Head')) {
            scene = object; camera = view; head = scene.getObjectByName('Head'); shirt = scene.getObjectByName('ConnyShirt');
            data.renders++; data.frames.push(data.snapshot());
          }
          return result;
        };
      });
    }, { proofSource: skinProof.toString(), bind: results.bindQuaternion });
    await page.goto(`${base}/?prepared-character-check=1#off-hours`);
    await page.locator('.tour[data-mode="live"]').waitFor({ timeout: 60000 });
    await page.waitForFunction(() => Boolean(window.preparedEvidence.snapshot()));
    await page.waitForTimeout(800);
    results.live = [];
    for (const [label, x, y] of [['pointer-left', 8, 8], ['pointer-right', 1272, 712], ['pointer-center', 640, 360]]) {
      await page.evaluate(label => { window.preparedEvidence.phase = label; }, label);
      await page.mouse.move(x, y);
      await page.waitForTimeout(650);
      results.live.push(await page.evaluate(label => ({ label, state: window.preparedEvidence.snapshot(), geometry: window.preparedEvidence.geometry() }), label));
      await page.screenshot({ path: path.join(output, `production-${label}.png`) });
      results.captures.push(`production-${label}.png`);
    }
    const beforeIdle = await page.evaluate(() => ({ renders: window.preparedEvidence.renders, rafScheduled: window.preparedEvidence.rafScheduled, state: window.preparedEvidence.snapshot() }));
    await page.waitForTimeout(9000);
    const afterIdle = await page.evaluate(() => ({ renders: window.preparedEvidence.renders, rafScheduled: window.preparedEvidence.rafScheduled, state: window.preparedEvidence.snapshot() }));
    results.idle = { durationMs: 9000, renderDelta: afterIdle.renders - beforeIdle.renders, rafDelta: afterIdle.rafScheduled - beforeIdle.rafScheduled };
    results.productionFrames = await page.evaluate(() => window.preparedEvidence.frames);
    results.unsupportedUniforms = await page.evaluate(() => window.preparedEvidence.unsupportedUniforms);
    await Promise.all(responseChecks);
    const states = results.live.map(frame => frame.state), pointerFrames = results.productionFrames.filter(frame => frame.phase.startsWith('pointer-'));
    results.gates.servedAssetMatches = results.servedSha256 === results.sha256;
    results.gates.realPointerMovesHead = !same(states[0].quaternion, states[1].quaternion);
    results.gates.boundedHead = pointerFrames.every(frame => Math.abs(frame.angles[0]) <= 0.03201 && Math.abs(frame.angles[1]) <= 0.05001 && Math.abs(frame.angles[2]) <= 0.00601);
    results.gates.fixedCamera = pointerFrames.every(frame => same(frame.camera, states[0].camera));
    results.gates.fixedBodyAndRoot = pointerFrames.every(frame => ['body', 'ancestors', 'rootBone'].every(key => same(frame[key], states[0][key])));
    results.gates.actualSkinnedTorsoAndHandFixed = results.live.every(frame => ['torso', 'hand'].every(name => frame.geometry[name].vertices > 0 && frame.geometry[name].maxDelta < 1e-6));
    results.gates.noLegacyEyeUniforms = results.unsupportedUniforms.length === 0;
    results.gates.quietIdle = results.idle.renderDelta === 0 && results.idle.rafDelta === 0 && same(beforeIdle.state.quaternion, afterIdle.state.quaternion);
    await page.close();

    const missingHead = await browser.newPage({ viewport: { width: 390, height: 844 } });
    missingHead.on('pageerror', error => errors.push(`missing Head: ${error.message}`));
    await missingHead.route('**/3d/conny-character.glb', route => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: withoutNamedHead(bytes) }));
    const requested = missingHead.waitForRequest('**/3d/conny-character.glb');
    await missingHead.goto(`${base}/?prepared-missing-head-check=1#jobs`);
    await requested;
    await missingHead.locator('.tour-stage canvas').waitFor({ state: 'detached', timeout: 30000 });
    await missingHead.locator('.tour[data-mode="static"]').waitFor();
    const cards = await missingHead.locator('.tour-card').all();
    results.gates.missingHeadRestoresReadableStatic = cards.length === 6 && (await Promise.all(cards.map(card => card.isVisible()))).every(Boolean);
    await missingHead.locator('.tour-tag[href="#jobs"]').click();
    await missingHead.waitForTimeout(300);
    results.gates.missingHeadKeepsNavigation = new URL(missingHead.url()).hash === '#jobs';
    await missingHead.screenshot({ path: path.join(output, 'production-missing-head-static.png') });
    results.captures.push('production-missing-head-static.png');
    await missingHead.close();
  }
  results.errors = errors;
  results.gates.noPageErrors = errors.length === 0;
  await writeFile(path.join(output, 'summary.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ output, gates: results.gates, idle: results.idle, errors }, null, 2));
  for (const [gate, passed] of Object.entries(results.gates)) assert.ok(passed, gate);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
