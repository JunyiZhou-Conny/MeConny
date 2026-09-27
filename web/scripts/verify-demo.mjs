// Browser checks for the editorial demo (vertical Works, dialogs, integrated About).
// This is a review aid for the running dev server, not the release contract in
// verify-publication.mjs. Playwright is not a web/ dependency; point to any install:
//
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
//   DEMO_URL=http://127.0.0.1:3023 OUT_DIR=/tmp/demo-verify \
//   node web/scripts/verify-demo.mjs
//
// CHROMIUM_ARGS adds launch flags (software GL in containers, e.g.
// "--use-angle=swiftshader --enable-unsafe-swiftshader"). VIEWPORTS limits the
// run to named sizes: desktop, wide, phone, compact-phone.
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const moduleName = process.env.PLAYWRIGHT_MODULE
const { chromium } = await import(
  moduleName ? pathToFileURL(path.resolve(moduleName)).href : 'playwright'
)
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const url = (process.env.DEMO_URL || 'http://127.0.0.1:3023').replace(/\/$/, '')
const output = path.resolve(process.env.OUT_DIR || 'demo-verification')
const acceptedModel = '168a2c2bef0b549a86a5e906647dfdd62fc572863e5474af532815b09fba1f01'
const viewports = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'wide', width: 1680, height: 1000 },
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'compact-phone', width: 375, height: 667, mobile: true },
].filter((v) => !process.env.VIEWPORTS || process.env.VIEWPORTS.split(',').includes(v.name))

const results = { url, started: new Date().toISOString(), checks: [], runtimeErrors: [], screenshots: [] }
const check = (name, passed, detail) => {
  results.checks.push({ name, passed: Boolean(passed), detail })
  console.log(passed ? 'PASS' : 'FAIL', name, passed ? '' : JSON.stringify(detail))
}
const digest = (data) => createHash('sha256').update(data).digest('hex')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
// Software-rendered WebGL can run at ~1 fps, so wait for motion to finish.
const settle = Number(process.env.SETTLE_MS || 2500)

await mkdir(output, { recursive: true })
const local = await readFile(path.join(webRoot, 'public/models/me.glb'))
check('Local model matches the accepted open-eye GLB', digest(local) === acceptedModel, { sha256: digest(local) })

const browser = await chromium.launch({
  headless: true,
  args: (process.env.CHROMIUM_ARGS || '').split(' ').filter(Boolean),
})

async function screenshot(page, name) {
  const file = path.join(output, `${name}.png`)
  await page.screenshot({ path: file, timeout: 90000 })
  results.screenshots.push(file)
}
async function ready(page) {
  await page.locator('.project-spread').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  // The overlay unmounts ~0.7s after it starts hiding; accept either state.
  await page.waitForFunction(
    () => document.querySelector('.loading-screen')?.classList.contains('is-hidden') ?? true,
    null,
    { timeout: 120000 }
  )
  await delay(600)
}
async function scrollToY(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
  await delay(settle)
}
async function waitForCopy(page, selector) {
  await page
    .waitForFunction(
      (s) => [...document.querySelectorAll(`${s} .tl-period, ${s} .tl-place`)].every((el) => getComputedStyle(el).opacity === '1'),
      selector,
      { timeout: 20000 }
    )
    .catch(() => {})
}

try {
  for (const viewport of viewports) {
    console.log('Starting', viewport.name)
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: Boolean(viewport.mobile),
      isMobile: Boolean(viewport.mobile),
    })
    const page = await context.newPage()
    page.on('pageerror', (error) => results.runtimeErrors.push({ viewport: viewport.name, message: error.message }))
    page.on('console', (message) => {
      if (message.type() === 'error') results.runtimeErrors.push({ viewport: viewport.name, message: message.text() })
    })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await ready(page)
    await scrollToY(page, 0)

    const hero = await page.locator('.about-body').evaluate((el) => {
      const s = getComputedStyle(el)
      return { size: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) }
    })
    check(`${viewport.name}: hero copy is at least 16px with 1.5 line height`, hero.size >= 16 && hero.line / hero.size >= 1.49, hero)
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      projects: [...document.querySelectorAll('.project-spread')].map((el) => {
        const r = el.getBoundingClientRect()
        return { id: el.id, top: r.top, height: r.height, facts: el.querySelectorAll('.project-facts dt').length }
      }),
      anchors: [...document.querySelectorAll('.tl-entry[data-point]')].map((el) => el.getAttribute('data-point')),
      gallery: Boolean(document.querySelector('.wk-gallery')),
      scene: getComputedStyle(document.querySelector('.scene-bg')).zIndex,
      content: getComputedStyle(document.querySelector('.content')).zIndex,
      fonts: [...new Set(['.about-body', '.tl-period', '.project-summary', '.about-conny'].map((s) => getComputedStyle(document.querySelector(s)).fontFamily))],
    }))
    check(`${viewport.name}: no horizontal overflow`, layout.scrollWidth <= layout.width + 1, layout)
    check(
      `${viewport.name}: four vertically ordered projects with fact lists`,
      layout.projects.length === 4 &&
        layout.projects.every((p, i) => p.facts === 4 && (i === 0 || p.top >= layout.projects[i - 1].top + layout.projects[i - 1].height - 1)),
      layout.projects
    )
    check(`${viewport.name}: five camera anchors and the .wk-gallery hook retained`, JSON.stringify(layout.anchors) === JSON.stringify(['focus-1', 'focus-2', 'focus-3', 'focus-4', 'focus-5']) && layout.gallery, layout.anchors)
    check(`${viewport.name}: grain stays beneath content`, Number(layout.scene) < Number(layout.content), layout)
    check(`${viewport.name}: body copy shares one sans-serif stack`, layout.fonts.length === 1, layout.fonts)
    await screenshot(page, `${viewport.name}-hero`)

    for (let i = 1; i <= 5; i++) {
      const selector = `[data-point="focus-${i}"]`
      const top = await page.locator(selector).evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
      await scrollToY(page, top - viewport.height * 0.3)
      await waitForCopy(page, selector)
      const g = await page.locator(selector).evaluate((el) => {
        const entry = el.getBoundingClientRect()
        const card = el.querySelector('.tl-body').getBoundingClientRect()
        const dot = el.querySelector('.tl-dot').getBoundingClientRect()
        return { vh: innerHeight, entry: { top: entry.top, bottom: entry.bottom }, card: { top: card.top, bottom: card.bottom }, dot: { top: dot.top }, opacity: getComputedStyle(el.querySelector('.tl-place')).opacity }
      })
      check(`${viewport.name}: story ${i} copy is fully on screen`, g.card.top >= 0 && g.card.bottom <= g.vh && g.opacity === '1', g)
      check(`${viewport.name}: story ${i} timeline dot stays beside its card`, g.dot.top >= g.card.top - 1 && g.dot.top <= g.card.top + 24, g)
      if (viewport.mobile) {
        const clear = i === 5 ? g.card.top >= g.vh * 0.5 : Math.min(g.vh, g.entry.bottom) - g.card.bottom >= 70
        check(`${viewport.name}: story ${i} leaves the portrait visible`, clear, g)
      }
      await screenshot(page, `${viewport.name}-story-${i}`)
    }

    for (const [index, project] of layout.projects.entries()) {
      const article = page.locator(`#${project.id}`)
      const expectedTitle = (await article.locator('h3 button').innerText()).trim()
      await article.evaluate((el) => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - innerHeight * 0.14, behavior: 'instant' }))
      await page.waitForFunction((s) => [...document.querySelectorAll(`${s} img`)].every((img) => img.complete && img.naturalWidth > 0), `#${project.id}`)
      await delay(settle)
      await screenshot(page, `${viewport.name}-project-${index + 1}`)
      for (const [kind, selector] of [['cover', '.project-cover'], ['title', 'h3 button'], ['cta', '.project-actions button']]) {
        const trigger = article.locator(selector)
        await trigger.scrollIntoViewIfNeeded()
        await trigger.focus()
        const before = await page.evaluate(() => window.scrollY)
        await page.keyboard.press('Enter')
        const dialog = page.locator('dialog[open]')
        await dialog.waitFor()
        const opened = await dialog.evaluate((el) => ({
          title: el.querySelector('#case-title')?.textContent.trim(),
          facts: el.querySelectorAll('.case-facts dt').length,
          modal: el.matches(':modal'),
          focusInside: el.contains(document.activeElement),
        }))
        check(`${viewport.name}: ${project.id} ${kind} opens its modal case study`, opened.title === expectedTitle && opened.facts === 4 && opened.modal && opened.focusInside, opened)
        if (kind === 'cover') {
          const trace = []
          for (let tab = 0; tab < 12; tab++) {
            await page.keyboard.press('Tab')
            trace.push(await dialog.evaluate((el) => el.contains(document.activeElement) || !document.hasFocus()))
          }
          check(`${viewport.name}: ${project.id} keeps keyboard focus inside the dialog`, trace.every(Boolean), trace)
        }
        if (index === 0 && kind === 'title') {
          await delay(settle)
          await screenshot(page, `${viewport.name}-clinical-dialog`)
          await dialog.locator('.case-media').scrollIntoViewIfNeeded()
          await delay(settle)
          await screenshot(page, `${viewport.name}-clinical-dialog-media`)
          const media = await dialog.evaluate((el) => [...el.querySelectorAll('.case-media a')].map((a) => ({ href: a.getAttribute('href'), img: Boolean(a.querySelector('img')) })))
          check(`${viewport.name}: clinical screenshots open at full size`, media.length === 2 && media.every((m) => m.img && m.href.startsWith('/projects/')), media)
        }
        if (kind === 'cta') await dialog.getByRole('button', { name: 'Back to selected work' }).press('Enter')
        else await page.keyboard.press('Escape')
        // Escape closes the native dialog at once; React unmounts it when the
        // queued close event arrives, which can be seconds later at ~1 fps.
        await page.locator('dialog.case-study').waitFor({ state: 'detached', timeout: 30000 })
        await page
          .waitForFunction((el) => document.activeElement === el, await trigger.elementHandle(), { timeout: 8000 })
          .catch(() => {})
        const back = await trigger.evaluate((el) => ({ focused: document.activeElement === el, scroll: window.scrollY, overflow: document.body.style.overflow }))
        check(`${viewport.name}: ${project.id} ${kind} restores focus and scroll`, back.focused && Math.abs(back.scroll - before) < 3 && back.overflow === '', { before, ...back })
      }
    }

    await page.locator('.journal-outro a').click()
    await page.waitForFunction(() => location.hash === '#about')
    await delay(settle)
    const about = await page.locator('#about').boundingBox()
    check(`${viewport.name}: More about me reaches the integrated About`, about.y < viewport.height * 0.35 && about.y > -50, about)
    await screenshot(page, `${viewport.name}-about`)
    const links = await page.evaluate(() => ({
      images: [...document.images].map((img) => ({ src: img.currentSrc, loaded: img.complete && img.naturalWidth > 0 })),
      anchors: [...document.querySelectorAll('a[href^="#"]')].map((a) => ({ href: a.getAttribute('href'), exists: Boolean(document.getElementById(a.getAttribute('href').slice(1))) })),
      external: [...document.querySelectorAll('a[href^="http"]')].map((a) => ({ href: a.href, target: a.target })),
    }))
    check(`${viewport.name}: displayed media loads`, links.images.every((i) => i.loaded), links.images.filter((i) => !i.loaded))
    check(`${viewport.name}: internal anchor targets exist`, links.anchors.every((a) => a.exists), links.anchors.filter((a) => !a.exists))
    check(`${viewport.name}: external links are HTTPS`, links.external.every((l) => l.href.startsWith('https://')), links.external.filter((l) => !l.href.startsWith('https://')))
    await context.close()
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  page.on('pageerror', (error) => results.runtimeErrors.push({ viewport: 'routes', message: error.message }))
  const served = await page.request.get(`${url}/models/me.glb`)
  check('Served model is the accepted open-eye GLB', served.ok() && digest(await served.body()) === acceptedModel, { status: served.status() })
  for (const route of ['/hub', '/hub/', '/hub.html', '/#species-ot']) {
    await page.goto(`${url}${route}`, { waitUntil: 'domcontentloaded' })
    await ready(page)
    await delay(600)
    const target = route.includes('#') ? '#species-ot' : '#about'
    const position = await page.locator(target).evaluate((el) => ({ top: el.getBoundingClientRect().top, path: location.pathname, hash: location.hash }))
    check(`${route} lands on ${target}`, position.path === '/' && position.hash === target && position.top >= -10 && position.top <= 170, position)
  }
  await context.close()
  check('No runtime or browser console errors', results.runtimeErrors.length === 0, results.runtimeErrors)
} catch (error) {
  results.fatal = { message: error.message, stack: error.stack }
  console.error(error)
} finally {
  await browser.close()
  results.finished = new Date().toISOString()
  results.summary = {
    passed: results.checks.filter((c) => c.passed).length,
    failed: results.checks.filter((c) => !c.passed).length,
    screenshots: results.screenshots.length,
  }
  await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results.summary), results.fatal ? 'FATAL' : '')
  if (results.fatal || results.summary.failed) process.exitCode = 1
}
