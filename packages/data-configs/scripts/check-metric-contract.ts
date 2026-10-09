import Ajv from 'ajv';
import {
  existsSync,
  readFileSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
  unlinkSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { COLOR_SCHEME_CATALOG } from '@stats47/types';
import { METRICS_REGISTRY } from '../src/registry';
import { listThemeCatalogs, validateChartProps } from '../src/theme-catalog';
import {
  metricDependencies,
  metricSourceReferences,
  metricNormalizationDependencies,
  type MetricLinkageEntry,
  type MetricLinkageIndex,
} from '../src/metric-linkage';
import { buildRecipe } from '../src/recipe';
import { METRICS_DIR, REPO_ROOT } from './_lib';
import { checkMetricSchema, METRIC_SCHEMA_PATH } from './metric-schema';
import { checkThemePropsSchema } from './theme-props-schema';
import { datasetPath, datasetDir } from '../../../config/datasets.mjs';
import { assertMetricPresentation } from '@stats47/types';

checkMetricSchema(true);
checkThemePropsSchema(true);
const validate = new Ajv({ allErrors: true }).compile(
  JSON.parse(readFileSync(METRIC_SCHEMA_PATH, 'utf8'))
);
const errors: string[] = [];
const manifest = JSON.parse(
  readFileSync(resolve(REPO_ROOT, datasetPath('content.entities')), 'utf8')
) as { shards: { key: string }[] };
const pages = manifest.shards.flatMap(
  (shard) =>
    (
      JSON.parse(
        readFileSync(
          resolve(REPO_ROOT, datasetDir('content.pages'), shard.key + '.json'),
          'utf8'
        )
      ) as { pages: import('../src/content').ContentPage[] }
    ).pages
);
const pagesById = new Map(pages.map(page => [page.id, page]));
const consumers = new Map<string, { pageId: string; kind: string }[]>();
for (const page of pages) {
  const refs = [
    ...new Set([
      ...(page.rankingKeys ?? []),
      ...(['ranking', 'municipality-ranking'].includes(page.kind)
        ? [page.key]
        : []),
    ]),
  ];
  for (const key of refs) {
    if (!METRICS_REGISTRY[key])
      errors.push('Unknown content metric: ' + page.id + ' → ' + key);
    const existing = consumers.get(key) ?? [];
    existing.push({ pageId: page.id, kind: page.kind });
    consumers.set(key, existing);
  }
}
const files = readdirSync(METRICS_DIR)
  .filter((file) => file.endsWith('.ts'))
  .sort();
const keys = Object.keys(METRICS_REGISTRY).sort();
if (
  files.length === 0 ||
  JSON.stringify(files.map((file) => file.slice(0, -3)).sort()) !==
    JSON.stringify(keys)
)
  errors.push('Metric filename/registry mismatch');
if (existsSync(resolve(REPO_ROOT, 'packages/data-configs/src/metrics')))
  errors.push('Duplicate legacy metric directory');
const catalogs = listThemeCatalogs();
const validateTheme = new Ajv({ allErrors: true }).compile(
  JSON.parse(
    readFileSync(
      resolve(REPO_ROOT, datasetPath('themes.catalog-schema')),
      'utf8'
    )
  )
);
for (const theme of catalogs)
  if (!validateTheme(theme))
    errors.push(
      `${theme.key}: theme shape ${JSON.stringify(validateTheme.errors)}`
    );
for (const theme of catalogs) for (const chart of theme.charts) {
  for (const error of validateChartProps(chart.componentType, chart.componentProps ?? {})) errors.push(`${theme.key}/${chart.componentKey}: ${error}`);
}
for (const theme of catalogs)
  for (const metric of theme.metrics) {
    if (!METRICS_REGISTRY[metric.rankingKey])
      errors.push(`${theme.key}: orphan ${metric.rankingKey}`);
  }
const entries: MetricLinkageEntry[] = keys.map((key) => {
  const metric = METRICS_REGISTRY[key];
  if (key !== metric.key || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key))
    errors.push(`Invalid metric ID ${key}`);
  if (!validate(metric))
    errors.push(`${key}: ${JSON.stringify(validate.errors)}`);
  const v = metric.visualization;
  try {
    assertMetricPresentation(v);
  } catch (error) {
    errors.push(`${key}: ${String(error)}`);
  }
  for (const option of metric.calculation?.normalizationOptions ?? [])
    if (option.visualization) {
      try {
        assertMetricPresentation(option.visualization);
      } catch (error) {
        errors.push(`${key}/${option.type}: ${String(error)}`);
      }
    }
  const scheme = COLOR_SCHEME_CATALOG.find(
    (entry) => entry.canonical === v.colorScheme
  );
  if (scheme?.type !== v.colorSchemeType)
    errors.push(`${key}: color scheme/type mismatch`);
  if (
    v.colorSchemeType === 'sequential' &&
    (v.divergingMidpoint !== undefined || v.isSymmetrized !== undefined)
  )
    errors.push(`${key}: diverging properties on sequential scale`);
  if (
    v.divergingMidpoint === 'custom' &&
    !Number.isFinite(v.divergingMidpointValue)
  )
    errors.push(`${key}: custom midpoint missing`);
  for (const domain of [v.domain, v.trendDomain, v.comparisonDomain]) {
    if (!domain) continue;
    if (
      domain.mode === 'fixed' &&
      (!Number.isFinite(domain.min) ||
        !Number.isFinite(domain.max) ||
        domain.min >= domain.max)
    )
      errors.push(`${key}: invalid fixed domain`);
    if (domain.mode !== 'fixed' && (domain.padding ?? 0) < 0)
      errors.push(`${key}: negative domain padding`);
  }
  const classification = v.classification;
  if (
    'classes' in classification &&
    (!Number.isInteger(classification.classes) ||
      classification.classes < 2 ||
      classification.classes > 9)
  )
    errors.push(`${key}: classes must be 2–9`);
  if (
    'thresholds' in classification &&
    (classification.thresholds.length === 0 ||
      classification.thresholds.some(
        (value, index, array) =>
          !Number.isFinite(value) || (index > 0 && value <= array[index - 1])
      ))
  )
    errors.push(`${key}: thresholds must be finite and increasing`);
  const dependencies = metricDependencies(metric);
  const normalizationDependencies = metricNormalizationDependencies(metric);
  for (const dep of [...dependencies, ...normalizationDependencies])
    if (!METRICS_REGISTRY[dep]) errors.push(`${key}: missing operand ${dep}`);
  return {
    metricKey: key,
    pageId: (consumers.get(key) ?? []).find(ref => ref.kind === 'ranking' && pagesById.get(ref.pageId)?.published === true)?.pageId ?? null,
    title: metric.title,
    sources: metricSourceReferences(metric),
    recipe: buildRecipe(metric),
    dependencies,
    normalizationDependencies,
    consumers: (consumers.get(key) ?? []).sort((a, b) =>
      a.pageId.localeCompare(b.pageId, 'en')
    ),
    themes: [...new Set((consumers.get(key) ?? []).filter(ref => ref.kind === 'theme').map(ref => ref.pageId.slice('theme:'.length)))].sort(),
  };
});
const visited = new Set<string>();
function visit(key: string, ancestors = new Set<string>()) {
  if (ancestors.has(key)) {
    errors.push('Cyclic metric dependency: ' + [...ancestors, key].join(' → '));
    return;
  }
  if (visited.has(key) || !METRICS_REGISTRY[key]) return;
  const next = new Set([...ancestors, key]);
  for (const dep of metricDependencies(METRICS_REGISTRY[key])) visit(dep, next);
  visited.add(key);
}
for (const key of keys) visit(key);
if (errors.length)
  throw new Error(
    errors.slice(0, 50).join('\n') + `\n${errors.length} contract failures`
  );
const indexDir = resolve(METRICS_DIR, 'index');
const index = { version: 1, entries } satisfies MetricLinkageIndex;
const validateIndex = new Ajv({ allErrors: true }).compile(
  JSON.parse(
    readFileSync(resolve(METRICS_DIR, 'schema/linkage.schema.json'), 'utf8')
  )
);
if (!validateIndex(index))
  throw new Error(
    'Invalid linkage index: ' + JSON.stringify(validateIndex.errors)
  );
// Small deterministic shards keep the complete reverse index reviewable in git.
const shards = new Map<string, string>();
for (let offset = 0; offset < entries.length; offset += 100) {
  const name = 'linkage-' + String(offset / 100).padStart(3, '0') + '.json';
  const shard = { version: 1, entries: entries.slice(offset, offset + 100) } satisfies MetricLinkageIndex;
  const content = JSON.stringify(shard, null, 2) + '\n';
  if (Buffer.byteLength(content) > 1_048_576)
    throw new Error('Metric linkage shard exceeds repository size budget: ' + name);
  shards.set(name, content);
}
const existing = existsSync(indexDir) ? readdirSync(indexDir).filter(name => /^linkage(?:-\d+)?\.json$/.test(name)) : [];
if (process.argv.includes('--write-index')) {
  mkdirSync(indexDir, { recursive: true });
  for (const [name, content] of shards) writeFileSync(resolve(indexDir, name), content);
  for (const name of existing) if (!shards.has(name)) unlinkSync(resolve(indexDir, name));
} else {
  for (const [name, content] of shards)
    if (!existsSync(resolve(indexDir, name)) || readFileSync(resolve(indexDir, name), 'utf8') !== content)
      throw new Error('Stale metric linkage shard. Run metrics:build-index: ' + name);
  if (existing.some(name => !shards.has(name)))
    throw new Error('Unexpected metric linkage shard. Run metrics:build-index.');
}
console.log(
  `Metric contract PASS: ${keys.length} IDs, ${catalogs.length} themes, source coordinates, dependency cycles, schema and index freshness.`
);
