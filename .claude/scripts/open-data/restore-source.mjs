#!/usr/bin/env node
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, REPORT_DIR, loadCatalog, parseTarget, selectRecipes, writeJson } from './lib/contracts.mjs';
import { loadSnapshot } from './lib/archive.mjs';
import { createHttpClient, TooLargeError } from './lib/http.mjs';
import { apiHeaders } from './lib/expand.mjs';
import { restoreEntry, RestoreMismatchError } from './lib/restore.mjs';

export async function restoreRecipe({ recipe, root = ROOT, client = createHttpClient(), env = process.env }) {
  const snapshot = loadSnapshot(root, recipe.datasetId);
  const results = [];
  for (const entry of snapshot.versions) {
    try {
      results.push(await restoreEntry({ entry, root, download: async (file, destination) => {
        try { await client.download(file.url, destination, file.bytes, apiHeaders(recipe.fetch, env)); }
        catch (error) {
          if (error instanceof TooLargeError || /Content-Length mismatch/.test(error.message)) throw new RestoreMismatchError(`${file.key}: bytes mismatch`);
          throw error;
        }
      } }));
    } catch (error) {
      results.push({ datasetId: recipe.datasetId, version: entry.version, status: error instanceof RestoreMismatchError ? 'mismatch' : 'error', error: error.message });
    }
  }
  return results.length ? results : [{ datasetId: recipe.datasetId, status: 'no-snapshot' }];
}

export async function main(args = process.argv.slice(2), { root = ROOT, client = createHttpClient() } = {}) {
  if (args.includes('--apply') || args.includes('--dry-run')) throw Error('Restore accepts only --dataset / --source / --all');
  const { target } = parseTarget(args);
  const catalog = loadCatalog(root);
  const { selected, missing } = selectRecipes(catalog, target);
  // Restoration follows ledgers, including datasets that no longer have a fetch recipe.
  const recipes = [...selected, ...missing.map((datasetId) => ({ datasetId, fetch: { type: 'http-file' } }))];
  const results = [];
  for (const recipe of recipes) {
    try { results.push(...await restoreRecipe({ recipe, root, client })); }
    catch (error) { results.push({ datasetId: recipe.datasetId, status: 'error', error: error.message }); }
  }
  const report = { target, results, ok: !results.some((r) => ['mismatch', 'error', 'no-snapshot'].includes(r.status)) };
  writeJson(path.join(root, REPORT_DIR, 'restore.json'), report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
