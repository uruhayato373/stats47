import { createHash } from 'node:crypto';

import {
  FLOOD_ARCHIVES,
  type GeoAnalysisEvidenceManifest,
  type GeoAnalysisInputEvidence,
} from '@stats47/gis';

import type { GeoCrossAnalysisSlug } from '../geo-cross-analysis';

export const GENERATED_AT = '2026-09-05T00:00:00.000Z';
const codes = Array.from({ length: 47 }, (_, i) =>
  String(i + 1).padStart(2, '0')
);
export function artifact(key: string, value?: unknown, pretty = false) {
  const body = `${JSON.stringify(value ?? {}, null, pretty ? 2 : undefined)}\n`;
  return {
    key,
    sha256: createHash('sha256').update(body).digest('hex'),
    bytes: Buffer.byteLength(body),
    recordCount: 1,
  };
}
export function manifestFixture(
  slug: GeoCrossAnalysisSlug
): GeoAnalysisEvidenceManifest {
  const makeInput = (
    layerId: string,
    datasetId: string,
    version: string,
    geometry: GeoAnalysisInputEvidence['geometry'],
    key: string,
    context = false
  ): GeoAnalysisInputEvidence => ({
    layerId,
    datasetId,
    version,
    geometry,
    ...artifact(key),
    role: context ? 'context-only' : 'calculation-input',
    usedInCalculation: !context,
  });
  const population = codes.map((code) =>
    makeInput(
      'ipss-population-mesh-1km',
      'mesh1000r6',
      '24',
      'mesh',
      `gis/mlit-ksj/mesh1000r6/24/${code}.topojson`
    )
  );
  const detailOutputs = codes.map((code) => ({
    ...artifact(`app/geo/${slug}/pref/${code}.json`),
    areaCode: `${code}000`,
  }));
  const inputs = [...population];
  const stages: GeoAnalysisEvidenceManifest['stages'][number][] = [];
  const stage = (
    id: string,
    kind: GeoAnalysisEvidenceManifest['stages'][number]['kind'],
    inputIds: string[],
    outputs = detailOutputs
  ) => ({
    id,
    label: id,
    kind,
    role:
      kind === 'source'
        ? ('calculation-input' as const)
        : kind === 'context'
          ? ('context-only' as const)
          : ('derived' as const),
    inputIds,
    operation: id,
    outputKeyPattern: `app/geo/${slug}/pref/{NN}.json`,
    outputs,
  });
  stages.push(stage('population-mesh', 'source', ['ipss-population-mesh-1km']));
  let derivedId: string;
  if (slug === 'population-land-price') {
    inputs.push(
      makeInput(
        'ksj-l01-residential-land-price',
        'L01',
        '26',
        'point',
        'gis/mlit-ksj/L01/26/national.topojson'
      )
    );
    stages.push(
      stage('residential-land-price-points', 'source', [
        'ksj-l01-residential-land-price',
      ])
    );
    derivedId = 'land-price-mesh-join';
    stages.push(
      stage(derivedId, 'spatial-operation', [
        'population-mesh',
        'residential-land-price-points',
      ])
    );
  } else if (slug === 'population-flood-risk') {
    inputs.push(
      ...FLOOD_ARCHIVES.map(({ key }) =>
        makeInput('ksj-a31b-flood-polygon', 'A31b', '25', 'polygon', key)
      )
    );
    stages.push({
      ...stage('flood-maximum-polygons', 'source', ['ksj-a31b-flood-polygon']),
      outputs: FLOOD_ARCHIVES.map(({ key }) => artifact(key)),
    });
    derivedId = 'flood-center-point-containment';
    stages.push(
      stage(derivedId, 'spatial-operation', [
        'population-mesh',
        'flood-maximum-polygons',
      ])
    );
  } else {
    inputs.push(
      makeInput(
        'ksj-s12-station-point',
        'S12',
        '25',
        'line',
        'gis/mlit-ksj/S12/25/national.topojson'
      )
    );
    const context = codes.map((code) =>
      makeInput(
        'ksj-s12-passenger-context',
        'S12',
        '2019-2023',
        'point',
        `app/station-passengers/${code}/stations.json`,
        true
      )
    );
    inputs.push(...context);
    stages.push(
      stage('station-representative-points', 'spatial-operation', [
        'ksj-s12-station-point',
      ])
    );
    stages.push({
      ...stage('station-passenger-context', 'context', [
        'ksj-s12-passenger-context',
      ]),
      outputs: context.map((input, i) => ({
        ...artifact(input.key),
        areaCode: `${codes[i]}000`,
      })),
    });
    derivedId = 'station-access-800m';
    stages.push(
      stage(derivedId, 'spatial-operation', [
        'population-mesh',
        'station-representative-points',
      ])
    );
  }
  const aggregate = {
    ...artifact(`app/geo/${slug}/item.json`),
    recordCount: 47,
  };
  stages.push({
    ...stage('prefecture-aggregate', 'aggregate', [derivedId]),
    role: 'aggregate',
    outputs: [aggregate],
  });
  return {
    schemaVersion: 1,
    slug,
    generatedAt: GENERATED_AT,
    definitionSha256: 'a'.repeat(64),
    inputs,
    stages,
    aggregate,
    quality: {
      expectedAreas: 47,
      detailAreas: 47,
      conservationChecks: 47,
      sourceRecords: 47,
      derivedRecords: 47,
      populatedMeshes: 47,
      maxDetailBytes: 3,
      ...(slug === 'population-flood-risk' ? { exposedMeshes: 47 } : {}),
      ...(slug === 'population-station-access'
        ? { accessibleMeshes: 47, stationGroups: 47 }
        : {}),
    },
  };
}

export function bindFixtureArtifact(
  manifest: GeoAnalysisEvidenceManifest,
  key: string,
  value: unknown,
  pretty = false
): GeoAnalysisEvidenceManifest {
  const evidence = artifact(key, value, pretty);
  const stages = manifest.stages.map((stage) => ({
    ...stage,
    outputs: stage.outputs.map((output) =>
      output.key === key
        ? { ...output, ...evidence, recordCount: output.recordCount }
        : output
    ),
  }));
  return {
    ...manifest,
    stages,
    aggregate:
      manifest.aggregate.key === key
        ? { ...manifest.aggregate, ...evidence, recordCount: 47 }
        : manifest.aggregate,
    quality: {
      ...manifest.quality,
      maxDetailBytes: Math.max(
        ...stages[0]!.outputs.map((output) => output.bytes)
      ),
    },
  };
}
