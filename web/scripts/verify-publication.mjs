import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const root = path.dirname(web)
const dist = path.join(web, 'dist')
const contract = JSON.parse(await readFile(path.join(root, 'docs/reference/scene-contract.json'), 'utf8'))
const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
let checks = 0
const check = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message)
  checks++
}

function restoreCloudflareEmail(bytes) {
  const decode = encoded => {
    assert(/^(?:[0-9a-f]{2}){2,}$/i.test(encoded), 'Cloudflare email data is valid hexadecimal')
    const data = Buffer.from(encoded, 'hex')
    return Buffer.from(data.subarray(1).map(value => value ^ data[0])).toString('utf8')
  }
  const html = bytes.toString('utf8')
    .replace(/href="\/cdn-cgi\/l\/email-protection#([0-9a-f]+)"/gi, (_, encoded) => `href="mailto:${decode(encoded)}"`)
    .replace(/<span class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/span>/gi, (_, encoded) => decode(encoded))
  const script = /<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[0-9a-f]{8}\/cloudflare-static\/email-decode\.min\.js"><\/script>/gi
  assert.equal([...html.matchAll(script)].length, 1, 'Cloudflare injects one recognized email decoder')
  return Buffer.from(html.replace(script, ''))
}

check(config.framework, 'vite', 'Vercel deploys the Vite frontend')
check(config.installCommand, 'npm ci --prefix web', 'Installation uses the frontend lockfile')
check(config.buildCommand, 'npm run build --prefix web', 'Build uses the frontend package')
check(config.outputDirectory, 'web/dist', 'Deployment publishes the frontend output')
for (const [file, expected] of Object.entries(contract.files)) {
  check(hash(await readFile(path.join(root, file))), expected, `${file} retains the reference configuration`)
}
const manifest = JSON.parse(await readFile(path.join(web, 'package.json'), 'utf8'))
check(manifest.dependencies, contract.dependencies, 'Runtime dependency versions remain unchanged')
check(manifest.devDependencies, contract.devDependencies, 'Build dependency versions remain unchanged')
check(hash(await readFile(path.join(dist, 'models/me.glb'))), contract.acceptedModelSha256, 'The build contains the accepted wink character')

const assets = [
  ['public/index.html', 'hub.html'],
  ['docs/reference/LICENSE', 'licenses/scene/LICENSE'],
  ['docs/reference/NOTICE', 'licenses/scene/NOTICE'],
  ['docs/reference/fonts/cormorant-upright-OFL.txt', 'licenses/fonts/cormorant-upright-OFL.txt'],
  ['docs/reference/fonts/mansalva-OFL.txt', 'licenses/fonts/mansalva-OFL.txt'],
  ['docs/reference/fonts/README.md', 'licenses/fonts/README.md'],
]
for (const directory of ['css', 'js', 'favicon']) {
  for (const entry of await readdir(path.join(root, 'public', directory), { withFileTypes: true })) {
    assert(entry.isFile(), `Add explicit copying and verification for nested hub asset ${entry.name}`)
    assets.push([`public/${directory}/${entry.name}`, `${directory}/${entry.name}`])
  }
}
for (const [source, output] of assets) {
  check(hash(await readFile(path.join(dist, output))), hash(await readFile(path.join(root, source))), `${output} preserves its source bytes`)
}

const site = process.argv[2]
if (site) {
  const homepage = await fetch(site)
  check(homepage.status, 200, 'Homepage returns 200')
  const origin = new URL(homepage.url).origin
  const html = await homepage.text()
  check(/<title>About Conny · Junyi Zhou<\/title>/.test(html), true, 'Homepage serves the current Conny site')
  for (const [route, file] of [
    ['/hub', 'hub.html'],
    ['/models/me.glb', 'models/me.glb'],
    ['/stickers/pulse-illustrated.webp', 'stickers/pulse-illustrated.webp'],
    ...assets.filter(([source]) => source !== 'public/index.html').map(([, output]) => [`/${output}`, output]),
  ]) {
    const response = await fetch(new URL(route, origin))
    check(response.status, 200, `${route} returns 200`)
    const expected = await readFile(path.join(dist, file))
    let actual = Buffer.from(await response.arrayBuffer())
    if (file === 'hub.html' && !actual.equals(expected) && response.headers.get('server') === 'cloudflare') {
      actual = restoreCloudflareEmail(actual)
    }
    check(hash(actual), hash(expected), `${route} serves the verified build`)
  }
  for (const [route, destination, expectedStatus] of [['/hub/', '/hub', 308], ['/3d', '/', 307]]) {
    const response = await fetch(new URL(route, origin), { redirect: 'manual' })
    check(response.status, expectedStatus, `${route} redirects with the configured status`)
    check(new URL(response.headers.get('location'), origin).pathname, destination, `${route} reaches its canonical route`)
  }
}
console.log(JSON.stringify({ passed: true, checks, site: site || 'local build' }, null, 2))
