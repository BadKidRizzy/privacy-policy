import {access, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function collectHtml(directory = root) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(target);
  }
  return files;
}

function record(condition, message) {
  if (!condition) failures.push(message);
}

const data = JSON.parse(await readFile(path.join(root, 'data/public-growth-pages.json'), 'utf8'));
const productionIds = data.trucks.map((truck) => truck.production_id).filter(Boolean);
record(new Set(productionIds).size === productionIds.length, 'Production truck IDs must be unique.');

for (const truck of data.trucks) {
  const pagePath = path.join(root, 'truck', truck.slug, 'index.html');
  const html = await readFile(pagePath, 'utf8');
  if (truck.production_id) {
    record(
      html.includes(`selectedTruckId=${truck.production_id}`),
      `${truck.slug} is missing its verified production truck ID.`
    );
    record(html.includes('#claim-form'), `${truck.slug} should hand off directly to the claim form.`);
    record(html.includes('name="robots" content="index,follow"'), `${truck.slug} should remain indexable.`);
  } else {
    record(!html.includes('selectedTruckId='), `${truck.slug} contains an unverified production truck ID.`);
    record(html.includes('Get owner claim help'), `${truck.slug} is missing the owner-help fallback.`);
    record(html.includes('name="robots" content="noindex,follow"'), `${truck.slug} should be noindex until verified.`);
  }
}

const claimHtml = await readFile(path.join(root, 'claim-your-food-truck/index.html'), 'utf8');
record(claimHtml.includes('id="claim-form"'), 'The direct claim fragment target is missing.');
record(claimHtml.includes('data-claim-recovery'), 'The missing-listing recovery path is missing.');
record(claimHtml.includes('data-claim-support'), 'The prefilled owner-help link is missing.');

const homeHtml = await readFile(path.join(root, 'index.html'), 'utf8');
for (const phrase of [
  'What the website should make obvious',
  'Every screenshot on the site now has a home',
  'still expanding event-specific visuals',
  'live-feeling mobile view',
]) {
  record(!homeHtml.includes(phrase), `Homepage still contains internal drafting copy: "${phrase}".`);
}

for (const htmlPath of await collectHtml()) {
  const html = await readFile(htmlPath, 'utf8');
  const attributes = html.matchAll(/\b(?:href|src)=["']([^"'<>]+)["']/g);
  for (const match of attributes) {
    const raw = match[1].replaceAll('&amp;', '&');
    if (!raw || raw.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|foodtruckfinder:)/i.test(raw)) continue;
    const clean = raw.split(/[?#]/, 1)[0];
    if (!clean) continue;
    const resolved = clean.startsWith('/')
      ? path.join(root, decodeURIComponent(clean))
      : path.resolve(path.dirname(htmlPath), decodeURIComponent(clean));
    const target = path.extname(resolved) ? resolved : path.join(resolved, 'index.html');
    if (!await exists(target)) {
      failures.push(`${path.relative(root, htmlPath)} references missing local file: ${raw}`);
    }
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Site validation passed for ${data.trucks.length} truck profiles.`);
}
