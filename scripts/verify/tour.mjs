import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TOUR_URL || 'http://localhost:3017';
const output = path.resolve(process.env.TOUR_EVIDENCE || '../outputs/verification');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
const errors = [];
const stops = ['start', 'clinical', 'cells', 'jobs', 'loops', 'off-hours'];

async function open(options = {}, route = '/') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push({ url: page.url(), message: error.message }));
  await page.goto(new URL(route, base).href);
  return page;
}

async function live(page) {
  await page.locator('.tour[data-mode="live"]').waitFor();
  assert.equal(await page.locator('.tour-stage canvas').count(), 1);
  assert.equal(await page.locator('.tour-card').count(), 6);
  assert.equal(await page.locator('h1').count(), 1);
}

async function stop(page, id) {
  await page.locator(`.tour-tag[href="#${id}"]`).click();
  await page.waitForFunction(id => document.querySelector(`.tour-tag[href="#${id}"]`)?.getAttribute('aria-current') === 'true', id);
  await page.waitForTimeout(1000);
  const state = await page.evaluate(() => ({
    y: scrollY,
    height: innerHeight,
    hash: location.hash,
    visible: [...document.querySelectorAll('.tour-card')].filter(el => getComputedStyle(el).visibility === 'visible').length,
  }));
  assert.equal(state.hash, `#${id}`);
  assert.equal(state.visible, 1);
  assert.ok(Math.abs(state.y - stops.indexOf(id) * state.height) <= 2, JSON.stringify(state));
}

async function staticJobs(page, name) {
  await page.locator('.tour[data-mode="static"]').waitFor();
  assert.equal(await page.locator('.tour-stage canvas').count(), 0);
  assert.equal(await page.locator('.tour-card').count(), 6);
  for (const card of await page.locator('.tour-card').all()) assert.ok(await card.isVisible());
  await page.waitForFunction(() => {
    const img = document.querySelector('#jobs img');
    return img?.complete && img.naturalWidth === 1100;
  });
  await page.locator('.tour-tag[href="#jobs"]').click();
  await page.waitForTimeout(300);
  assert.equal(new URL(page.url()).hash, '#jobs');
  const position = await page.locator('#jobs').boundingBox();
  const nav = await page.locator('.tour-bar').boundingBox();
  assert.ok(position.y >= nav.y + nav.height - 2, JSON.stringify({ position, nav }));
  assert.ok(position.y < (await page.evaluate(() => innerHeight)) / 2);
  await page.screenshot({ path: path.join(output, `${name}.png`) });
}

async function record(name, run) {
  await run();
  results.push({ check: name, result: 'PASS' });
  console.log(`PASS ${name}`);
}

try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
    await record(`${name}: six live stops, native scroll, scene and cards`, async () => {
      const page = await open({ viewport: { width, height } });
      await live(page);
      const ids = await page.locator('.tour-tag').evaluateAll(tags => tags.map(tag => tag.hash.slice(1)));
      assert.deepEqual(ids, stops);
      for (const id of stops) {
        await stop(page, id);
        assert.equal(await page.locator('.tour-card img').count(), 0);
        await page.screenshot({ path: path.join(output, `${name}-${id}.png`) });
      }
      await stop(page, 'start');
      await page.mouse.move(width / 2, 130);
      await page.mouse.wheel(0, height);
      await page.waitForFunction(() => scrollY > 100);
      await page.context().close();
    });
    await record(`${name}: reduced motion retains Job Search scene`, async () => {
      const page = await open({ viewport: { width, height }, reducedMotion: 'reduce' }, '/#jobs');
      await staticJobs(page, `${name}-reduced-motion`);
      await page.context().close();
    });
    await record(`${name}: no JavaScript retains Job Search scene`, async () => {
      const page = await open({ viewport: { width, height }, javaScriptEnabled: false }, '/#jobs');
      await staticJobs(page, `${name}-no-js`);
      await page.context().close();
    });
    await record(`${name}: runtime motion reduction preserves current stop`, async () => {
      const page = await open({ viewport: { width, height } });
      await live(page);
      await stop(page, 'jobs');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('.tour[data-mode="static"]').waitFor();
      await page.waitForTimeout(400);
      assert.equal(new URL(page.url()).hash, '#jobs');
      const box = await page.locator('#jobs').boundingBox();
      assert.ok(box.y >= 0 && box.y < height / 2, JSON.stringify(box));
      await staticJobs(page, `${name}-motion-change`);
      await page.context().close();
    });
    await record(`${name}: context loss preserves current stop`, async () => {
      const page = await open({ viewport: { width, height } });
      await live(page);
      await stop(page, 'jobs');
      const lost = await page.locator('canvas').evaluate(canvas => {
        const gl = canvas.getContext('webgl2');
        const extension = gl?.getExtension('WEBGL_lose_context');
        extension?.loseContext();
        return Boolean(extension);
      });
      assert.ok(lost, 'WEBGL_lose_context extension is available');
      await page.locator('.tour[data-mode="static"]').waitFor();
      await page.waitForTimeout(400);
      assert.equal(new URL(page.url()).hash, '#jobs');
      const box = await page.locator('#jobs').boundingBox();
      assert.ok(box.y >= 0 && box.y < height / 2, JSON.stringify(box));
      await staticJobs(page, `${name}-context-loss`);
      await page.context().close();
    });
  }
  await record('legacy deep link redirects to Cells', async () => {
    const page = await open({}, '/3d#cells');
    await live(page);
    await page.waitForFunction(() => location.pathname === '/' && location.hash === '#cells' && Math.abs(scrollY - 2 * innerHeight) <= 2);
    await page.context().close();
  });
  await record('direct Job Search link restores the scene', async () => {
    const page = await open({}, '/#jobs');
    await live(page);
    await page.waitForFunction(() => document.querySelector('.tour-tag[href="#jobs"]').getAttribute('aria-current') === 'true');
    assert.equal(await page.evaluate(() => scrollY), 2700);
    await page.context().close();
  });
  for (const kind of ['failed', 'invalid']) {
    await record(`${kind} GLB restores static Job Search`, async () => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.route('**/3d/conny-bust.glb', route => kind === 'failed' ? route.abort() : route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: 'invalid glb' }));
      const page = await context.newPage();
      page.on('pageerror', error => errors.push({ url: page.url(), message: error.message }));
      await page.goto(`${base}/#jobs`);
      await staticJobs(page, `${kind}-glb`);
      await context.close();
    });
  }
  await record('short phone keeps card contents accessible', async () => {
    const page = await open({ viewport: { width: 390, height: 568 } });
    await live(page);
    await stop(page, 'clinical');
    const card = page.locator('.tour-card[data-active="true"]');
    const box = await card.boundingBox();
    const nav = await page.locator('.tour-bar').boundingBox();
    assert.ok(box.y >= nav.height && box.y + box.height < 568);
    const link = card.getByRole('link', { name: 'GitHub', exact: true });
    await link.scrollIntoViewIfNeeded();
    assert.ok(await link.isVisible());
    await page.screenshot({ path: path.join(output, 'phone-short.png') });
    await page.context().close();
  });
  await record('hub retains its separate page and assets', async () => {
    const page = await open({}, '/hub');
    assert.equal(await page.locator('.tour').count(), 0);
    for (const resource of ['/css/style.css', '/js/main.js', '/js/hero-particles.js']) {
      assert.equal((await page.request.get(new URL(resource, base).href)).status(), 200);
    }
    await page.context().close();
  });
  assert.deepEqual(errors, []);
  results.push({ check: 'browser runtime errors', result: 'PASS', errors });
} catch (error) {
  results.push({ check: 'verification interrupted', result: 'FAIL', message: error.stack });
  process.exitCode = 1;
  console.error(error);
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  await browser.close();
}
