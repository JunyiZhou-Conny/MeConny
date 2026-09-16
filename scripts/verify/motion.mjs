import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TOUR_URL || 'http://localhost:3017';
const batch = new Date().toISOString().replaceAll(':', '-');
const output = path.resolve(process.env.TOUR_EVIDENCE || '../outputs/motion-verification', batch);
const runs = Number(process.env.MOTION_RUNS || 3);
const pixels = process.env.MOTION_PIXELS === '1';
const idleDuration = 6000;
assert.ok(Number.isInteger(runs) && runs > 0 && runs <= 10, 'MOTION_RUNS must be an integer from 1 to 10');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const summaries = [];

const quantile = (values, q) => values.length ? [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * q)] : 0;
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
const frameGaps = frames => frames.slice(1).flatMap((frame, index) => frames[index].transitioning ? [frame.start - frames[index].start] : []);
function idleSummary(frames, start, duration) {
  const bursts = [];
  for (const frame of frames) {
    const last = bursts.at(-1);
    if (!last || frame.start - last.at(-1).start > 80) bursts.push([frame]);
    else last.push(frame);
  }
  const durations = bursts.map(burst => burst.at(-1).start - burst[0].start + 17);
  const quietIntervals = bursts.map((burst, index) => burst[0].start - (index ? bursts[index - 1].at(-1).start + 17 : start));
  quietIntervals.push(start + duration - (bursts.at(-1)?.at(-1).start + 17 || start));
  const morphFrames = frames.filter(frame => frame.faceMorphs?.some(mesh => Object.values(mesh.values).some(value => Math.abs(value) > 0.00001)));
  const morphNames = [...new Set(frames.flatMap(frame => frame.faceMorphs?.flatMap(mesh => Object.keys(mesh.values)) || []))];
  return { frames: frames.length, bursts: bursts.length, activeMorphFrames: morphFrames.length, observedMorphNames: morphNames, longestBurstMs: Math.max(0, ...durations), longestQuietMs: Math.max(0, ...quietIntervals), dutyCycle: durations.reduce((sum, value) => sum + value, 0) / duration };
}

function summarize(data) {
  const wheel = data.events.find(event => event.type === 'wheel' && event.phase === 'wheel');
  const wheelFrames = data.frames.filter(frame => frame.phase === 'wheel' && frame.start >= wheel.time);
  const first = wheelFrames.find(frame => distance(frame.camera, data.beforeWheel) > 0.00001);
  const settled = wheelFrames.find(frame => !frame.transitioning);
  const stallClick = data.events.find(event => event.type === 'click' && event.phase === 'stall');
  const stallSettled = data.frames.find(frame => frame.phase === 'stall' && frame.start >= stallClick.time && !frame.transitioning);
  const travelPhases = [...new Set(data.frames.filter(frame => frame.phase === 'wheel' || frame.phase === 'retarget' || frame.phase.startsWith('traverse-')).map(frame => frame.phase))];
  const gaps = travelPhases.flatMap(phase => frameGaps(data.frames.filter(frame => frame.phase === phase)));
  const idle = idleSummary(data.frames.filter(frame => frame.phase === 'idle'), data.idleStarted, idleDuration);
  const jobsIdle = idleSummary(data.frames.filter(frame => frame.phase === 'jobs-idle'), data.jobsIdleStarted, idleDuration);
  const idleFrames = data.frames.filter(frame => frame.phase === 'idle' || frame.phase === 'jobs-idle');
  const idleStable = ['idle', 'jobs-idle'].every(phase => {
    const frames = idleFrames.filter(frame => frame.phase === phase);
    const expectedCamera = phase === 'idle' ? data.idleCamera : data.jobsIdleCamera;
    return frames.every(frame => distance(frame.camera, expectedCamera) < 0.000001 && Math.abs(frame.bodyYaw) < 0.000001);
  });
  const result = {
    hardware: data.hardware,
    wheelResponseMs: first ? first.start - wheel.time : null,
    wheelSettleMs: settled ? settled.start - wheel.time : null,
    injectedStallMs: data.stall?.duration,
    injectedStallSettleMs: stallSettled ? stallSettled.start - stallClick.time : null,
    transitionFrameP95Ms: quantile(gaps, 0.95),
    transitionWorstGapMs: Math.max(0, ...gaps),
    transitionGapsOver100Ms: gaps.filter(gap => gap > 100).length,
    idle, jobsIdle, idleCameraAndTorsoStable: idleStable,
    retargetMismatches: data.frames.filter(frame => frame.phase === 'retarget' && (frame.hash !== frame.active || frame.hash !== frame.card)).length,
    postLoadShaderCompiles: data.calls.filter(call => call.phase !== 'loading' && call.name === 'compileShader').length,
    postLoadTextureUploads: data.calls.filter(call => call.phase !== 'loading' && ['texImage2D', 'texSubImage2D'].includes(call.name)).length,
    pixelReadbackP95Ms: quantile(data.frames.map(frame => frame.pixelCost || 0), 0.95),
    errors: data.errors,
  };
  const idlePasses = observation => observation.longestQuietMs >= 2000 && observation.longestBurstMs <= 450 && observation.dutyCycle <= 0.25;
  result.gates = {
    firstResponse: result.wheelResponseMs !== null && result.wheelResponseMs <= 100,
    boundedSettle: result.wheelSettleMs !== null && result.wheelSettleMs <= 700,
    boundedStallRecovery: result.injectedStallMs >= 200 && result.injectedStallSettleMs !== null && result.injectedStallSettleMs <= 800,
    idleRenders: idlePasses(idle) && idlePasses(jobsIdle),
    fixedIdlePose: idleStable,
    matchingRetargetState: result.retargetMismatches === 0,
    warmShaders: result.postLoadShaderCompiles === 0,
    warmTextures: result.postLoadTextureUploads === 0,
    frameBudget: pixels || (result.transitionFrameP95Ms <= 25 && result.transitionWorstGapMs <= 100),
    runtimeErrors: result.errors.length === 0,
  };
  return result;
}

async function settled(page, id) {
  await page.waitForFunction(id => location.hash === `#${id}` && document.querySelector('.tour-tag[aria-current="true"]')?.getAttribute('href') === `#${id}` && document.querySelector('.tour')?.dataset.transitioning === 'false', id);
}

try {
  for (let run = 1; run <= runs; run++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ pixels }) => {
      const data = { phase: 'loading', frames: [], events: [], calls: [], renderers: [], counters: {} };
      window.motionProfile = data;
      let renders = 0;
      let camera;
      let scene;
      let renderer;
      let previousImage;
      let pixelContext;
      const gl = WebGL2RenderingContext.prototype;
      for (const name of ['drawElements', 'drawArrays', 'compileShader', 'linkProgram', 'texImage2D', 'texSubImage2D']) {
        const original = gl[name];
        gl[name] = function (...args) {
          const time = performance.now();
          const result = original.apply(this, args);
          data.counters[name] = (data.counters[name] || 0) + 1;
          if (!name.startsWith('draw')) data.calls.push({ phase: data.phase, name, time, duration: performance.now() - time });
          return result;
        };
      }
      window.__THREE_DEVTOOLS__ = new EventTarget();
      window.__THREE_DEVTOOLS__.addEventListener('observe', ({ detail }) => {
        if (!detail.isWebGLRenderer) return;
        renderer = detail;
        data.renderers.push(renderer);
        const render = renderer.render;
        renderer.render = function (object, view) {
          renders++;
          if (view.isPerspectiveCamera && object.background?.isColor) {
            camera = view;
            scene = object;
            data.camera = [...camera.position.toArray(), camera.fov];
          }
          return render.call(this, object, view);
        };
      });
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = function (callback) {
        return raf.call(this, timestamp => {
          const start = performance.now();
          const before = renders;
          const draws = (data.counters.drawElements || 0) + (data.counters.drawArrays || 0);
          callback(timestamp);
          if (before === renders || !camera) return;
          const submitted = performance.now();
          const current = document.querySelector('.tour-tag[aria-current="true"]');
          const activeCard = document.querySelector('.tour-card[data-active="true"]');
          const activeId = [...document.querySelectorAll('.tour-card')].indexOf(activeCard);
          const frame = { phase: data.phase, start, duration: submitted - start, camera: [...camera.position.toArray(), camera.fov], bodyYaw: scene.children.find(child => child.isGroup)?.rotation.y || 0, renders: renders - before, draws: (data.counters.drawElements || 0) + (data.counters.drawArrays || 0) - draws, hash: location.hash, active: current?.getAttribute('href'), card: document.querySelectorAll('.tour-tag')[activeId]?.getAttribute('href'), transitioning: document.querySelector('.tour')?.dataset.transitioning === 'true' };
          if (data.phase === 'idle' || data.phase === 'jobs-idle') {
            frame.faceMorphs = [];
            scene.traverse(mesh => {
              if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) frame.faceMorphs.push({ mesh: mesh.name, values: Object.fromEntries(Object.entries(mesh.morphTargetDictionary).map(([name, index]) => [name, mesh.morphTargetInfluences[index]])) });
            });
          }
          if (pixels) {
            pixelContext ||= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
            pixelContext.canvas.width = 128;
            pixelContext.canvas.height = 72;
            pixelContext.drawImage(renderer.domElement, 0, 0, 128, 72);
            const image = pixelContext.getImageData(0, 0, 128, 72).data;
            if (previousImage) {
              let difference = 0;
              for (let i = 0; i < image.length; i += 4) difference += (Math.abs(image[i] - previousImage[i]) + Math.abs(image[i + 1] - previousImage[i + 1]) + Math.abs(image[i + 2] - previousImage[i + 2])) / 3;
              frame.pixelDifference = difference / (image.length / 4);
            }
            previousImage = image;
            frame.pixelCost = performance.now() - submitted;
          }
          data.frames.push(frame);
        });
      };
      for (const type of ['wheel', 'click', 'scroll', 'hashchange']) window.addEventListener(type, event => data.events.push({ type, phase: data.phase, time: performance.now(), hash: location.hash, scroll: scrollY, target: event.target?.closest?.('a')?.hash }), { passive: true });
    }, { pixels });
    await page.goto(`${base}/?motion-check=${run}#start`);
    await page.locator('.tour[data-mode="live"]').waitFor({ timeout: 60000 });
    await settled(page, 'start');
    await page.mouse.move(1200, 20);
    await page.waitForTimeout(1200);
    await page.evaluate(() => { window.motionProfile.phase = 'idle'; window.motionProfile.idleStarted = performance.now(); window.motionProfile.idleCamera = window.motionProfile.camera; });
    await page.waitForTimeout(idleDuration);
    await page.evaluate(() => { window.motionProfile.phase = 'wheel'; window.motionProfile.beforeWheel = window.motionProfile.camera; });
    await page.mouse.wheel(0, 720);
    await page.waitForTimeout(1400);
    for (const id of ['cells', 'jobs', 'loops', 'off-hours', 'start']) {
      await page.evaluate(id => { window.motionProfile.phase = `traverse-${id}`; }, id);
      await page.locator(`.tour-tag[href="#${id}"]`).click();
      await settled(page, id);
    }
    await page.evaluate(() => { window.motionProfile.phase = 'retarget'; });
    for (const id of ['jobs', 'loops', 'start']) {
      await page.locator(`.tour-tag[href="#${id}"]`).click();
      await page.waitForTimeout(70);
    }
    await settled(page, 'start');
    await page.evaluate(() => { window.motionProfile.phase = 'traverse-jobs-again'; });
    await page.locator('.tour-tag[href="#jobs"]').click();
    await settled(page, 'jobs');
    await page.evaluate(() => { window.motionProfile.phase = 'jobs-idle'; window.motionProfile.jobsIdleStarted = performance.now(); window.motionProfile.jobsIdleCamera = window.motionProfile.camera; });
    await page.waitForTimeout(idleDuration);
    await page.evaluate(() => { window.motionProfile.phase = 'stall'; });
    await page.locator('.tour-tag[href="#start"]').click();
    await page.evaluate(() => setTimeout(() => {
      const start = performance.now();
      while (performance.now() - start < 200) { /* deliberate test-only main-thread stall */ }
      window.motionProfile.stall = { start, duration: performance.now() - start };
    }, 50));
    await page.waitForTimeout(1200);
    await settled(page, 'start');
    const data = await page.evaluate(() => {
      const { renderers, ...data } = window.motionProfile;
      const renderer = renderers.at(-1);
      const gl = renderer.getContext();
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      return { ...data, hardware: { viewport: [innerWidth, innerHeight], devicePixelRatio, canvas: [renderer.domElement.width, renderer.domElement.height], gpu: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'unavailable' } };
    });
    data.errors = errors;
    const summary = summarize(data);
    summaries.push(summary);
    await writeFile(path.join(output, `run-${String(run).padStart(2, '0')}.json`), JSON.stringify(data, null, 2));
    console.log(JSON.stringify({ run, wheelResponseMs: summary.wheelResponseMs, wheelSettleMs: summary.wheelSettleMs, stallSettleMs: summary.injectedStallSettleMs, idle: summary.idle, jobsIdle: summary.jobsIdle, gates: summary.gates }));
    await context.close();
  }
  await writeFile(path.join(output, 'summary.json'), JSON.stringify({ base, pixels, idleDuration, runs: summaries }, null, 2));
  assert.ok(summaries.every(summary => Object.values(summary.gates).every(Boolean)), 'Motion acceptance gates failed; inspect summary.json');
} catch (error) {
  await writeFile(path.join(output, 'failure.json'), JSON.stringify({ message: error.stack, completedRuns: summaries }, null, 2));
  process.exitCode = 1;
  console.error(error);
} finally {
  await browser.close();
  console.log(`Motion evidence: ${output}`);
}
