/** Fixed GSI public snapshots. Only --write-local writes a canonical R2 file; no network writes. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/** Only the two symbols explicitly documented for this snapshot are accepted. */
export function parseApplicabilityMarker(value) {
  assert(
    value === '1' || value === '',
    `Unapproved applicability marker: ${JSON.stringify(value)}`
  );
  return value === '1';
}
/** The official common ID includes municipality and facility type, not coordinates. */
export function parseCommonId(id, kind) {
  assert(['emergency', 'shelter'].includes(kind), 'unknown facility type');
  assert(
    typeof id === 'string' && /^E\d{10}[12][012][1-9A-Za-z]$/.test(id),
    `Invalid common ID ${id}`
  );
  const type = id.slice(11, 13);
  assert(
    kind === 'emergency' ? type === '20' : ['11', '12'].includes(type),
    'common ID facility type mismatch'
  );
  return { municipalityCode: id.slice(1, 6), type };
}
export async function main() {
  const args = process.argv.slice(2),
    option = (key, fallback) => {
      const i = args.indexOf(key);
      return i < 0 ? fallback : args[i + 1];
    };
  const repo = path.resolve(option('--repo-root', process.cwd())),
    code = path.resolve(option('--code-root', repo)),
    require = createRequire(path.join(repo, 'package.json'));
  const { parse: parseCsv } = require('csv-parse/sync');
  const { SHELTER_APPLICABILITY_SOURCE: S } = await import(
    pathToFileURL(
      path.join(
        code,
        'packages/data-configs/src/theme-catalog/shelter-applicability-source.ts'
      )
    ).href
  );
  const { shelterApplicabilitySnapshotSchema } = await import(
    pathToFileURL(
      path.join(
        code,
        'apps/web/src/features/shelter-applicability/lib/shelter-applicability-snapshot.ts'
      )
    ).href
  );
  const { prefCodeFromSource } = await import(
    pathToFileURL(
      path.join(repo, 'packages/gis/src/mlit-ksj/prefecture-assign.ts')
    ).href
  );
  const prefList = JSON.parse(
    fs.readFileSync(
      path.join(repo, 'packages/area/src/data/prefectures.json'),
      'utf8'
    )
  );
  const input = option('--source-dir');
  assert(input, '--source-dir is required');
  const proofDir = path.resolve(
      option('--proof-dir', '/tmp/stats47-shelter-applicability-proof')
    ),
    outputRoot = path.resolve(
      option('--output-root', path.join(repo, '.local/r2'))
    );
  const sha = (b) => crypto.createHash('sha256').update(b).digest('hex'),
    read = (name) => {
      const p = S.files.find((f) => f.filename === name);
      assert(p, `Unknown source ${name}`);
      const b = fs.readFileSync(path.join(input, name));
      assert.equal(b.length, p.bytes, `${name} bytes`);
      assert.equal(sha(b), p.sha256, `${name} SHA256`);
      return b;
    };
  for (const pin of S.files) read(pin.filename);
  const rows = (name) =>
    parseCsv(new TextDecoder('utf-8', { fatal: true }).decode(read(name)), {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
    });
  const meta = rows('municipality-meta.csv'),
    prefMeta = rows('pref-meta.csv');
  assert.equal(meta.length, S.expected.catalogMunicipalities);
  assert.equal(prefMeta.length, 47);
  const municipality = new Map();
  for (const r of meta) {
    assert.equal(r.length, 6);
    assert(/^\d{5}$/.test(r[0]));
    assert(!municipality.has(r[0]), 'duplicate municipality metadata');
    assert(
      ['', '11', '12', '9'].includes(r[4]),
      'unapproved publication status'
    );
    municipality.set(r[0], r);
  }
  const latest = (max) => max.reduce((a, b) => (a > b ? a : b), '');
  assert.equal(latest(meta.map((r) => r[3])), S.latestDatabaseUpdate);
  const countPublication = (list) => {
    const c = {
      catalogMunicipalities: list.length,
      bothPublished: 0,
      emergencyOnlyPublished: 0,
      shelterOnlyPublished: 0,
      notPublished: 0,
    };
    for (const r of list) {
      if (r[4] === '9') {
        assert(!r[2] && !r[3]);
        c.notPublished++;
      } else {
        assert(r[2] && r[3]);
        c[
          r[4] === '11'
            ? 'emergencyOnlyPublished'
            : r[4] === '12'
              ? 'shelterOnlyPublished'
              : 'bothPublished'
        ]++;
      }
    }
    return c;
  };
  const byPref = new Map(
    prefList.map((p, i) => {
      const pm = prefMeta[i];
      assert.equal(pm[0], p.prefCode);
      assert.equal(pm[1], p.prefName);
      assert.equal(pm[3], '');
      const c = meta.filter((r) => r[0].startsWith(p.prefCode.slice(0, 2)));
      return [
        p.prefCode,
        {
          areaCode: p.prefCode,
          areaName: p.prefName,
          latestDatabaseUpdate: pm[2],
          coverage: countPublication(c),
          emergency: {
            facilities: 0,
            addressAlsoShelter: 0,
            hazards: S.hazards.map((h) => ({
              key: h.key,
              applicable: 0,
              notApplicable: 0,
              unknown: 0,
            })),
          },
          shelter: {
            facilities: 0,
            general: 0,
            welfare: 0,
            addressAlsoEmergency: 0,
            hazardAttributes: 'not-provided-for-this-facility-type',
          },
        },
      ];
    })
  );
  const emergencyHeaders = [
    'NO',
    '共通ID',
    '都道府県名及び市町村名',
    '施設・場所名',
    '住所',
    ...S.hazards.map((h) => h.label),
    '指定避難所との住所同一',
    '緯度',
    '経度',
    '備考',
  ];
  const shelterHeaders = [
    'NO',
    '共通ID',
    '都道府県名及び市町村名',
    '施設・場所名',
    '住所',
    '指定緊急避難場所との住所同一',
    'その他市町村長が必要と認める事項',
    '受入対象者',
    '緯度',
    '経度',
    '備考',
  ];
  const bool = parseApplicabilityMarker;
  const partitionProof = [],
    originalCoverage = [];
  for (const [kind, headers] of [
    ['emergency', emergencyHeaders],
    ['shelter', shelterHeaders],
  ]) {
    const all = rows(`${kind}-national.csv`);
    assert.deepEqual(all.shift(), headers);
    const seen = new Set(),
      citySet = new Set(),
      byCityId = new Map();
    for (const r of all) {
      assert.equal(r.length, headers.length);
      const id = r[1];
      const identity = parseCommonId(id, kind);
      assert(!seen.has(id), 'duplicate common ID');
      seen.add(id);
      const city = identity.municipalityCode,
        m = municipality.get(city);
      assert(m, 'unknown municipality common ID');
      assert.equal(r[2], m[1]);
      assert.equal(
        prefCodeFromSource(
          { municipalityName: r[2] },
          { kind: 'address', field: 'municipalityName' }
        ),
        city.slice(0, 2)
      );
      assert(
        m[4] === '' || m[4] === (kind === 'emergency' ? '11' : '12'),
        'CSV contains unpublished municipality type'
      );
      const assigned = prefCodeFromSource(
        { municipalityCode: city },
        { kind: 'muniCode', field: 'municipalityCode' }
      );
      assert(assigned, 'unassigned municipality');
      const prefecture = assigned + '000',
        target = byPref.get(prefecture);
      assert(target);
      citySet.add(city);
      byCityId.set(id, r[1] + JSON.stringify(r.slice(3)));
      assert(r[3].trim(), 'missing facility/place name');
      if (kind === 'emergency') {
        target.emergency.facilities++;
        if (bool(r[13])) target.emergency.addressAlsoShelter++;
        let any = false;
        for (let i = 0; i < 8; i++) {
          const yes = bool(r[5 + i]);
          any ||= yes;
          target.emergency.hazards[i][yes ? 'applicable' : 'notApplicable']++;
        }
        assert(any, 'Emergency place has no designated hazard');
      } else {
        target.shelter.facilities++;
        target.shelter[id[12] === '1' ? 'general' : 'welfare']++;
        if (bool(r[5])) target.shelter.addressAlsoEmergency++;
      }
    }
    let expectedCount = 0;
    for (const [pref, p] of byPref) {
      const county = rows(`${kind}-${pref.slice(0, 2)}.csv`);
      assert.deepEqual(
        county.shift(),
        headers.filter((_, i) => i !== 2)
      );
      const ids = new Set();
      for (const r of county) {
        const id = r[1];
        assert(!ids.has(id), 'duplicate county common ID');
        ids.add(id);
        assert(
          id.slice(1, 3) === pref.slice(0, 2),
          'wrong prefecture source partition'
        );
        assert.equal(
          byCityId.get(id),
          r[1] + JSON.stringify(r.slice(2)),
          `${kind}/${pref}/${id} national/pref field mismatch`
        );
      }
      assert.equal(county.length, p[kind].facilities);
      expectedCount += county.length;
      partitionProof.push({
        kind,
        areaCode: pref,
        records: county.length,
        status: 'national-and-prefecture-all-fields-exact',
      });
    }
    assert.equal(expectedCount, all.length);
    const expectedCities = [...municipality.entries()]
      .filter(
        ([, r]) => r[4] === '' || r[4] === (kind === 'emergency' ? '11' : '12')
      )
      .map(([key]) => key)
      .sort();
    assert.deepEqual([...citySet].sort(), expectedCities);
    originalCoverage.push({
      kind,
      nationalRecords: all.length,
      distinctCommonIds: seen.size,
      distinctMunicipalities: citySet.size,
    });
  }
  const data = [...byPref.values()],
    national = {
      areaCode: '00000',
      areaName: '全国',
      latestDatabaseUpdate: S.latestDatabaseUpdate,
      coverage: countPublication(meta),
      emergency: {
        facilities: 0,
        addressAlsoShelter: 0,
        hazards: S.hazards.map((h) => ({
          key: h.key,
          applicable: 0,
          notApplicable: 0,
          unknown: 0,
        })),
      },
      shelter: {
        facilities: 0,
        general: 0,
        welfare: 0,
        addressAlsoEmergency: 0,
        hazardAttributes: 'not-provided-for-this-facility-type',
      },
    };
  for (const r of data) {
    for (const k of ['facilities', 'addressAlsoShelter'])
      national.emergency[k] += r.emergency[k];
    for (const k of [
      'facilities',
      'general',
      'welfare',
      'addressAlsoEmergency',
    ])
      national.shelter[k] += r.shelter[k];
    for (let i = 0; i < 8; i++)
      for (const k of ['applicable', 'notApplicable', 'unknown'])
        national.emergency.hazards[i][k] += r.emergency.hazards[i][k];
  }
  const snapshot = shelterApplicabilitySnapshotSchema.parse({
    schemaVersion: 1,
    seriesKey: S.seriesKey,
    dataVersion: S.dataVersion,
    acquiredOn: S.acquiredOn,
    latestDatabaseUpdate: S.latestDatabaseUpdate,
    generatedAt: new Date().toISOString(),
    unit: '掲載件数（共通ID）',
    sourcePins: S.files.map((p) => ({
      filename: p.filename,
      sha256: p.sha256,
      bytes: p.bytes,
    })),
    national,
    rows: data,
  });
  const body = JSON.stringify(snapshot, null, 2) + '\n';
  if (args.includes('--write-local')) {
    const out = path.join(outputRoot, S.r2Key);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, body);
    assert.equal(sha(fs.readFileSync(out)), sha(body));
  }
  const proof = {
    status: 'PASS',
    sourceFiles: S.files.length,
    prefectures: 47,
    unit: snapshot.unit,
    originalCoverage,
    partitionProof,
    national: snapshot.national,
    payloadSha256: sha(body),
    payloadBytes: Buffer.byteLength(body),
    snapshotKey: S.r2Key,
    writeLocal: args.includes('--write-local'),
    unknownMarkerCount: 0,
    unpublishedMunicipalities: meta
      .filter((r) => r[4] === '9')
      .map((r) => ({
        municipalityCode: r[0],
        name: r[1],
        status: r[4],
        note: r[5],
      })),
    license: S.license,
    notes: S.notes,
  };
  fs.mkdirSync(proofDir, { recursive: true });
  fs.writeFileSync(
    path.join(proofDir, 'ingester-proof.json'),
    JSON.stringify(proof, null, 2) + '\n'
  );
  fs.writeFileSync(path.join(proofDir, 'proposed-payload.json'), body);
  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        originalCoverage,
        prefectures: 47,
        payloadSha256: proof.payloadSha256,
        payloadBytes: proof.payloadBytes,
        writeLocal: proof.writeLocal,
      },
      null,
      2
    )
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href
)
  await main();
