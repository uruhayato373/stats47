import {
  accumulateNative,
  validateNativePoint,
} from './lib/tsunami-native-reader.mjs';
import { realpathSync } from 'node:fs';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { TSUNAMI_EXPOSURE_SOURCE as source } from '../../../packages/data-configs/src/theme-catalog/tsunami-exposure-source.ts';
import {
  verifyTsunamiSnapshot,
  assertTsunamiCountyRow,
  assertTsunamiManifest,
  assertTsunamiVerification,
} from '../../../packages/data-configs/src/theme-catalog/tsunami-exposure-schema.ts';
import { computeTsunamiExposure } from './lib/tsunami-source-reader.mjs';
import {
  accumulate,
  uniqueIdentity,
  quarterMeshCenter,
} from './lib/tsunami-spatial.mjs';
const sha = (b) => createHash('sha256').update(b).digest('hex');
export function verifyTsunamiIntermediate(value) {
  assert.deepEqual(
    Object.keys(value).sort(),
    ['schemaVersion', 'row', 'points'].sort()
  );
  assert.equal(value.schemaVersion, 1);
  assertTsunamiCountyRow(value.row);
  assert.ok(Array.isArray(value.points));
  const ids = new Set();
  const scenario = source.scenarios.find(
    (s) => s.areaCode === value.row.areaCode
  );
  const isNative = !['22000', '36000'].includes(value.row.areaCode);
  for (const p of value.points) {
    if (isNative) {
      validateNativePoint(p, scenario, ids);
      continue;
    }
    assert.ok(['population', 'facility'].includes(p.kind));
    assert.deepEqual(
      Object.keys(p).sort(),
      (p.kind === 'population'
        ? [
            'id',
            'kind',
            'meshCode',
            'municipality',
            'coordinates',
            'p2020',
            'p2050',
            'band',
          ]
        : ['id', 'kind', 'group', 'coordinates', 'band']
      ).sort()
    );
    uniqueIdentity(ids, p.id);
    assert.ok(Number.isInteger(p.band) && p.band >= -1 && p.band < 8);
    assert.ok(
      Array.isArray(p.coordinates) &&
        p.coordinates.length === 2 &&
        p.coordinates.every(Number.isFinite) &&
        p.coordinates[0] > 123 &&
        p.coordinates[0] < 155 &&
        p.coordinates[1] > 20 &&
        p.coordinates[1] < 47
    );
    if (p.kind === 'population') {
      assert.equal(
        p.id,
        `${value.row.areaCode.slice(0, 2)}:${p.municipality}:${p.meshCode}`
      );
      assert.ok(p.municipality.startsWith(value.row.areaCode.slice(0, 2)));
      assert.deepEqual(p.coordinates, quarterMeshCenter(p.meshCode));
      for (const k of ['p2020', 'p2050'])
        assert.ok(Number.isSafeInteger(p[k]) && p[k] >= 0);
    } else {
      assert.ok(p.id.startsWith(`P05-22:${value.row.areaCode.slice(0, 2)}:`));
      assert.ok(['administrative', 'public-meeting'].includes(p.group));
    }
  }
  const result = isNative
    ? accumulateNative(value.points, scenario)
    : accumulate(value.points);
  assert.deepEqual(value.row.bands, result.bands);
  assert.deepEqual(value.row.total, result.total);
  return value;
}
export async function buildTsunamiBundle(options) {
  const computed = await computeTsunamiExposure(options),
    generatedAt = new Date().toISOString();
  const snapshot = {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt,
    rows: computed.map((p) => p.row),
  };
  await verifyTsunamiSnapshot(snapshot);
  const verification = {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt,
    status: 'PASS',
    checkedCounties: source.scenarios.length,
    unavailableCounties: 47 - source.scenarios.length,
    countyChecks: computed.map((p) => ({
      areaCode: p.row.areaCode,
      populationRecords: p.row.total.populationRecords,
      facilityRecords:
        p.row.total.administrativeFacilities +
        p.row.total.publicMeetingFacilities,
      hazardRecords: p.evidence.sourceFeatures,
      conservationChecks: 5,
    })),
  };
  assertTsunamiVerification(verification, snapshot);
  const files = new Map(),
    store = (key, value) => {
      const body = JSON.stringify(value) + '\n';
      files.set(key, body);
      return { key, sha256: sha(body), bytes: Buffer.byteLength(body) };
    };
  const aggregate = store(`${source.r2Root}/item.json`, snapshot),
    verificationRef = store(`${source.r2Root}/verification.json`, verification);
  const intermediates = computed.map((p) => ({
    ...store(
      `${source.r2Root}/pref/${p.pref}.json`,
      verifyTsunamiIntermediate(p.intermediate)
    ),
    areaCode: p.row.areaCode,
  }));
  const manifest = {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt,
    publicationContract: source.publicationContract,
    canonicalPath: source.canonicalPath,
    inputs: source.inputs,
    evidence: source.evidence,
    scenarios: source.scenarios,
    aggregate,
    verification: verificationRef,
    intermediates,
    reproduction: {
      command:
        'node --import tsx .claude/scripts/themes/ingest-tsunami-exposure.mjs --hazard-dir <licensed-inputs> --population-dir <m250r6-zips> --facility-dir <P05-pref-json> --output-dir <local-validation-dir>',
      populationIdentity:
        'pref + SHICODE + MESH_ID; 250m grid centre; integer units of 1/10000 person',
      overlapPolicy:
        'Same-source maximum native depth. Hyogo uses disjoint north/south coastal inputs; latest integrated KSJ versions replace older files. County-specific bins are never split. No cross-prefecture scenario total.',
      unavailablePolicy:
        'Non-computed counties remain explicit source.coverage statuses, never zero. Tokyo mainland and unresolved island coverage remain separate. No national hazard sum.',
    },
  };
  assertTsunamiManifest(manifest);
  store(`${source.r2Root}/manifest.json`, manifest);
  return { files, computed, snapshot, manifest, verification };
}
async function main() {
  const args = process.argv.slice(2),
    option = (key) => {
      const i = args.indexOf(key);
      if (i < 0) return null;
      assert.ok(args[i + 1] && !args[i + 1].startsWith('--'), `Missing ${key}`);
      return resolve(args[i + 1]);
    };
  const allowed = [
    '--hazard-dir',
    '--population-dir',
    '--facility-dir',
    '--output-dir',
    '--write-local',
    '--r2-root',
  ];
  for (let i = 0; i < args.length; i++) {
    assert.ok(allowed.includes(args[i]), 'Unknown flag');
    if (args[i] !== '--write-local') i++;
  }
  const options = {
    hazardDir: option('--hazard-dir'),
    populationDir: option('--population-dir'),
    facilityDir: option('--facility-dir'),
  };
  assert.ok(
    Object.values(options).every(Boolean),
    'Three source directories required'
  );
  const bundle = await buildTsunamiBundle(options);
  const output = option('--output-dir'),
    writeLocal = args.includes('--write-local');
  assert.ok(
    !output || !output.includes('/.local/r2'),
    'Use --write-local for a local R2 destination'
  );
  assert.ok(
    !option('--r2-root') || writeLocal,
    '--r2-root requires --write-local'
  );
  const destinations = [
    ...(output ? [output] : []),
    ...(writeLocal
      ? [
          option('--r2-root') ??
            resolve(
              dirname(fileURLToPath(import.meta.url)),
              '../../../.local/r2'
            ),
        ]
      : []),
  ];
  for (const dest of destinations) {
    for (const [key, body] of bundle.files) {
      const target = resolve(dest, key);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, body);
    }
    for (const input of source.inputs) {
      const dir =
        input.kind === 'hazard'
          ? options.hazardDir
          : input.kind === 'population'
            ? options.populationDir
            : options.facilityDir;
      const original = resolve(dir, input.localSourceName);
      const bytes = await readFile(original);
      assert.equal(sha(bytes), input.sha256);
      assert.equal(bytes.length, input.bytes);
      const target = resolve(dest, input.publicKey);
      await mkdir(dirname(target), { recursive: true });
      await copyFile(original, target);
    }
  }
  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        counties: source.scenarios.length,
        populationRows: bundle.snapshot.rows.reduce(
          (s, r) => s + r.total.populationRecords,
          0
        ),
        publicArtifacts: bundle.files.size,
        licensedInputs: source.inputs.length,
        writeLocal,
        destinations,
      },
      null,
      2
    )
  );
}
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
)
  await main();
