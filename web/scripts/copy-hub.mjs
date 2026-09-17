import { copyFile, cp, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.resolve(web, '../public')
const output = path.join(web, 'dist')

await copyFile(path.join(source, 'index.html'), path.join(output, 'hub.html'))
for (const directory of ['css', 'js', 'favicon']) {
  await cp(path.join(source, directory), path.join(output, directory), { recursive: true })
}

const reference = path.resolve(web, '../docs/reference')
await mkdir(path.join(output, 'licenses/scene'), { recursive: true })
for (const file of ['LICENSE', 'NOTICE']) {
  await copyFile(path.join(reference, file), path.join(output, 'licenses/scene', file))
}
await cp(path.join(reference, 'fonts'), path.join(output, 'licenses/fonts'), { recursive: true })
