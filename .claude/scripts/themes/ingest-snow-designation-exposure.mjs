import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2),
  flag = (key) => args.includes(key),
  option = (key, fallback) => {
    const i = args.indexOf(key);
    return i < 0 ? fallback : args[i + 1];
  };
const repo = path.resolve(option('--repo-root', process.cwd())),
  code = path.resolve(option('--code-root', repo));
const work = path.resolve(
  option('--work-dir', '/tmp/stats47-snow-designation-work')
);
const snowDir = option('--snow-dir'),
  populationDir = option('--population-dir');
assert(
  snowDir && populationDir,
  '--snow-dir and --population-dir are required'
);
const output = path.resolve(
  option('--output-root', path.join(repo, '.local/r2'))
);
const load = async (rel) => import(pathToFileURL(path.join(code, rel)).href);
const { SNOW_DESIGNATION_SOURCE: S } = await load(
  'packages/data-configs/src/theme-catalog/snow-designation-source.ts'
);
const { SNOW_DESIGNATION_DEFINITION: D } = await load(
  'packages/gis/src/geo-analysis/snow-designation-definition.ts'
);
const {
  parseGeoSnowPrefDetail,
  parseGeoSnowManifest,
  assertGeoSnowConservation,
} = await load('packages/gis/src/geo-analysis/snow-designation.ts');
const { readPopulationZip } = await import(
  pathToFileURL(
    path.join(repo, '.claude/scripts/themes/lib/earthquake-dbf.mjs')
  ).href
);
const { assertKsjPublicStructuredOutputAllowed } = await import(
  pathToFileURL(path.join(repo, 'packages/gis/src/mlit-ksj/license-policy.ts'))
    .href
);
for (const s of [S.snow, S.population])
  assertKsjPublicStructuredOutputAllowed({
    dataId: s.datasetId,
    license: s.licenseKey,
    output: S.r2Root,
  });
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex'),
  compact = (o) => JSON.stringify(o) + '\n';
const checked = (file, pin) => {
  const b = fs.readFileSync(file);
  assert.equal(b.length, pin.bytes, `${file} bytes`);
  assert.equal(sha(b), pin.sha256, `${file} SHA256`);
  return b;
};
const putWork = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, compact(value));
};
const clone = (a, b) => {
  fs.mkdirSync(path.dirname(b), { recursive: true });
  fs.copyFileSync(a, b, fs.constants.COPYFILE_FICLONE);
};
assert.equal(S.populationSources.length, 47);
assert.deepEqual(
  S.populationSources.map((p) => p.areaCode),
  Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0') + '000')
);
assert.deepEqual(
  S.snowSources.map((p) => p.areaCode.slice(0, 2)),
  S.designatedPrefectures
);
for (const p of S.documentSources)
  checked(path.resolve(snowDir, p.filename), p);
const inputs = [],
  receipts = [],
  mirrors = [];
for (const pin of S.snowSources) {
  const file = path.resolve(snowDir, pin.filename);
  checked(file, pin);
  const pref = pin.areaCode.slice(0, 2),
    key = `gis/mlit-ksj/A22/16/${pref}.zip`;
  const target = path.join(work, 'raw', pin.filename);
  if (file !== target) clone(file, target);
  mirrors.push({ file, key, pin });
  receipts.push({
    ...pin,
    key,
    role: 'calculation-input',
    usedInCalculation: true,
    acquiredAt: pin.fetchedAt,
  });
}
putWork(path.join(work, 'source-manifest.json'), S.snowSources);
const populationEvidence = [];
for (const pin of S.populationSources) {
  const pref = pin.areaCode.slice(0, 2),
    file = path.resolve(populationDir, `${pref}.zip`),
    key = `gis/mlit-ksj/m250r6/24/${pref}.zip`;
  checked(file, pin);
  mirrors.push({ file, key, pin });
  const metaPath = `${file}.metadata.json`,
    meta = fs.existsSync(metaPath)
      ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
      : null;
  receipts.push({
    ...pin,
    key,
    role: 'calculation-input',
    usedInCalculation: true,
    acquiredAt: meta?.sha256 === pin.sha256 ? meta.acquiredAt : null,
    acquisitionNote:
      meta?.sha256 === pin.sha256 ? '元の取得日時を継承' : '初回取得日時未記録',
  });
  const rows = [],
    identities = new Set();
  let zero = 0,
    sum = 0;
  const dbf = await readPopulationZip(file, pref, (p) => {
    const id = `${p.SHICODE}:${p.MESH_ID}`;
    assert(!identities.has(id), `duplicate population identity ${pref}:${id}`);
    identities.add(id);
    const n = Math.round(p.PTN_2020 * 10000);
    assert(
      Number.isSafeInteger(n) && Math.abs(n - p.PTN_2020 * 10000) < 0.00001,
      'PTN_2020 precision'
    );
    sum += n;
    if (n === 0) zero++;
    else rows.push([p.MESH_ID, p.SHICODE, n]);
  });
  assert(Number.isSafeInteger(sum));
  rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  const value = {
      pref,
      areaName: pin.areaName,
      rows,
      rawRecords: dbf.records,
      zeroRecords: zero,
      sumScaled: sum,
    },
    body = compact(value);
  putWork(path.join(work, 'work/population', `${pref}.json`), value);
  populationEvidence.push({
    ...pin,
    path: file,
    dbf,
    populatedRecords: rows.length,
    zeroRecords: zero,
    populationScaled: sum,
    extractedSha256: sha(body),
    extractedBytes: Buffer.byteLength(body),
  });
  inputs.push({
    layerId: 'ksj-population-mesh-250m',
    datasetId: 'm250r6',
    version: '24',
    key,
    sha256: pin.sha256,
    bytes: pin.bytes,
    geometry: 'mesh',
    role: 'calculation-input',
    usedInCalculation: true,
  });
}
putWork(path.join(work, 'population-evidence.json'), populationEvidence);
for (const p of S.snowSources)
  inputs.push({
    layerId: 'ksj-a22-snow-designation',
    datasetId: 'A22',
    version: '16',
    key: `gis/mlit-ksj/A22/16/${p.areaCode.slice(0, 2)}.zip`,
    sha256: p.sha256,
    bytes: p.bytes,
    geometry: 'polygon',
    role: 'calculation-input',
    usedInCalculation: true,
  });
const python = option('--python', 'python3'),
  engine = path.join(
    code,
    'packages/gis/src/geo-analysis/snow-designation-overlay.py'
  );
const pythonCheck = spawnSync(
  python,
  [
    '-c',
    'import shapely,pyproj; assert shapely.__version__=="2.1.2" and pyproj.__version__=="3.7.2"',
  ],
  { encoding: 'utf8' }
);
assert.equal(pythonCheck.status, 0, pythonCheck.stderr);
const result = spawnSync(python, [engine, '--work-root', work], {
  encoding: 'utf8',
  stdio: 'inherit',
});
assert.equal(result.status, 0, 'spatial operation failed');
const independent = spawnSync(
  python,
  [
    path.join(
      code,
      '.claude/scripts/themes/lib/snow-designation-original-check.py'
    ),
    work,
  ],
  { encoding: 'utf8', stdio: 'inherit' }
);
assert.equal(
  independent.status,
  0,
  'independent DBF/SHP and national-boundary checks'
);
const proof = JSON.parse(
  fs.readFileSync(path.join(work, 'work/overlay-proof.json'), 'utf8')
);
assert.equal(proof.status, 'PASS');
assert.equal(proof.prefectureCount, 47);
assert.equal(proof.designatedPrefectureCount, 24);
assert.equal(proof.nonDesignatedPrefectureCount, 23);
const generatedAt = new Date().toISOString(),
  artifacts = new Map(),
  derived = [],
  sources = [],
  rows = [];
const put = (key, value, count, areaCode) => {
  const body = key.endsWith('/item.json')
    ? JSON.stringify(value, null, 2) + '\n'
    : compact(value);
  const evidence = {
    key,
    sha256: sha(body),
    bytes: Buffer.byteLength(body),
    recordCount: count,
    ...(areaCode ? { areaCode } : {}),
  };
  artifacts.set(key, { body, evidence });
  return evidence;
};
for (const p of S.populationSources) {
  const pref = p.areaCode.slice(0, 2),
    detail = JSON.parse(
      fs.readFileSync(path.join(work, 'work/derived', `${pref}.json`), 'utf8')
    );
  detail.generatedAt = generatedAt;
  assert(parseGeoSnowPrefDetail(detail, p.areaCode), `county schema ${pref}`);
  const s = detail.summary,
    values = {
      designatedCenterPopulation:
        (s.populationScaled[1] + s.populationScaled[2]) / 10000,
      specialCenterPopulation: s.populationScaled[2] / 10000,
      designatedCenterPopulationShare:
        ((s.populationScaled[1] + s.populationScaled[2]) * 100) /
        s.populationTotalScaled,
      designatedAreaKm2: s.designatedAreaKm2,
      specialAreaKm2: s.specialAreaKm2,
      boundaryCellPopulation: s.boundaryScaled[0] / 10000,
      population2020: s.populationTotalScaled / 10000,
    };
  const row = { areaCode: p.areaCode, areaName: p.areaName, rank: 0, values };
  assertGeoSnowConservation(detail, row);
  rows.push(row);
  derived.push(
    put(
      `${S.r2Root}/pref/${pref}.json`,
      detail,
      detail.meshes.length,
      p.areaCode
    )
  );
  const source = JSON.parse(
    fs.readFileSync(path.join(work, 'work/source', `${pref}.json`), 'utf8')
  );
  source.generatedAt = generatedAt;
  sources.push(
    put(
      `${S.r2Root}/source/${pref}.json`,
      source,
      source.records.length,
      p.areaCode
    )
  );
}
// Rank is required by the existing Geo schema. It sorts descriptive shares, never a hazard/safety score.
const sorted = [...rows].sort(
  (a, b) =>
    b.values.designatedCenterPopulationShare -
      a.values.designatedCenterPopulationShare ||
    a.areaCode.localeCompare(b.areaCode)
);
let last = null,
  rank = 0;
sorted.forEach((r, i) => {
  if (last !== r.values.designatedCenterPopulationShare) rank = i + 1;
  r.rank = rank;
  last = r.values.designatedCenterPopulationShare;
});
const snapshot = {
  ...D,
  generatedAt,
  rows,
  summary: {
    observationCount: 47,
    medianValue: sorted[23].values.designatedCenterPopulationShare,
    topAreaCodes: sorted.slice(0, 3).map((r) => r.areaCode),
    bottomAreaCodes: sorted.slice(-3).map((r) => r.areaCode),
  },
  dataQuality: {
    expectedAreas: 47,
    actualAreas: 47,
    missingAreaCodes: [],
    inputCounts: {
      snowArchives: 24,
      populationArchives: 47,
      snowPolygonRecords: proof.geometryRecords,
      populatedMeshes: proof.populatedRecords,
    },
    coverageNote:
      'A22-16は指定24県・非指定23県。分母は47県の同一2020年基準人口。境界感度は中間artifactに保持。',
  },
};
const aggregate = put(`${S.r2Root}/item.json`, snapshot, 47),
  stage = (id, label, kind, role, inputIds, operation, dir, outputs) => ({
    id,
    label,
    kind,
    role,
    inputIds,
    operation,
    outputKeyPattern:
      dir === 'item' ? `${S.r2Root}/item.json` : `${S.r2Root}/${dir}/{NN}.json`,
    outputs,
  });
const manifest = {
  schemaVersion: 1,
  slug: S.slug,
  generatedAt,
  definitionSha256: sha(JSON.stringify(D)),
  inputs,
  stages: [
    stage(
      'population-mesh',
      '2020年基準人口250mメッシュ',
      'source',
      'calculation-input',
      ['ksj-population-mesh-250m'],
      'PTN_2020を原典小数4桁整数としMESH_ID/SHICODEを保持。ゼロ行は件数検算へ保持。',
      'pref',
      derived
    ),
    stage(
      'snow-designation-polygons',
      '2016年度の豪雪指定区域',
      'source',
      'calculation-input',
      ['ksj-a22-snow-designation'],
      '原典24県の全行を保持して和集合。地図用20m簡略化は計算に使用しない。非指定23県は完全な原典一覧から確認。',
      'source',
      sources
    ),
    stage(
      'snow-center-point-containment',
      '中心包含と格子の境界感度',
      'spatial-operation',
      'derived',
      ['population-mesh', 'snow-designation-polygons'],
      '同県のunsimplified原典に250m中心をcovers判定。特別豪雪優先。人口按分なし。格子全包含/交差も記録。',
      'pref',
      derived
    ),
    stage(
      'prefecture-aggregate',
      '47県集計と保存則',
      'aggregate',
      'aggregate',
      ['snow-center-point-containment'],
      '人口の排他3区分と全国合計、区域面積の排他2区分を検算。',
      'item',
      [aggregate]
    ),
  ],
  aggregate,
  quality: {
    expectedAreas: 47,
    detailAreas: 47,
    conservationChecks: 47,
    sourceRecords: proof.geometryRecords + proof.populatedRecords,
    derivedRecords: proof.populatedRecords,
    populatedMeshes: proof.populatedRecords,
    exposedMeshes: proof.rows.reduce(
      (n, r) => n + r.summary.populatedRecords,
      0
    ),
    maxDetailBytes: Math.max(...derived.map((d) => d.bytes)),
  },
};
// Count exposed rows from the actual class column, not all populated rows.
manifest.quality.exposedMeshes = [...artifacts.entries()]
  .filter(([key]) => /\/pref\/\d{2}\.json$/.test(key))
  .reduce(
    (n, [, a]) => n + JSON.parse(a.body).meshes.filter((r) => r[3] > 0).length,
    0
  );
assert(
  parseGeoSnowManifest(manifest),
  'manifest source/stage/coverage contract'
);
put(`${S.r2Root}/manifest.json`, manifest, 47);
const verification = {
  originalChecks: {
    population: JSON.parse(
      fs.readFileSync(
        path.join(work, 'independent-original-proof.json'),
        'utf8'
      )
    ),
    boundaries: JSON.parse(
      fs.readFileSync(path.join(work, 'national-boundary-proof.json'), 'utf8')
    ),
  },
  schemaVersion: 1,
  slug: S.slug,
  generatedAt,
  status: 'PASS',
  definitionSha256: manifest.definitionSha256,
  algorithmSha256: sha(fs.readFileSync(engine)),
  originalSourceCount: 71,
  national: proof.national,
  conservationChecks: proof.conservationChecks,
  rows: proof.rows,
  runtime: proof.runtime,
  maxDetailBytes: manifest.quality.maxDetailBytes,
  artifactEvidence: [...artifacts.values()].map((a) => a.evidence),
  contextOnly: {
    usedInCalculation: false,
    officialPopulationThousands: 18248,
    officialAreaKm2: 191992,
    populationYear: 2020,
    areaDate: '2025-10-01',
    excludedPartialCities: ['仙台市', '郡山市', '静岡市', '大津市'],
    note: '原典範囲/時点/集計方法が異なるため本分析との一致は要求しない。',
  },
  limitations: S.notes,
};
put(`${S.r2Root}/verification.json`, verification, 47);
put(
  `${S.r2Root}/sources.json`,
  {
    schemaVersion: 1,
    slug: S.slug,
    generatedAt,
    processor: 'stats47',
    sources: receipts,
    documentSources: S.documentSources,
    attribution: [S.snow.attribution, S.population.attribution],
  },
  71
);
assert.equal(
  proof.national.populationScaled.reduce((a, b) => a + b, 0),
  proof.national.populationTotalScaled
);
if (flag('--write-local')) {
  for (const m of mirrors) {
    const target = path.join(output, m.key);
    if (path.resolve(m.file) !== target) clone(m.file, target);
    checked(target, m.pin);
  }
  for (const [key, a] of artifacts) {
    const target = path.join(output, key);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, a.body);
    assert.equal(sha(fs.readFileSync(target)), a.evidence.sha256);
  }
}
const report = {
  status: 'PASS',
  writeLocal: flag('--write-local'),
  snapshotKey: aggregate.key,
  snapshotSha256: aggregate.sha256,
  publicJsonArtifacts: artifacts.size,
  originalMirrors: mirrors.length,
  rows: 47,
  populatedMeshes: proof.populatedRecords,
  national: proof.national,
  maxDetailBytes: manifest.quality.maxDetailBytes,
};
putWork(path.join(work, 'ingester-proof.json'), report);
console.log(JSON.stringify(report, null, 2));
