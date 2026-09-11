/** Recompute the complete source; R2 is written only with --write-local. */
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export async function main(args = process.argv.slice(2)) {
  const root = process.cwd();
  const value = flag => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
  const sourceDir = value('--source-dir');
  if (!sourceDir) throw new Error('Required: --source-dir (three original XLSX files)');
  const proposal = value('--proposal-dir');
  if (proposal && args.includes('--write-local')) throw new Error('Proposal validation cannot write canonical R2');
  const require = createRequire(resolve(root, 'package.json'));
  const { tsImport } = require('tsx/esm/api');
  const sourcePath = proposal ? resolve(proposal, 'bridge-inspection-age-source.ts') : resolve(root, 'packages/data-configs/src/theme-catalog/bridge-inspection-age-source.ts');
  const { BRIDGE_INSPECTION_AGE_SOURCE: source } = await tsImport(pathToFileURL(sourcePath).href, import.meta.url);
  const prefectures = JSON.parse(await readFile(resolve(root, 'packages/area/src/data/prefectures.json'), 'utf8'));
  const result = spawnSync('python3', [resolve(dirname(fileURLToPath(import.meta.url)), 'extract-bridge-inspection-age.py')], {
    input: JSON.stringify({source, prefectures, sourceDir: resolve(sourceDir), generatedAt: new Date().toISOString()}), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `Source extraction exited ${result.status}`);
  const { snapshot, proof } = JSON.parse(result.stdout);
  // The production import validates the same strict contract as the Web reader.
  // The source proposal is validated by the focused TypeScript suite before adoption.
  if (!proposal) {
    const parserPath = resolve(root, 'apps/web/src/features/bridge-inspection-age/lib/bridge-inspection-age-snapshot.ts');
    const { parseBridgeInspectionAgeSnapshot } = await tsImport(pathToFileURL(parserPath).href, import.meta.url);
    parseBridgeInspectionAgeSnapshot(snapshot);
  }
  const bytes = JSON.stringify(snapshot) + '\n';
  proof.snapshotSha256 = createHash('sha256').update(bytes).digest('hex');
  proof.snapshotBytes = Buffer.byteLength(bytes);
  proof.r2Key = source.r2Key;
  proof.sourceDefinition = source;
  const out = value('--out');
  if (out) {
    await mkdir(out, {recursive:true});
    await writeFile(resolve(out, 'inspection-age.json'), bytes);
    await writeFile(resolve(out, 'bridge-source-proof.json'), JSON.stringify(proof, null, 2) + '\n');
  }
  if (args.includes('--write-local')) {
    const destination = resolve(root, '.local/r2', source.r2Key);
    await mkdir(dirname(destination), {recursive:true});
    await writeFile(destination, bytes);
  }
  console.log(JSON.stringify({status:'PASS', rawRows:proof.rawRows, rejects:proof.rejects, prefectures:47, knownYearCount:proof.knownYearCount, unknownYearCount:proof.unknownYearCount, snapshotSha256:proof.snapshotSha256, wroteLocal:args.includes('--write-local')}));
  return {snapshot, proof};
}
if (process.argv[1] && await realpath(process.argv[1]) === await realpath(fileURLToPath(import.meta.url))) await main();
