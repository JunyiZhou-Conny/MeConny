import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TOUR_URL || 'http://localhost:3017';
const output = path.resolve(process.env.TOUR_EVIDENCE || '../outputs/decal-verification');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
const illustrations = [
  ['pulse', 'clinical', 'Clinical AI'], ['dna', 'cells', 'Cells'],
  ['chip', 'loops', 'Loops'], ['bike', 'off-hours', 'Off hours'],
  ['headphones', 'off-hours', 'Off hours'], ['hub', 'start', 'Start'],
];

async function open(phone) {
  const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 720 }, hasTouch: phone, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', ({ detail }) => {
      if (!detail.isWebGLRenderer) return;
      const render = detail.render;
      detail.render = function (scene, camera) {
        if (camera.isPerspectiveCamera && scene.background?.isColor) window.decalScene = { scene, camera };
        return render.call(this, scene, camera);
      };
    });
  });
  await page.goto(`${base}/#start`);
  await page.locator('.tour[data-mode="live"]').waitFor();
  await page.locator('.tour-loading').waitFor({ state: 'hidden' });
  return page;
}

async function candidates(page, illustration) {
  return page.evaluate(name => {
    const { scene, camera } = window.decalScene;
    let mesh;
    scene.traverse(object => {
      if (object.material?.map?.image?.src?.endsWith(`/${name}-illustrated.webp`)) mesh = object;
    });
    if (!mesh) throw new Error(`Illustration not rendered: ${name}`);
    const points = [];
    const pos = mesh.geometry.attributes.position;
    const uv = mesh.geometry.attributes.uv;
    const img = mesh.material.map.image;
    const sample = document.createElement('canvas');
    sample.width = img.width; sample.height = img.height;
    const ctx = sample.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const rgba = ctx.getImageData(0, 0, img.width, img.height).data;
    for (let i = 0; i < pos.count; i += 3) {
      const point = camera.position.clone().set(0, 0, 0);
      let u = 0, v = 0;
      for (let n = i; n < i + 3; n++) {
        point.add(camera.position.clone().fromBufferAttribute(pos, n));
        u += uv.getX(n) / 3; v += uv.getY(n) / 3;
      }
      const x = Math.min(img.width - 1, Math.max(0, Math.floor(u * img.width)));
      const y = Math.min(img.height - 1, Math.max(0, Math.floor((1 - v) * img.height)));
      if (rgba[(y * img.width + x) * 4 + 3] < 240) continue;
      point.multiplyScalar(1 / 3); mesh.localToWorld(point); point.project(camera);
      const client = { x: (point.x + 1) * innerWidth / 2, y: (1 - point.y) * innerHeight / 2 };
      if (document.elementFromPoint(client.x, client.y)?.tagName === 'CANVAS') points.push(client);
    }
    return points.filter((point, i) => i % Math.max(1, Math.floor(points.length / 12)) === 0);
  }, illustration);
}

async function transform(page, illustration) {
  return page.evaluate(name => {
    let mesh;
    window.decalScene.scene.traverse(object => {
      if (object.material?.map?.image?.src?.endsWith(`/${name}-illustrated.webp`)) mesh = object;
    });
    return { position: mesh.position.toArray(), scale: mesh.scale.toArray() };
  }, illustration);
}

async function reset(page) {
  await page.locator('.tour-tag[href="#start"]').click();
  await page.locator('.tour[data-transitioning="false"]').waitFor();
  await page.mouse.move(10, 350);
  await page.waitForTimeout(350);
}

try {
  const page = await open(false);
  for (const [illustration, stop, label] of illustrations) {
    await reset(page);
    const points = await candidates(page, illustration);
    assert.ok(points.length, `${illustration} is visible and not covered by copy`);
    let chosen;
    const resting = await transform(page, illustration);
    const before = await page.screenshot();
    for (const point of points) {
      await page.mouse.move(point.x, point.y);
      await page.waitForTimeout(90);
      if (await page.locator('.tour-sticker-caption').textContent({ timeout: 250 }).catch(() => null) === label) { chosen = point; break; }
    }
    assert.ok(chosen, `${illustration} reveals its destination on hover`);
    assert.equal(await page.locator('.tour-stage canvas').evaluate(canvas => getComputedStyle(canvas).cursor), 'pointer');
    await page.waitForTimeout(350);
    const raised = await transform(page, illustration);
    for (const scale of raised.scale) assert.ok(Math.abs(scale - 1.06) < 0.0001, `${illustration} visibly scales about its center`);
    const lift = Math.hypot(...raised.position.map((value, i) => value - resting.position[i]));
    assert.ok(Math.abs(lift - 0.004) < 0.0001, `${illustration} lifts off the sweater (${lift})`);
    const after = await page.screenshot({ path: path.join(output, `hover-${illustration}.png`) });
    const clip = { left: Math.max(0, Math.floor(chosen.x) - 35), top: Math.max(0, Math.floor(chosen.y) - 35), width: 70, height: 70 };
    const a = await sharp(before).extract(clip).removeAlpha().raw().toBuffer();
    const b = await sharp(after).extract(clip).removeAlpha().raw().toBuffer();
    const changed = a.reduce((sum, value, i) => sum + Number(Math.abs(value - b[i]) > 10), 0) / a.length;
    assert.ok(changed > 0.005, `${illustration} has visible local hover feedback (${changed})`);
    await page.mouse.click(chosen.x, chosen.y);
    await page.waitForFunction(id => location.hash === `#${id}` && document.querySelector(`.tour-tag[href="#${id}"]`)?.getAttribute('aria-current') === 'true', stop);
    results.push({ illustration, interaction: 'hover and click', changedFraction: changed, lift, scale: raised.scale[0], destination: stop, result: 'PASS' });
  }
  await page.close();
  const phone = await open(true);
  const points = await candidates(phone, 'pulse');
  assert.ok(points.length, 'Heart is visible above phone copy');
  const point = points[Math.floor(points.length / 2)];
  await phone.touchscreen.tap(point.x, point.y);
  await phone.waitForFunction(() => location.hash === '#clinical' && document.querySelector('.tour-tag[href="#clinical"]')?.getAttribute('aria-current') === 'true');
  await phone.locator('.tour[data-transitioning="false"]').waitFor();
  await phone.screenshot({ path: path.join(output, 'phone-heart-tap.png') });
  results.push({ illustration: 'pulse', interaction: 'touch tap', destination: 'clinical', result: 'PASS' });
  await phone.close();
} catch (error) {
  results.push({ result: 'FAIL', message: error.stack });
  process.exitCode = 1;
  console.error(error);
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}
