import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
const root = process.env.SNOW_CODE_ROOT ?? process.cwd();
const {
  parseGeoSnowPrefDetail: parse,
  parseGeoSnowManifest,
  snowMeshBounds,
  assertGeoSnowConservation,
} = await import(
  pathToFileURL(
    path.join(root, 'packages/gis/src/geo-analysis/snow-designation.ts')
  ).href
);
const copy = (x) => structuredClone(x);
function fixture() {
  return {
    schemaVersion: 1,
    slug: 'population-snow-designation',
    dataVersion: 'A22-16_m250r6-24_PTN2020_center-v1',
    generatedAt: '2026-09-11T00:00:00Z',
    areaCode: '13000',
    areaName: '東京都',
    populationScale: 10000,
    cellColumns: [
      'meshCode',
      'municipalityCode',
      'population2020Scaled',
      'centerClass',
      'sensitivityFlags',
    ],
    classes: [
      'center-outside-input-polygon',
      'regular-only',
      'special-heavy-snow',
    ],
    flagBits: {
      totalLower: 1,
      totalUpper: 2,
      specialLower: 4,
      specialUpper: 8,
      totalBoundaryCell: 16,
      centerOnEdge: 32,
    },
    meshes: [[5339452511, 13101, 12500, 0, 0]],
    summary: {
      populationScaled: [12500, 0, 0],
      lowerScaled: [0, 0],
      upperScaled: [0, 0],
      boundaryScaled: [0, 0],
      exactEdgeCount: 0,
      populationTotalScaled: 12500,
      populatedRecords: 1,
      rawRecords: 2,
      zeroRecords: 1,
      regularOnlyAreaKm2: 0,
      specialAreaKm2: 0,
      designatedAreaKm2: 0,
    },
  };
}
test('strict valid county and positive fractional population', () =>
  assert(parse(fixture(), '13000')));
for (const [name, change] of [
  ['unknown root', (x) => (x.unexpected = 1)],
  ['source edition', (x) => (x.dataVersion = 'A22s-12')],
  ['population year', (x) => (x.populationYear = 2021)],
  ['wrong county', (x) => (x.areaCode = '14000')],
  ['wrong county name', (x) => (x.areaName = '神奈川県')],
  ['wrong owner', (x) => (x.meshes[0][1] = 14101)],
  ['wrong mesh', (x) => (x.meshes[0][0] = 5339452510)],
  ['duplicate ownership', (x) => x.meshes.push(x.meshes[0])],
  ['negative population', (x) => (x.meshes[0][2] = -1)],
  ['missing population', (x) => (x.meshes[0][2] = null)],
  ['changed population', (x) => x.meshes[0][2]++],
  ['unknown class', (x) => (x.meshes[0][3] = 3)],
  ['impossible inclusion bit', (x) => (x.meshes[0][4] = 1)],
  ['false edge outside', (x) => (x.meshes[0][4] = 32)],
  ['changed denominator', (x) => x.summary.populationTotalScaled++],
  ['changed raw count', (x) => x.summary.rawRecords++],
  ['lost zero rows', (x) => (x.summary.zeroRecords = 0)],
  ['nonfinite area', (x) => (x.summary.designatedAreaKm2 = Infinity)],
  ['area nonconservation', (x) => (x.summary.regularOnlyAreaKm2 = 1)],
  ['unknown summary', (x) => (x.summary.count = 1)],
  [
    'unapproved positive designated area',
    (x) => {
      x.summary.regularOnlyAreaKm2 = 1;
      x.summary.designatedAreaKm2 = 1;
    },
  ],
])
  test(`reject ${name}`, () => {
    const x = fixture();
    change(x);
    assert.equal(parse(x, '13000'), null);
  });
test('quarter grid dimensions', () => {
  const b = snowMeshBounds(5339452511);
  assert(b);
  assert(Math.abs(b[2] - b[0] - 1 / 320) < 1e-12);
  assert(Math.abs(b[3] - b[1] - 1 / 480) < 1e-12);
});
const artifactRoot = process.env.GEO_ARTIFACT_ROOT;
if (artifactRoot) {
  const base = path.join(artifactRoot, 'app/geo/population-snow-designation'),
    load = (name) => JSON.parse(fs.readFileSync(path.join(base, name), 'utf8'));
  const manifest = load('manifest.json'),
    item = load('item.json');
  test('actual manifest source coverage and graph', () =>
    assert(parseGeoSnowManifest(manifest)));
  for (const [name, change] of [
    ['definition hash', (x) => (x.definitionSha256 = '0'.repeat(64))],
    ['missing source', (x) => x.inputs.pop()],
    ['wrong source hash', (x) => (x.inputs[0].sha256 = '0'.repeat(64))],
    [
      'source classified context',
      (x) => {
        x.inputs[0].role = 'context-only';
        x.inputs[0].usedInCalculation = false;
      },
    ],
    ['A22s not admissible', (x) => (x.inputs[47].datasetId = 'A22s')],
    ['missing spatial stage', (x) => x.stages.splice(2, 1)],
    [
      'changed stage parents',
      (x) => (x.stages[2].inputIds = ['population-mesh']),
    ],
    ['county detail omission', (x) => x.stages[0].outputs.pop()],
    [
      'inconsistent shared artifact',
      (x) => (x.stages[2].outputs[0].sha256 = '0'.repeat(64)),
    ],
    ['oversize artifact', (x) => (x.quality.maxDetailBytes = 5_000_001)],
  ])
    test(`actual reject ${name}`, () => {
      const x = copy(manifest);
      change(x);
      assert.equal(parseGeoSnowManifest(x), null);
    });
  test('all 47 details, output hashes, exact item values and national integer sum', () => {
    let national = 0;
    for (const artifact of [
      ...manifest.stages[0].outputs,
      ...manifest.stages[1].outputs,
      manifest.aggregate,
    ]) {
      const b = fs.readFileSync(path.join(artifactRoot, artifact.key));
      assert.equal(b.length, artifact.bytes);
      assert.equal(
        crypto.createHash('sha256').update(b).digest('hex'),
        artifact.sha256
      );
    }
    for (const row of item.rows) {
      const d = load(`pref/${row.areaCode.slice(0, 2)}.json`);
      assert(parse(d, row.areaCode));
      assertGeoSnowConservation(d, row);
      national += d.summary.populationTotalScaled;
    }
    assert.equal(
      national,
      load('verification.json').national.populationTotalScaled
    );
  });
  test('actual altered county count rejected by its SHA even if summary is adjusted', () => {
    const a = manifest.stages[0].outputs[0],
      d = load('pref/01.json');
    d.meshes[0][2]++;
    const digest = crypto
      .createHash('sha256')
      .update(JSON.stringify(d) + '\n')
      .digest('hex');
    assert.notEqual(digest, a.sha256);
  });
}
