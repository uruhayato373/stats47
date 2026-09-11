import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const args = process.argv.slice(2),
  opt = (n, d) => {
    const i = args.indexOf(n);
    return i < 0 ? d : args[i + 1];
  },
  repo = path.resolve(opt('--repo-root', process.cwd())),
  code = path.resolve(opt('--code-root', repo)),
  work = path.resolve(
    opt('--work-dir', '/tmp/stats47-landslide-exposure-work')
  ),
  source = opt('--source-dir'),
  pop = opt('--population-dir'),
  fac = opt(
    '--facilities-dir',
    path.join(repo, '.local/r2/gis/mlit-ksj/P05/22')
  ),
  python = opt('--python', 'python3');
assert(source && pop, '--source-dir and --population-dir required');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex'),
  compact = (x) => JSON.stringify(x) + '\n',
  load = (rel) => import(pathToFileURL(path.join(code, rel)).href),
  read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const { LANDSLIDE_EXPOSURE_SOURCE: S } = await load(
    'packages/data-configs/src/theme-catalog/landslide-exposure-source.ts'
  ),
  { LANDSLIDE_EXPOSURE_DEFINITION: D, LANDSLIDE_EXPOSURE_DEFINITION_SHA256 } =
    await load(
      'packages/gis/src/geo-analysis/landslide-exposure-definition.ts'
    ),
  core = await load('packages/gis/src/geo-analysis/landslide-exposure.ts');
assert.equal(sha(JSON.stringify(D)), LANDSLIDE_EXPOSURE_DEFINITION_SHA256);
const { readPopulationZip } = await import(
  pathToFileURL(
    path.join(repo, '.claude/scripts/themes/lib/earthquake-dbf.mjs')
  )
);
const put = (file, value, pretty = false) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      (pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value)) + '\n'
    );
  },
  checked = (file, p) => {
    const b = fs.readFileSync(file);
    assert.equal(b.length, p.bytes, `${file} bytes`);
    assert.equal(sha(b), p.sha256, `${file} SHA`);
    return b;
  },
  mirror = (a, b) => {
    fs.mkdirSync(path.dirname(b), { recursive: true });
    if (path.resolve(a) !== path.resolve(b))
      fs.copyFileSync(a, b, fs.constants.COPYFILE_FICLONE);
  };
const inputs = core.expectedLandslideInputs(),
  rawMirrors = [];
for (const input of inputs) {
  const pref = input.key.split('/').at(-1).slice(0, 2);
  const file =
    input.datasetId === 'A33'
      ? path.join(source, `A33-25_${pref}_GEOJSON.zip`)
      : input.datasetId === 'm250r6'
        ? path.join(pop, `${pref}.zip`)
        : path.join(fac, `${pref}.geojson`);
  checked(file, input);
  rawMirrors.push({ file, key: input.key });
  if (input.datasetId === 'A33') {
    core.assertLandslideSourcePublication(
      pref,
      input.sha256,
      S.a33.permissions.sha256
    );
    mirror(file, path.join(work, 'raw', `A33-25_${pref}_GEOJSON.zip`));
  }
}
assert.equal(
  sha(fs.readFileSync(path.join(source, 'A33_permision_R7.xlsx'))),
  S.a33.permissions.sha256
);
assert(!inputs.some((p) => p.key === 'gis/mlit-ksj/A33/25/26.zip'));
put(path.join(work, 'a33-source-manifest.json'), {
  index: { url: S.a33.pageUrl, sha256: S.a33.indexSha256 },
  permissions: S.a33.permissions,
  prefectures: S.prefectures,
});
const evidence = [];
for (const pin of S.populationSources) {
  const pref = pin.areaCode.slice(0, 2),
    rows = [],
    ids = new Set();
  let zeroRecords = 0,
    total = 0;
  const dbf = await readPopulationZip(
    path.join(pop, `${pref}.zip`),
    pref,
    (r) => {
      const id = `${r.SHICODE}:${r.MESH_ID}`;
      assert(!ids.has(id));
      ids.add(id);
      const v = Math.round(r.PTN_2020 * 10000);
      assert(
        Number.isSafeInteger(v) && Math.abs(v - r.PTN_2020 * 10000) < 0.00001
      );
      total += v;
      if (v === 0) zeroRecords++;
      else rows.push([r.MESH_ID, r.SHICODE, v]);
    }
  );
  rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  assert.equal(total, pin.populationScaled);
  assert.equal(rows.length, pin.populatedRecords);
  assert.equal(zeroRecords, pin.zeroRecords);
  const value = {
    pref,
    areaName: pin.areaName,
    rows,
    rawRecords: dbf.records,
    zeroRecords,
    sumScaled: total,
  };
  put(path.join(work, 'work/population', `${pref}.json`), value);
  evidence.push({
    ...pin,
    dbf,
    extractedSha256: sha(compact(value)),
    extractedBytes: Buffer.byteLength(compact(value)),
  });
}
put(path.join(work, 'population-evidence.json'), evidence);
const runtime = spawnSync(
  python,
  ['-c', 'import shapely; assert shapely.__version__=="2.1.2"'],
  { encoding: 'utf8' }
);
assert.equal(runtime.status, 0, runtime.stderr);
if (!args.includes('--verified-overlay-dir')) {
  const proc = spawnSync(
    python,
    [
      path.join(
        code,
        'packages/gis/src/geo-analysis/landslide-exposure-overlay.py'
      ),
      '--work-root',
      work,
      '--population-prepared-dir',
      path.join(work, 'work/population'),
      '--facility-dir',
      fac,
    ],
    { stdio: 'inherit', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } }
  );
  assert.equal(proc.status, 0, 'overlay failed');
}
assert(
  !(args.includes('--verified-overlay-dir') && args.includes('--write-local')),
  'verified overlay reuse is preview-only'
);
const spatial = opt('--verified-overlay-dir', path.join(work, 'work')),
  proof = read(path.join(spatial, 'overlay-proof.json'));
if (!args.includes('--verified-overlay-dir')) {
  const check = spawnSync(
    python,
    [
      path.join(
        code,
        '.claude/scripts/themes/lib/landslide-exposure-independent.py'
      ),
      '--work-root',
      work,
    ],
    { stdio: 'inherit', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } }
  );
  assert.equal(check.status, 0, 'independent source verification failed');
}
const independent = read(
  path.join(path.dirname(spatial), 'independent-proof.json')
);
assert.equal(independent.status, 'PASS');
assert.equal(independent.sourceReceipts.length, 46);
for (const p of independent.sourceReceipts) {
  const s = S.prefectures.find((x) => x.areaCode === p.areaCode);
  assert.equal(p.sha256, s.sha256);
}
for (const p of independent.detailArtifactPins)
  assert.equal(
    sha(fs.readFileSync(path.join(spatial, 'pref', p.pref + '.json'))),
    p.sha256
  );
assert.equal(independent.detailArtifactPins.length, 47);
assert.equal(proof.status, 'PASS');
assert.equal(proof.dataVersion, S.dataVersion);
assert.equal(proof.availablePrefectures, 46);
assert.deepEqual(proof.excludedPrefectures, ['26000']);
const tiles = spawnSync(
  python,
  [
    path.join(code, 'packages/gis/src/geo-analysis/landslide-source-tiles.py'),
    '--work-root',
    spatial,
  ],
  { stdio: 'inherit', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } }
);
assert.equal(tiles.status, 0, 'display tiling failed');
const generatedAt = new Date().toISOString(),
  out = args.includes('--write-local')
    ? path.resolve(opt('--output-root', path.join(repo, '.local/r2')))
    : path.join(work, 'canonical-preview'),
  artifacts = [],
  emit = (key, value, count, areaCode, pretty = false) => {
    put(path.join(out, key), value, pretty);
    const b = fs.readFileSync(path.join(out, key));
    const a = {
      key,
      sha256: sha(b),
      bytes: b.length,
      recordCount: count,
      ...(areaCode ? { areaCode } : {}),
    };
    artifacts.push(a);
    return a;
  };
const prefArtifacts = [],
  sourceArtifacts = [],
  facilityArtifacts = [],
  details = [],
  displayIndex = [];
for (const p of S.prefectures) {
  const pref = p.areaCode.slice(0, 2),
    detail = {
      ...read(path.join(spatial, 'pref', `${pref}.json`)),
      generatedAt,
    };
  assert(core.parseGeoLandslidePrefDetail(detail, p.areaCode));
  details.push(detail);
  prefArtifacts.push(
    emit(
      `${S.r2Root}/pref/${pref}.json`,
      detail,
      detail.meshes.length,
      p.areaCode
    )
  );
  const index = {
    ...read(path.join(spatial, 'source', `${pref}.json`)),
    generatedAt,
  };
  assert.deepEqual(index.source, p);
  const canonicalParts = [];
  for (const part of index.parts ?? []) {
    const file = path.join(spatial, 'source', part.name);
    checked(file, part);
    const key = `${S.r2Root}/source/${part.name}`,
      b = Buffer.from(compact(read(file)));
    canonicalParts.push({ ...part, bytes: b.length, sha256: sha(b) });
    fs.mkdirSync(path.dirname(path.join(out, key)), { recursive: true });
    fs.writeFileSync(path.join(out, key), b);
    sourceArtifacts.push({
      key,
      sha256: sha(b),
      bytes: b.length,
      recordCount: part.records,
      areaCode: p.areaCode,
    });
    displayIndex.push({
      key,
      sha256: sha(b),
      bytes: b.length,
      recordCount: part.records,
      areaCode: p.areaCode,
      bounds: part.bounds,
    });
  }
  index.parts = canonicalParts;
  if (index.proof) index.proof.displayParts = canonicalParts;
  sourceArtifacts.push(
    emit(
      `${S.r2Root}/source/${pref}.json`,
      index,
      index.proof?.rawRecords ?? 0,
      p.areaCode
    )
  );
  const sourceFacility = read(path.join(fac, `${pref}.geojson`));
  facilityArtifacts.push(
    emit(
      `${S.r2Root}/facilities/${pref}.json`,
      {
        schemaVersion: 1,
        slug: S.slug,
        generatedAt,
        areaCode: p.areaCode,
        facilities: sourceFacility.features.map((f, i) => [
          `P05-22:${pref}:${i}`,
          f.properties.P05_001,
          Number(f.properties.P05_002),
          f.properties.P05_003 ?? '',
          ...f.geometry.coordinates,
        ]),
      },
      sourceFacility.features.length,
      p.areaCode
    )
  );
}
sourceArtifacts.push(
  emit(
    `${S.r2Root}/source/index.json`,
    {
      schemaVersion: 1,
      slug: S.slug,
      generatedAt,
      displayOnly: true,
      parts: displayIndex,
    },
    displayIndex.length
  )
);
const rows = details.map((d) => ({
  areaCode: d.areaCode,
  areaName: d.areaName,
  rank: 0,
  values: core.landslideValues(d.summary),
}));
rows.sort(
  (a, b) =>
    (b.values.exposedCenterPopulationShare ?? -1) -
      (a.values.exposedCenterPopulationShare ?? -1) ||
    a.areaCode.localeCompare(b.areaCode)
);
rows.forEach((r, i) => (r.rank = i + 1));
const observed = rows.filter((r) => r.areaCode !== '26000'),
  asc = observed
    .map((r) => r.values.exposedCenterPopulationShare)
    .sort((a, b) => a - b),
  snapshot = {
    ...D,
    generatedAt,
    rows,
    summary: {
      observationCount: 46,
      medianValue: (asc[22] + asc[23]) / 2,
      topAreaCodes: observed.slice(0, 3).map((r) => r.areaCode),
      bottomAreaCodes: observed.slice(-3).map((r) => r.areaCode),
    },
    dataQuality: {
      expectedAreas: 47,
      actualAreas: 47,
      missingAreaCodes: ['26000'],
      inputCounts: {
        a33Archives: 46,
        populationArchives: 47,
        facilityFiles: 47,
        designatedPolygonRecords: proof.sourceProofs.reduce(
          (n, p) => n + p.designatedPolygonRecords,
          0
        ),
        preDesignationExcluded: proof.preDesignationExcluded,
        lineRecordsExcluded: proof.lineRecordsExcluded,
      },
      coverageNote:
        '対象46県計。京都府は商用利用条件により対象外。指定済み面に限る。',
    },
  };
assert(core.parseGeoLandslideSnapshot(snapshot));
for (const d of details)
  core.assertGeoLandslideConservation(
    d,
    rows.find((r) => r.areaCode === d.areaCode)
  );
const aggregate = emit(`${S.r2Root}/item.json`, snapshot, 47, undefined, true),
  outputs = [
    prefArtifacts,
    facilityArtifacts,
    sourceArtifacts,
    prefArtifacts,
    [aggregate],
  ],
  labels = [
    '250m人口メッシュ',
    '公共施設地点',
    '指定済み土砂災害区域面',
    '全国の面包含と県帰属',
    '対象46県の集計',
  ],
  manifest = {
    schemaVersion: 1,
    slug: S.slug,
    generatedAt,
    definitionSha256: LANDSLIDE_EXPOSURE_DEFINITION_SHA256,
    inputs,
    stages: core.LANDSLIDE_STAGES.map((g, i) => ({
      id: g[0],
      label: labels[i],
      kind: g[1],
      role: g[2],
      inputIds: g.slice(3),
      operation: D.method[Math.min(i, D.method.length - 1)],
      outputKeyPattern:
        i === 4
          ? `${S.r2Root}/item.json`
          : `${S.r2Root}/${i === 1 ? 'facilities' : i === 2 ? 'source' : 'pref'}/{prefCode}.json`,
      outputs: outputs[i],
    })),
    aggregate,
    quality: {
      expectedAreas: 47,
      detailAreas: 47,
      conservationChecks: 46,
      sourceRecords: proof.sourceRecords,
      derivedRecords: details.reduce((n, d) => n + d.meshes.length, 0),
      populatedMeshes: details.reduce((n, d) => n + d.meshes.length, 0),
      exposedMeshes: details.reduce(
        (n, d) => n + (d.summary?.exposedRecords ?? 0),
        0
      ),
      maxDetailBytes: Math.max(
        ...[...prefArtifacts, ...facilityArtifacts, ...sourceArtifacts].map(
          (a) => a.bytes
        )
      ),
    },
  };
assert(core.parseGeoLandslideManifest(manifest));
emit(`${S.r2Root}/manifest.json`, manifest, manifest.stages.length);
for (const a of [
  ...prefArtifacts,
  ...facilityArtifacts,
  ...sourceArtifacts,
  aggregate,
]) {
  const value = read(path.join(out, a.key)),
    body =
      (a.key === aggregate.key
        ? JSON.stringify(value, null, 2)
        : JSON.stringify(value)) + '\n';
  assert.equal(sha(body), a.sha256, 'Web serialization SHA');
  assert.equal(Buffer.byteLength(body), a.bytes, 'Web serialization bytes');
}
if (args.includes('--write-local'))
  for (const p of rawMirrors) mirror(p.file, path.join(out, p.key));
put(path.join(work, 'ingester-proof.json'), {
  status: 'PASS',
  generatedAt,
  writeLocal: args.includes('--write-local'),
  out,
  slug: S.slug,
  inputs: inputs.length,
  artifacts: [
    ...artifacts,
    ...sourceArtifacts.filter((a) => !artifacts.some((b) => b.key === a.key)),
  ],
  details: 47,
  available: 46,
  excluded: ['26000'],
  sourceRecords: proof.sourceRecords,
  conservationChecks: 46,
  maxDetailBytes: manifest.quality.maxDetailBytes,
  rawMirrors: args.includes('--write-local') ? rawMirrors : [],
});
console.log(
  JSON.stringify({
    status: 'PASS',
    out,
    inputs: inputs.length,
    details: 47,
    available: 46,
    maxBytes: manifest.quality.maxDetailBytes,
  })
);
