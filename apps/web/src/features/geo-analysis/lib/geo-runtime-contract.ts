import {
  assertFloodArchiveKeys,
  type GeoAnalysisArtifactEvidence,
  type GeoAnalysisEvidenceManifest,
} from '@stats47/gis';

import type { GeoCrossAnalysisSlug } from './geo-cross-analysis';

// Same limit as the canonical Geo bundle generator.
export const GEO_DETAIL_MAX_BYTES = 5_000_000;
export const GEO_AREA_CODES = Array.from(
  { length: 47 },
  (_, i) => `${String(i + 1).padStart(2, '0')}000`
);
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
export const isTimestamp = (value: unknown): value is string =>
  isText(value) &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  Number.isFinite(Date.parse(value));
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const isSha = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const isKey = (value: unknown): value is string =>
  isText(value) &&
  !value.startsWith('/') &&
  !value.includes('..') &&
  !/[?#\\]/.test(value);
const unique = (values: readonly unknown[]) =>
  new Set(values).size === values.length;

function isArtifact(value: unknown): value is GeoAnalysisArtifactEvidence {
  return (
    isRecord(value) &&
    isKey(value.key) &&
    isSha(value.sha256) &&
    isCount(value.bytes) &&
    value.bytes > 0 &&
    isCount(value.recordCount) &&
    (value.areaCode === undefined ||
      GEO_AREA_CODES.includes(String(value.areaCode)))
  );
}

// The approved stage graph is also a runtime publication contract, not just a label check.
const STAGES = {
  'population-land-price': [
    ['population-mesh', 'source', 'ipss-population-mesh-1km'],
    [
      'residential-land-price-points',
      'source',
      'ksj-l01-residential-land-price',
    ],
    [
      'land-price-mesh-join',
      'spatial-operation',
      'population-mesh',
      'residential-land-price-points',
    ],
    ['prefecture-aggregate', 'aggregate', 'land-price-mesh-join'],
  ],
  'population-flood-risk': [
    ['population-mesh', 'source', 'ipss-population-mesh-1km'],
    ['flood-maximum-polygons', 'source', 'ksj-a31b-flood-polygon'],
    [
      'flood-center-point-containment',
      'spatial-operation',
      'population-mesh',
      'flood-maximum-polygons',
    ],
    ['prefecture-aggregate', 'aggregate', 'flood-center-point-containment'],
  ],
  'population-station-access': [
    ['population-mesh', 'source', 'ipss-population-mesh-1km'],
    [
      'station-representative-points',
      'spatial-operation',
      'ksj-s12-station-point',
    ],
    ['station-passenger-context', 'context', 'ksj-s12-passenger-context'],
    [
      'station-access-800m',
      'spatial-operation',
      'population-mesh',
      'station-representative-points',
    ],
    ['prefecture-aggregate', 'aggregate', 'station-access-800m'],
  ],
} as const;

export function validateGeoManifest(
  value: unknown,
  slug: GeoCrossAnalysisSlug
): GeoAnalysisEvidenceManifest | null {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.slug !== slug ||
    !isTimestamp(value.generatedAt) ||
    !isSha(value.definitionSha256) ||
    !Array.isArray(value.inputs) ||
    !value.inputs.length ||
    !Array.isArray(value.stages) ||
    !isArtifact(value.aggregate) ||
    !isRecord(value.quality)
  )
    return null;
  const quality = value.quality;
  if (
    quality.expectedAreas !== 47 ||
    quality.detailAreas !== 47 ||
    quality.conservationChecks !== 47 ||
    ![
      'sourceRecords',
      'derivedRecords',
      'populatedMeshes',
      'maxDetailBytes',
    ].every((key) => isCount(quality[key])) ||
    !Object.values(quality).every(isCount) ||
    Number(quality.populatedMeshes) <= 0 ||
    Number(quality.maxDetailBytes) <= 0 ||
    Number(quality.maxDetailBytes) > GEO_DETAIL_MAX_BYTES
  )
    return null;
  const inputs = value.inputs;
  if (
    !inputs.every(
      (input) =>
        isRecord(input) &&
        isText(input.layerId) &&
        isText(input.datasetId) &&
        isText(input.version) &&
        isKey(input.key) &&
        isSha(input.sha256) &&
        isCount(input.bytes) &&
        input.bytes > 0 &&
        ['mesh', 'point', 'line', 'polygon'].includes(String(input.geometry)) &&
        ((input.role === 'calculation-input' &&
          input.usedInCalculation === true) ||
          (input.role === 'context-only' && input.usedInCalculation === false))
    )
  )
    return null;
  if (!unique(inputs.map((input) => input.key))) return null;
  const expectedLayers = new Map<
    string,
    readonly [string, string, string, string]
  >([
    [
      'ipss-population-mesh-1km',
      ['mesh1000r6', '24', 'mesh', 'calculation-input'],
    ],
    ...(slug === 'population-land-price'
      ? ([
          [
            'ksj-l01-residential-land-price',
            ['L01', '26', 'point', 'calculation-input'],
          ],
        ] as const)
      : []),
    ...(slug === 'population-flood-risk'
      ? ([
          [
            'ksj-a31b-flood-polygon',
            ['A31b', '25', 'polygon', 'calculation-input'],
          ],
        ] as const)
      : []),
    ...(slug === 'population-station-access'
      ? ([
          ['ksj-s12-station-point', ['S12', '25', 'line', 'calculation-input']],
          [
            'ksj-s12-passenger-context',
            ['S12', '2019-2023', 'point', 'context-only'],
          ],
        ] as const)
      : []),
  ]);
  for (const input of inputs) {
    const expected = expectedLayers.get(input.layerId);
    if (
      !expected ||
      [input.datasetId, input.version, input.geometry, input.role].some(
        (item, i) => item !== expected[i]
      )
    )
      return null;
  }
  for (const layer of expectedLayers.keys()) {
    const keys = inputs
      .filter((input) => input.layerId === layer)
      .map((input) => input.key);
    let expectedKeys: string[];
    if (layer === 'ksj-a31b-flood-polygon') {
      try {
        assertFloodArchiveKeys(keys);
      } catch {
        return null;
      }
      continue;
    }
    if (layer === 'ipss-population-mesh-1km')
      expectedKeys = GEO_AREA_CODES.map(
        (code) => `gis/mlit-ksj/mesh1000r6/24/${code.slice(0, 2)}.topojson`
      );
    else if (layer === 'ksj-s12-passenger-context')
      expectedKeys = GEO_AREA_CODES.map(
        (code) => `app/station-passengers/${code.slice(0, 2)}/stations.json`
      );
    else
      expectedKeys = [
        `gis/mlit-ksj/${layer === 'ksj-l01-residential-land-price' ? 'L01/26' : 'S12/25'}/national.topojson`,
      ];
    if (
      keys.length !== expectedKeys.length ||
      expectedKeys.some((key) => !keys.includes(key))
    )
      return null;
  }
  const graph = STAGES[slug];
  if (value.stages.length !== graph.length || !value.stages.every(isRecord))
    return null;
  const evidence = new Map<string, GeoAnalysisArtifactEvidence>();
  for (const input of inputs)
    evidence.set(input.key, { ...input, recordCount: 0 });
  for (let i = 0; i < graph.length; i++) {
    const stage = value.stages[i];
    const [id, kind, ...refs] = graph[i]!;
    const role =
      kind === 'source'
        ? 'calculation-input'
        : kind === 'spatial-operation'
          ? 'derived'
          : kind === 'context'
            ? 'context-only'
            : 'aggregate';
    if (
      stage.id !== id ||
      stage.kind !== kind ||
      stage.role !== role ||
      !isText(stage.label) ||
      !isText(stage.operation) ||
      !isText(stage.outputKeyPattern) ||
      !Array.isArray(stage.inputIds) ||
      JSON.stringify(stage.inputIds) !== JSON.stringify(refs) ||
      !Array.isArray(stage.outputs) ||
      !stage.outputs.length ||
      !stage.outputs.every(isArtifact) ||
      !unique(stage.outputs.map((output) => output.key))
    )
      return null;
    const outputs: GeoAnalysisArtifactEvidence[] = stage.outputs;
    if (kind === 'aggregate') {
      if (
        outputs.length !== 1 ||
        JSON.stringify(outputs[0]) !== JSON.stringify(value.aggregate) ||
        value.aggregate.key !== `app/geo/${slug}/item.json` ||
        value.aggregate.recordCount !== 47
      )
        return null;
    } else if (id === 'flood-maximum-polygons') {
      try {
        assertFloodArchiveKeys(outputs.map((output) => output.key));
      } catch {
        return null;
      }
    } else {
      if (
        outputs.length !== 47 ||
        !unique(outputs.map((output) => output.areaCode)) ||
        GEO_AREA_CODES.some(
          (code) => !outputs.some((output) => output.areaCode === code)
        )
      )
        return null;
      for (const output of outputs) {
        const key =
          kind === 'context'
            ? `app/station-passengers/${output.areaCode?.slice(0, 2)}/stations.json`
            : `app/geo/${slug}/pref/${output.areaCode?.slice(0, 2)}.json`;
        if (
          output.key !== key ||
          (kind !== 'context' && output.bytes > GEO_DETAIL_MAX_BYTES)
        )
          return null;
      }
    }
    for (const output of outputs) {
      const previous = evidence.get(output.key);
      if (
        previous &&
        (previous.sha256 !== output.sha256 || previous.bytes !== output.bytes)
      )
        return null;
      evidence.set(output.key, output);
    }
  }
  const stages =
    value.stages as unknown as GeoAnalysisEvidenceManifest['stages'];
  const population = stages.find((stage) => stage.id === 'population-mesh')!;
  const derived = stages.find(
    (stage) => stage.id === graph[graph.length - 2]![0]
  )!;
  const sumRecords = (stage: typeof population) =>
    stage.outputs.reduce(
      (sum: number, output: GeoAnalysisArtifactEvidence) =>
        sum + output.recordCount,
      0
    );
  if (
    sumRecords(population) !== quality.populatedMeshes ||
    sumRecords(derived) !== quality.derivedRecords ||
    Math.max(
      ...population.outputs.map(
        (output: GeoAnalysisArtifactEvidence) => output.bytes
      )
    ) !== quality.maxDetailBytes
  )
    return null;
  if (
    slug === 'population-flood-risk' &&
    quality.exposedMeshes !== quality.derivedRecords
  )
    return null;
  if (
    slug === 'population-station-access' &&
    (quality.accessibleMeshes !== quality.derivedRecords ||
      !isCount(quality.stationGroups) ||
      quality.stationGroups <= 0)
  )
    return null;
  return value as unknown as GeoAnalysisEvidenceManifest;
}

/** Verify generator-canonical JSON, not wire whitespace; fetch remains JSON-only. */
export async function matchesGeoArtifact(
  value: unknown,
  artifact: GeoAnalysisArtifactEvidence,
  pretty = false
): Promise<boolean> {
  const body = new TextEncoder().encode(
    `${JSON.stringify(value, null, pretty ? 2 : undefined)}\n`
  );
  if (body.byteLength !== artifact.bytes) return false;
  const digest = await crypto.subtle.digest('SHA-256', body);
  const sha = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  return sha === artifact.sha256;
}
