import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repo = path.dirname(web)
const contract = JSON.parse(await readFile(path.join(repo, 'docs/reference/scene-contract.json'), 'utf8'))
const baseline = contract.upstream.commit
const url = process.env.COMPARISON_URL || 'http://localhost:3020'
const output = path.resolve(process.argv[2] || process.env.COMPARISON_EVIDENCE || 'reference-verification')
assert(process.env.PLAYWRIGHT_MODULE, 'Set PLAYWRIGHT_MODULE to an installed Playwright module')
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE)
await mkdir(output, { recursive: true })

const results = { url, baseline, started: new Date().toISOString(), checks: [], viewports: [] }
const check = (name, passed, detail) => results.checks.push({ name, passed: Boolean(passed), detail })
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parseGlb = bytes => {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67)
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
}
for (const [file, expected] of Object.entries(contract.files)) {
  const current = await readFile(path.join(repo, file))
  check(`${file} matches the recorded scene contract`, sha256(current) === expected, { sha256: sha256(current) })
}
const manifest = JSON.parse(await readFile(path.join(web, 'package.json'), 'utf8'))
check('Original dependency configuration', JSON.stringify(manifest.dependencies) === JSON.stringify(contract.dependencies) && JSON.stringify(manifest.devDependencies) === JSON.stringify(contract.devDependencies))
const canvasProps = source => source.match(/<Canvas\b([\s\S]*?)>\s*<color/)?.[1]
const currentApp = await readFile(path.join(web, 'src/App.tsx'), 'utf8')
const initialCanvas = contract.canvasProps
check('Original Canvas configuration', initialCanvas && canvasProps(currentApp) === initialCanvas)

const modelBytes = await readFile(path.join(web, 'public/models/me.glb'))
const modelHash = sha256(modelBytes)
const model = parseGlb(modelBytes)
const requiredNames = ['Camera', 'man', 'focus-0', 'focus-1', 'focus-2', 'focus-3', 'focus-4', 'focus-5', 'focus-works']
check('Camera, animation carrier, and seven focus anchors', requiredNames.every(name => model.nodes.some(node => node.name === name)))
check('Original authored camera', JSON.stringify(model.cameras) === JSON.stringify(contract.cameras), model.cameras)
check('Original animation clip names', JSON.stringify(model.animations.map(clip => clip.name).sort()) === JSON.stringify(['CameraAction', 'manAction']))
check('Conny character replaces the source mesh', modelHash !== contract.originalModelSha256 && model.nodes.some(node => /Conny/i.test(node.name || '')), { bytes: modelBytes.length, sha256: modelHash })
check('No substituted eye tracking geometry', !model.nodes.some(node => /eye/i.test(node.name || '')))

const authorIdentity = /About Sen|Sen Zheng|郑越升|HOTSAR|坏打印机|Bad Printer|小郑还挺忙|ZOOOP|Based in Shenzhen/i
const expectedRepositories = [
  'Airway-Management-Assistant', 'speciesOT', 'job-search-2026-2027-starter', 'scgen-cellot-autoresearch',
]
const storyStickers = contract.model?.storyStickers ?? {}
const maxFocusDistanceError = contract.model?.maxFocusDistanceError
let stickerLineOfSight
if (Object.keys(storyStickers).length) {
  assert(Number.isFinite(maxFocusDistanceError) && maxFocusDistanceError >= 0, 'Candidate contract must specify maxFocusDistanceError')
  const THREE = await import('three')
  const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js')
  await MeshoptDecoder.ready
  const bodyNode = model.nodes.find(node => node.name === 'ConnyBody')
  const primitive = model.meshes[bodyNode.mesh].primitives[0]
  const binary = modelBytes.subarray(28 + modelBytes.readUInt32LE(12))
  const decode = (index, Type, size) => {
    const accessor = model.accessors[index]
    const extension = model.bufferViews[accessor.bufferView].extensions.EXT_meshopt_compression
    assert.equal(accessor.componentType, Type === Float32Array ? 5126 : 5125)
    assert.equal(accessor.type, size === 3 ? 'VEC3' : 'SCALAR')
    assert.equal(accessor.byteOffset ?? 0, 0)
    assert.equal(extension.byteStride, size * 4)
    assert.equal(extension.count, accessor.count)
    const decoded = new Uint8Array(accessor.count * size * 4)
    MeshoptDecoder.decodeGltfBuffer(decoded, extension.count, extension.byteStride,
      binary.subarray(extension.byteOffset, extension.byteOffset + extension.byteLength), extension.mode, extension.filter)
    return new Type(decoded.buffer)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(decode(primitive.attributes.POSITION, Float32Array, 3), 3))
  geometry.setIndex(new THREE.BufferAttribute(decode(primitive.indices, Uint32Array, 1), 1))
  const body = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
  const raycaster = new THREE.Raycaster()
  stickerLineOfSight = (frame, sticker) => {
    body.matrixWorld.fromArray(frame.bodyMatrixWorld)
    const origin = new THREE.Vector3().fromArray(frame.cameraWorld)
    const target = new THREE.Vector3().fromArray(sticker.surfaceSample.world)
    const direction = target.clone().sub(origin)
    const targetDistance = direction.length()
    raycaster.set(origin, direction.normalize())
    raycaster.far = targetDistance + 0.02
    const hit = raycaster.intersectObject(body, false)[0]
    return {
      unobstructed: !hit || hit.distance >= targetDistance - 0.02,
      targetDistance, hitDistance: hit?.distance ?? null,
      foregroundDistance: hit ? targetDistance - hit.distance : null,
      tolerance: 0.02, hitPoint: hit?.point.toArray() ?? null,
    }
  }
}
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]))
const viewportSizes = { desktop: [1440, 900], phone: [390, 844], 'compact-phone': [375, 667] }
const viewportNames = (process.env.COMPARISON_VIEWPORTS || 'desktop,phone').split(',')
assert(viewportNames.length && viewportNames.every(name => Object.hasOwn(viewportSizes, name)), 'Unknown COMPARISON_VIEWPORTS value')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const name of viewportNames) {
    const [width, height] = viewportSizes[name]
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: name !== 'desktop', hasTouch: name !== 'desktop' })
    const page = await context.newPage()
    const result = { name, width, height, errors: [], failedRequests: [], samples: [], works: [] }
    results.viewports.push(result)
    page.on('pageerror', error => result.errors.push({ source: 'page', message: error.message }))
    page.on('console', message => { if (message.type() === 'error') result.errors.push({ source: 'console', message: message.text(), location: message.location() }) })
    page.on('requestfailed', request => result.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }))
    page.on('response', response => { if (response.status() >= 400) result.failedRequests.push({ url: response.url(), status: response.status() }) })
    await page.addInitScript(storyStickers => {
      const stickerIds = [...new Set(Object.values(storyStickers))]
      let referenceScene, referenceCamera, referenceCanvas
      window.referenceFrame = null
      const sampleStickerSurface = mesh => {
        const { position, uv } = mesh.geometry.attributes
        const index = mesh.geometry.index
        if (!uv) return null
        let chosen, nearest = Infinity
        for (let offset = 0; offset + 2 < (index?.count ?? position.count); offset += 3) {
          const ids = [0, 1, 2].map(corner => index ? index.getX(offset + corner) : offset + corner)
          const points = ids.map(id => [uv.getX(id), uv.getY(id)])
          const [[ax, ay], [bx, by], [cx, cy]] = points
          const denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
          if (Math.abs(denominator) > 1e-12) {
            const a = ((by - cy) * (0.5 - cx) + (cx - bx) * (0.5 - cy)) / denominator
            const b = ((cy - ay) * (0.5 - cx) + (ax - cx) * (0.5 - cy)) / denominator
            const weights = [a, b, 1 - a - b]
            if (weights.every(weight => weight >= -1e-7)) {
              chosen = { ids, weights, uv: [0.5, 0.5], method: 'uv-center', triangle: offset / 3 }
              break
            }
          }
          const centroid = [(ax + bx + cx) / 3, (ay + by + cy) / 3]
          const distance = (centroid[0] - 0.5) ** 2 + (centroid[1] - 0.5) ** 2
          if (distance < nearest) {
            nearest = distance
            chosen = { ids, weights: [1 / 3, 1 / 3, 1 / 3], uv: centroid, method: 'nearest-uv-triangle-centroid', triangle: offset / 3 }
          }
        }
        if (!chosen) return null
        const point = referenceCamera.position.clone().set(0, 0, 0)
        const vertex = referenceCamera.position.clone()
        chosen.ids.forEach((id, corner) => point.addScaledVector(vertex.fromBufferAttribute(position, id), chosen.weights[corner]))
        return { world: point.applyMatrix4(mesh.matrixWorld).toArray(), uv: chosen.uv, method: chosen.method, triangle: chosen.triangle }
      }
      window.captureReferenceStickers = () => Object.fromEntries(stickerIds.map(id => {
        const objectName = `ConnySticker-${id}`
        const mesh = referenceScene.getObjectByName(objectName)
        const positions = mesh?.geometry?.attributes.position
        if (!positions?.count) return [id, { objectName, found: false }]
        const geometry = mesh.geometry
        if (!geometry.boundingBox) geometry.computeBoundingBox()
        const worldCenter = geometry.boundingBox.getCenter(referenceCamera.position.clone()).applyMatrix4(mesh.matrixWorld)
        const center = worldCenter.clone().project(referenceCamera).toArray()
        const focusName = Object.keys(storyStickers).find(point => storyStickers[point] === id)
        const focusWorld = referenceScene.getObjectByName(focusName).getWorldPosition(referenceCamera.position.clone())
        const cameraWorld = referenceCamera.getWorldPosition(referenceCamera.position.clone())
        const focusDistance = cameraWorld.distanceTo(focusWorld)
        const surfaceSample = sampleStickerSurface(mesh)
        const stickerDistance = surfaceSample ? cameraWorld.distanceTo(worldCenter.clone().fromArray(surfaceSample.world)) : null
        const vertex = referenceCamera.position.clone()
        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
        for (let index = 0; index < positions.count; index++) {
          vertex.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld).project(referenceCamera)
          const projected = vertex.toArray()
          for (let axis = 0; axis < 3; axis++) {
            min[axis] = Math.min(min[axis], projected[axis])
            max[axis] = Math.max(max[axis], projected[axis])
          }
        }
        const rect = referenceCanvas.getBoundingClientRect()
        return [id, {
          objectName, found: true, center, worldCenter: worldCenter.toArray(),
          surfaceSample, samplingError: surfaceSample ? null : 'No valid UV triangle on sticker geometry',
          focusDistance, stickerDistance, radialFocusDistanceError: surfaceSample ? Math.abs(focusDistance - stickerDistance) : null,
          bounds: { min, max },
          pixels: {
            center: [rect.left + (center[0] + 1) * rect.width / 2, rect.top + (1 - center[1]) * rect.height / 2],
            left: rect.left + (min[0] + 1) * rect.width / 2,
            right: rect.left + (max[0] + 1) * rect.width / 2,
            top: rect.top + (1 - max[1]) * rect.height / 2,
            bottom: rect.top + (1 - min[1]) * rect.height / 2,
          },
        }]
      }))
      window.__THREE_DEVTOOLS__ = new EventTarget()
      window.__THREE_DEVTOOLS__.addEventListener('observe', ({ detail }) => {
        if (!detail.isWebGLRenderer) return
        const render = detail.render
        detail.render = function (scene, camera) {
          const rendered = render.call(this, scene, camera)
          if (scene.getObjectByName?.('Camera') && camera.isPerspectiveCamera) {
            referenceScene = scene
            referenceCamera = camera
            referenceCanvas = this.domElement
            window.referenceFrame = {
              camera: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov,
              man: scene.getObjectByName('man')?.quaternion.toArray(),
              ...(stickerIds.length ? {
                cameraWorld: camera.getWorldPosition(camera.position.clone()).toArray(),
                bodyMatrixWorld: scene.getObjectByName('ConnyBody').matrixWorld.toArray(),
              } : {}),
            }
          }
          return rendered
        }
      })
    }, storyStickers)
    try {
      const [response] = await Promise.all([
        page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/models/me.glb'), { timeout: 60000 }),
        page.goto(url),
      ])
      check(`${name}: served prepared model`, response.ok() && sha256(await response.body()) === modelHash)
      await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 60000 })
      await page.waitForFunction(() => window.referenceFrame?.man, undefined, { timeout: 30000 })
      await page.mouse.move(width / 2, height / 2)
      const copy = await page.locator('body').innerText()
      check(`${name}: Conny identity`, /Conny/i.test(await page.title()) && /Conny/i.test(await page.locator('h1').innerText()))
      check(`${name}: no source author's personal biography`, !authorIdentity.test(copy))
      check(`${name}: five timeline entries`, await page.locator('[data-point]').count() === 5)
      check(`${name}: written portfolio is discoverable`, await page.locator('[data-point="focus-5"] a[href="/hub"]').count() === 1)

      for (const point of ['hero', 'focus-1', 'focus-2', 'focus-3', 'focus-4', 'focus-5', 'works']) {
        await page.evaluate(point => {
          const target = point === 'hero' ? 0 : point === 'works'
            ? document.querySelector('.wk-gallery').getBoundingClientRect().top + scrollY + innerWidth
            : document.querySelector(`[data-point="${point}"]`).getBoundingClientRect().top + scrollY - innerHeight * 0.3
          scrollTo({ top: target, behavior: 'instant' })
        }, point)
        await page.waitForTimeout(2000)
        const sample = await page.evaluate(point => ({
          frame: window.referenceFrame, scroll: scrollY, width: document.documentElement.scrollWidth, viewport: innerWidth,
          headings: [...document.querySelectorAll('h1,h2,h3')].map(element => element.textContent),
          stickers: window.captureReferenceStickers(),
          card: (() => {
            const entry = document.querySelector(`[data-point="${point}"]`)
            const body = entry?.querySelector('.tl-body')
            if (!body) return null
            return { bottom: body.getBoundingClientRect().bottom,
              nextTop: entry.nextElementSibling?.getBoundingClientRect().top ?? innerHeight,
              viewportHeight: innerHeight }
          })(),
        }), point)
        result.samples.push({ point, ...sample })
        check(`${name}: ${point} renders with original camera FOV`, Math.abs(sample.frame.fov - 22.89519204617112) < 0.00001, sample.frame)
        check(`${name}: ${point} has no horizontal overflow`, sample.width <= sample.viewport + 1, { width: sample.width, viewport: sample.viewport })
        if (storyStickers[point]) {
          const id = storyStickers[point]
          const sticker = sample.stickers[id]
          check(`${name}: ${point} ${id} sticker center is inside the camera viewport`,
            sticker.found && sticker.center.every(Number.isFinite) && Math.abs(sticker.center[0]) <= 0.95 && Math.abs(sticker.center[1]) <= 0.95 && Math.abs(sticker.center[2]) <= 1,
            sticker)
          if (name !== 'desktop') {
            const bottom = Math.min(sample.card.nextTop, sample.card.viewportHeight)
            check(`${name}: ${point} entire sticker clears the text cards and viewport`,
              sticker.found && sticker.pixels.top >= sample.card.bottom + 2 && sticker.pixels.bottom <= bottom - 2,
              { pixels: sticker.pixels, card: sample.card })
          }
          const visibility = sticker.surfaceSample ? stickerLineOfSight(sample.frame, sticker) : null
          check(`${name}: ${point} ${id} sticker surface sample has no foreground body occlusion`, visibility?.unobstructed, visibility ?? { samplingError: sticker.samplingError ?? 'Sticker not found' })
          check(`${name}: ${point} ${id} sticker radial focus distance is within tolerance`, Boolean(sticker.surfaceSample) && sticker.radialFocusDistanceError <= maxFocusDistanceError,
            { focusDistance: sticker.focusDistance, stickerDistance: sticker.stickerDistance, error: sticker.radialFocusDistanceError, tolerance: maxFocusDistanceError, samplingError: sticker.samplingError })
        }
        await page.screenshot({ path: path.join(output, `${name}-${point}.png`) })
      }
      check(`${name}: camera moves through native scroll stops`, result.samples.slice(1).every((sample, index) => distance(sample.frame.camera, result.samples[index].frame.camera) > 0.01))
      check(`${name}: manAction turns character in works`, distance(result.samples[0].frame.man, result.samples.at(-1).frame.man) > 0.1)

      const cards = page.locator('.wk-card')
      check(`${name}: four real works`, await cards.count() === 4 && await page.locator('.wk-line-btn').count() === 4)
      for (let index = 0; index < 4; index++) {
        await page.evaluate(index => {
          const card = document.querySelectorAll('.wk-card')[index]
          if (innerWidth <= 640) {
            scrollTo({ top: card.getBoundingClientRect().top + scrollY, behavior: 'instant' })
          } else {
            const gallery = document.querySelector('.wk-gallery')
            const track = document.querySelector('.wk-track')
            const relativeLeft = card.getBoundingClientRect().left - track.getBoundingClientRect().left
            scrollTo({ top: gallery.getBoundingClientRect().top + scrollY + relativeLeft, behavior: 'instant' })
          }
        }, index)
        await page.waitForTimeout(500)
        const before = await page.evaluate(() => ({ scroll: scrollY, overflow: document.body.style.overflow }))
        await cards.nth(index).locator('.wk-line-btn').click()
        const modal = page.locator('.wk-detail')
        await modal.waitFor({ state: 'visible' })
        await page.waitForTimeout(500)
        const detail = await modal.evaluate(element => ({
          title: element.querySelector('.wk-detail-title')?.textContent,
          content: element.querySelector('.wk-md')?.textContent,
          href: element.querySelector('a.wk-detail-link')?.href,
          placeholder: Boolean(element.querySelector('.wk-detail-ph-img, .wk-detail-link.is-ph, .wk-detail-banner.is-ph')),
          locked: document.body.style.overflow === 'hidden',
          brokenImages: [...element.querySelectorAll('img')].filter(image => !image.complete || !image.naturalWidth).map(image => image.src),
        }))
        result.works.push(detail)
        check(`${name}: work ${index + 1} has authored detail and repository CTA`, detail.content?.length > 100 && !detail.placeholder && !authorIdentity.test(detail.content) && detail.href === `https://github.com/JunyiZhou-Conny/${expectedRepositories[index]}`, detail)
        check(`${name}: work ${index + 1} images load and modal locks scroll`, detail.brokenImages.length === 0 && detail.locked)
        await page.screenshot({ path: path.join(output, `${name}-work-${index + 1}.png`) })
        if (index % 2) await page.keyboard.press('Escape')
        else await page.locator('.wk-detail-close').click()
        await modal.waitFor({ state: 'detached' })
        const after = await page.evaluate(() => ({ scroll: scrollY, overflow: document.body.style.overflow }))
        await page.mouse.wheel(0, -100)
        await page.waitForTimeout(400)
        const scroll = await page.evaluate(() => scrollY)
        check(`${name}: work ${index + 1} closes and restores native scroll`, before.overflow === after.overflow && Math.abs(before.scroll - after.scroll) < 2 && scroll < after.scroll - 20, { before, after, scroll })
      }
      const brokenImages = await page.locator('img').evaluateAll(images => images.filter(image => !image.complete || !image.naturalWidth).map(image => image.src))
      check(`${name}: all page images load`, brokenImages.length === 0, brokenImages)
    } catch (error) {
      check(`${name}: browser sequence completes`, false, error.stack)
      await page.screenshot({ path: path.join(output, `${name}-failure.png`) }).catch(() => {})
    } finally {
      check(`${name}: no runtime errors`, result.errors.length === 0, result.errors)
      check(`${name}: no failed asset requests`, result.failedRequests.length === 0, result.failedRequests)
      await context.close()
    }
  }
} finally {
  await browser.close()
  results.finished = new Date().toISOString()
  results.passed = results.checks.every(item => item.passed)
  await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
  console.log(JSON.stringify({ passed: results.passed, checks: results.checks.length, failures: results.checks.filter(item => !item.passed), output }, null, 2))
}
if (!results.passed) process.exitCode = 1
