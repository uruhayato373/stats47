import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { fetchPrefectures } from '@stats47/area';
import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';
import { feature } from 'topojson-client';
import type { Topology, GeometryObject } from 'topojson-specification';
import unzipper from 'unzipper';
import {
  PUBLIC_FACILITY_INPUTS,
  PUBLIC_FACILITY_SOURCE_URL,
  PUBLIC_FACILITY_ARCHIVE_SHA256,
} from '../../geo-analysis/public-facility-inputs';
import { PUBLIC_FACILITY_DEFINITION } from '../../geo-analysis/public-facility-definition';
import {
  PUBLIC_FACILITY_BANDS,
  createPublicFacilitySearch,
  summarizePublicFacilityMeshes,
  publicFacilityAggregateValues,
  validatePublicFacilityDetail,
  publicFacilityDistanceMeters,
  publicFacilityGroup,
  assertPublicFacilityConservation,
} from '../../geo-analysis/public-facility-access';
import {
  mesh1000BoundsFromCode,
  rankAreaRows,
  median,
} from '../../geo-analysis/geo-analysis-core';
import type {
  GeoAnalysisEvidenceManifest,
  GeoAnalysisInputEvidence,
  GeoAnalysisArtifactEvidence,
  GeoAnalysisSnapshot,
  GeoPublicFacilityPoint,
  GeoPublicFacilityMesh,
  GeoPublicFacilityPrefDetail,
} from '../../geo-analysis/snapshot';
import { GIS_DATASETS_BY_ID } from '../datasets';
import { assertKsjPublicStructuredOutputAllowed } from '../license-policy';

async function main() {
  const { values: options } = parseArgs({
    options: {
      'source-dir': {
        type: 'string',
        default: '.local/verification/themes/public-facility-inputs',
      },
      'output-root': { type: 'string', default: '.local/r2' },
      download: { type: 'boolean', default: false },
    },
  });
  const sourceDir = resolve(options['source-dir']!),
    outputRoot = resolve(options['output-root']!),
    slug = 'population-public-facility-access',
    generatedAt = new Date().toISOString();
  const sha = (bytes: Buffer | string) =>
    createHash('sha256').update(bytes).digest('hex');
  const ensure = (value: unknown, reason: string) => {
    if (!value) throw new Error(reason);
  };
  const outputs = new Map<
    string,
    { bytes: Buffer; recordCount: number; areaCode?: string }
  >();
  const put = (
    key: string,
    value: unknown,
    recordCount: number,
    areaCode?: string
  ): GeoAnalysisArtifactEvidence => {
    const bytes = Buffer.from(
      `${JSON.stringify(value, null, key.endsWith('/item.json') ? 2 : undefined)}\n`
    );
    outputs.set(key, { bytes, recordCount, areaCode });
    return {
      key,
      bytes: bytes.length,
      sha256: sha(bytes),
      recordCount,
      ...(areaCode ? { areaCode } : {}),
    };
  };
  async function fetchBytes(url: string) {
    const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
    if (!response.ok) throw new Error(`Source HTTP ${response.status}: ${url}`);
    return Buffer.from(await response.arrayBuffer());
  }
  async function checked(
    path: string,
    expected: { bytes: number; sha256: string }
  ) {
    const bytes = await readFile(path);
    ensure(
      bytes.length === expected.bytes && sha(bytes) === expected.sha256,
      `Input SHA/bytes mismatch: ${path}`
    );
    return bytes;
  }
  await mkdir(sourceDir, { recursive: true });
  let acquisition: Record<string, string> = {};
  try {
    acquisition = JSON.parse(
      await readFile(resolve(sourceDir, 'acquisition.json'), 'utf8')
    );
  } catch {}
  if (options.download) {
    const missing = [];
    for (const input of PUBLIC_FACILITY_INPUTS) {
      try {
        await checked(
          resolve(sourceDir, `${input.pref}.geojson`),
          input.facilities
        );
      } catch {
        missing.push(input);
      }
    }
    if (missing.length) {
      const bytes = await fetchBytes(PUBLIC_FACILITY_SOURCE_URL);
      ensure(
        sha(bytes) === PUBLIC_FACILITY_ARCHIVE_SHA256,
        'P05 original ZIP changed'
      );
      const outer = await unzipper.Open.buffer(bytes);
      for (const input of missing) {
        const member = outer.files.find((f: { path: string }) =>
          f.path.endsWith(`P05-22_${input.pref}_GML.zip`)
        );
        ensure(member, `Missing P05 county ${input.pref}`);
        const inner = await unzipper.Open.buffer(await member!.buffer());
        const geo = inner.files.find((f: { path: string }) =>
          f.path.endsWith(`P05-22_${input.pref}.geojson`)
        );
        ensure(geo, 'Missing P05 GeoJSON');
        const body = await geo!.buffer();
        ensure(
          body.length === input.facilities.bytes &&
            sha(body) === input.facilities.sha256,
          'P05 county body changed'
        );
        await writeFile(resolve(sourceDir, `${input.pref}.geojson`), body);
        acquisition[`P05/${input.pref}`] = new Date().toISOString();
      }
    }
    let cursor = 0;
    await Promise.all(
      Array.from({ length: 3 }, async () => {
        while (cursor < PUBLIC_FACILITY_INPUTS.length) {
          const input = PUBLIC_FACILITY_INPUTS[cursor++];
          const file = resolve(sourceDir, `${input.pref}.topojson`);
          try {
            await checked(file, input.population);
            continue;
          } catch {}
          const bytes = await fetchBytes(
            `https://storage.stats47.jp/gis/mlit-ksj/mesh1000r6/24/${input.pref}.topojson`
          );
          ensure(
            bytes.length === input.population.bytes &&
              sha(bytes) === input.population.sha256,
            'Population input changed'
          );
          await writeFile(file, bytes);
          acquisition[`mesh1000r6/${input.pref}`] = new Date().toISOString();
        }
      })
    );
    await writeFile(
      resolve(sourceDir, 'acquisition.json'),
      JSON.stringify(acquisition, null, 2)
    );
  }
  for (const dataId of ['P05', 'mesh1000r6']) {
    const dataset = GIS_DATASETS_BY_ID.get(dataId);
    ensure(dataset, `Unknown dataset ${dataId}`);
    assertKsjPublicStructuredOutputAllowed({
      dataId,
      license: dataset!.license,
      output: `app/geo/${slug}/`,
    });
  }
  const points: GeoPublicFacilityPoint[] = [],
    inputs: GeoAnalysisInputEvidence[] = [],
    facilitySources: GeoAnalysisArtifactEvidence[] = [];
  for (const input of PUBLIC_FACILITY_INPUTS) {
    const bytes = await checked(
      resolve(sourceDir, `${input.pref}.geojson`),
      input.facilities
    );
    const json = JSON.parse(bytes.toString());
    ensure(
      json.type === 'FeatureCollection' && Array.isArray(json.features),
      'Invalid facility source'
    );
    const key = `gis/mlit-ksj/P05/22/${input.pref}.geojson`;
    outputs.set(key, { bytes, recordCount: json.features.length });
    inputs.push({
      layerId: 'ksj-p05-public-facility-point',
      datasetId: 'P05',
      version: '22',
      key,
      sha256: sha(bytes),
      bytes: bytes.length,
      geometry: 'point',
      role: 'calculation-input',
      usedInCalculation: true,
    });
    const local: GeoPublicFacilityPoint[] = [];
    for (const [index, f] of json.features.entries()) {
      ensure(f.geometry?.type === 'Point', 'Non-point facility');
      const p = f.properties;
      ensure(
        String(p.P05_001).startsWith(input.pref),
        'Facility county mismatch'
      );
      const point: GeoPublicFacilityPoint = [
        points.length,
        `P05-22:${input.pref}:${index}`,
        p.P05_001,
        p.P05_002,
        p.P05_003,
        f.geometry.coordinates[0],
        f.geometry.coordinates[1],
      ];
      points.push(point);
      local.push(point);
    }
    facilitySources.push(
      put(
        `app/geo/${slug}/source/${input.pref}.json`,
        {
          schemaVersion: 1,
          slug,
          generatedAt,
          areaCode: `${input.pref}000`,
          facilities: local,
        },
        local.length,
        `${input.pref}000`
      )
    );
  }
  ensure(points.length === 79532, 'Facility source set drift');
  const search = createPublicFacilitySearch(points),
    prefArtifacts: GeoAnalysisArtifactEvidence[] = [],
    details: GeoPublicFacilityPrefDetail[] = [],
    nearestChecks: unknown[] = [];
  for (const input of PUBLIC_FACILITY_INPUTS) {
    const bytes = await checked(
        resolve(sourceDir, `${input.pref}.topojson`),
        input.population
      ),
      topology = JSON.parse(bytes.toString()) as Topology;
    const key = `gis/mlit-ksj/mesh1000r6/24/${input.pref}.topojson`;
    inputs.push({
      layerId: 'ipss-population-mesh-1km',
      datasetId: 'mesh1000r6',
      version: '24',
      key,
      sha256: sha(bytes),
      bytes: bytes.length,
      geometry: 'mesh',
      role: 'calculation-input',
      usedInCalculation: true,
    });
    const meshes: GeoPublicFacilityMesh[] = [],
      used = new Set(
        points.filter((p) => p[2].startsWith(input.pref)).map((p) => p[0])
      );
    for (const object of Object.values(topology.objects)) {
      const fc = feature(topology, object as GeometryObject);
      const features = fc.type === 'FeatureCollection' ? fc.features : [fc];
      for (const f of features) {
        const props = (f.properties ?? {}) as Record<string, unknown>,
          id = String(props.MESH_ID ?? ''),
          bounds = mesh1000BoundsFromCode(id);
        ensure(bounds, `Invalid mesh ${id}`);
        ensure(
          String(props.SHICODE).startsWith(input.pref),
          'Population county identity'
        );
        const value = (name: string) => {
          const raw = props[name];
          ensure(
            raw !== null &&
              raw !== undefined &&
              raw !== '' &&
              (typeof raw === 'string' || typeof raw === 'number'),
            `Missing population ${id}/${name}`
          );
          const n = Number(raw);
          ensure(Number.isFinite(n) && n >= 0, 'Invalid population');
          return n;
        };
        const p2020 = value('PTN_2020'),
          p2050 = value('PTN_2050');
        if (p2020 + p2050 === 0) continue;
        const lon =
            (Math.round(bounds![0] * 1e6) + Math.round(bounds![2] * 1e6)) / 2e6,
          lat =
            (Math.round(bounds![1] * 1e6) + Math.round(bounds![3] * 1e6)) / 2e6;
        const a = search(lon, lat, 'administrative'),
          b = search(lon, lat, 'meeting');
        used.add(a.point[0]);
        used.add(b.point[0]);
        meshes.push([
          id,
          lon,
          lat,
          p2020,
          p2050,
          a.point[0],
          a.distanceMeters,
          a.bandIndex,
          b.point[0],
          b.distanceMeters,
          b.bandIndex,
        ]);
      }
    }
    const facilities = points.filter((p) => used.has(p[0])),
      areaCode = `${input.pref}000`,
      pref = fetchPrefectures().find((p) => p.prefCode === areaCode);
    ensure(pref, 'Unknown county');
    const detail: GeoPublicFacilityPrefDetail = {
      schemaVersion: 1,
      slug,
      generatedAt,
      areaCode,
      areaName: pref!.prefName,
      bands: PUBLIC_FACILITY_BANDS,
      meshes,
      facilities,
      summary: summarizePublicFacilityMeshes(meshes, facilities, areaCode),
    };
    validatePublicFacilityDetail(detail);
    for (const meshIndex of [
      0,
      Math.floor(meshes.length / 2),
      meshes.length - 1,
    ])
      for (const [group, offset] of [
        ['administrative', 5],
        ['meeting', 8],
      ] as const) {
        const mesh = meshes[meshIndex];
        let minimum = Infinity;
        for (const p of points) {
          if (publicFacilityGroup(p) === group)
            minimum = Math.min(
              minimum,
              publicFacilityDistanceMeters([mesh[1], mesh[2]], [p[5], p[6]])
            );
        }
        ensure(
          Math.abs(minimum - (mesh[offset + 1] as number)) < 1e-5,
          'Nearest/brute force mismatch'
        );
        nearestChecks.push({
          areaCode,
          meshId: mesh[0],
          group,
          differenceMeters: Math.abs(minimum - (mesh[offset + 1] as number)),
        });
      }
    const evidence = put(
      `app/geo/${slug}/pref/${input.pref}.json`,
      detail,
      meshes.length,
      areaCode
    );
    ensure(evidence.bytes <= 5000000, 'County detail exceeds 5MB');
    prefArtifacts.push(evidence);
    details.push(detail);
    console.log(
      `Public facility access ${input.pref}: ${meshes.length} meshes`
    );
  }
  ensure(
    details.length === 47 &&
      details.reduce((sum, d) => sum + d.meshes.length, 0) === 177791,
    'Population cohort changed'
  );
  const rows = rankAreaRows(
    details.map((d) => ({
      areaCode: d.areaCode,
      areaName: d.areaName,
      values: publicFacilityAggregateValues(d),
    })),
    PUBLIC_FACILITY_DEFINITION.primaryMetricKey
  );
  for (const detail of details)
    assertPublicFacilityConservation(
      detail,
      rows.find((r) => r.areaCode === detail.areaCode)
    );
  const snapshot: GeoAnalysisSnapshot = {
    ...PUBLIC_FACILITY_DEFINITION,
    generatedAt,
    rows,
    summary: {
      observationCount: 47,
      medianValue: median(
        rows.map((r) =>
          Number(r.values[PUBLIC_FACILITY_DEFINITION.primaryMetricKey])
        )
      ),
      topAreaCodes: rows.slice(0, 3).map((r) => r.areaCode),
      bottomAreaCodes: rows.slice(-3).map((r) => r.areaCode),
    },
    dataQuality: {
      expectedAreas: 47,
      actualAreas: 47,
      missingAreaCodes: [],
      inputCounts: {
        populationMeshes: 177791,
        facilityPoints: points.length,
        administrativeFacilityPoints: points.filter(
          (p) => publicFacilityGroup(p) === 'administrative'
        ).length,
        meetingFacilityPoints: points.filter(
          (p) => publicFacilityGroup(p) === 'meeting'
        ).length,
      },
      coverageNote:
        '47県の固定版原典をSHA照合し、メッシュ番号から復元した正規格子の中心で距離を計算。施設の業務・開館時間・利用資格は判定しません。',
    },
  };
  const aggregate = put(`app/geo/${slug}/item.json`, snapshot, 47),
    definition = GEO_ANALYSES.find((d: { slug: string }) => d.slug === slug);
  ensure(definition, 'Missing authored analysis definition');
  const manifest: GeoAnalysisEvidenceManifest = {
    schemaVersion: 1,
    slug,
    generatedAt,
    definitionSha256: sha(JSON.stringify(definition)),
    inputs,
    aggregate,
    stages: [
      {
        id: 'population-mesh',
        label: '1km人口メッシュ',
        kind: 'source',
        role: 'calculation-input',
        inputIds: ['ipss-population-mesh-1km'],
        operation: 'MESH_IDから正規格子を復元し2020/2050人口を保持',
        outputKeyPattern: `app/geo/${slug}/pref/{NN}.json#meshes`,
        outputs: prefArtifacts,
      },
      {
        id: 'public-facility-points',
        label: '役場等・公的集会施設の原典地点',
        kind: 'source',
        role: 'calculation-input',
        inputIds: ['ksj-p05-public-facility-point'],
        operation: 'P05の全県内施設を5区分・地点・原典順IDで保持',
        outputKeyPattern: `app/geo/${slug}/source/{NN}.json#facilities`,
        outputs: facilitySources,
      },
      {
        id: 'nearest-facility-distance',
        label: '最寄り施設と距離帯',
        kind: 'spatial-operation',
        role: 'derived',
        inputIds: ['population-mesh', 'public-facility-points'],
        operation: '全国2群のKD木最近隣検索、大円距離、5距離帯への排他分類',
        outputKeyPattern: `app/geo/${slug}/pref/{NN}.json#meshes`,
        outputs: prefArtifacts,
      },
      {
        id: 'distance-band-population',
        label: '県別・距離帯別人口',
        kind: 'aggregate',
        role: 'aggregate',
        inputIds: ['nearest-facility-distance'],
        operation: '2施設群と2人口年をそれぞれ独立集計し人口保存則を照合',
        outputKeyPattern: `app/geo/${slug}/item.json`,
        outputs: [aggregate],
      },
    ],
    quality: {
      expectedAreas: 47,
      detailAreas: 47,
      conservationChecks: 47,
      sourceRecords: 177791 + points.length,
      derivedRecords: 177791,
      populatedMeshes: 177791,
      maxDetailBytes: Math.max(...prefArtifacts.map((e) => e.bytes)),
    },
  };
  put(`app/geo/${slug}/manifest.json`, manifest, 4);
  put(
    `app/geo/${slug}/sources.json`,
    {
      schemaVersion: 1,
      slug,
      generatedAt,
      archive: {
        url: PUBLIC_FACILITY_SOURCE_URL,
        sha256: PUBLIC_FACILITY_ARCHIVE_SHA256,
      },
      sources: inputs.map((i) => ({
        ...i,
        url:
          i.datasetId === 'P05'
            ? PUBLIC_FACILITY_SOURCE_URL
            : `https://storage.stats47.jp/${i.key}`,
        acquiredAt:
          acquisition[
            `${i.datasetId}/${i.key.split('/').slice(-1)[0].slice(0, 2)}`
          ] ?? null,
        verifiedAt: generatedAt,
      })),
    },
    inputs.length
  );
  // All semantic and source checks pass before replacing any delivery body.
  for (const [key, { bytes }] of outputs) {
    const target = resolve(outputRoot, key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
  const report = {
    status: 'PASS',
    generatedAt,
    slug,
    prefectures: 47,
    populationMeshes: 177791,
    facilities: points.length,
    conservationChecks: 47,
    bandPopulationChecks: 282,
    bruteForceNearestChecks: nearestChecks.length,
    nearestChecks,
    files: [...outputs].map(([key, { bytes }]) => ({
      key,
      bytes: bytes.length,
      sha256: sha(bytes),
    })),
    remoteWrites: 0,
  };
  await mkdir('.local/verification/themes', { recursive: true });
  await writeFile(
    '.local/verification/themes/public-facility-access-source.json',
    JSON.stringify(report, null, 2) + '\n'
  );
  console.log(
    JSON.stringify({
      status: report.status,
      files: report.files.length,
      bruteForceNearestChecks: report.bruteForceNearestChecks,
      remoteWrites: 0,
    })
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
