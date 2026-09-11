import { computeNativeTsunamiExposure } from './tsunami-native-reader.mjs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readPopulationZip } from './earthquake-dbf.mjs';
import { TSUNAMI_EXPOSURE_SOURCE as source } from '../../../../packages/data-configs/src/theme-catalog/tsunami-exposure-source.ts';
import {
  DEPTH_BANDS,
  depthBand,
  fixedPopulation,
  quarterMeshCenter,
  pointInPolygonInclusive,
  gridCellKey,
  uniqueIdentity,
  accumulate,
} from './tsunami-spatial.mjs';
const require = createRequire(import.meta.url),
  unzipper = require('unzipper'),
  shapefile = require('shapefile'),
  proj4 = require('proj4');
const sha = (b) => createHash('sha256').update(b).digest('hex');
async function computeInitialTsunamiExposure({
  hazardDir,
  populationDir,
  facilityDir,
  onProgress = () => {},
}) {
  const all = [];
  for (const pref of ['22', '36']) {
    const pm = source.inputs.find((p) => p.id === `population-${pref}`);
    const populationPath = `${populationDir}/${pm.localSourceName}`;
    const pb = await readFile(populationPath);
    assert.equal(sha(pb), pm.sha256);
    assert.equal(pb.length, pm.bytes);
    const points = [],
      ids = new Set();
    let hidden = 0,
      merged = 0;
    const populationEvidence = await readPopulationZip(
      populationPath,
      pref,
      (p, i) => {
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
        if (p.HITOKU2050) hidden++;
        if (p.GASSAN2050) merged++;
      }
    );
    const fb = await readFile(`${facilityDir}/${pref}.geojson`),
      fac = JSON.parse(fb);
    const facilityPin = source.inputs.find(
      (p) => p.id === `facilities-${pref}`
    );
    assert.equal(sha(fb), facilityPin.sha256);
    assert.equal(fb.length, facilityPin.bytes);
    for (const [fidx, f] of fac.features.entries()) {
      assert.equal(f.geometry.type, 'Point');
      const p = f.properties;
      assert.ok(String(p.P05_001).startsWith(pref));
      assert.ok(/^[1-5]$/.test(p.P05_002));
      const id = `P05-22:${pref}:${fidx}`;
      uniqueIdentity(ids, id);
      points.push({
        id,
        kind: 'facility',
        group: +p.P05_002 < 4 ? 'administrative' : 'public-meeting',
        coordinates: f.geometry.coordinates,
        band: -1,
      });
    }
    const filename =
      pref === '22' ? `A40-16_${pref}_GML.zip` : 'tokushima-2025.zip';
    const pin = source.inputs.find((p) => p.id === `hazard-${pref}`),
      body = await readFile(`${hazardDir}/${filename}`);
    assert.equal(sha(body), pin.sha256);
    assert.equal(body.length, pin.bytes);
    const z = await unzipper.Open.file(`${hazardDir}/${filename}`);
    const shp = z.files.find((f) => f.path.endsWith('.shp')),
      dbf = z.files.find((f) => f.path.endsWith('.dbf'));
    const sb = await shp.buffer(),
      db = await dbf.buffer();
    const reader = await shapefile.open(sb, db, { encoding: 'shift_jis' });
    let features = 0,
      depthCounts = {},
      overlapHits = 0;
    let evidence;
    if (pref === '22') {
      const buckets = new Map();
      for (let i = 0; i < points.length; i++) {
        const [x, y] = points[i].coordinates,
          k = `${Math.floor(x * 100)},${Math.floor(y * 100)}`;
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push(i);
      }
      const labels = [
        '0.01m以上 ～ 0.3m未満',
        '0.3m以上 ～ 1m未満',
        '1m以上 ～ 2m未満',
        '2m以上 ～ 3m未満',
        '3m以上 ～ 5m未満',
        '5m以上 ～ 10m未満',
        '10m以上 ～ 20m未満',
        '20m以上',
      ];
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        features++;
        const f = next.value;
        assert.equal(f.properties.A40_002, pref);
        assert.equal(f.properties.A40_001, '静岡県');
        const band = labels.indexOf(f.properties.A40_003);
        assert.ok(band >= 0, 'Unknown A40 depth');
        depthCounts[labels[band]] = (depthCounts[labels[band]] || 0) + 1;
        const polys =
          f.geometry.type === 'Polygon'
            ? [f.geometry.coordinates]
            : f.geometry.type === 'MultiPolygon'
              ? f.geometry.coordinates
              : null;
        assert.ok(polys, 'Unexpected hazard geometry');
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
                  x > 123 &&
                  x < 155 &&
                  y > 20 &&
                  y < 47
              );
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          assert.ok((maxX - minX) * (maxY - minY) < 10);
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
      evidence = {
        operation:
          '250m-code-centre-and-P05-point / boundary-inclusive polygon / same-version maximum depth',
        sourceFeatures: features,
        depthCounts,
        overlapHits,
        sourceShpSha256: sha(sb),
        sourceDbfSha256: sha(db),
      };
    } else {
      const wkt = (
        await z.files.find((f) => f.path.endsWith('.prj')).buffer()
      ).toString();
      assert.ok(wkt.includes('JGD_2000_Japan_Zone_4'));
      const grid = new Map();
      let min = Infinity,
        max = -Infinity;
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        features++;
        const f = next.value;
        assert.equal(f.geometry.type, 'Point');
        assert.deepEqual(Object.keys(f.properties), ['data']);
        const d = f.properties.data;
        depthBand(d);
        min = Math.min(min, d);
        max = Math.max(max, d);
        const [x, y] = f.geometry.coordinates;
        assert.equal((x - 5) % 10, 0);
        assert.equal((y - 5) % 10, 0);
        const key = gridCellKey(x, y);
        assert.ok(!grid.has(key), 'Duplicate 10m source cell');
        grid.set(key, d);
        const b = depthBand(d);
        depthCounts[DEPTH_BANDS[b][0]] =
          (depthCounts[DEPTH_BANDS[b][0]] || 0) + 1;
      }
      let nearBoundary = 0;
      for (const p of points) {
        const xy = proj4(
          '+proj=longlat +ellps=GRS80 +no_defs',
          wkt,
          p.coordinates
        );
        const depth = grid.get(gridCellKey(...xy));
        if (depth !== undefined) p.band = depthBand(depth);
        const dist = Math.min(
          ...xy.map((v) => {
            const r = ((v % 10) + 10) % 10;
            return Math.min(r, 10 - r);
          })
        );
        if (dist < 1) nearBoundary++;
      }
      assert.equal(features, 1589048);
      assert.equal(Math.round(features * 0.0001 * 10) / 10, 158.9);
      evidence = {
        operation:
          '250m-code-centre-and-P05-point / projected 10m half-open source cell',
        sourceFeatures: features,
        depthCounts,
        depthMinimum: min,
        depthMaximum: max,
        sourceGridAreaKm2: features * 0.0001,
        officialRoundedAreaKm2: 158.9,
        officialPdfPage: 5,
        sourceShpSha256: sha(sb),
        sourceDbfSha256: sha(db),
        sourceWkt: wkt,
        coordinateOperation:
          'GRS80 geographic to JGD2000 Japan Zone4 transverse Mercator; no epoch displacement transform',
        pointsWithinOneMetreGridEdge: nearBoundary,
      };
    }
    const result = accumulate(points);
    const expectedPop = points.filter((p) => p.kind === 'population');
    assert.equal(result.total.populationRecords, expectedPop.length);
    assert.equal(
      result.total.population2020Units,
      expectedPop.reduce((s, p) => s + p.p2020, 0)
    );
    assert.equal(
      result.total.population2050Units,
      expectedPop.reduce((s, p) => s + p.p2050, 0)
    );
    assert.equal(
      result.total.administrativeFacilities +
        result.total.publicMeetingFacilities,
      fac.features.length
    );
    const row = {
      areaCode: `${pref}000`,
      areaName: pref === '22' ? '静岡県' : '徳島県',
      scenarioKey:
        pref === '22'
          ? 'shizuoka-ksj2016-level2-envelope'
          : 'tokushima-2025-09-12-level2-envelope',
      ...result,
    };
    const prefArtifact = { schemaVersion: 1, row, points };
    const proof = {
      pref,
      hazard: pin,
      population: {
        ...pm,
        dbf: populationEvidence,
        hiddenRecords: hidden,
        mergedRecords: merged,
      },
      facilities: {
        sha256: sha(fb),
        bytes: fb.length,
        records: fac.features.length,
      },
      evidence,
      conservationChecks: 5,
      row,
      intermediate: prefArtifact,
    };
    all.push(proof);
    onProgress({
      pref,
      hazardFeatures: features,
      total: row.total,
      exposed:
        row.bands.slice(0, 8).reduce((s, b) => s + b.population2020Units, 0) /
        10000,
    });
  }
  return all;
}

export async function computeTsunamiExposure(options) {
  const initial = await computeInitialTsunamiExposure(options);
  const additions = await computeNativeTsunamiExposure(options);
  return [...initial, ...additions].sort((a, b) =>
    a.pref.localeCompare(b.pref)
  );
}
