import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { EARTHQUAKE_EXPOSURE_SOURCE as source } from '../../../../packages/data-configs/src/theme-catalog/earthquake-exposure-source.ts';
import {
  assertEarthquakeManifest,
  assertEarthquakePopulationSnapshot,
  assertEarthquakePrefArtifact,
  assertEarthquakeVerification,
  buildEarthquakePrefArtifact,
  selectEarthquakePopulationRow,
} from '../../../../packages/data-configs/src/theme-catalog/earthquake-exposure-schema.ts';
import { parseEarthquakeExposureBundle } from '../../../../apps/web/src/features/earthquake-exposure/lib/earthquake-exposure-bundle.ts';
import {
  assertPrivatePath,
  classifyEarthquakeIntensity,
  populationTenThousandths,
} from '../ingest-earthquake-exposure.mjs';
const generatedAt = '2026-09-10T23:00:00.000Z';
const clone = (v) => structuredClone(v);
const count = (records) => ({
  records,
  population2020: records * 10,
  population2050: records * 8,
});
const reference = (key, value) => {
  const text = JSON.stringify(value);
  return {
    key,
    sha256: createHash('sha256').update(text).digest('hex'),
    bytes: Buffer.byteLength(text),
  };
};
function fixture() {
  const n = source.expectedCounts.populationRecords,
    base = Math.floor(n / 47),
    remainder = n % 47;
  const rows = source.populationSources.map((s, i) => {
    const records = base + (i < remainder ? 1 : 0),
      missing = i === 0 ? 5 : 0;
    return {
      areaCode: s.areaCode,
      areaName: s.areaName,
      total: count(records),
      bands: source.bands.map((b, j) => ({
        key: b.key,
        ...count(j === 0 ? records - missing : 0),
      })),
      unmatched: {
        ...count(missing),
        notInSourceRecords: missing,
        missingValueRecords: 0,
      },
      coverage: {
        population2020Percent: (1 - missing / records) * 100,
        population2050Percent: (1 - missing / records) * 100,
      },
    };
  });
  const national = {
    areaCode: '00000',
    areaName: '全国',
    total: count(n),
    bands: source.bands.map((b, i) => ({
      key: b.key,
      ...count(i === 0 ? n - 5 : 0),
    })),
    unmatched: { ...count(5), notInSourceRecords: 5, missingValueRecords: 0 },
    coverage: {
      population2020Percent: (1 - 5 / n) * 100,
      population2050Percent: (1 - 5 / n) * 100,
    },
  };
  const snapshot = {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt,
    rows,
    national,
  };
  const verification = {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt,
    status: 'PASS',
    sourceFiles: 48,
    checkedPrefectures: 47,
    ...source.expectedCounts,
    invalidPopulationValues: 0,
    duplicatePopulationIdentities: 0,
    missingHazardValues: 0,
    conservationChecks: 144,
  };
  const manifest = {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt,
    kind: 'restricted-source-prefecture-aggregate',
    canonicalPath: source.canonicalPath,
    operation: source.algorithm,
    publicShape: 'prefecture-intensity-band-population',
    jshisOriginalPublic: false,
    inputs: [source.hazard, ...source.populationSources].map((p) => ({
      id: p.id,
      version: p.version,
      url: p.url,
      sha256: p.sha256,
      bytes: p.bytes,
      acquiredAt: '2026-09-10T00:00:00.000Z',
      bodyVisibility:
        p.id === source.hazard.id
          ? 'private-original'
          : 'public-license-original',
    })),
    intermediates: rows.map((row) => ({
      areaCode: row.areaCode,
      ...reference(
        `${source.r2Root}/pref/${row.areaCode.slice(0, 2)}.json`,
        buildEarthquakePrefArtifact(snapshot, row)
      ),
    })),
    aggregate: reference(`${source.r2Root}/item.json`, snapshot),
    verification: reference(`${source.r2Root}/verification.json`, verification),
    reproduction: {
      command:
        'node --import tsx .claude/scripts/themes/ingest-earthquake-exposure.mjs --source-dir <PRIVATE_INPUT_DIR> --private-work-dir <PRIVATE_WORK_DIR> --write-local',
      privateInputRequirement:
        'J-SHIS original ZIP and joined mesh rows remain outside public R2',
      populationIdentity: 'prefecture+SHICODE+MESH_ID; many-to-one hazard join',
      unmatchedPolicy: 'preserve separately; never classify as intensity zero',
    },
  };
  return { snapshot, manifest, verification };
}
const serialized = (f) => ({
  itemText: JSON.stringify(f.snapshot),
  manifestText: JSON.stringify(f.manifest),
  verificationText: JSON.stringify(f.verification),
});
test('unranked 47-area distribution preserves unmatched and common area selection', async () => {
  const f = fixture();
  assertEarthquakePopulationSnapshot(f.snapshot);
  assertEarthquakeManifest(f.manifest);
  assertEarthquakeVerification(f.verification);
  assert.equal(
    selectEarthquakePopulationRow(f.snapshot, null).areaCode,
    '00000'
  );
  assert.equal(
    selectEarthquakePopulationRow(f.snapshot, '37000').areaName,
    '香川県'
  );
  assert.equal(selectEarthquakePopulationRow(f.snapshot, '48000'), null);
  assert.ok(await parseEarthquakeExposureBundle(serialized(f)));
  assert.equal(f.snapshot.national.unmatched.records, 5);
});
for (const [value, expected] of [
  [4.499, 0],
  [4.5, 1],
  [4.999, 1],
  [5, 2],
  [5.499, 2],
  [5.5, 3],
  [5.999, 3],
  [6, 4],
  [6.499, 4],
  [6.5, 5],
])
  test(`intensity boundary ${value}`, () =>
    assert.equal(classifyEarthquakeIntensity(value), expected));
for (const value of [null, undefined, NaN, Infinity, -9999, -1, '6.5'])
  test(`reject non-intensity ${String(value)}`, () =>
    assert.throws(() => classifyEarthquakeIntensity(value)));
for (const [name, mutate] of [
  [
    'wrong version',
    (f) => {
      f.definitionVersion = 'Y2023';
    },
  ],
  [
    'missing county',
    (f) => {
      f.rows.pop();
    },
  ],
  [
    'county duplicated',
    (f) => {
      f.rows[1] = clone(f.rows[0]);
    },
  ],
  [
    'wrong county name',
    (f) => {
      f.rows[0].areaName = '青森県';
    },
  ],
  [
    'dropped unmatched',
    (f) => {
      delete f.rows[0].unmatched;
    },
  ],
  [
    'unmatched folded into safe',
    (f) => {
      f.rows[0].unmatched.records = 0;
      f.rows[0].unmatched.notInSourceRecords = 0;
      f.rows[0].bands[0].records += 5;
    },
  ],
  [
    'wrong denominator',
    (f) => {
      f.rows[0].coverage.population2020Percent = 100;
    },
  ],
  [
    'duplicate band',
    (f) => {
      f.rows[0].bands[1].key = f.rows[0].bands[0].key;
    },
  ],
  [
    'non-numeric population',
    (f) => {
      f.rows[0].bands[0].population2020 = null;
    },
  ],
  [
    'national not sum',
    (f) => {
      f.national.bands[0].population2050 += 1;
    },
  ],
  [
    'raw mesh leak',
    (f) => {
      f.rows[0].meshId = '5134400433';
    },
  ],
  [
    'raw geometry leak',
    (f) => {
      f.rows[0].bands[0].geometry = { type: 'Point', coordinates: [134, 34] };
    },
  ],
  [
    'rank leak',
    (f) => {
      f.rows[0].rank = 1;
    },
  ],
])
  test(`snapshot rejects ${name}`, () => {
    const f = fixture().snapshot;
    mutate(f);
    assert.throws(() => assertEarthquakePopulationSnapshot(f));
  });
for (const [name, mutate] of [
  [
    'wrong provider version',
    (f) => {
      f.inputs[0].version = 'Y2023';
    },
  ],
  [
    'republished original',
    (f) => {
      f.inputs[0].bodyVisibility = 'public-license-original';
    },
  ],
  [
    'private raw source key',
    (f) => {
      f.inputs[0].key = 'app/geo/raw-jshis.json';
    },
  ],
  [
    'private path leak',
    (f) => {
      f.inputs[0].localPath = '/tmp/raw.zip';
    },
  ],
  [
    'source duplication',
    (f) => {
      f.inputs[1] = clone(f.inputs[0]);
    },
  ],
  [
    'dropped intermediate',
    (f) => {
      f.intermediates.pop();
    },
  ],
  [
    'duplicate intermediate',
    (f) => {
      f.intermediates[1] = clone(f.intermediates[0]);
    },
  ],
  [
    'wrong canonical',
    (f) => {
      f.canonicalPath = '/geo/unimplemented';
    },
  ],
])
  test(`manifest rejects ${name}`, () => {
    const f = fixture().manifest;
    mutate(f);
    assert.throws(() => assertEarthquakeManifest(f));
  });
test('intermediate row is bound to prefecture identity', () => {
  const f = fixture();
  const p = buildEarthquakePrefArtifact(f.snapshot, f.snapshot.rows[0]);
  assertEarthquakePrefArtifact(p, '01000');
  assert.throws(() => assertEarthquakePrefArtifact(p, '02000'));
});
test('bundle rejects changed payload bytes and changed intermediate hash', async () => {
  const f = fixture();
  assert.equal(
    await parseEarthquakeExposureBundle({
      ...serialized(f),
      itemText: JSON.stringify(f.snapshot) + ' ',
    }),
    null
  );
  f.manifest.intermediates[0].sha256 = '0'.repeat(64);
  assert.equal(await parseEarthquakeExposureBundle(serialized(f)), null);
});
test('private paths cannot target public R2 and population precision is preserved', () => {
  assert.throws(() => assertPrivatePath('/tmp/public/raw.zip', '/tmp/public'));
  assert.throws(() =>
    assertPrivatePath('/other/.local/r2/raw.zip', '/tmp/public')
  );
  assert.equal(populationTenThousandths(102.1231), 1021231);
  assert.throws(() => populationTenThousandths(0.123456));
});
