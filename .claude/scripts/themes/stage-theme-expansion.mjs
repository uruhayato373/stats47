import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  PREFECTURES,
  validateStagedComparison,
  explicitIndicatorCodes,
  inspectLocalMetricCoverage,
} from './theme-expansion-core.mjs';

// Local preparation only: canonical builders produce the release files; no upload capability.
const require = createRequire(import.meta.url);
const {
  METRICS_REGISTRY,
} = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const {
  parseStatsValuesPayload,
} = require('../../../packages/stats-r2/src/schemas.ts');
const {
  buildPartitions,
} = require('../../../packages/ranking/src/scripts/generate-ranking-values.ts');
const {
  buildRankingItemFromMetric,
} = require('../../../packages/ranking/src/builders/build-ranking-item-from-metric.ts');
const {
  deriveFeaturedTop,
} = require('../../../packages/ranking/src/exporters/home-featured.ts');
const {
  RankingValuesKeySnapshotSchema,
} = require('../../../packages/ranking/src/repositories/schemas/ranking-values.schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const { values: options } = parseArgs({
  options: {
    'api-artifact-dir': { type: 'string' },
    'stage-dir': { type: 'string', default: '.local/r2' },
    out: {
      type: 'string',
      default: '.local/verification/themes/first-batch/release-manifest.json',
    },
    'additional-theme': { type: 'string' },
    'additional-metrics': { type: 'string' },
    'refresh-items': { type: 'string' },
    'all-components': { type: 'boolean', default: false },
    'local-metrics': { type: 'string' },
    'repair-laspeyres-unit': { type: 'boolean', default: false },
    'tourism-seasonality': { type: 'boolean', default: false },
    nutrition: { type: 'boolean', default: false },
    'public-facility-access': { type: 'boolean', default: false },
    'industry-specialization': { type: 'boolean', default: false },
    'medical-workforce': { type: 'boolean', default: false },
    'population-core': { type: 'boolean', default: false },
    'graduation-paths': { type: 'boolean', default: false },
    'physical-activity': { type: 'boolean', default: false },
    'property-prices': { type: 'boolean', default: false },
    'factory-investment': { type: 'boolean', default: false },
    'depopulated-settlements': { type: 'boolean', default: false },
    'freight-airports': { type: 'boolean', default: false },
    'earthquake-exposure': { type: 'boolean', default: false },
    'bridge-inspection-age': { type: 'boolean', default: false },
    'water-quality': { type: 'boolean', default: false },
    'cultural-heritage': { type: 'boolean', default: false },
    'snow-designation': { type: 'boolean', default: false },
    'shelter-applicability': { type: 'boolean', default: false },
    'tsunami-exposure': { type: 'boolean', default: false },
    'landslide-exposure': { type: 'boolean', default: false },
  },
});
if (!options['api-artifact-dir'])
  throw new Error('--api-artifact-dir from theme:expansion:verify is required');
const stage = resolve(root, options['stage-dir']);
const planPath =
  '.claude/skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json';
const evidencePath = '.claude/state/estat/theme-expansion-verification.json';
const plan = JSON.parse(await readFile(resolve(root, planPath), 'utf8'));
const evidence = JSON.parse(
  await readFile(resolve(root, evidencePath), 'utf8')
);
const batches = [...plan.firstBatch];
if (options['additional-theme'] || options['additional-metrics']) {
  if (!options['additional-theme'] || !options['additional-metrics'])
    throw new Error(
      'Additional theme and metric keys must be supplied together'
    );
  const {
    THEME_CATALOGS,
  } = require('../../../packages/data-configs/src/theme-catalog/index.ts');
  const catalog = THEME_CATALOGS[options['additional-theme']];
  const candidate = plan.themes.find(
    (row) => row.decision?.targetThemeKey === options['additional-theme']
  );
  if (!catalog || !candidate)
    throw new Error('Additional theme is not an adopted candidate');
  const keys = options['additional-metrics'].split(',');
  if (new Set(keys).size !== keys.length)
    throw new Error('Duplicate additional metric');
  batches.push({
    themeKey: catalog.key,
    metrics: keys.map((key) => {
      const config = METRICS_REGISTRY[key];
      const source = evidence.series.find(
        (row) =>
          row.statsDataId === config?.source?.statsDataId &&
          row.code === config?.source?.cdCat01
      );
      if (
        !config?.isActive ||
        !catalog.metrics.some((metric) => metric.rankingKey === key) ||
        source?.status !== 'verified' ||
        !explicitIndicatorCodes(candidate).includes(source.code) ||
        !source.completeYears?.length ||
        source.duplicateAreaYears?.length
      )
        throw new Error(`Additional metric lacks verified source: ${key}`);
      return {
        metricKey: key,
        proposedMetricKey: key,
        indicatorCode: source.code,
        comparisonYear: source.completeYears.at(-1),
        unit: config.unit,
      };
    }),
  });
}
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const observedAt = new Date().toISOString();
const manifest = {
  schemaVersion: 1,
  generatedAt: observedAt,
  status: 'staged-unpublished',
  plan: planPath,
  evidence: evidencePath,
  themes: batches.map((row) => row.themeKey),
  metrics: [],
  files: [],
};
const outputs = new Map();
const sourceRows = new Map();
const artifacts = evidence.requests ?? evidence.responses;
if (!Array.isArray(artifacts))
  throw new Error('Verification report has no response manifest');
for (const response of artifacts.filter(
  (row) => row.endpoint === 'getStatsData'
)) {
  const bytes = await readFile(
    resolve(options['api-artifact-dir'], response.artifactName)
  );
  if (sha(bytes) !== response.sha256)
    throw new Error(`Source hash mismatch: ${response.artifactName}`);
  const rows = JSON.parse(bytes).GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE;
  for (const row of rows) {
    const key = `${response.parameters.statsDataId}:${row['@cat01']}`;
    const existing = sourceRows.get(key) ?? [];
    existing.push(row);
    sourceRows.set(key, existing);
  }
}
async function publicJson(key) {
  const response = await fetch(`https://storage.stats47.jp/${key}`, {
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Public ${key}: HTTP ${response.status}`);
  return response.json();
}
for (const batch of batches) {
  for (const metric of batch.metrics) {
    const key = metric.metricKey;
    const config = METRICS_REGISTRY[key];
    if (!config?.isActive) throw new Error(`Unregistered metric: ${key}`);
    const statsKey = `app/stats/${key}/values.json`;
    // Newly registered metrics are ingested by page-data-batch, which applies the shared shape gate.
    // Existing observations come from public SSOT and keep all historical years.
    const input = metric.proposedMetricKey
      ? JSON.parse(await readFile(resolve(stage, statsKey), 'utf8'))
      : await publicJson(statsKey);
    const payload = parseStatsValuesPayload(input);
    if (payload.metricKey !== key || payload.entityKind !== 'prefecture')
      throw new Error(`Wrong payload identity: ${key}`);
    const rows = payload.rows.filter(
      (row) => row.yearCode === metric.comparisonYear
    );
    if (
      rows.length !== 47 ||
      new Set(rows.map((row) => row.areaCode)).size !== 47 ||
      !PREFECTURES.every((code) =>
        rows.some((row) => row.areaCode === code && Number.isFinite(row.value))
      )
    )
      throw new Error(`Incomplete comparison: ${key}`);
    const source = evidence.series.find(
      (row) => row.code === metric.indicatorCode
    );
    const raw = sourceRows
      .get(`${source.statsDataId}:${metric.indicatorCode}`)
      ?.filter(
        (row) =>
          row['@time'].slice(0, 4) === metric.comparisonYear &&
          PREFECTURES.includes(row['@area'])
      );
    if (raw?.length !== 47) throw new Error(`Missing verified source: ${key}`);
    const mismatches = validateStagedComparison(rows, raw, config.unit);
    if (config.unit !== metric.unit || mismatches.length)
      throw new Error(
        `${key}: ${mismatches.join('; ') || 'Planned unit mismatch'}`
      );
    const partitions = buildPartitions(key, payload.rows, config.years);
    const comparison = partitions.find(
      (partition) => partition.yearCode === metric.comparisonYear
    );
    if (comparison?.values.length !== 47)
      throw new Error(`Incomplete ranking: ${key}`);
    const ranking = RankingValuesKeySnapshotSchema.parse({
      generatedAt: observedAt,
      rankingKey: key,
      areaType: 'prefecture',
      partitions,
    });
    const item = buildRankingItemFromMetric(config, {
      now: observedAt,
      registry: METRICS_REGISTRY,
      values: {
        yearCodes: partitions.map((partition) => partition.yearCode),
        latestTop: deriveFeaturedTop(partitions[0].values),
      },
    });
    outputs.set(statsKey, payload);
    outputs.set(`app/ranking/${key}/values.json`, ranking);
    outputs.set(`app/ranking/${key}/item.json`, {
      generatedAt: observedAt,
      item,
    });
    manifest.metrics.push({
      themeKey: batch.themeKey,
      metricKey: key,
      indicatorCode: metric.indicatorCode,
      comparisonYear: metric.comparisonYear,
      comparisonPrefectures: 47,
      sourceMatchedPrefectures: 47,
      unit: config.unit,
      preservedYears: [
        ...new Set(payload.rows.map((row) => row.yearCode)),
      ].sort(),
      sourceSha256: sha(JSON.stringify(raw)),
    });
  }
  const componentKey = `app/page-components/theme/${batch.themeKey}.json`;
  outputs.set(
    componentKey,
    JSON.parse(
      await readFile(
        resolve(
          root,
          `apps/web/scripts/data/page-components/theme/${batch.themeKey}.json`
        ),
        'utf8'
      )
    )
  );
}
if (options['all-components']) {
  const {
    THEME_CATALOGS,
  } = require('../../../packages/data-configs/src/theme-catalog/index.ts');
  manifest.componentThemes = Object.keys(THEME_CATALOGS);
  for (const key of manifest.componentThemes) {
    outputs.set(
      `app/page-components/theme/${key}.json`,
      JSON.parse(
        await readFile(
          resolve(
            root,
            `apps/web/scripts/data/page-components/theme/${key}.json`
          ),
          'utf8'
        )
      )
    );
  }
}
// Source verification is performed by each ingester. This step checks identity/recipe/shape,
// then generates the canonical delivery format without claiming another source comparison.
for (const key of options['local-metrics']?.split(',') ?? []) {
  const {
    THEME_CATALOGS,
  } = require('../../../packages/data-configs/src/theme-catalog/index.ts');
  const config = METRICS_REGISTRY[key];
  const themes = Object.values(THEME_CATALOGS).filter((catalog) =>
    catalog.metrics.some((metric) => metric.rankingKey === key)
  );
  if (
    !config?.isActive ||
    !config.entities.includes('prefecture') ||
    !themes.length ||
    manifest.metrics.some((metric) => metric.metricKey === key)
  )
    throw new Error(`Invalid/duplicate local metric: ${key}`);
  const statsKey = `app/stats/${key}/values.json`;
  const payload = parseStatsValuesPayload(
    JSON.parse(await readFile(resolve(stage, statsKey), 'utf8'))
  );
  if (key === 'retail-employees') {
    const { verifyRetailSourceBytes, parseRetailEmployees } = await import('./ingest-retail-employees.mjs');
    const sourceBytes = await readFile(resolve(root, '.local/verification/themes/retail-employment-source/retail-employees.json'));
    verifyRetailSourceBytes(sourceBytes);
    const original = parseRetailEmployees(JSON.parse(sourceBytes));
    const byCode = new Map(original.rows.map(row => [row.areaCode, row]));
    if (payload.rows.length !== 47 || payload.rows.some(row => row.yearCode !== '2021' || row.unit !== '人' || byCode.get(row.areaCode)?.areaName !== row.areaName || byCode.get(row.areaCode)?.value !== row.value)) throw new Error('Retail source-to-release mismatch');
  }
  if (
    payload.metricKey !== key ||
    payload.entityKind !== 'prefecture' ||
    payload.meta.recipe?.configHash !== buildRecipe(config).configHash
  )
    throw new Error(`Local identity/recipe mismatch: ${key}`);
  const coverage = inspectLocalMetricCoverage(
    payload.rows,
    config.source.kind === 'external'
      ? config.source.config?.nonApplicablePrefectures
      : undefined
  );
  if (
    coverage.errors.length ||
    payload.rows.some((row) => row.unit !== config.unit)
  )
    throw new Error(
      `Local shape/unit mismatch: ${key}: ${coverage.errors.join('; ')}`
    );
  const partitions = buildPartitions(key, payload.rows, config.years);
  if (
    !partitions.length ||
    partitions.some(
      (partition) =>
        partition.values.length !== coverage.numericCodes.length ||
        partition.values.some(
          (row) => !coverage.numericCodes.includes(row.areaCode)
        )
    )
  )
    throw new Error(`Local incomplete cohort: ${key}`);
  const ranking = RankingValuesKeySnapshotSchema.parse({
    generatedAt: observedAt,
    rankingKey: key,
    areaType: 'prefecture',
    partitions,
  });
  const item = buildRankingItemFromMetric(config, {
    now: observedAt,
    registry: METRICS_REGISTRY,
    values: {
      yearCodes: partitions.map((partition) => partition.yearCode),
      latestTop: deriveFeaturedTop(partitions[0].values),
    },
  });
  outputs.set(statsKey, payload);
  outputs.set(`app/ranking/${key}/values.json`, ranking);
  outputs.set(`app/ranking/${key}/item.json`, {
    generatedAt: observedAt,
    item,
  });
  manifest.metrics.push({
    themeKey: themes[0].key,
    metricKey: key,
    comparisonYear: partitions[0].yearCode,
    comparisonPrefectures: coverage.numericCodes.length,
    nonApplicablePrefectures: PREFECTURES.filter(
      (code) => !coverage.numericCodes.includes(code)
    ),
    sourceMatchedPrefectures: null,
    sourceVerification: 'separate-ingester-record',
    unit: config.unit,
    preservedYears: partitions.map((partition) => partition.yearCode).sort(),
  });
}
const inventoryKey = 'app/ranking-items/all.json';
if (options['landslide-exposure']) {
  const { LANDSLIDE_EXPOSURE_SOURCE: source } = require('../../../packages/data-configs/src/theme-catalog/landslide-exposure-source.ts');
  const { parseGeoLandslideManifest, parseGeoLandslideSnapshot, parseGeoLandslidePrefDetail, assertGeoLandslideConservation, assertLandslideSourcePublication } = require('../../../packages/gis/src/geo-analysis/landslide-exposure.ts');
  const verificationPath = '.local/verification/themes/landslide-exposure-source/reproduced/ingester-proof.json';
  const proof = JSON.parse(await readFile(resolve(root, verificationPath), 'utf8'));
  if (proof.status !== 'PASS' || !proof.writeLocal || proof.slug !== source.slug || proof.inputs !== 140 || proof.details !== 47 || proof.available !== 46 || JSON.stringify(proof.excluded) !== '["26000"]' || proof.artifacts?.length !== 596) throw new Error('Landslide source verification incomplete');
  const prefix = source.r2Root;
  const manifestBytes = await readFile(resolve(stage, `${prefix}/manifest.json`));
  const lineage = parseGeoLandslideManifest(JSON.parse(manifestBytes));
  if (!lineage || lineage.generatedAt !== proof.generatedAt) throw new Error('Invalid landslide manifest');
  const artifacts = new Map([...proof.artifacts, ...lineage.inputs, ...lineage.stages.flatMap(s => s.outputs), lineage.aggregate].map(a => [a.key, a]));
  const files = new Map();
  for (const [key, pin] of artifacts) {
    const bytes = await readFile(resolve(stage, key));
    if (sha(bytes) !== pin.sha256 || bytes.length !== pin.bytes) throw new Error(`Landslide artifact changed: ${key}`);
    const proofPin = proof.artifacts.find(a => a.key === key);
    if (proofPin && (proofPin.sha256 !== pin.sha256 || proofPin.bytes !== pin.bytes)) throw new Error(`Landslide proof mismatch: ${key}`);
    if (pin.datasetId === 'A33') assertLandslideSourcePublication(key.split('/').at(-1).slice(0,2), pin.sha256, source.a33.permissions.sha256);
    files.set(key, bytes);
  }
  const item = parseGeoLandslideSnapshot(JSON.parse(files.get(`${prefix}/item.json`)));
  if (!item || item.generatedAt !== lineage.generatedAt || files.size !== 736) throw new Error('Landslide artifact set mismatch');
  for (const code of PREFECTURES) {
    const detail = parseGeoLandslidePrefDetail(JSON.parse(files.get(`${prefix}/pref/${code.slice(0,2)}.json`)), code);
    if (!detail || detail.generatedAt !== lineage.generatedAt) throw new Error(`Invalid landslide detail: ${code}`);
    assertGeoLandslideConservation(detail, item.rows.find(r => r.areaCode === code));
  }
  for (const [key, bytes] of files) outputs.set(key, bytes);
  manifest.landslideExposure = { slug: source.slug, files: files.size, availablePrefectures: 46, excludedPrefectures: ['26000'], verificationPath };
}
if (options['tsunami-exposure']) {
  const { TSUNAMI_EXPOSURE_SOURCE: source, parseTsunamiBundle } = require('../../../packages/data-configs/src/theme-catalog/index.ts');
  const { verifyTsunamiIntermediate } = await import('./ingest-tsunami-exposure.mjs');
  const prefix = source.r2Root;
  const files = new Map(await Promise.all(['item', 'manifest', 'verification'].map(async name => {
    const key = `${prefix}/${name}.json`;
    return [key, await readFile(resolve(stage, key))];
  })));
  const bundle = await parseTsunamiBundle({ itemText: files.get(`${prefix}/item.json`).toString(), manifestText: files.get(`${prefix}/manifest.json`).toString(), verificationText: files.get(`${prefix}/verification.json`).toString() });
  if (!bundle) throw new Error('Tsunami exposure source bundle mismatch');
  for (const ref of [...bundle.manifest.intermediates, ...source.inputs.map(input => ({ key: input.publicKey, sha256: input.sha256, bytes: input.bytes }))]) {
    const bytes = await readFile(resolve(stage, ref.key));
    if (sha(bytes) !== ref.sha256 || bytes.length !== ref.bytes) throw new Error(`Tsunami artifact changed: ${ref.key}`);
    if (ref.key.startsWith(`${prefix}/pref/`)) {
      const detail = JSON.parse(bytes);
      verifyTsunamiIntermediate(detail);
      if (JSON.stringify(detail.row) !== JSON.stringify(bundle.snapshot.rows.find(r => r.areaCode === detail.row.areaCode))) throw new Error(`Tsunami intermediate/aggregate mismatch: ${ref.key}`);
    }
    files.set(ref.key, bytes);
  }
  if (files.size !== 3 + source.scenarios.length + source.inputs.length) throw new Error('Tsunami exact artifact set mismatch');
  for (const [key, bytes] of files) outputs.set(key, bytes);
  manifest.tsunamiExposure = { files: files.size, prefectures: source.scenarios.map(s => s.areaCode), scope: 'licensed-subset-scenario-exposure', originalAllPrefectureScopeFulfilled: false, canonicalPath: source.canonicalPath };
}
if (options['shelter-applicability']) {
  const { SHELTER_APPLICABILITY_SOURCE: source } = require('../../../packages/data-configs/src/theme-catalog/shelter-applicability-source.ts');
  const { shelterApplicabilitySnapshotSchema } = require('../../../apps/web/src/features/shelter-applicability/lib/shelter-applicability-snapshot.ts');
  const verificationPath = '.local/verification/themes/shelter-applicability-source/reproduced/ingester-proof.json';
  const proof = JSON.parse(await readFile(resolve(root, verificationPath), 'utf8'));
  const bytes = await readFile(resolve(stage, source.r2Key));
  shelterApplicabilitySnapshotSchema.parse(JSON.parse(bytes));
  if (proof.status !== 'PASS' || !proof.writeLocal || proof.sourceFiles !== 105 || proof.prefectures !== 47 || proof.unknownMarkerCount !== 0 || proof.partitionProof?.length !== 94 || proof.partitionProof.some(p => p.status !== 'national-and-prefecture-all-fields-exact') || proof.payloadSha256 !== sha(bytes) || proof.payloadBytes !== bytes.length) throw new Error('Shelter applicability original verification mismatch');
  outputs.set(source.r2Key, bytes);
  manifest.shelterApplicability = { key: source.r2Key, prefectures: 47, emergencyPlaces: 115878, shelters: 83294, verificationPath };
}
if (options['bridge-inspection-age']) {
  const {
    BRIDGE_INSPECTION_AGE_SOURCE: source,
  } = require('../../../packages/data-configs/src/theme-catalog/bridge-inspection-age-source.ts');
  const {
    parseBridgeInspectionAgeSnapshot,
  } = require('../../../apps/web/src/features/bridge-inspection-age/lib/bridge-inspection-age-snapshot.ts');
  const verificationPath =
    '.local/verification/themes/bridge-inspection-age-source/reproduced/bridge-source-proof.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  const bytes = await readFile(resolve(stage, source.r2Key));
  parseBridgeInspectionAgeSnapshot(JSON.parse(bytes));
  if (
    proof.status !== 'PASS' ||
    proof.rejects !== 0 ||
    proof.rawRows !== source.expectedPublishedCount ||
    proof.unknownYearCount !== source.expectedUnknownYearCount ||
    !proof.reportPrintedPage111CountMatch ||
    proof.snapshotSha256 !== sha(bytes) ||
    proof.snapshotBytes !== bytes.length ||
    source.sources.some(
      (s) => proof.files.find((f) => f.id === s.id)?.sha256 !== s.sha256
    )
  )
    throw new Error('Bridge inspection-age source verification mismatch');
  outputs.set(source.r2Key, bytes);
  manifest.bridgeInspectionAge = {
    key: source.r2Key,
    prefectures: 47,
    publishedBridges: proof.rawRows,
    allManagedBridgesScope: 'not-included',
    verificationPath,
  };
}
if (options['water-quality']) {
  const {
    WATER_QUALITY_SOURCE: source,
  } = require('../../../packages/data-configs/src/theme-catalog/water-quality-source.ts');
  const {
    waterQualitySnapshotSchema,
  } = require('../../../apps/web/src/features/water-quality/lib/water-quality-snapshot.ts');
  const verificationPath =
    '.local/verification/themes/water-quality-source.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  const bytes = await readFile(resolve(stage, source.r2Key));
  waterQualitySnapshotSchema.parse(JSON.parse(bytes));
  if (
    proof.status !== 'PASS' ||
    !proof.writeLocal ||
    proof.sourceSha256 !== source.sha256 ||
    proof.mainSourceSha256 !== source.mainSha256 ||
    proof.prefecturalSourceSha256 !== source.anomaly.prefecturalSourceSha256 ||
    proof.prefectures !== 47 ||
    proof.sourceRows !== 3427 ||
    proof.files?.find((f) => f.key === source.r2Key)?.sha256 !== sha(bytes)
  )
    throw new Error('Water quality source verification mismatch');
  outputs.set(source.r2Key, bytes);
  manifest.waterQuality = {
    key: source.r2Key,
    prefectures: 47,
    originalListingRows: 3427,
    nationalAggregation: proof.nationalAggregation,
    verificationPath,
  };
}
if (options['cultural-heritage']) {
  const {
    CULTURAL_HERITAGE_SOURCE: source,
  } = require('../../../packages/data-configs/src/theme-catalog/cultural-heritage-source.ts');
  const {
    verifyCulturalHeritageSnapshot,
  } = require('../../../apps/web/src/features/cultural-heritage/lib/cultural-heritage-snapshot.ts');
  const prefix = source.r2Key.replace(/\.json$/, '');
  const verificationKey = `${prefix}/verification.json`;
  const files = new Map(
    await Promise.all(
      [source.r2Key, `${prefix}/source-manifest.json`, verificationKey].map(
        async (key) => [key, await readFile(resolve(stage, key))]
      )
    )
  );
  const proof = JSON.parse(files.get(verificationKey));
  const snapshot = await verifyCulturalHeritageSnapshot(
    JSON.parse(files.get(source.r2Key))
  );
  if (
    !snapshot ||
    proof.status !== 'PASS' ||
    proof.checks?.detailRecords !== 167 ||
    proof.checks?.prefectureQueries !== 47 ||
    proof.checks?.sourceBodies !== 225 ||
    proof.payloadSha256 !== sha(files.get(source.r2Key)) ||
    proof.factsSha256 !== source.factsSha256 ||
    proof.rawManifestSha256 !==
      sha(files.get(`${prefix}/source-manifest.json`)) ||
    snapshot.source.rawManifestSha256 !== proof.rawManifestSha256
  )
    throw new Error('Cultural heritage source verification mismatch');
  for (const [key, bytes] of files) outputs.set(key, bytes);
  manifest.culturalHeritage = {
    key: source.r2Key,
    uniqueRecords: 167,
    scope: source.scope,
    files: 3,
    verificationKey,
  };
}
if (options['snow-designation']) {
  const {
    SNOW_DESIGNATION_SOURCE: source,
  } = require('../../../packages/data-configs/src/theme-catalog/snow-designation-source.ts');
  const {
    parseGeoSnowManifest,
    parseGeoSnowPrefDetail,
    assertGeoSnowConservation,
  } = require('../../../packages/gis/src/geo-analysis/snow-designation.ts');
  const prefix = source.r2Root;
  const verificationPath =
    '.local/verification/themes/snow-designation-source/ingester-proof.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  const manifestBytes = await readFile(
    resolve(stage, `${prefix}/manifest.json`)
  );
  const lineage = parseGeoSnowManifest(JSON.parse(manifestBytes));
  if (
    !lineage ||
    proof.status !== 'PASS' ||
    !proof.writeLocal ||
    proof.rows !== 47 ||
    proof.publicJsonArtifacts !== 98 ||
    proof.originalMirrors !== 71
  )
    throw new Error('Snow designation source verification incomplete');
  const files = new Map([[`${prefix}/manifest.json`, manifestBytes]]);
  const artifacts = new Map(
    [
      ...lineage.inputs,
      ...lineage.stages.flatMap((s) => s.outputs),
      lineage.aggregate,
    ].map((a) => [a.key, a])
  );
  for (const [key, artifact] of artifacts) {
    const bytes = await readFile(resolve(stage, key));
    if (sha(bytes) !== artifact.sha256 || bytes.length !== artifact.bytes)
      throw new Error(`Snow designation artifact changed: ${key}`);
    files.set(key, bytes);
  }
  const item = JSON.parse(files.get(`${prefix}/item.json`));
  if (
    sha(files.get(`${prefix}/item.json`)) !== proof.snapshotSha256 ||
    item.generatedAt !== lineage.generatedAt ||
    item.dataVersion !== source.dataVersion ||
    item.rows?.length !== 47 ||
    new Set(item.rows.map((r) => r.areaCode)).size !== 47
  )
    throw new Error('Snow designation aggregate mismatch');
  for (const code of PREFECTURES) {
    const detail = parseGeoSnowPrefDetail(
      JSON.parse(files.get(`${prefix}/pref/${code.slice(0, 2)}.json`)),
      code
    );
    if (!detail || detail.generatedAt !== lineage.generatedAt)
      throw new Error(`Invalid snow designation detail: ${code}`);
    assertGeoSnowConservation(
      detail,
      item.rows.find((r) => r.areaCode === code)
    );
  }
  const verificationKey = `${prefix}/verification.json`;
  const verificationBytes = await readFile(resolve(stage, verificationKey));
  const verification = JSON.parse(verificationBytes);
  if (
    verification.status !== 'PASS' ||
    verification.generatedAt !== lineage.generatedAt ||
    verification.definitionSha256 !== lineage.definitionSha256 ||
    verification.originalSourceCount !== 71 ||
    verification.originalChecks?.population?.status !== 'PASS' ||
    verification.originalChecks.population.prefectures !== 47
  )
    throw new Error('Snow designation independent verification mismatch');
  files.set(verificationKey, verificationBytes);
  const sourceKey = `${prefix}/sources.json`;
  const sourceBytes = await readFile(resolve(stage, sourceKey));
  const sourceReceipt = JSON.parse(sourceBytes);
  if (sourceReceipt.slug !== source.slug || sourceReceipt.generatedAt !== lineage.generatedAt || sourceReceipt.sources?.length !== 71 || new Set(sourceReceipt.sources.map(s => s.key)).size !== 71 || JSON.stringify(sourceReceipt.documentSources) !== JSON.stringify(source.documentSources) || sourceReceipt.sources.some(s => {
    const input = lineage.inputs.find(i => i.key === s.key);
    return !input || input.sha256 !== s.sha256 || input.bytes !== s.bytes || !s.usedInCalculation || !Number.isFinite(Date.parse(s.acquiredAt));
  })) throw new Error('Snow designation source receipt mismatch');
  files.set(sourceKey, sourceBytes);
  if (files.size !== 169)
    throw new Error('Snow designation exact artifact set mismatch');
  for (const [key, bytes] of files) outputs.set(key, bytes);
  manifest.snowDesignation = {
    slug: source.slug,
    files: files.size,
    prefectures: 47,
    designatedPrefectures: 24,
    nonDesignatedPrefectures: 23,
    verificationPath,
  };
}
if (options['freight-airports']) {
  const {
    FREIGHT_OD_SOURCE,
    AIRPORT_TRAFFIC_SOURCE,
  } = require('../../../packages/data-configs/src/theme-catalog/index.ts');
  const {
    freightOdSnapshotSchema,
  } = require('../../../apps/web/src/features/freight-od/lib/freight-od-snapshot.ts');
  const {
    airportTrafficSnapshotSchema,
  } = require('../../../apps/web/src/features/airport-traffic/lib/airport-traffic-snapshot.ts');
  const verificationPath =
    '.local/verification/themes/freight-airport-source/ingest-verification.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  if (
    proof.status !== 'PASS' ||
    !proof.writeLocal ||
    proof.airportCount !== 96 ||
    proof.freight?.length !== 4 ||
    proof.freight.some((mode) => mode.cells !== 2209)
  )
    throw new Error('Freight/airport source verification incomplete');
  for (const [source, schema] of [
    [FREIGHT_OD_SOURCE, freightOdSnapshotSchema],
    [AIRPORT_TRAFFIC_SOURCE, airportTrafficSnapshotSchema],
  ]) {
    const bytes = await readFile(resolve(stage, source.r2Key));
    schema.parse(JSON.parse(bytes));
    if (
      proof.outputs?.find((row) => row.key === source.r2Key)?.sha256 !==
      sha(bytes)
    )
      throw new Error(
        `Freight/airport profile differs from source verification: ${source.r2Key}`
      );
    outputs.set(source.r2Key, bytes);
  }
  manifest.freightAirports = {
    profiles: 2,
    odCells: 8836,
    airports: 96,
    verificationPath,
  };
}
if (options['depopulated-settlements']) {
  const {
    DEPOPULATED_SETTLEMENTS_SOURCE: source,
  } = require('../../../packages/data-configs/src/theme-catalog/depopulated-settlements-source.ts');
  const {
    parseDepopulatedSettlementsSnapshot,
  } = require('../../../apps/web/src/features/depopulated-settlements/lib/depopulated-settlements-snapshot.ts');
  const verificationPath =
    '.local/verification/themes/depopulated-settlements-source/reproduced/verification.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  const bytes = await readFile(resolve(stage, source.r2Key));
  if (
    !parseDepopulatedSettlementsSnapshot(JSON.parse(bytes)) ||
    proof.status !== 'PASS' ||
    proof.source.sha256 !== source.sha256 ||
    proof.checks?.nationalColumnSums !== 11 ||
    proof.payloadSha256 !== sha(bytes)
  )
    throw new Error('Depopulated settlements source verification mismatch');
  outputs.set(source.r2Key, bytes);
  manifest.depopulatedSettlements = {
    key: source.r2Key,
    blocks: 10,
    prefectureObservationsCreated: 0,
    verificationPath,
  };
}
if (options['factory-investment']) {
  const {
    FACTORY_INVESTMENT_SOURCE: source,
  } = require('../../../packages/data-configs/src/theme-catalog/factory-investment-source.ts');
  const {
    factoryInvestmentSnapshotSchema,
  } = require('../../../apps/web/src/features/factory-investment/lib/factory-investment-snapshot.ts');
  const verificationPath =
    '.local/verification/themes/factory-investment-source.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  const bytes = await readFile(resolve(stage, source.r2Key));
  factoryInvestmentSnapshotSchema.parse(JSON.parse(bytes));
  if (
    proof.status !== 'PASS' ||
    !proof.writeLocal ||
    proof.sourceSha256 !== source.sha256 ||
    proof.sourceCellChecks !== 47 ||
    proof.files?.find((row) => row.key === source.r2Key)?.sha256 !== sha(bytes)
  )
    throw new Error('Factory investment source verification mismatch');
  outputs.set(source.r2Key, bytes);
  manifest.factoryInvestment = {
    key: source.r2Key,
    prefectures: 47,
    publishedPrefectures: 44,
    suppressedPrefectures: 3,
    verificationPath,
  };
}
if (options['property-prices']) {
  const {
    PROPERTY_PRICE_DISTRIBUTION_SOURCE: source,
  } = require('../../../packages/data-configs/src/theme-catalog/property-price-distribution-source.ts');
  const {
    parsePropertyPriceDistributionSnapshot,
  } = require('../../../apps/web/src/features/property-price-distribution/lib/property-price-distribution-snapshot.ts');
  const verificationPath =
    '.local/verification/themes/property-prices-source.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  const bytes = await readFile(resolve(stage, source.r2Key));
  const profile = parsePropertyPriceDistributionSnapshot(JSON.parse(bytes));
  if (
    proof.status !== 'source-verified-staged' ||
    proof.sourceManifestSha256 !== source.sourceManifestSha256 ||
    proof.files?.find((row) => row.key === source.r2Key)?.sha256 !== sha(bytes)
  )
    throw new Error('Property price source verification mismatch');
  for (const metric of source.metrics) {
    const stats = parseStatsValuesPayload(
      JSON.parse(
        await readFile(
          resolve(stage, `app/stats/${metric.key}/values.json`),
          'utf8'
        )
      )
    );
    for (const area of profile.areas) {
      const row = stats.rows.find(
        (row) => row.areaCode === area.areaCode && row.yearCode === source.year
      );
      if (
        row?.value !== area[metric.dataset][metric.statistic] ||
        row?.unit !== metric.unit
      )
        throw new Error(
          `Property price profile differs from ranking: ${metric.key}/${area.areaCode}`
        );
    }
  }
  outputs.set(source.r2Key, bytes);
  manifest.propertyPrices = {
    key: source.r2Key,
    prefectures: 47,
    metrics: 4,
    sourceMatchedValues: 188,
    verificationPath,
  };
}
if (options['physical-activity']) {
  const {
    PHYSICAL_ACTIVITY_SOURCE,
  } = require('../../../packages/data-configs/src/theme-catalog/physical-activity-source.ts');
  const {
    physicalActivitySnapshotSchema,
  } = require('../../../apps/web/src/features/physical-activity/lib/physical-activity-snapshot.ts');
  const key = PHYSICAL_ACTIVITY_SOURCE.r2Key;
  const verificationPath =
    '.local/verification/themes/healthcare-core-source.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  const bytes = await readFile(resolve(stage, key));
  const profile = physicalActivitySnapshotSchema.parse(JSON.parse(bytes));
  if (
    proof.status !== 'source-verified-staged' ||
    proof.files?.find((row) => row.key === key)?.sha256 !== sha(bytes)
  )
    throw new Error('Physical activity source verification mismatch');
  for (const metric of PHYSICAL_ACTIVITY_SOURCE.metrics) {
    const stats = parseStatsValuesPayload(
      JSON.parse(
        await readFile(
          resolve(stage, `app/stats/${metric.key}/values.json`),
          'utf8'
        )
      )
    );
    for (const areaCode of PREFECTURES) {
      const point = profile.rows.find(
        (row) => row.areaCode === areaCode && row.metricKey === metric.key
      );
      const row = stats.rows.find(
        (row) =>
          row.areaCode === areaCode &&
          row.yearCode === PHYSICAL_ACTIVITY_SOURCE.period
      );
      if (
        !point ||
        row?.value !== point.mean ||
        row?.unit !== PHYSICAL_ACTIVITY_SOURCE.unit
      )
        throw new Error(
          `Physical activity profile differs from ranking: ${metric.key}/${areaCode}`
        );
    }
  }
  outputs.set(key, bytes);
  manifest.physicalActivity = {
    key,
    prefectures: 47,
    metrics: 2,
    sourceMatchedValues: 94,
    verificationPath,
  };
}
if (options['graduation-paths']) {
  const {
    GRADUATION_PATHS_SOURCE,
  } = require('../../../packages/data-configs/src/theme-catalog/graduation-paths-source.ts');
  const {
    parseGraduationPathsSnapshot,
  } = require('../../../apps/web/src/features/graduation-paths/lib/graduation-paths-snapshot.ts');
  const key = GRADUATION_PATHS_SOURCE.r2Key;
  const verificationPath =
    '.local/verification/themes/education-core-source.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  const bytes = await readFile(resolve(stage, key));
  const profile = parseGraduationPathsSnapshot(JSON.parse(bytes));
  if (
    !profile ||
    proof.status !== 'source-verified-staged' ||
    proof.files?.find((row) => row.key === key)?.sha256 !== sha(bytes)
  )
    throw new Error('Graduation paths source verification mismatch');
  outputs.set(key, bytes);
  manifest.graduationPaths = {
    key,
    prefectures: 47,
    categories: 8,
    verificationPath,
  };
}
if (options['population-core']) {
  const {
    parsePopulationCoreProfile,
  } = require('../../../packages/data-configs/src/theme-catalog/population-core-profile.ts');
  const {
    PROFILE_KEYS,
    getPopulationProfileMetricValue,
  } = require('../../../apps/web/src/features/population-demographics/lib/population-profile-view.ts');
  const { SOURCES } = await import('./population-core-pins.mjs');
  const verificationPath =
    '.local/verification/themes/population-core-source.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  const metrics = [
    [
      PROFILE_KEYS.migration,
      [
        'interprefecture-net-migration-age15to24',
        'interprefecture-net-migration-age25to34',
      ],
    ],
    [
      PROFILE_KEYS.households,
      [
        'single-households-age65plus-male',
        'single-households-age65plus-female',
      ],
    ],
    [
      PROFILE_KEYS.residence,
      [
        'five-year-residence-same-address',
        'five-year-residence-other-prefecture',
      ],
    ],
  ];
  const expected = new Set(
    metrics.flatMap(([key, keys]) => [
      key,
      ...keys.map((metric) => `app/stats/${metric}/values.json`),
    ])
  );
  if (
    proof.status !== 'source-verified-staged' ||
    proof.files?.length !== expected.size
  )
    throw new Error('Population source verification is incomplete');
  const files = new Map();
  for (const file of proof.files) {
    if (!expected.delete(file.key))
      throw new Error(`Unexpected/duplicate population artifact: ${file.key}`);
    const bytes = await readFile(resolve(stage, file.key));
    if (sha(bytes) !== file.sha256 || bytes.length !== file.bytes)
      throw new Error(`Population artifact changed: ${file.key}`);
    files.set(file.key, bytes);
  }
  if (expected.size) throw new Error('Missing population artifacts');
  let comparedValues = 0;
  for (const [key, keys] of metrics) {
    const bytes = files.get(key);
    const profile = parsePopulationCoreProfile(JSON.parse(bytes));
    for (const source of profile.sources) {
      const pin = SOURCES.find(
        (row) => row.parameters.statsDataId === source.tableId
      );
      if (
        !pin ||
        source.statisticalDataSha256 !== pin.statisticalDataSha256 ||
        JSON.stringify(source.parameters) !== JSON.stringify(pin.parameters)
      )
        throw new Error(`Population source pin mismatch: ${source.tableId}`);
    }
    for (const metricKey of keys) {
      const stats = parseStatsValuesPayload(
        JSON.parse(files.get(`app/stats/${metricKey}/values.json`))
      );
      if (stats.metricKey !== metricKey || stats.rows.length !== 47)
        throw new Error(`Population ranking shape mismatch: ${metricKey}`);
      for (const areaCode of PREFECTURES) {
        const row = stats.rows.find(
          (row) =>
            row.areaCode === areaCode &&
            row.yearCode === profile.period.slice(0, 4)
        );
        const value = getPopulationProfileMetricValue(
          profile,
          metricKey,
          areaCode
        );
        if (
          value === null ||
          row?.value !== value ||
          row?.unit !== profile.unit
        )
          throw new Error(
            `Population profile differs from ranking: ${metricKey}/${areaCode}`
          );
        comparedValues++;
      }
    }
    outputs.set(key, bytes);
  }
  manifest.populationCore = {
    profiles: 3,
    prefectures: 47,
    comparedValues,
    verificationPath,
  };
}
if (options['medical-workforce']) {
  const {
    MEDICAL_WORKFORCE_SOURCE,
  } = require('../../../packages/data-configs/src/theme-catalog/medical-workforce-source.ts');
  const {
    medicalWorkforceSnapshotSchema,
  } = require('../../../apps/web/src/features/medical-workforce/lib/medical-workforce-snapshot.ts');
  const key = MEDICAL_WORKFORCE_SOURCE.r2Key;
  const bytes = await readFile(resolve(stage, key));
  const payload = medicalWorkforceSnapshotSchema.parse(JSON.parse(bytes));
  const verificationPath =
    '.local/verification/themes/forestry-medical-core-source.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  if (
    proof.status !== 'source-verified-staged' ||
    proof.files.find((file) => file.key === key)?.sha256 !== sha(bytes) ||
    proof.medical?.nationalChecks !== 60 ||
    proof.medical?.partitions !== 144
  )
    throw new Error('Medical workforce source verification mismatch');
  const selections = [
    ['medical-physicians-under-40', (area) => area.ages.slice(0, 4)],
    ['medical-physicians-age-40-59', (area) => area.ages.slice(4, 8)],
    ['medical-physicians-age-60-plus', (area) => area.ages.slice(8)],
    [
      'medical-physicians-pediatrics',
      (area) => area.specialties.filter((row) => row.specialty === '小児科'),
    ],
    [
      'medical-physicians-obstetrics-gynecology',
      (area) =>
        area.specialties.filter((row) =>
          ['産婦人科', '産科', '婦人科'].includes(row.specialty)
        ),
    ],
    [
      'medical-physicians-emergency-medicine',
      (area) => area.specialties.filter((row) => row.specialty === '救急科'),
    ],
  ];
  for (const [metricKey, select] of selections) {
    const stats = parseStatsValuesPayload(
      JSON.parse(
        await readFile(
          resolve(stage, `app/stats/${metricKey}/values.json`),
          'utf8'
        )
      )
    );
    for (const area of payload.areas) {
      const points = select(area);
      const row = stats.rows.find(
        (row) => row.areaCode === area.areaCode && row.yearCode === '2024'
      );
      if (
        !points.length ||
        stats.metricKey !== metricKey ||
        row?.value !==
          points.reduce((sum, point) => sum + point.physicians, 0) ||
        row?.unit !== '人'
      )
        throw new Error(
          `Medical profile differs from ranking: ${metricKey}/${area.areaCode}`
        );
    }
  }
  outputs.set(key, bytes);
  manifest.medicalWorkforce = {
    key,
    period: payload.period,
    prefectures: 47,
    ageGroups: 14,
    specialties: 45,
    verificationPath,
  };
}
if (options['earthquake-exposure']) {
  const {
    parseEarthquakeExposureBundle,
  } = require('../../../apps/web/src/features/earthquake-exposure/lib/earthquake-exposure-bundle.ts');
  const {
    assertEarthquakePrefArtifact,
    buildEarthquakePrefArtifact,
  } = require('../../../packages/data-configs/src/theme-catalog/earthquake-exposure-schema.ts');
  const prefix = 'app/geo/earthquake-population-exposure';
  const verificationPath =
    '.local/verification/themes/earthquake-exposure-source.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  if (proof.status !== 'verified-local-staged' || proof.files?.length !== 50)
    throw new Error('Earthquake source verification is incomplete');
  const expected = new Set([
    `${prefix}/item.json`,
    `${prefix}/manifest.json`,
    `${prefix}/verification.json`,
    ...PREFECTURES.map((code) => `${prefix}/pref/${code.slice(0, 2)}.json`),
  ]);
  const files = new Map();
  for (const file of proof.files) {
    if (!expected.delete(file.key))
      throw new Error(`Unexpected/duplicate earthquake artifact: ${file.key}`);
    const bytes = await readFile(resolve(stage, file.key));
    if (sha(bytes) !== file.sha256 || bytes.length !== file.bytes)
      throw new Error(`Earthquake artifact changed: ${file.key}`);
    files.set(file.key, bytes);
  }
  if (expected.size) throw new Error('Missing earthquake artifacts');
  const bundle = await parseEarthquakeExposureBundle({
    itemText: files.get(`${prefix}/item.json`).toString(),
    manifestText: files.get(`${prefix}/manifest.json`).toString(),
    verificationText: files.get(`${prefix}/verification.json`).toString(),
  });
  if (!bundle) throw new Error('Earthquake source lineage/aggregate mismatch');
  for (const row of bundle.snapshot.rows) {
    const detail = JSON.parse(
      files.get(`${prefix}/pref/${row.areaCode.slice(0, 2)}.json`)
    );
    assertEarthquakePrefArtifact(detail, row.areaCode);
    if (
      JSON.stringify(detail) !==
      JSON.stringify(buildEarthquakePrefArtifact(bundle.snapshot, row))
    )
      throw new Error(
        `Earthquake intermediate differs from aggregate: ${row.areaCode}`
      );
  }
  // Publish transformed county totals only; no original hazard grids or private joins.
  for (const [key, bytes] of files) outputs.set(key, bytes);
  manifest.earthquakeExposure = {
    files: files.size,
    prefectures: 47,
    verificationPath,
    housingSpatialScope: 'unfulfilled',
  };
}
if (options['industry-specialization']) {
  const {
    INDUSTRY_SPECIALIZATION_SOURCE,
  } = require('../../../packages/data-configs/src/theme-catalog/index.ts');
  const {
    industrySpecializationSnapshotSchema,
  } = require('../../../apps/web/src/features/industry-specialization/lib/industry-specialization-snapshot.ts');
  const key = INDUSTRY_SPECIALIZATION_SOURCE.r2Key;
  const bytes = await readFile(resolve(stage, key));
  const payload = industrySpecializationSnapshotSchema.parse(JSON.parse(bytes));
  const verificationPath =
    '.local/verification/themes/industry-core-source.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  if (
    proof.status !== 'source-verified-staged' ||
    proof.files.find((file) => file.key === key)?.sha256 !== sha(bytes)
  )
    throw new Error('Industry profile source verification mismatch');
  for (const [metricKey, industryCode] of [
    ['employment-location-quotient-manufacturing', 'E'],
    ['employment-location-quotient-information-communication', 'G'],
    ['employment-location-quotient-health-welfare', 'P'],
  ]) {
    const stats = parseStatsValuesPayload(
      JSON.parse(
        await readFile(
          resolve(stage, `app/stats/${metricKey}/values.json`),
          'utf8'
        )
      )
    );
    for (const area of payload.areas) {
      const point = area.industries.find(
        (row) => row.industryCode === industryCode
      );
      const row = stats.rows.find(
        (row) =>
          row.areaCode === area.areaCode && row.yearCode === payload.period
      );
      if (
        stats.metricKey !== metricKey ||
        row?.value !== Number(point.locationQuotient.toFixed(8)) ||
        row?.unit !== '倍'
      )
        throw new Error(
          `Industry profile differs from ranking: ${metricKey}/${area.areaCode}`
        );
    }
  }
  outputs.set(key, bytes);
  manifest.industrySpecialization = {
    key,
    rows: 846,
    industries: 18,
    verificationPath,
  };
}
if (options['public-facility-access']) {
  const {
    validateGeoManifest,
  } = require('../../../apps/web/src/features/geo-analysis/lib/geo-runtime-contract.ts');
  const {
    validPublicFacilityRows,
    parseGeoPublicFacilityPrefDetail,
  } = require('../../../apps/web/src/features/geo-analysis/lib/geo-public-facility-evidence.ts');
  const {
    assertPublicFacilityConservation,
  } = require('../../../packages/gis/src/geo-analysis/public-facility-access.ts');
  const slug = 'population-public-facility-access';
  const prefix = `app/geo/${slug}`;
  const verificationPath =
    '.local/verification/themes/public-facility-access-source.json';
  const proof = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  if (
    proof.status !== 'PASS' ||
    proof.prefectures !== 47 ||
    proof.files?.length !== 144 ||
    proof.bandPopulationChecks !== 282 ||
    proof.nearestChecks?.length !== 282 ||
    proof.nearestChecks.some((row) => row.differenceMeters !== 0)
  )
    throw new Error('Public-facility source verification is incomplete');
  const expected = new Set([
    `${prefix}/item.json`,
    `${prefix}/manifest.json`,
    `${prefix}/sources.json`,
  ]);
  for (const code of PREFECTURES) {
    const pref = code.slice(0, 2);
    expected.add(`${prefix}/pref/${pref}.json`);
    expected.add(`${prefix}/source/${pref}.json`);
    expected.add(`gis/mlit-ksj/P05/22/${pref}.geojson`);
  }
  const files = new Map();
  for (const file of proof.files) {
    if (!expected.delete(file.key))
      throw new Error(
        `Unexpected/duplicate public-facility artifact: ${file.key}`
      );
    const bytes = await readFile(resolve(stage, file.key));
    if (sha(bytes) !== file.sha256 || bytes.length !== file.bytes)
      throw new Error(`Public-facility artifact changed: ${file.key}`);
    files.set(file.key, bytes);
  }
  if (expected.size) throw new Error('Missing public-facility artifacts');
  const item = JSON.parse(files.get(`${prefix}/item.json`));
  if (
    !validateGeoManifest(
      JSON.parse(files.get(`${prefix}/manifest.json`)),
      slug
    ) ||
    !validPublicFacilityRows(item.rows)
  )
    throw new Error('Invalid public-facility lineage/aggregate');
  for (const row of item.rows) {
    const detail = parseGeoPublicFacilityPrefDetail(
      JSON.parse(files.get(`${prefix}/pref/${row.areaCode.slice(0, 2)}.json`)),
      row.areaCode
    );
    if (!detail)
      throw new Error(`Invalid public-facility detail: ${row.areaCode}`);
    assertPublicFacilityConservation(detail, row);
  }
  // Keep bytes exact: the Geo manifest pins raw inputs and intermediate artifacts.
  for (const [key, bytes] of files) outputs.set(key, bytes);
  manifest.publicFacilityAccess = {
    slug,
    files: files.size,
    prefectures: 47,
    verificationPath,
  };
}
if (options.nutrition) {
  const {
    NUTRITION_SOURCE,
  } = require('../../../packages/data-configs/src/theme-catalog/index.ts');
  const {
    nutritionSnapshotSchema,
  } = require('../../../apps/web/src/features/nutrition/lib/nutrition-snapshot.ts');
  const key = NUTRITION_SOURCE.r2Key;
  const payload = nutritionSnapshotSchema.parse(
    JSON.parse(await readFile(resolve(stage, key), 'utf8'))
  );
  const verificationPath =
    '.local/verification/themes/singleparent-nutrition-source.json';
  const verification = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  if (
    verification.status !== 'PASS' ||
    verification.nutrition?.payloadSha256 !== sha(JSON.stringify(payload)) ||
    verification.nutrition?.rows !== 188 ||
    verification.nutrition?.nationalRows !== 4
  ) {
    throw new Error('Nutrition payload lacks matching source verification');
  }
  for (const metric of NUTRITION_SOURCE.metrics) {
    const stats = parseStatsValuesPayload(
      JSON.parse(
        await readFile(
          resolve(stage, `app/stats/${metric.key}/values.json`),
          'utf8'
        )
      )
    );
    for (const row of payload.rows.filter(
      (point) => point.metricKey === metric.key
    )) {
      const observation = stats.rows.find(
        (point) =>
          point.areaCode === row.areaCode && point.yearCode === row.period
      );
      if (
        stats.metricKey !== metric.key ||
        observation?.value !== row.mean ||
        observation?.unit !== 'g/日'
      )
        throw new Error(
          `Nutrition mean differs from ranking data: ${metric.key}/${row.areaCode}`
        );
    }
  }
  outputs.set(key, payload);
  manifest.nutrition = {
    key,
    year: NUTRITION_SOURCE.period,
    rows: 188,
    nationalRows: 4,
    sourceVerification: verificationPath,
  };
}
if (options['tourism-seasonality']) {
  const {
    tourismSeasonalitySnapshotSchema,
    TOURISM_SEASONALITY_SNAPSHOT_KEY: key,
  } = require('../../../apps/web/src/features/tourism-seasonality/lib/tourism-seasonality-snapshot.ts');
  const payload = JSON.parse(await readFile(resolve(stage, key), 'utf8'));
  tourismSeasonalitySnapshotSchema.parse(payload);
  const verificationPath =
    '.local/verification/themes/tourism-seasonality/verification.json';
  const verification = JSON.parse(
    await readFile(resolve(root, verificationPath), 'utf8')
  );
  if (
    verification.status !== 'PASS' ||
    verification.payloadSha256 !== sha(JSON.stringify(payload)) ||
    verification.crossTableMatches !== 576 ||
    verification.nationalReleaseMatches !== 12
  )
    throw new Error(
      'Monthly tourism source verification does not match staged payload'
    );
  outputs.set(key, payload);
  manifest.monthlySeries = [
    {
      key,
      year: payload.year,
      rows: payload.rows.length,
      nationalRows: payload.national.length,
      sourceVerification: 'separate-ingester-record',
      verificationPath,
    },
  ];
}
if (options['repair-laspeyres-unit']) {
  const key = 'laspeyres-index-prefecture';
  const config = METRICS_REGISTRY[key];
  if (config.unit !== '指数' || config.display?.conversionFactor !== 1)
    throw new Error('Unexpected Laspeyres unit config');
  const statsKey = `app/stats/${key}/values.json`;
  const source = parseStatsValuesPayload(await publicJson(statsKey));
  if (
    source.metricKey !== key ||
    source.entityKind !== 'prefecture' ||
    source.rows.some((row) => !['', config.unit].includes(row.unit))
  )
    throw new Error('Unexpected Laspeyres source');
  const coverage = inspectLocalMetricCoverage(source.rows);
  if (coverage.errors.length) throw new Error(coverage.errors.join('; '));
  const rows = source.rows.map((row) => ({ ...row, unit: config.unit }));
  const observationHash = (observations) =>
    sha(JSON.stringify(observations.map(({ unit, ...row }) => row)));
  if (observationHash(rows) !== observationHash(source.rows))
    throw new Error('Unit repair changed observations');
  const payload = parseStatsValuesPayload({
    ...source,
    rows,
    meta: {
      ...source.meta,
      generatedAt: observedAt,
      recipe: buildRecipe(config),
    },
  });
  const partitions = buildPartitions(key, rows, config.years);
  const item = buildRankingItemFromMetric(config, {
    now: observedAt,
    registry: METRICS_REGISTRY,
    values: {
      yearCodes: partitions.map((partition) => partition.yearCode),
      latestTop: deriveFeaturedTop(partitions[0].values),
    },
  });
  outputs.set(statsKey, payload);
  outputs.set(
    `app/ranking/${key}/values.json`,
    RankingValuesKeySnapshotSchema.parse({
      generatedAt: observedAt,
      rankingKey: key,
      areaType: 'prefecture',
      partitions,
    })
  );
  outputs.set(`app/ranking/${key}/item.json`, {
    generatedAt: observedAt,
    item,
  });
  manifest.unitRepairs = [
    {
      metricKey: key,
      rowCount: rows.length,
      sourceUnits: [...new Set(source.rows.map((row) => row.unit))],
      unit: config.unit,
      sourceSha256: sha(JSON.stringify(source)),
      preservedObservationHash: observationHash(rows),
    },
  ];
  manifest.metrics.push({
    themeKey: 'local-finance',
    metricKey: key,
    comparisonYear: partitions[0].yearCode,
    comparisonPrefectures: 47,
    sourceMatchedPrefectures: null,
    sourceVerification: 'public-observations-preserved-unit-label-only',
    unit: config.unit,
    preservedYears: partitions.map((partition) => partition.yearCode).sort(),
  });
}
// Display/definition-only repairs use public observations unchanged; they are not new source verification.
const refreshedItems = [];
for (const key of options['refresh-items']?.split(',') ?? []) {
  const config = METRICS_REGISTRY[key];
  if (!config?.isActive || !config.entities.includes('prefecture'))
    throw new Error(`Invalid refresh metric: ${key}`);
  const payload = parseStatsValuesPayload(
    await publicJson(`app/stats/${key}/values.json`)
  );
  if (payload.metricKey !== key || payload.entityKind !== 'prefecture')
    throw new Error(`Wrong refresh identity: ${key}`);
  const partitions = buildPartitions(key, payload.rows, config.years);
  if (!partitions.length)
    throw new Error(`Refresh has no observations: ${key}`);
  const item = buildRankingItemFromMetric(config, {
    now: observedAt,
    registry: METRICS_REGISTRY,
    values: {
      yearCodes: partitions.map((partition) => partition.yearCode),
      latestTop: deriveFeaturedTop(partitions[0].values),
    },
  });
  outputs.set(`app/ranking/${key}/item.json`, {
    generatedAt: observedAt,
    item,
  });
  refreshedItems.push(key);
}
manifest.refreshedItems = refreshedItems;
manifest.themes = [
  ...new Set(manifest.metrics.map((metric) => metric.themeKey)),
];
const inventory = await publicJson(inventoryKey);
if (
  !Array.isArray(inventory.items) ||
  inventory.items.length < 2000 ||
  new Set(inventory.items.map((item) => item.rankingKey)).size !==
    inventory.items.length
)
  throw new Error('Invalid public ranking inventory');
const byKey = new Map(inventory.items.map((item) => [item.rankingKey, item]));
for (const metric of manifest.metrics)
  byKey.set(
    metric.metricKey,
    outputs.get(`app/ranking/${metric.metricKey}/item.json`).item
  );
for (const key of refreshedItems)
  byKey.set(key, outputs.get(`app/ranking/${key}/item.json`).item);
outputs.set(inventoryKey, {
  ...inventory,
  generatedAt: observedAt,
  count: byKey.size,
  items: [...byKey.values()],
});
// Keep both directions of source links in the same release, using the complete merged inventory.
const {
  surveyBucketsForItem,
} = require('../../../packages/ranking/src/exporters/survey-bucketing.ts');
const {
  buildSurveyItemsSnapshot,
} = require('../../../packages/ranking/src/exporters/survey-items-snapshot.ts');
const {
  buildSurveysSnapshot,
  parseSurveysSnapshot,
} = require('../../../packages/ranking/src/types/snapshot.ts');
const surveys = JSON.parse(
  await readFile(
    resolve(root, 'packages/ranking/src/data/surveys.json'),
    'utf8'
  )
);
const surveyIds = new Set(surveys.map((survey) => survey.id));
const surveyBuckets = new Map();
for (const item of byKey.values()) {
  if (!item.isActive) continue;
  for (const id of surveyBucketsForItem(item)) {
    if (!surveyIds.has(id))
      throw new Error(`Unknown survey in merged inventory: ${id}`);
    const bucket = surveyBuckets.get(id) ?? [];
    bucket.push(item);
    surveyBuckets.set(id, bucket);
  }
}
for (const [id, items] of surveyBuckets)
  outputs.set(
    `app/survey/${id}/items.json`,
    buildSurveyItemsSnapshot(id, items, observedAt)
  );
const surveyRows = surveys
  .filter((survey) => surveyBuckets.has(survey.id))
  .map((survey) => ({
    ...survey,
    itemCount: surveyBuckets.get(survey.id).length,
  }));
outputs.set(
  'app/survey/all.json',
  parseSurveysSnapshot(buildSurveysSnapshot(surveyRows, observedAt))
);
manifest.surveys = {
  count: surveyRows.length,
  itemCounts: Object.fromEntries(
    surveyRows.map((survey) => [survey.id, survey.itemCount])
  ),
};
// Validate everything before replacing any staged file. The manifest is written last.
for (const [key, value] of outputs) {
  const bytes = Buffer.isBuffer(value) ? value : JSON.stringify(value);
  const path = resolve(stage, key);
  await mkdir(dirname(path), { recursive: true });
  const current = await readFile(path).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  // Preserve unchanged original GIS files and their copy-on-write staging clones.
  if (!current?.equals(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes))) {
    await writeFile(path, bytes);
  }
  manifest.files.push({
    key,
    bytes: Buffer.byteLength(bytes),
    sha256: sha(bytes),
  });
}
const out = resolve(root, options.out);
await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(
  JSON.stringify({
    themes: new Set(manifest.metrics.map((metric) => metric.themeKey)).size,
    metrics: manifest.metrics.length,
    matchedPrefectures: manifest.metrics.reduce(
      (sum, metric) => sum + (metric.sourceMatchedPrefectures ?? 0),
      0
    ),
    files: manifest.files.length,
    manifest: out,
    uploaded: false,
  })
);
