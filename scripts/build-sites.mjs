import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
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

const associationPath = path.join(root, '.well-known', 'apple-app-site-association');
const associationJson = await readFile(associationPath, 'utf8');
JSON.parse(associationJson);

const workerTemplate = await readFile(path.join(root, 'sites', 'worker.js'), 'utf8');
const workerSource = workerTemplate.replace(
  "'__APPLE_ASSOCIATION_JSON__'",
  JSON.stringify(associationJson),
);

await rm(path.join(assetsRoot, '.well-known', 'apple-app-site-association'));
await rm(path.join(assetsRoot, 'apple-app-site-association'));
await writeFile(path.join(outputRoot, 'worker.js'), workerSource);
