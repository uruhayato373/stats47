import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { TSUNAMI_EXPOSURE_SOURCE as source } from '../../../../packages/data-configs/src/theme-catalog/tsunami-exposure-source.ts';
import { readPopulationZip } from './earthquake-dbf.mjs';
import {
  fixedPopulation,
  quarterMeshCenter,
  uniqueIdentity,
  pointInPolygonInclusive,
} from './tsunami-spatial.mjs';
const require = createRequire(import.meta.url),
  unzipper = require('unzipper'),
  shapefile = require('shapefile');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const countKeys = [
  'populationRecords',
  'population2020Units',
  'population2050Units',
  'administrativeFacilities',
  'publicMeetingFacilities',
];
const nativeCount = (scenario) =>
  scenario.bands.filter((b) => b.key.startsWith('native-')).length;
export function validateNativePoint(point, scenario, ids) {
  assert.ok(point && ['population', 'facility'].includes(point.kind));
  assert.deepEqual(
    Object.keys(point).sort(),
    (point.kind === 'population'
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
      : ['id', 'kind', 'municipality', 'group', 'coordinates', 'band']
    ).sort()
  );
  uniqueIdentity(ids, point.id);
  assert.ok(
    typeof point.municipality === 'string' &&
      /^\d{5}$/.test(point.municipality) &&
      point.municipality.startsWith(scenario.areaCode.slice(0, 2))
  );
  assert.ok(
    Array.isArray(point.coordinates) &&
      point.coordinates.length === 2 &&
      point.coordinates.every(Number.isFinite) &&
      point.coordinates[0] > 122 &&
      point.coordinates[0] < 155 &&
      point.coordinates[1] > 20 &&
      point.coordinates[1] < 47
  );
  const n = nativeCount(scenario);
  assert.ok(
    Number.isInteger(point.band) &&
      point.band >= (scenario.coverageMunicipalities ? -2 : -1) &&
      point.band < n
  );
  if (scenario.coverageMunicipalities)
    assert.equal(
      point.band === -2,
      !scenario.coverageMunicipalities.includes(point.municipality),
      'Unmodelled Tokyo area must remain separate'
    );
  if (point.kind === 'population') {
    assert.equal(
      point.id,
      `${scenario.areaCode.slice(0, 2)}:${point.municipality}:${point.meshCode}`
    );
    assert.deepEqual(point.coordinates, quarterMeshCenter(point.meshCode));
    for (const key of ['p2020', 'p2050'])
      assert.ok(Number.isSafeInteger(point[key]) && point[key] >= 0);
  } else {
    assert.ok(point.id.startsWith(`P05-22:${scenario.areaCode.slice(0, 2)}:`));
    assert.ok(['administrative', 'public-meeting'].includes(point.group));
  }
}
export function accumulateNative(points, scenario) {
  const bands = scenario.bands.map((b) => ({
      key: b.key,
      ...Object.fromEntries(countKeys.map((k) => [k, 0])),
    })),
    n = nativeCount(scenario);
  for (const point of points) {
    const index =
      point.band >= 0 ? point.band : n + (point.band === -1 ? 0 : 1);
    assert.ok(bands[index], 'Unknown coverage band');
    const b = bands[index];
    if (point.kind === 'population') {
      b.populationRecords++;
      b.population2020Units += point.p2020;
      b.population2050Units += point.p2050;
    } else
      b[
        point.group === 'administrative'
          ? 'administrativeFacilities'
          : 'publicMeetingFacilities'
      ]++;
  }
  const total = Object.fromEntries(
    countKeys.map((k) => [k, bands.reduce((sum, b) => sum + b[k], 0)])
  );
  for (const v of Object.values(total))
    assert.ok(Number.isSafeInteger(v) && v >= 0);
  return { bands, total };
}
export function assertDisjointBounds(bounds) {
  for (let i = 0; i < bounds.length; i++)
    for (let j = 0; j < i; j++)
      assert.ok(
        bounds[i][2] < bounds[j][0] ||
          bounds[j][2] < bounds[i][0] ||
          bounds[i][3] < bounds[j][1] ||
          bounds[j][3] < bounds[i][1],
        'Separate coastal input extents must be disjoint'
      );
}
export async function computeNativeTsunamiExposure({
  hazardDir,
  populationDir,
  facilityDir,
  onProgress = () => {},
}) {
  const all = [];
  for (const scenario of source.scenarios.filter(
    (s) => !['22000', '36000'].includes(s.areaCode)
  )) {
    const pref = scenario.areaCode.slice(0, 2),
      points = [],
      ids = new Set();
    const populationPin = source.inputs.find(
        (p) => p.id === `population-${pref}`
      ),
      populationPath = `${populationDir}/${populationPin.localSourceName}`,
      raw = await readFile(populationPath);
    assert.equal(sha(raw), populationPin.sha256);
    assert.equal(raw.length, populationPin.bytes);
    const populationEvidence = await readPopulationZip(
      populationPath,
      pref,
      (p) => {
        const id = `${pref}:${p.SHICODE}:${p.MESH_ID}`;
        uniqueIdentity(ids, id);
        points.push({
          id,
          kind: 'population',
          meshCode: p.MESH_ID,
          municipality: p.SHICODE,
          coordinates: quarterMeshCenter(p.MESH_ID),
          p2020: fixedPopulation(p.PTN_2020),
          p2050: fixedPopulation(p.PTN_2050),
          band: -1,
        });
      }
    );
    const facilityPin = source.inputs.find(
        (p) => p.id === `facilities-${pref}`
      ),
      fb = await readFile(`${facilityDir}/${facilityPin.localSourceName}`);
    assert.equal(sha(fb), facilityPin.sha256);
    assert.equal(fb.length, facilityPin.bytes);
    const fac = JSON.parse(fb);
    for (const [i, f] of fac.features.entries()) {
      assert.equal(f.geometry.type, 'Point');
      const p = f.properties;
      assert.ok(p.P05_001.startsWith(pref));
      assert.ok(/^[1-5]$/.test(p.P05_002));
      const id = `P05-22:${pref}:${i}`;
      uniqueIdentity(ids, id);
      points.push({
        id,
        kind: 'facility',
        municipality: p.P05_001,
        group: +p.P05_002 < 4 ? 'administrative' : 'public-meeting',
        coordinates: f.geometry.coordinates,
        band: -1,
      });
    }
    const buckets = new Map();
    for (const [i, p] of points.entries()) {
      const [x, y] = p.coordinates,
        k = `${Math.floor(x * 100)},${Math.floor(y * 100)}`;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(i);
    }
    const labels = scenario.bands
      .filter((b) => b.key.startsWith('native-'))
      .map((b) => b.label);
    let features = 0,
      overlapHits = 0;
    const depthCounts = {},
      sourceBounds = [];
    for (const inputId of scenario.inputIds) {
      const pin = source.inputs.find((p) => p.id === inputId),
        path = `${hazardDir}/${pin.localSourceName}`,
        body = await readFile(path);
      assert.equal(sha(body), pin.sha256);
      assert.equal(body.length, pin.bytes);
      const archive = await unzipper.Open.file(path),
        shp = archive.files.find((f) => f.path.endsWith('.shp')),
        dbf = archive.files.find((f) => f.path.endsWith('.dbf'));
      assert.ok(shp && dbf);
      const sb = await shp.buffer();
      assert.equal(sb.readInt32LE(32), 5);
      sourceBounds.push(
        [36, 44, 52, 60].map((offset) => sb.readDoubleLE(offset))
      );
      const reader = await shapefile.open(sb, await dbf.buffer(), {
        encoding: 'shift_jis',
      });
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        features++;
        const f = next.value;
        assert.equal(String(f.properties.A40_002).padStart(2, '0'), pref);
        const label = f.properties.A40_003,
          band = labels.indexOf(label);
        assert.ok(band >= 0, 'Unknown native depth class');
        depthCounts[label] = (depthCounts[label] || 0) + 1;
        const polys =
          f.geometry?.type === 'Polygon'
            ? [f.geometry.coordinates]
            : f.geometry?.type === 'MultiPolygon'
              ? f.geometry.coordinates
              : null;
        assert.ok(polys, 'Missing polygon');
        for (const rings of polys) {
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          for (const ring of rings)
            for (const [x, y] of ring) {
              assert.ok(
                Number.isFinite(x) &&
                  Number.isFinite(y) &&
                  x > 122 &&
                  x < 155 &&
                  y > 20 &&
                  y < 47
              );
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          for (let x = Math.floor(minX * 100); x <= Math.floor(maxX * 100); x++)
            for (
              let y = Math.floor(minY * 100);
              y <= Math.floor(maxY * 100);
              y++
            )
              for (const i of buckets.get(`${x},${y}`) || []) {
                const p = points[i];
                if (pointInPolygonInclusive(p.coordinates, rings)) {
                  if (p.band >= 0) overlapHits++;
                  p.band = Math.max(p.band, band);
                }
              }
        }
      }
    }
    if (sourceBounds.length > 1) assertDisjointBounds(sourceBounds);
    if (scenario.coverageMunicipalities)
      for (const point of points)
        if (!scenario.coverageMunicipalities.includes(point.municipality)) {
          assert.equal(
            point.band,
            -1,
            'Hazard extends outside declared island municipalities'
          );
          point.band = -2;
        }
    const checkedIds = new Set();
    for (const point of points)
      validateNativePoint(point, scenario, checkedIds);
    assert.equal(features, scenario.hazardRecords);
    const result = accumulateNative(points, scenario),
      pop = points.filter((p) => p.kind === 'population');
    assert.equal(result.total.populationRecords, pop.length);
    for (const yr of [2020, 2050])
      assert.equal(
        result.total[`population${yr}Units`],
        pop.reduce((s, p) => s + p[`p${yr}`], 0)
      );
    assert.equal(
      result.total.administrativeFacilities,
      points.filter(
        (p) => p.kind === 'facility' && p.group === 'administrative'
      ).length
    );
    assert.equal(
      result.total.publicMeetingFacilities,
      points.filter(
        (p) => p.kind === 'facility' && p.group === 'public-meeting'
      ).length
    );
    const row = {
        areaCode: scenario.areaCode,
        areaName: source.coverage.find((c) => c.areaCode === scenario.areaCode)
          .areaName,
        scenarioKey: scenario.key,
        ...result,
      },
      intermediate = { schemaVersion: 1, row, points },
      evidence = {
        sourceFeatures: features,
        depthCounts,
        overlapHits,
        sourceBounds,
        operation:
          '250m-code-centre/P05 point-in-polygon; maximum original native class; disjoint coastal files only; explicit unmodelled coverage',
      };
    all.push({
      pref,
      row,
      intermediate,
      evidence,
      population: { ...populationPin, dbf: populationEvidence },
      facilities: { ...facilityPin, records: fac.features.length },
      conservationChecks: 5,
    });
    onProgress({ pref, hazardFeatures: features, total: row.total });
  }
  return all;
}
