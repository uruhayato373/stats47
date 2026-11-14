import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import Ajv from 'ajv';
import { datasetPath } from '../../../../config/datasets.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const DEFAULT_MAX_BYTES = 5 * 1024 ** 3;
export const REPORT_DIR = '.local/verification/open-data';
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(`${file}.tmp`, file);
}
const ajv = new Ajv({ allErrors: true });
const validators = new Map();
export function validateDocument(name, doc) {
  if (!validators.has(name)) validators.set(name, ajv.compile(readJson(path.join(ROOT, `config/schema/open-data.${name}.schema.json`))));
  const validate = validators.get(name);
  if (!validate(doc)) throw Error(`${name} Schema: ${ajv.errorsText(validate.errors)}`);
  return doc;
}
export function safeSegment(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) throw Error('Unsafe path segment');
  return value;
}
export function httpUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw Error('Expected HTTP URL without credentials');
  url.hash = '';
  return url.href;
}
export function validateRecipes(doc) {
  validateDocument('fetch-recipes', doc);
  const ids = new Set();
  const urlOwners = new Map();
  for (const recipe of doc.recipes) {
    if (ids.has(recipe.datasetId)) throw Error(`Duplicate recipe: ${recipe.datasetId}`);
    ids.add(recipe.datasetId);
    const urls = recipe.fetch.type === 'http-file' ? recipe.fetch.urls : recipe.fetch.type === 'http-index' ? [recipe.fetch.indexUrl] : [];
    for (const url of urls) {
      const owner = urlOwners.get(url);
      if (owner && owner !== recipe.datasetId) throw Error(`Duplicate recipe URL: ${owner} / ${recipe.datasetId}: ${url}`);
      urlOwners.set(url, recipe.datasetId);
    }
    for (const value of [...(recipe.fetch.urls ?? []), recipe.fetch.url, recipe.fetch.indexUrl, recipe.fetch.baseUrl].filter(Boolean)) httpUrl(value);
    if (recipe.fetch.linkPattern) new RegExp(recipe.fetch.linkPattern);
    const tables = new Set();
    for (const table of recipe.normalize?.tables ?? []) {
      new RegExp(table.filePattern);
      if (tables.has(table.table)) throw Error(`Duplicate table: ${table.table}`);
      tables.add(table.table);
      if (new Set(table.areas.map((a) => a.level)).size !== table.areas.length) throw Error('Duplicate area level');
    }
  }
  return doc;
}
export function loadCatalog(root = ROOT) {
  const recipes = validateRecipes(readJson(path.join(root, datasetPath('open-data.fetch-recipes')))).recipes;
  const datasets = readJson(path.join(root, datasetPath('open-data.datasets'))).datasets;
  for (const r of recipes) if (!datasets.some((d) => d.id === r.datasetId)) throw Error(`Unknown dataset: ${r.datasetId}`);
  return { recipes, datasets };
}
export function assertPublishable(dataset) {
  if (dataset?.license?.commercialUse !== 'allowed') throw Error('Publication refused: commercialUse must be allowed');
}
export function assertSha(bytes, expected) {
  if (sha256(bytes) !== expected) throw Error('SHA-256 mismatch');
}
export function parseTarget(args) {
  let target;
  let apply = false;
  let mode;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (['--dry-run', '--apply'].includes(arg)) {
      if (mode) throw Error('Choose --dry-run or --apply once');
      mode = arg; apply = arg === '--apply';
    } else if (['--all', '--dataset', '--source'].includes(arg)) {
      if (target) throw Error('Choose one target');
      const value = arg === '--all' ? undefined : args[++i];
      if (arg !== '--all' && (!value || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))) throw Error('Invalid target ID');
      target = { type: arg.slice(2), value };
    } else throw Error(`Unknown argument: ${arg}`);
  }
  if (!target) throw Error('--dataset <id> | --source <id> | --all required');
  return { target, apply };
}
export function selectRecipes(catalog, target) {
  const ids = new Set(catalog.datasets.filter((d) => target.type === 'all' || (target.type === 'source' ? d.sourceId === target.value : d.id === target.value)).map((d) => d.id));
  if (!ids.size) throw Error('Unknown target');
  return { selected: catalog.recipes.filter((r) => ids.has(r.datasetId)), missing: [...ids].filter((id) => !catalog.recipes.some((r) => r.datasetId === id)) };
}
