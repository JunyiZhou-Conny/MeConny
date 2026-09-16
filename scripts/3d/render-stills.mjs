import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TOUR_URL || 'http://localhost:3000';
const scratch = path.resolve(process.env.TOUR_SCRATCH || '../work/tour-stills');
await mkdir(scratch, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const [id, width, height, file] of [
    ['start', 1600, 1000, 'poster.jpg'],
    ['jobs', 1100, 700, 'job-search-still.webp'],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(`${base}/?place=1#${id}`);
    await page.locator('.tour[data-mode="live"]').waitFor();
    await page.waitForTimeout(1200);
    await page.addStyleTag({ content: '.tour-bar,.tour-cards,.tour-credit,.tour-place,.tour-poster,.tour-viewfinder,.tour-location,.tour-index,.tour-scroll-hint,.tour-sticker-links,.tour-loading,.site-grain,nextjs-portal{display:none!important}.tour-stage::after{display:none!important}' });
    const image = path.join(scratch, `${id}.png`);
    await page.screenshot({ path: image });
    await sharp(image).toFormat(id === 'start' ? 'jpeg' : 'webp', { quality: 85 }).toFile(path.join('public/3d', file));
    await page.close();
  }
} finally {
  await browser.close();
}
