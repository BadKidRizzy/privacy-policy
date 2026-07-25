import {cp, mkdir, readdir, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(root, '.open-next');
const assetsRoot = path.join(outputRoot, 'assets');
const excludedRootEntries = new Set([
  '.DS_Store',
  '.git',
  '.idea',
  '.open-next',
  '.openai',
  'node_modules',
  'package-lock.json',
  'package.json',
  'sites',
]);

await rm(outputRoot, {force: true, recursive: true});
await mkdir(assetsRoot, {recursive: true});

for (const entry of await readdir(root, {withFileTypes: true})) {
  if (excludedRootEntries.has(entry.name)) {
    continue;
  }

  await cp(path.join(root, entry.name), path.join(assetsRoot, entry.name), {
    recursive: entry.isDirectory(),
  });
}

await cp(path.join(root, 'sites', 'worker.js'), path.join(outputRoot, 'worker.js'));
