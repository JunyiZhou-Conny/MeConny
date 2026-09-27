import { chromium } from '/Users/conny/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { writeFile } from 'node:fs/promises'
const output = '/Users/conny/Documents/Codex/2026-09-15/i-wan/outputs/editorial-demo/verification'
const results = { started: new Date().toISOString(), checks: [], errors: [] }
const check = (name, passed, detail) => { results.checks.push({ name, passed: Boolean(passed), detail }); if (!passed) console.log('FAIL', name, detail) }
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const viewport of [{ name: 'desktop', width: 1280, height: 720 }, { name: 'phone', width: 390, height: 844 }, { name: 'compact-phone', width: 375, height: 667 }]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    page.on('pageerror', error => results.errors.push(error.message))
    await page.goto('http://127.0.0.1:3023/', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.loading-screen.is-hidden').waitFor({ timeout: 45000 })
    const projects = await page.locator('.project-spread').evaluateAll(els => els.map(el => el.id))
    for (const [index, id] of projects.entries()) {
      const article = page.locator(`#${id}`)
      await article.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .14, behavior: 'instant' }))
      await delay(180)
      await page.waitForFunction(id => [...document.querySelectorAll(`#${id} img`)].every(img => img.complete && img.naturalWidth > 0), id)
      const geometry = await article.evaluate(el => {
        const box = selector => { const r = el.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right } }
        return { heading: box('.project-heading'), image: box('.project-evidence'), description: box('.project-description'), scrollWidth: document.documentElement.scrollWidth, width: innerWidth }
      })
      const ordered = viewport.name === 'desktop' ? Math.abs(geometry.heading.left - geometry.description.left) < 1 && geometry.image.left > geometry.heading.right && geometry.description.top >= geometry.heading.bottom : geometry.image.top >= geometry.heading.bottom && geometry.description.top >= geometry.image.bottom
      check(`${viewport.name}: ${id} reading layout is preserved`, ordered, geometry)
      check(`${viewport.name}: ${id} has no horizontal overflow`, geometry.scrollWidth <= geometry.width + 1, geometry)
      await page.screenshot({ path: `${output}/${viewport.name}-project-${index + 1}.png`, animations: 'disabled' })
      await article.locator('h3 button').focus()
      await page.keyboard.press('Tab')
      check(`${viewport.name}: ${id} title Tab reaches cover`, await article.locator('.project-cover').evaluate(el => el === document.activeElement))
      await page.keyboard.press('Tab')
      check(`${viewport.name}: ${id} cover Tab reaches case CTA`, await article.locator('.project-actions button').evaluate(el => el === document.activeElement))
      await page.keyboard.press('Tab')
      check(`${viewport.name}: ${id} case CTA Tab reaches GitHub`, await article.locator('.project-actions a').evaluate(el => el === document.activeElement))
      await article.locator('.project-cover').focus()
      const before = await page.evaluate(() => new Promise(resolve => {
        let previous = scrollY
        let stableFrames = 0
        const started = performance.now()
        const sample = () => {
          stableFrames = Math.abs(scrollY - previous) < .5 ? stableFrames + 1 : 0
          previous = scrollY
          if (stableFrames >= 8 || performance.now() - started > 2000) resolve(scrollY)
          else requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
      }))
      await page.keyboard.press('Enter')
      await page.locator('dialog[open]').waitFor()
      check(`${viewport.name}: ${id} keyboard cover activation opens right dialog`, (await page.locator('#case-title').innerText()).trim() === (await article.locator('h3 button').innerText()).trim())
      await page.keyboard.press('Escape')
      await page.locator('dialog[open]').waitFor({ state: 'detached' })
      await delay(70)
      const returned = await article.locator('.project-cover').evaluate(el => ({ focused: document.activeElement === el, scroll: scrollY }))
      check(`${viewport.name}: ${id} returns to cover without scroll movement`, returned.focused && Math.abs(returned.scroll - before) < 3, { before, ...returned })
    }
    await context.close()
  }
  check('No runtime errors in follow-up', results.errors.length === 0, results.errors)
} finally {
  await browser.close()
  results.finished = new Date().toISOString()
  results.summary = { passed: results.checks.filter(x => x.passed).length, failed: results.checks.filter(x => !x.passed).length }
  await writeFile(`${output}/project-flow-results.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results.summary))
}
