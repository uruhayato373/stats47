#!/usr/bin/env node
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, REPORT_DIR, loadCatalog, parseTarget, selectRecipes, writeJson } from './lib/contracts.mjs';
import { createHttpClient } from './lib/http.mjs';
import { archiveRecipe } from './lib/archive.mjs';

export async function main(args = process.argv.slice(2)) {
  const { target, apply } = parseTarget(args);
  const mode = apply ? 'apply' : 'dry-run';
  const catalog = loadCatalog();
  const { selected, missing } = selectRecipes(catalog, target);
  const client = createHttpClient();
  const results = missing.map((datasetId) => ({ datasetId, status: 'missing-recipe', files: [] }));
  // Invalidate an earlier plan before any network access can fail.
  if (apply) writeJson(path.join(ROOT, REPORT_DIR, 'upload-plan.json'), { files: [], snapshots: [] });
  for (const recipe of selected) {
    try {
      results.push(await archiveRecipe({ recipe, dataset: catalog.datasets.find((d) => d.id === recipe.datasetId), client, apply }));
    } catch (error) {
      results.push({ datasetId: recipe.datasetId, status: 'error', error: error.message, code: error.cause?.code ?? error.code ?? null, files: [] });
    }
  }
  const failed = results.some((r) => ['error', 'unreachable'].includes(r.status));
  const report = { mode, target, results, ok: !failed };
  writeJson(path.join(ROOT, REPORT_DIR, `fetch-${mode}.json`), report);
  if (apply && !failed) writeJson(path.join(ROOT, REPORT_DIR, 'upload-plan.json'), {
    files: results.flatMap((r) => r.files),
    snapshots: results.filter((r) => r.status === 'staged').map(({ datasetId, version }) => ({ datasetId, version })),
  });
  console.log(JSON.stringify(report, null, 2));
  if (failed) process.exitCode = 1;
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
