#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, REPORT_DIR, loadCatalog, parseTarget, selectRecipes, sha256, writeJson } from './lib/contracts.mjs';
import { loadSnapshot, localKey, verifyEntry } from './lib/archive.mjs';
import { assertNormalizedTable, csvMembers, normalizeTable, NORMALIZE_LIMIT } from './lib/normalize.mjs';

/** Validate the whole batch first, so one invalid hierarchy cannot leave partial outputs. */
export function writeNormalizedTables(pending, root = ROOT) {
  for (const { table, levels } of pending) assertNormalizedTable(table, levels);
  for (const { key, table } of pending) writeJson(localKey(root, key), table);
  return pending.map(({ key, table }) => ({ key, rows: table.rows.length }));
}

export async function normalizeRecipe(recipe, root = ROOT) {
  if (!recipe.normalize) return { datasetId: recipe.datasetId, status: 'no-normalize-recipe' };
  const snapshot = loadSnapshot(root, recipe.datasetId);
  if (!snapshot.versions.length) throw Error('No local source snapshot; fetch or restore raw files first');
  const pending = [];
  for (const entry of snapshot.versions) {
    await verifyEntry(root, entry);
    if (entry.bytes > NORMALIZE_LIMIT) throw Error('Normalization byte limit exceeded');
    const members = [];
    for (const file of entry.files) {
      const name = decodeURIComponent(new URL(file.url).pathname.split('/').pop());
      members.push(...await csvMembers(fs.readFileSync(localKey(root, file.key)), name));
    }
    if (members.reduce((n, m) => n + m.bytes.length, 0) > NORMALIZE_LIMIT) throw Error('Normalization expansion limit exceeded');
    const tables = recipe.normalize.tables.map((table) => normalizeTable({
      datasetId: recipe.datasetId, version: entry.version, table, members,
      provenance: { manifestKey: entry.manifestKey, manifestSha256: entry.manifestSha256, recipeSha256: sha256(JSON.stringify(recipe)) },
    }));
    for (const table of tables) {
      const key = `open-data/normalized/${recipe.datasetId}/${entry.version}/${table.table}.json`;
      const levels = recipe.normalize.tables.find((definition) => definition.table === table.table).areas.map((area) => area.level);
      pending.push({ key, table, levels });
    }
  }
  return { datasetId: recipe.datasetId, status: 'normalized', outputs: writeNormalizedTables(pending, root) };
}

export async function main(args = process.argv.slice(2)) {
  // Normalization only writes local derived files, never R2 or git ledgers.
  if (args.includes('--apply') || args.includes('--dry-run')) throw Error('Normalization accepts only --dataset / --source / --all');
  const { target } = parseTarget(args);
  const { selected, missing } = selectRecipes(loadCatalog(), target);
  const results = missing.map((datasetId) => ({ datasetId, status: 'missing-recipe' }));
  for (const recipe of selected) {
    try { results.push(await normalizeRecipe(recipe)); }
    catch (error) { results.push({ datasetId: recipe.datasetId, status: 'error', error: error.message }); }
  }
  writeJson(path.join(ROOT, REPORT_DIR, 'normalize.json'), { results });
  console.log(JSON.stringify({ results }, null, 2));
  if (results.some((r) => r.status === 'error')) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
