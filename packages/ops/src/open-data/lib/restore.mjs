import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, assertSha, validateDocument } from './contracts.mjs';
import { entryManifest, localKey, serializeManifest, verifyEntry, verifyFile } from './archive.mjs';

export class RestoreMismatchError extends Error {}

/** Nothing enters the local mirror until every file and the manifest agree. */
export async function restoreEntry({ entry, root = ROOT, download, manifestBody = serializeManifest(entryManifest(entry)) }) {
  validateDocument('snapshots', { datasetId: entry.datasetId, versions: [entry] });
  const prefix = `open-data/raw/${entry.datasetId}/${entry.version}/`;
  if (entry.manifestKey !== `${prefix}manifest.json` || entry.files.some((f) => !f.key.startsWith(prefix) || f.key === entry.manifestKey)
    || new Set(entry.files.map((f) => f.key)).size !== entry.files.length) throw Error('Snapshot key mismatch');
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'open-data-restore-'));
  let install;
  try {
    try { assertSha(manifestBody, entry.manifestSha256); }
    catch (error) { throw new RestoreMismatchError(`Manifest ${error.message}`); }
    for (const file of entry.files) {
      const destination = localKey(staging, file.key);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      await download(file, destination);
      try { await verifyFile(destination, file); }
      catch (error) { throw new RestoreMismatchError(`${file.key}: ${error.message}`); }
    }
    fs.writeFileSync(localKey(staging, entry.manifestKey), manifestBody);
    try { await verifyEntry(staging, entry); }
    catch (error) { throw new RestoreMismatchError(error.message); }
    const finalDir = localKey(root, prefix.slice(0, -1));
    if (fs.existsSync(finalDir)) {
      // Never overwrite an existing partial or unverified version implicitly.
      await verifyEntry(root, entry);
    } else {
      fs.mkdirSync(path.dirname(finalDir), { recursive: true });
      install = fs.mkdtempSync(`${finalDir}.restore-`);
      fs.cpSync(localKey(staging, prefix.slice(0, -1)), install, { recursive: true });
      fs.renameSync(install, finalDir);
    }
    return { datasetId: entry.datasetId, version: entry.version, status: 'restored', files: entry.files.length };
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
    if (install) fs.rmSync(install, { recursive: true, force: true });
  }
}
