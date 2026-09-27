import { copyFile, cp, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.resolve(web, '../public')
const output = path.join(web, 'dist')

await writeFile(
  path.join(output, 'hub.html'),
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/#about"><title>About Conny</title><a href="/#about">About Conny</a></html>'
)
for (const directory of ['css', 'js', 'favicon']) {
  await cp(path.join(source, directory), path.join(output, directory), {
    recursive: true,
  })
}

const reference = path.resolve(web, '../docs/reference')
await mkdir(path.join(output, 'licenses/scene'), { recursive: true })
for (const file of ['LICENSE', 'NOTICE']) {
  await copyFile(
    path.join(reference, file),
    path.join(output, 'licenses/scene', file)
  )
}
await cp(path.join(reference, 'fonts'), path.join(output, 'licenses/fonts'), {
  recursive: true,
})
