import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, writeJson } from './contracts.mjs';
import { loadSnapshot, snapshotPath } from './archive.mjs';
import { datasetDir } from '../../../../config/datasets.mjs';

/** Append verified entries; never replace a different immutable version during commit-back. */
export function mergeSnapshots(fromRoot, toRoot) {
  const pending = [];
  for (const file of fs.readdirSync(path.join(fromRoot, datasetDir('open-data.snapshots'))).filter((f) => f.endsWith('.json'))) {
    const id = file.slice(0, -5);
    const incoming = loadSnapshot(fromRoot, id);
    const existing = loadSnapshot(toRoot, id);
    const versions = [...existing.versions];
    for (const entry of incoming.versions) {
      if (entry.status !== 'archived') throw Error('Unverified snapshot cannot be committed');
      const old = versions.find((v) => v.version === entry.version);
      if (old && JSON.stringify(old) !== JSON.stringify(entry)) throw Error('Conflicting snapshot during commit-back');
      if (!old) versions.push(entry);
    }
    pending.push([snapshotPath(toRoot, id), { datasetId: id, versions }]);
  }
  for (const [file, doc] of pending) writeJson(file, doc);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 3) throw Error('Usage: merge-snapshots.mjs <develop-checkout>');
  mergeSnapshots(ROOT, path.resolve(process.argv[2]));
}
