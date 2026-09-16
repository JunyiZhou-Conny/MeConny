import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TOUR_URL || 'http://localhost:3017';
const output = path.resolve(process.env.TOUR_EVIDENCE || '../outputs/portrait-verification', new Date().toISOString().replaceAll(':', '-'));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = { base, evidenceKind: 'Actual renderer frames; natural input and blink timers; capture overhead excluded from performance claims', gates: {}, captures: [], angles: [] };
const same = (a, b) => a.length === b.length && a.every((value, index) => Math.abs(value - b[index]) < 0.000001);
const difference = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const data = { frames: [], captures: {}, uniforms: {}, phase: 'loading', armed: null, blink: null };
    window.portraitEvidence = data;
    const images = new Map();
    const locations = new WeakMap();
    const gl = WebGL2RenderingContext.prototype;
    const getUniformLocation = gl.getUniformLocation;
    gl.getUniformLocation = function (program, name) {
      const location = getUniformLocation.call(this, program, name);
      if (location && ['connyGaze', 'connyHeadPose', 'connyBlink'].includes(name)) locations.set(location, name);
      return location;
    };
    for (const name of ['uniform1f', 'uniform2f', 'uniform2fv', 'uniform3f', 'uniform3fv']) {
      const original = gl[name];
      gl[name] = function (location, ...values) {
        const uniform = locations.get(location);
        if (uniform) data.uniforms[uniform] = name.endsWith('fv') ? Array.from(values[0]) : values;
        return original.call(this, location, ...values);
      };
    }
    let renderer;
    let scene;
    let camera;
    let face;
    let renders = 0;
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', ({ detail }) => {
      if (!detail.isWebGLRenderer) return;
      renderer = detail;
      const render = renderer.render;
      renderer.render = function (object, view) {
        renders++;
        if (view.isPerspectiveCamera && object.background?.isColor) {
          scene = object;
          camera = view;
          scene.traverse(mesh => { if (mesh.morphTargetDictionary?.connyBlink !== undefined) face = mesh; });
        }
        return render.call(this, object, view);
      };
    });
    function state() {
      if (!face || !camera) return null;
      const ancestors = [];
      for (let object = face; object && object !== scene; object = object.parent) ancestors.push(...object.matrix.elements);
      return {
        time: performance.now(), phase: data.phase, hash: location.hash,
        camera: [...camera.matrixWorld.elements, ...camera.projectionMatrix.elements],
        bodyMatrix: Array.from(face.matrixWorld.elements), ancestors,
        blink: face.morphTargetInfluences[face.morphTargetDictionary.connyBlink],
        gaze: data.uniforms.connyGaze?.slice(), head: data.uniforms.connyHeadPose?.slice(),
        blinkUniform: data.uniforms.connyBlink?.[0],
      };
    }
    function capture(label, frame) {
      const started = performance.now();
      const copy = document.createElement('canvas');
      copy.width = renderer.domElement.width;
      copy.height = renderer.domElement.height;
      copy.getContext('2d').drawImage(renderer.domElement, 0, 0);
      images.set(label, copy);
      data.captures[label] = { ...frame, copyMs: performance.now() - started, size: [copy.width, copy.height] };
    }
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = function (callback) {
      return raf.call(this, timestamp => {
        const before = renders;
        callback(timestamp);
        if (renders === before || document.querySelector('.tour')?.dataset.mode !== 'live') return;
        const frame = state();
        if (!frame) return;
        data.frames.push(frame);
        if (data.armed && frame.time >= data.armed.after && frame.blink < 0.001) {
          capture(data.armed.label, frame);
          data.armed = null;
        }
        const blink = data.blink;
        if (!blink) return;
        if (frame.blink > 0.2 && frame.blink < 0.8 && !data.captures[`${blink.id}-half`]) capture(`${blink.id}-half`, frame);
        if (frame.blink >= 0.98 && !data.captures[`${blink.id}-closed`]) capture(`${blink.id}-closed`, frame);
        if (frame.blink > 0) blink.started = true;
        if (blink.started && frame.blink < 0.001) {
          capture(`${blink.id}-reopened`, frame);
          blink.complete = true;
          data.blink = null;
        }
      });
    };
    data.arm = label => { data.armed = { label, after: performance.now() + 270 }; };
    data.armBlink = id => {
      for (const kind of ['half', 'closed', 'reopened']) { delete data.captures[`${id}-${kind}`]; images.delete(`${id}-${kind}`); }
      data.blink = { id, started: false };
    };
    data.snapshot = state;
    data.image = label => images.get(label)?.toDataURL('image/png');
    data.geometry = () => {
      const position = face.geometry.getAttribute('position');
      const closed = face.geometry.morphAttributes.position[0];
      const bits = new Uint32Array(position.array.buffer, position.array.byteOffset, position.array.length);
      let hash = 2166136261;
      for (const value of bits) hash = Math.imul(hash ^ value, 16777619) >>> 0;
      let torsoDelta = 0;
      let changedVertices = 0;
      const lids = [{ x: -0.092, depths: [] }, { x: 0.091, depths: [] }];
      for (let i = 0; i < position.count; i++) {
        const delta = Math.hypot(position.getX(i) - closed.getX(i), position.getY(i) - closed.getY(i), position.getZ(i) - closed.getZ(i));
        if (delta > 0.000001) changedVertices++;
        const y = position.getY(i) * 0.5 + 0.5;
        if (y <= 0.31) torsoDelta = Math.max(torsoDelta, delta);
        for (const lid of lids) if (Math.abs(position.getX(i) * 0.5 - lid.x) < 0.05 && Math.abs(y - 0.652) < 0.008 && position.getZ(i) * 0.5 > 0.12) lid.depths.push(closed.getZ(i) * 0.5);
      }
      return { rawPositionHash: hash, vertices: position.count, changedLidVertices: changedVertices, torsoMorphDelta: torsoDelta, closedLidDepthRange: lids.map(lid => Math.max(...lid.depths) - Math.min(...lid.depths)) };
    };
  });
  await page.goto(`${base}/?portrait-check=1#off-hours`);
  await page.locator('.tour[data-mode="live"]').waitFor({ timeout: 60000 });
  await page.waitForFunction(() => window.portraitEvidence.snapshot()?.gaze?.length === 2);

  const initialGeometry = await page.evaluate(() => window.portraitEvidence.geometry());
  for (const [label, x, y] of [['gaze-left', 120, 220], ['gaze-right', 1160, 500]]) {
    await page.evaluate(label => { window.portraitEvidence.phase = label; window.portraitEvidence.arm(label); }, label);
    await page.mouse.move(x, y);
    await page.waitForFunction(label => Boolean(window.portraitEvidence.captures[label]), label, { timeout: 4000 });
  }
  const gaze = await page.evaluate(() => ['gaze-left', 'gaze-right'].map(label => window.portraitEvidence.captures[label]));
  const gazeFrames = await page.evaluate(() => window.portraitEvidence.frames.filter(frame => ['gaze-left', 'gaze-right'].includes(frame.phase)));
  results.gaze = { left: gaze[0].gaze, right: gaze[1].gaze, headLeft: gaze[0].head, headRight: gaze[1].head };
  results.gates.fixedCameraGaze = gazeFrames.every(frame => same(frame.camera, gaze[0].camera));
  results.gates.fixedBodyGaze = gazeFrames.every(frame => same(frame.bodyMatrix, gaze[0].bodyMatrix) && same(frame.ancestors, gaze[0].ancestors));
  results.gates.actualGazeUniformChanged = difference(gaze[0].gaze, gaze[1].gaze) > 0.03;
  results.gates.actualHeadUniformChanged = difference(gaze[0].head, gaze[1].head) > 0.01;

  for (const id of ['off-hours', 'start', 'clinical']) {
    if (id !== 'off-hours') {
      await page.locator(`.tour-tag[href="#${id}"]`).click();
      await page.waitForFunction(id => location.hash === `#${id}` && document.querySelector('.tour')?.dataset.transitioning === 'false', id);
    }
    await page.evaluate(id => { window.portraitEvidence.phase = id; window.portraitEvidence.arm(`${id}-open`); }, id);
    await page.mouse.move(700, 360);
    await page.waitForFunction(id => Boolean(window.portraitEvidence.captures[`${id}-open`]), id, { timeout: 4000 });
    let attempts = 0;
    for (; attempts < 3; attempts++) {
      await page.evaluate(id => window.portraitEvidence.armBlink(id), id);
      await page.waitForFunction(id => Boolean(window.portraitEvidence.captures[`${id}-reopened`]), id, { timeout: 12000 });
      if (await page.evaluate(id => ['half', 'closed', 'reopened'].every(kind => window.portraitEvidence.captures[`${id}-${kind}`]), id)) break;
    }
    const angle = await page.evaluate(id => {
      const evidence = window.portraitEvidence;
      const selected = Object.fromEntries(['open', 'half', 'closed', 'reopened'].map(kind => [kind, evidence.captures[`${id}-${kind}`]]));
      return { id, selected, frames: evidence.frames.filter(frame => frame.phase === id), frameCountAfterBlink: evidence.frames.length };
    }, id);
    angle.captureAttempts = Math.min(3, attempts + 1);
    await page.waitForTimeout(900);
    angle.quietFrames = await page.evaluate(before => window.portraitEvidence.frames.length - before, angle.frameCountAfterBlink);
    angle.maxBlink = Math.max(...angle.frames.map(frame => frame.blink));
    const { open, half, closed, reopened } = angle.selected;
    angle.gates = {
      completeNaturalBlink: Boolean(open && half && closed && reopened && open.blink < 0.001 && half.blink > 0.2 && half.blink < 0.8 && closed.blink >= 0.98 && angle.maxBlink >= 0.999 && reopened.blink < 0.001),
      actualUniformMatchesMorph: angle.frames.every(frame => Math.abs(frame.blink - frame.blinkUniform) < 0.00001),
      fixedCamera: angle.frames.every(frame => same(frame.camera, open.camera)),
      fixedBody: angle.frames.every(frame => same(frame.bodyMatrix, open.bodyMatrix) && same(frame.ancestors, open.ancestors)),
      finiteQuietReturn: angle.quietFrames === 0,
    };
    results.angles.push(angle);
  }

  const geometry = await page.evaluate(() => window.portraitEvidence.geometry());
  results.geometry = geometry;
  results.gates.rawGeometryUnchanged = initialGeometry.rawPositionHash === geometry.rawPositionHash;
  results.gates.torsoMorphUnchanged = geometry.torsoMorphDelta === 0;
  results.gates.curvedLidGeometry = geometry.changedLidVertices > 0 && geometry.closedLidDepthRange.every(range => range > 0.001);
  results.gates.runtimeErrors = errors.length === 0;
  results.errors = errors;
  const labels = await page.evaluate(() => Object.keys(window.portraitEvidence.captures));
  for (const label of labels) {
    const png = await page.evaluate(label => window.portraitEvidence.image(label), label);
    await writeFile(path.join(output, `${label}.png`), Buffer.from(png.split(',')[1], 'base64'));
    results.captures.push(`${label}.png`);
  }
  const frames = await page.evaluate(() => window.portraitEvidence.frames);
  await writeFile(path.join(output, 'frames.json'), JSON.stringify(frames, null, 2));
  await writeFile(path.join(output, 'summary.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ gates: results.gates, angles: results.angles.map(angle => ({ id: angle.id, gates: angle.gates })), gaze: results.gaze, geometry, captures: results.captures.length }));
  assert.ok(Object.values(results.gates).every(Boolean) && results.angles.every(angle => Object.values(angle.gates).every(Boolean)), 'Portrait evidence gates failed; inspect summary and actual canvas captures');
} catch (error) {
  await writeFile(path.join(output, 'failure.json'), JSON.stringify({ message: error.stack, results, errors }, null, 2));
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  console.log(`Portrait evidence: ${output}`);
}
