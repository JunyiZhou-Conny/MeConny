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
const selectedChecks = process.env.TOUR_CHECK ? new RegExp(process.env.TOUR_CHECK) : null;

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

async function settledStop(page, id) {
  await page.waitForFunction(({ id, index }) =>
    location.hash === `#${id}` &&
    document.querySelector(`.tour-tag[href="#${id}"]`)?.getAttribute('aria-current') === 'true' &&
    Math.abs(scrollY - index * innerHeight) <= 2,
  { id, index: stops.indexOf(id) });
  const state = await page.evaluate(() => ({
    hash: location.hash,
    current: document.querySelector('.tour-tag[aria-current="true"]')?.getAttribute('href'),
    visibleCards: [...document.querySelectorAll('.tour-card')].filter(card => getComputedStyle(card).visibility === 'visible').length,
  }));
  assert.equal(state.hash, `#${id}`);
  assert.equal(state.current, `#${id}`);
  assert.equal(state.visibleCards, 1);
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
  if (selectedChecks && !selectedChecks.test(name)) return;
  await run();
  results.push({ check: name, result: 'PASS' });
  console.log(`PASS ${name}`);
}

try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
    await record(`${name}: direct Start link opens the introduction at zero scroll`, async () => {
      const page = await open({ viewport: { width, height } }, '/#start');
      await live(page);
      await settledStop(page, 'start');
      assert.equal(await page.evaluate(() => scrollY), 0);
      assert.equal(await page.locator('.tour-card[data-active="true"] h1').innerText(), 'Hi, I’m Conny.');
      await page.context().close();
    });
    await record(`${name}: Start reload defeats previous stop restoration`, async () => {
      const page = await open({ viewport: { width, height } }, '/#jobs');
      await live(page);
      await settledStop(page, 'jobs');
      await page.locator('.tour-tag[href="#start"]').click();
      await settledStop(page, 'start');
      await page.reload();
      await live(page);
      await settledStop(page, 'start');
      assert.equal(await page.evaluate(() => scrollY), 0);
      await page.context().close();
    });
    await record(`${name}: Back and Forward restore matching scene and hash`, async () => {
      const page = await open({ viewport: { width, height } }, '/#start');
      await live(page);
      await settledStop(page, 'start');
      await page.locator('.tour-tag[href="#jobs"]').click();
      await settledStop(page, 'jobs');
      await page.locator('.tour-tag[href="#off-hours"]').click();
      await settledStop(page, 'off-hours');
      await page.goBack();
      await settledStop(page, 'jobs');
      await page.goBack();
      await settledStop(page, 'start');
      await page.goForward();
      await settledStop(page, 'jobs');
      await page.goForward();
      await settledStop(page, 'off-hours');
      await page.context().close();
    });
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
  for (const [asset, pattern] of [
    ['model', '**/3d/conny-bust.glb'],
    ['sticker texture', '**/3d/stickers/pulse-illustrated.webp'],
  ]) {
    await record(`delayed ${asset} keeps the loading screen until the scene is ready`, async () => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      let release;
      const held = new Promise(resolve => { release = resolve; });
      await context.route(pattern, async route => {
        await held;
        await route.continue();
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push({ url: page.url(), message: error.message }));
      try {
        const request = page.waitForRequest(pattern);
        await page.goto(`${base}/#start`, { waitUntil: 'domcontentloaded' });
        await request;
        await page.locator('.tour[data-mode="loading"]').waitFor();
        await page.waitForTimeout(350);
        assert.equal(await page.locator('.tour').getAttribute('data-mode'), 'loading');
        const overlay = page.locator('.tour-loading');
        assert.equal(await overlay.getAttribute('data-ready'), 'false');
        assert.equal(await overlay.evaluate(element => getComputedStyle(element).opacity), '1');
        const progress = Number.parseInt(await page.locator('.tour-loading-count').innerText(), 10);
        assert.ok(progress >= 0 && progress < 100, String(progress));
        release();
        await live(page);
        await settledStop(page, 'start');
        assert.equal(await overlay.getAttribute('data-ready'), 'true');
        assert.equal(await page.locator('.tour-loading-count').innerText(), '100 / 100');
        await overlay.waitFor({ state: 'hidden' });
        await page.waitForFunction(() => getComputedStyle(document.querySelector('.tour-poster')).opacity === '0');
      } finally {
        release();
        await context.close();
      }
    });
  }
  await record('failed HDR keeps a live scene with room lighting', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    let failedRequests = 0;
    await context.route('**/3d/studio-environment.hdr', route => {
      failedRequests++;
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push({ url: page.url(), message: error.message }));
    await page.goto(`${base}/#start`);
    await live(page);
    await settledStop(page, 'start');
    assert.ok(failedRequests > 0, 'HDR request was deliberately failed');
    assert.equal(await page.locator('.tour-loading').getAttribute('data-ready'), 'true');
    await stop(page, 'jobs');
    assert.equal(await page.locator('.tour').getAttribute('data-mode'), 'live');
    await context.close();
  });
  await record('sticker companion links support Tab and Enter navigation', async () => {
    const page = await open({}, '/#start');
    await live(page);
    await settledStop(page, 'start');
    const target = '.tour-sticker-link[href="#clinical"]';
    let focused = false;
    for (let presses = 0; presses < 30 && !focused; presses++) {
      await page.keyboard.press('Tab');
      focused = await page.evaluate(selector => document.activeElement?.matches(selector) === true, target);
    }
    assert.ok(focused, 'The clinical sticker link is reachable with Tab');
    assert.equal(await page.locator('.tour-sticker-links').evaluate(element => getComputedStyle(element).opacity), '1');
    await page.keyboard.press('Enter');
    await settledStop(page, 'clinical');
    assert.equal(await page.locator('.tour-card[data-active="true"] h2').innerText(), 'Residents run cases. Admins edit the prompts.');
    await page.context().close();
  });
  await record('unsupported float render targets retain the poster and static Job Search', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      window.__deniedColorBufferRequests = [];
      const getExtension = WebGL2RenderingContext.prototype.getExtension;
      WebGL2RenderingContext.prototype.getExtension = function (name) {
        if (name === 'EXT_color_buffer_float' || name === 'EXT_color_buffer_half_float') {
          window.__deniedColorBufferRequests.push(name);
          return null;
        }
        return getExtension.call(this, name);
      };
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push({ url: page.url(), message: error.message }));
    try {
      await page.goto(`${base}/#jobs`);
      await page.waitForFunction(() => window.__deniedColorBufferRequests.length > 0);
      await staticJobs(page, 'unsupported-float-targets');
      assert.equal(await page.locator('.tour[data-mode="live"]').count(), 0);
      assert.equal(await page.locator('.tour-stage canvas').count(), 0);
      await page.waitForFunction(() => {
        const poster = document.querySelector('.tour-poster');
        return poster?.complete && poster.naturalWidth > 0 && getComputedStyle(poster).opacity === '1';
      });
      assert.ok(await page.locator('.tour-poster').isVisible());
    } finally {
      await context.close();
    }
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
  assert.ok(results.length > 0, `No checks matched ${process.env.TOUR_CHECK}`);
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
