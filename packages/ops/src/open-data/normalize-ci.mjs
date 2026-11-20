#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, REPORT_DIR, loadCatalog, parseTarget, selectRecipes, writeJson } from './lib/contracts.mjs';
import { loadSnapshot } from './lib/archive.mjs';
import { restoreEntry } from './lib/restore.mjs';
import { createPrivateStore, assertPrivateWriteAllowed, exactPublisher, publishNormalizedOutputs } from './lib/publish.mjs';
import { normalizeRecipe } from './normalize-source.mjs';

export async function normalizeFromR2({ target, root = ROOT, store, dryRun = true, publish = exactPublisher, assertWrite = assertPrivateWriteAllowed }) {
  const { selected, missing } = selectRecipes(loadCatalog(root), target);
  const results = missing.map((datasetId) => ({ datasetId, status: 'missing-recipe' }));
  for (const recipe of selected) {
    if (!recipe.normalize) {
      results.push({ datasetId: recipe.datasetId, status: 'no-normalize-recipe' });
      continue;
    }
    try {
      for (const entry of loadSnapshot(root, recipe.datasetId).versions) {
        const manifest = await store.get(entry.manifestKey);
        if (!manifest) throw Error(`Missing remote manifest: ${entry.manifestKey}`);
        await restoreEntry({ entry, root, manifestBody: manifest.body, download: async (file, destination) => {
          const object = await store.get(file.key);
          if (!object) throw Error(`Missing remote raw file: ${file.key}`);
          fs.writeFileSync(destination, object.body);
        } });
      }
      results.push(await normalizeRecipe(recipe, root));
    } catch (error) {
      results.push({ datasetId: recipe.datasetId, status: 'error', error: error.message });
    }
  }
  const files = results.flatMap((result) => result.outputs ?? []);
  const report = { target, dryRun, results, ok: !results.some((r) => ['error', 'missing-recipe'].includes(r.status)) };
  if (report.ok) {
    try {
      if (!dryRun && files.length) await assertWrite(files.map((file) => file.key));
      report.publish = await publishNormalizedOutputs({ root, files, store, publish, dryRun });
    } catch (error) { report.ok = false; report.error = error.message; }
  }
  writeJson(path.join(root, REPORT_DIR, 'normalize-ci.json'), report);
  return report;
}

export async function main(args = process.argv.slice(2)) {
  const { target, apply } = parseTarget(args);
  const store = await createPrivateStore();
  const report = await normalizeFromR2({ target, store, dryRun: !apply });
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
