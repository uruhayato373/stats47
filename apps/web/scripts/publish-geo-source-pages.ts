/** CI entry: prepare (local only) → publish dry-run → publish --apply → verify --canonical after purge. */
import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  createS3ImageObjectStoreFromEnv,
  listFromR2WithSize,
} from '@stats47/r2-storage/tooling';
import { GEO_SOURCE_PAGES } from '../../../packages/data-configs/src/business-plan/geo-source-pages';
import { downloadSourceArchive } from '../../../packages/gis/src/mlit-ksj/scripts/rebuild-source-page-data';
import {
  REPAIR_VERSIONS,
  mapGeoSourceBatch,
  assertPublicDataset,
  buildExactPlan,
  decoded,
  executeGeoSourcePlan,
  parseRepairIds,
  readbackObject,
  sha256,
  validateFloodManifest,
  validateLocalOutput,
  validateRepairManifest,
  type FloodManifest,
  type GeoSourcePlan,
  type Readback,
  type RepairManifest,
} from './geo-source-publish-core';
import {
  buildGeoSourceCatalog,
  sourceMetadataFromGit,
  writeGeoSourceCatalog,
  type SourceInventoryRow,
} from './export-geo-source-catalog';

const root = path.resolve('.local/r2');
const evidence = path.resolve('.local/verification/geo-source-publish');
const planPath = path.join(evidence, 'plan.json');
const publicBase =
  process.env.R2_PUBLIC_FETCH_URL ?? 'https://storage.stats47.jp';
const args = process.argv.slice(2);
const command = args[0];
const idsIndex = args.indexOf('--ids');
const idsValue = idsIndex >= 0 ? args[idsIndex + 1] : 'all';
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--ids') {
    if (!args[++i]) throw Error('--ids requires a value');
    continue;
  }
  if (!['--apply', '--canonical'].includes(args[i]))
    throw Error(`Unknown argument: ${args[i]}`);
}
if (!['prepare', 'publish', 'verify'].includes(command))
  throw Error(
    'Use prepare|publish|verify [--ids all|none|ID,...] [--apply] [--canonical]'
  );
if (
  (args.includes('--apply') && command !== 'publish') ||
  (args.includes('--canonical') && command !== 'verify')
)
  throw Error('Invalid command/flag combination');
if (publicBase !== 'https://storage.stats47.jp')
  throw Error('This release targets https://storage.stats47.jp only');
if (process.env.NODE_ENV === 'development')
  throw Error('Remote inventory cannot use development filesystem fallback');
const store = createS3ImageObjectStoreFromEnv();
if (!store)
  throw Error(
    'R2 S3 credentials are required for exact inventory, plans and verification'
  );
const objectStore = store;
mkdirSync(evidence, { recursive: true });
const write = (file: string, value: unknown) =>
  writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

async function run(script: string, extra: string[] = []) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        '--max-old-space-size=10000',
        'node_modules/tsx/dist/cli.mjs',
        script,
        ...extra,
      ],
      { stdio: 'inherit', env: process.env }
    );
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(Error(`${script} exited ${code}`))
    );
  });
}

async function prepare() {
  const ids = parseRepairIds(idsValue);
  const inventory: SourceInventoryRow[] = [];
  for (const page of GEO_SOURCE_PAGES) {
    assertPublicDataset(page.dataId, page.version);
    const rows = await listFromR2WithSize(
      `gis/mlit-ksj/${page.dataId}/${page.version}/`
    );
    inventory.push(
      ...rows
        .filter((row) => /\.(topojson|geojson)$/.test(row.key))
        .map((row) => ({ key: row.key, bytes: row.size }))
    );
  }
  write(path.join(evidence, 'observed-inventory.json'), {
    observedAt: new Date().toISOString(),
    objects: inventory,
  });
  const scratch = mkdtempSync(path.join(tmpdir(), 'stats47-geo-source-'));
  try {
    for (const id of ids) {
      console.log(`GENERATE ${id}/${REPAIR_VERSIONS[id]}`);
      if (id === 'A38') {
        const zip = path.join(scratch, 'A38-20_GML.zip');
        await downloadSourceArchive(
          'https://nlftp.mlit.go.jp/ksj/gml/data/A38/A38-20/A38-20_GML.zip',
          zip
        );
        await run(
          'packages/gis/src/mlit-ksj/scripts/rebuild-medical-areas.ts',
          ['--source-zip', zip]
        );
        rmSync(zip);
      } else if (id === 'A31b') {
        await run(
          'packages/gis/src/mlit-ksj/scripts/build-flood-view-files.ts'
        );
      } else {
        await run(
          'packages/gis/src/mlit-ksj/scripts/rebuild-source-page-data.ts',
          ['--data-id', id, '--source-dir', scratch, '--download']
        );
      }
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  let rows = inventory;
  const keys: string[] = [];
  const repairs = [];
  for (const [id, version] of Object.entries(REPAIR_VERSIONS)) {
    const key = `app/geo/datasets/${id}/${id === 'A31b' ? 'manifest' : 'repair'}.json`;
    let bytes: Buffer;
    if (ids.includes(id)) bytes = readFileSync(path.join(root, key));
    else {
      const remote = await objectStore.get(key);
      if (!remote)
        throw Error(
          `Repair proof missing for ${id}; rerun --ids all or include ${id}`
        );
      bytes = decoded(remote.body);
    }
    const manifest = JSON.parse(bytes.toString('utf8')) as RepairManifest &
      FloodManifest;
    if (manifest.dataId !== id || manifest.version !== version)
      throw Error(`Mismatched repair evidence ${key}`);
    const outputs =
      id === 'A31b'
        ? validateFloodManifest(manifest)
        : validateRepairManifest(manifest);
    await mapGeoSourceBatch(outputs, async (output) => {
      if (ids.includes(id)) validateLocalOutput(root, output);
      else {
        const current = await objectStore.head(output.key);
        if (
          !current ||
          current.contentLength !== output.bytes ||
          current.metadata['stats47-sha256'] !== output.outputSha256
        )
          throw Error(`Published repair output changed/missing: ${output.key}`);
      }
    });
    // Both selected and already-published repaired datasets replace their entire inventory.
    // Malformed extra files remain untouched. Remove this inventory replacement only after
    // an exact-key retention audit confirms all superseded source files were removed.
    rows = rows
      .filter((row) => !row.key.startsWith(`gis/mlit-ksj/${id}/${version}/`))
      .concat(
        id === 'A31b'
          ? manifest.assets.map(({ key: assetKey, bytes: size, label }) => ({
              key: assetKey,
              bytes: size,
              label,
            }))
          : outputs.map(({ key: assetKey, bytes: size }) => ({
              key: assetKey,
              bytes: size,
            }))
      );
    if (ids.includes(id)) keys.push(...outputs.map((o) => o.key), key);
    writeFileSync(
      path.join(
        evidence,
        `${id}-${id === 'A31b' ? 'manifest' : 'repair'}.json`
      ),
      bytes
    );
    repairs.push({
      dataId: id,
      version,
      regenerated: ids.includes(id),
      proofKey: key,
      proofSha256: sha256(bytes),
      outputs: outputs.length,
    });
  }
  const data = buildGeoSourceCatalog({
    rows,
    metadata: sourceMetadataFromGit(),
    generatedAt: new Date().toISOString(),
  });
  keys.push(...writeGeoSourceCatalog(root, data));
  // Avoid re-publishing identical indexes merely to change generatedAt on a subset retry.
  const previousCatalog = await objectStore.get('app/geo/layers/items.json');
  if (previousCatalog) {
    const previous = JSON.parse(
      decoded(previousCatalog.body).toString('utf8')
    ) as { generatedAt: string; items: unknown[] };
    if (JSON.stringify(previous.items) === JSON.stringify(data.catalog.items)) {
      data.catalog.generatedAt = previous.generatedAt;
      writeGeoSourceCatalog(root, data);
    }
  }
  const plan = await buildExactPlan(root, keys, ids, objectStore);
  write(planPath, plan);
  write(path.join(evidence, 'scope.json'), {
    generatedAt: plan.generatedAt,
    repairs,
    datasetCount: data.items.length,
    indexObjects: 51,
    existingThumbnailObjectsExcluded: 150,
    objects: plan.objects.length,
    storedBytes: plan.objects.reduce((n, o) => n + o.bytes, 0),
    planSha256: sha256(readFileSync(planPath)),
  });
  console.log(
    `PREPARED ${plan.objects.length} exact objects; 50 datasets; ${planPath}`
  );
}

async function main() {
  if (command === 'prepare') return prepare();
  if (!existsSync(planPath))
    throw Error('Run prepare first in the same checkout/staging directory');
  const plan = JSON.parse(readFileSync(planPath, 'utf8')) as GeoSourcePlan;
  const scope = JSON.parse(
    readFileSync(path.join(evidence, 'scope.json'), 'utf8')
  ) as { planSha256: string };
  if (sha256(readFileSync(planPath)) !== scope.planSha256)
    throw Error('Exact plan hash changed after preparation');
  const readbacks: Readback[] = [];
  const record = (row: Readback) => {
    readbacks.push(row);
    if (readbacks.length % 50 === 0) {
      write(path.join(evidence, 'readback-progress.json'), {
        verified: readbacks.length,
        expected: plan.objects.length,
        readbacks,
      });
      console.log(`VERIFIED ${readbacks.length}/${plan.objects.length}`);
    }
  };
  if (command === 'verify') {
    await mapGeoSourceBatch(plan.objects, async (object) =>
      record(
        await readbackObject(
          object,
          objectStore,
          publicBase,
          args.includes('--canonical')
        )
      )
    );
    write(
      path.join(
        evidence,
        args.includes('--canonical')
          ? 'canonical-readback.json'
          : 'public-readback.json'
      ),
      {
        verifiedAt: new Date().toISOString(),
        verified: readbacks.length,
        planSha256: scope.planSha256,
        readbacks,
      }
    );
    return;
  }
  const apply = args.includes('--apply');
  const dryRunPath = path.join(evidence, 'dry-run.json');
  if (apply) {
    if (
      !existsSync(dryRunPath) ||
      JSON.parse(readFileSync(dryRunPath, 'utf8')).planSha256 !==
        scope.planSha256
    )
      throw Error('This exact plan needs a successful dry-run before apply');
  }
  const result = await executeGeoSourcePlan({
    root,
    plan,
    store: objectStore,
    publicBase,
    apply,
    onVerified: record,
  });
  write(path.join(evidence, apply ? 'result.json' : 'dry-run.json'), {
    completedAt: new Date().toISOString(),
    mode: apply ? 'published-public-query-verified' : 'dry-run',
    planSha256: scope.planSha256,
    ...result,
    readbacks,
  });
  console.log(JSON.stringify(result));
}
main().catch((error: unknown) => {
  write(path.join(evidence, 'failure.json'), {
    failedAt: new Date().toISOString(),
    command,
    message: error instanceof Error ? error.message : String(error),
  });
  console.error(error);
  process.exitCode = 1;
});
