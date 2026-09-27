import { chromium } from '/Users/conny/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = '/Users/conny/Documents/Codex/2026-09-15/i-wan'
const output = path.join(root, 'outputs/editorial-demo/verification')
const url = process.env.DEMO_URL || 'http://127.0.0.1:3023'
const results = { url, started: new Date().toISOString(), checks: [], runtimeErrors: [], screenshots: [], externalLinks: [] }
const check = (name, passed, detail) => { results.checks.push({ name, passed: Boolean(passed), detail }); if (!passed) console.log('FAIL', name, JSON.stringify(detail)) }
const digest = data => createHash('sha256').update(data).digest('hex')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
await mkdir(output, { recursive: true })
const production = await readFile(path.join(root, 'MeConny-live/web/public/models/me.glb'))
const local = await readFile(path.join(root, 'MeConny-demo/web/public/models/me.glb'))
check('Demo model is identical to production', digest(local) === digest(production), { sha256: digest(local), bytes: local.length })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const allLinks = new Set()
const viewports = [{ name: 'desktop', width: 1280, height: 720 }, { name: 'phone', width: 390, height: 844 }, { name: 'compact-phone', width: 375, height: 667 }]
async function screenshot(page, name) {
  const file = path.join(output, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false, animations: 'disabled' })
  results.screenshots.push(file)
}
async function scrollTo(page, selector, fraction = .14) {
  await page.locator(selector).evaluate((el, fraction) => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - innerHeight * fraction, behavior: 'instant' }), fraction)
  await delay(180)
}
async function ready(page) {
  await page.locator('.project-spread').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.loading-screen.is-hidden').waitFor({ timeout: 45000 })
  await delay(400)
}
try {
  for (const viewport of viewports) {
    console.log('Starting', viewport.name)
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
    const page = await context.newPage()
    page.on('pageerror', error => results.runtimeErrors.push({ viewport: viewport.name, message: error.message }))
    page.on('console', message => { if (message.type() === 'error') results.runtimeErrors.push({ viewport: viewport.name, message: message.text() }) })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await ready(page)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await delay(900)
    const hero = await page.locator('.about-body').evaluate(el => { const s = getComputedStyle(el); return { size: parseFloat(s.fontSize), line: parseFloat(s.lineHeight), family: s.fontFamily } })
    check(`${viewport.name}: hero copy is at least 16px with 1.5 line height`, hero.size >= 16 && hero.line / hero.size >= 1.49, hero)
    const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, projects: [...document.querySelectorAll('.project-spread')].map(el => ({ id: el.id, top: el.getBoundingClientRect().top, left: el.getBoundingClientRect().left, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })), anchors: [...document.querySelectorAll('.tl-entry[data-point]')].map(el => el.getAttribute('data-point')), grain: getComputedStyle(document.querySelector('[data-three-noise-overlay]')).zIndex, scene: getComputedStyle(document.querySelector('.scene-bg')).zIndex, content: getComputedStyle(document.querySelector('.content')).zIndex } ))
    check(`${viewport.name}: no horizontal overflow`, layout.scrollWidth <= layout.width + 1, layout)
    check(`${viewport.name}: four complete vertically ordered projects`, layout.projects.length === 4 && layout.projects.every((project, i) => i === 0 || project.top >= layout.projects[i-1].top + layout.projects[i-1].height - 1), layout.projects)
    check(`${viewport.name}: five camera anchor wrappers retained`, JSON.stringify(layout.anchors) === JSON.stringify(['focus-1','focus-2','focus-3','focus-4','focus-5']), layout.anchors)
    check(`${viewport.name}: grain is contained beneath content`, Number(layout.scene) < Number(layout.content), { scene: layout.scene, content: layout.content, grain: layout.grain })
    if (viewport.name === 'desktop') {
      const served = await page.request.get(`${url}/models/me.glb`)
      check('Served model is identical to production', served.ok() && digest(await served.body()) === digest(production), { status: served.status() })
    }
    await screenshot(page, `${viewport.name}-hero`)
    if (viewport.name !== 'desktop') {
      for (let i = 1; i <= 5; i++) {
        await scrollTo(page, `[data-point="focus-${i}"]`, .3)
        await delay(900)
        const geometry = await page.locator(`[data-point="focus-${i}"]`).evaluate(el => { const entry = el.getBoundingClientRect(); const card = el.querySelector('.tl-body').getBoundingClientRect(); return { viewport: { width: innerWidth, height: innerHeight }, entry: { top: entry.top, bottom: entry.bottom }, card: { top: card.top, bottom: card.bottom, height: card.height }, availableBelow: Math.min(innerHeight, entry.bottom) - card.bottom } })
        check(`${viewport.name}: story ${i} has visible copy and lower scene space`, geometry.card.top >= 0 && geometry.card.bottom <= viewport.height && (i === 5 || geometry.availableBelow >= 70), geometry)
        await screenshot(page, `${viewport.name}-story-${i}`)
      }
    }
    for (const [index, project] of layout.projects.entries()) {
      const article = page.locator(`#${project.id}`)
      const expectedTitle = (await article.locator('h3 button').innerText()).trim()
      await scrollTo(page, `#${project.id}`)
      await page.waitForFunction(selector => [...document.querySelectorAll(`${selector} img`)].every(img => img.complete && img.naturalWidth > 0), `#${project.id}`)
      await screenshot(page, `${viewport.name}-project-${index + 1}`)
      const triggers = [['cover', '.project-cover'], ['title', 'h3 button'], ['cta', '.project-actions button']]
      for (const [kind, selector] of triggers) {
        const trigger = article.locator(selector)
        await trigger.scrollIntoViewIfNeeded()
        await trigger.focus()
        const before = await page.evaluate(() => window.scrollY)
        await trigger.click()
        const dialog = page.locator('dialog[open]')
        await dialog.waitFor()
        check(`${viewport.name}: ${project.id} ${kind} opens correct detail`, (await dialog.locator('#case-title').innerText()).trim() === expectedTitle)
        if (kind === 'cover') {
          const focusTrace = []
          for (let tab = 0; tab < 12; tab++) {
            await page.keyboard.press('Tab')
            focusTrace.push(await dialog.evaluate(el => ({ tag: document.activeElement.tagName, inside: el.contains(document.activeElement), documentFocused: document.hasFocus(), modal: el.matches(':modal') })))
          }
          const backgroundInert = await page.locator('.demo-header a').first().evaluate(el => { el.focus(); return document.activeElement !== el })
          check(`${viewport.name}: ${project.id} modal contains document focus and makes background inert`, backgroundInert && focusTrace.every(state => state.modal && (state.inside || !state.documentFocused)), { backgroundInert, focusTrace })
          for (const href of await dialog.locator('a[href]').evaluateAll(els => els.map(el => el.getAttribute('href')))) allLinks.add(href)
        }
        if (index === 0 && kind === 'title') {
          await dialog.evaluate(el => { el.scrollTop = 0 })
          await screenshot(page, `${viewport.name}-clinical-dialog`)
        }
        if (kind === 'cover') await page.keyboard.press('Escape')
        else await dialog.getByRole('button', { name: 'Back to selected work' }).click()
        await page.locator('dialog[open]').waitFor({ state: 'detached' })
        await delay(70)
        const back = await trigger.evaluate(el => ({ focused: document.activeElement === el, scroll: window.scrollY }))
        check(`${viewport.name}: ${project.id} ${kind} restores focus and scroll`, back.focused && Math.abs(back.scroll - before) < 3, { before, ...back })
      }
    }
    const samePageLinks = await page.locator('a[href="#about"]').evaluateAll(els => els.map(el => ({ text: el.textContent, target: el.getAttribute('target') })))
    check(`${viewport.name}: More about me stays in this page`, samePageLinks.filter(link => /More about me/.test(link.text)).length >= 2 && samePageLinks.every(link => !link.target), samePageLinks)
    await page.locator('.journal-outro a').click()
    await page.waitForFunction(() => location.hash === '#about')
    await delay(850)
    const about = await page.locator('#about').boundingBox()
    check(`${viewport.name}: More about me reaches integrated About`, about.y < viewport.height * .35 && about.y > -50, about)
    await screenshot(page, `${viewport.name}-about`)
    const local = await page.evaluate(() => ({ images: [...document.images].map(img => ({ src: img.currentSrc, loaded: img.complete && img.naturalWidth > 0 })), links: [...document.querySelectorAll('a[href]')].map(el => el.getAttribute('href')), anchorTargets: [...document.querySelectorAll('a[href^="#"]')].map(el => ({ href: el.getAttribute('href'), exists: Boolean(document.getElementById(el.getAttribute('href').slice(1))) })) }))
    check(`${viewport.name}: displayed media loads`, local.images.every(image => image.loaded), local.images)
    check(`${viewport.name}: internal anchor targets exist`, local.anchorTargets.every(link => link.exists), local.anchorTargets)
    for (const link of local.links) allLinks.add(link)
    await context.close()
    console.log('Finished', viewport.name)
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  page.on('pageerror', error => results.runtimeErrors.push({ viewport: 'routes', message: error.message }))
  for (const route of ['/hub', '/hub/', '/hub.html']) {
    await page.goto(`${url}${route}`, { waitUntil: 'domcontentloaded' })
    await ready(page)
    const position = await page.locator('#about').evaluate(el => ({ top: el.getBoundingClientRect().top, path: location.pathname, hash: location.hash }))
    check(`${route} normalizes to integrated About`, position.path === '/' && position.hash === '#about' && position.top >= -10 && position.top <= 130, position)
  }
  await context.close()
  const cold = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  await cold.route('**/*.woff2', async route => { await delay(1400); await route.continue() })
  const deep = await cold.newPage()
  await deep.goto(`${url}/#species-ot`, { waitUntil: 'domcontentloaded' })
  await ready(deep)
  await delay(300)
  const target = await deep.locator('#species-ot').evaluate(el => ({ top: el.getBoundingClientRect().top, hash: location.hash, scroll: window.scrollY, fonts: document.fonts.status }))
  check('Cold direct #species-ot load remains correctly anchored after font swap', target.hash === '#species-ot' && target.top >= 0 && target.top < 170, target)
  await screenshot(deep, 'desktop-cold-species-anchor')
  await cold.close()
  for (const href of allLinks) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue
    const target = new URL(href, url)
    if (target.origin === new URL(url).origin) {
      const response = await fetch(target)
      check(`Local linked resource resolves: ${target.pathname}`, response.ok, { status: response.status })
    } else {
      const record = { href, protocol: target.protocol }
      if (target.hostname === 'github.com') {
        try {
          const response = await fetch(target, { signal: AbortSignal.timeout(15000) })
          record.status = response.status
          record.finalUrl = response.url
          await response.body?.cancel()
          check(`GitHub source link resolves: ${target.pathname}`, response.ok, { status: response.status })
        } catch (error) { record.error = error.message; check(`GitHub source link resolves: ${target.pathname}`, false, record) }
      }
      results.externalLinks.push(record)
      check(`External link has valid HTTPS target: ${href}`, target.protocol === 'https:')
    }
  }
  check('No runtime or browser console errors', results.runtimeErrors.length === 0, results.runtimeErrors)
} catch (error) {
  results.fatal = { message: error.message, stack: error.stack }
  console.error(error)
} finally {
  await browser.close()
  results.finished = new Date().toISOString()
  results.summary = { passed: results.checks.filter(check => check.passed).length, failed: results.checks.filter(check => !check.passed).length, screenshots: results.screenshots.length }
  await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results.summary), results.fatal ? 'FATAL' : '')
}
