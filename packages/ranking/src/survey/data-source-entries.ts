/**
 * 各面の lineage を出典表示用の `DataSourceEntry[]` へ変換する唯一の実装。
 *
 * - blog chart: `app/blog/<slug>/data/<base>.source.json`
 * - metric config (git TS): ranking / blog の rankingKey 参照
 * - ranking item.json: 焼き込み済みの `sourceConfig` + `attribution`
 *
 * 調査への紐付けは survey taxonomy と同じ関数 (`resolveProvenanceByParams` /
 * `resolveSourceProvenance` / source-name 辞書) を使い、別の対応表を持たない。
 * 正典: `.claude/rules/survey-linkage-standards.md` §2
 */
import {
  buildEstatTableUrl,
  isSsdsStatsDataId,
  mergeDataSourceEntries,
  resolveAttribution,
  resolveProvenanceByParams,
  resolveSourceProvenance,
  resolveSurveyIdBySourceName,
  type DataSourceEntry,
  type MetricConfig,
  type MetricRegistry,
  type ProvenanceSurvey,
  type SourceAttribution,
} from '@stats47/data-configs';

import surveysMaster from '../data/surveys.json';
import type { SourceProvenance } from '../types/ranking-item';
import {
  extractBlogChartSourceReferences,
  nestedRecords,
  splitStatsDataIds,
} from './survey-taxonomy';

interface SurveyMasterRow {
  id: string;
  name: string;
  organization?: string | null;
  url?: string | null;
  license?: string | null;
}

const MASTER_BY_ID = new Map(
  (surveysMaster as SurveyMasterRow[]).map((row) => [row.id, row])
);

const SSDS_ORGANIZATION = '総務省統計局';
const MAX_DEPTH = 4;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function httpUrl(value: unknown): string | undefined {
  return typeof value === 'string' && /^https?:\/\//.test(value)
    ? value
    : undefined;
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** master に実在する調査だけを surveyId 付きの行にする。非実在 (合成 id 等) は undefined。 */
function surveyEntry(
  survey: ProvenanceSurvey,
  tables: DataSourceEntry['tables']
): DataSourceEntry | undefined {
  const master = MASTER_BY_ID.get(survey.id);
  if (!master) return undefined;
  return {
    label: master.name,
    ...(master.organization ? { organization: master.organization } : {}),
    surveyId: master.id,
    ...(master.url ? { url: master.url } : {}),
    tables,
    ...(master.license ? { license: master.license } : {}),
  };
}

/**
 * e-Stat の 1 表を出典行へ。SSDS は「社会・人口統計体系」の行に表を付け、
 * 原典調査は表なしの行として並べる (SourceAttribution の 2 階層表記と同じ意味)。
 */
function estatEntries(
  statsDataId: string,
  cdCat01: string | undefined,
  tableLabel: string | undefined
): DataSourceEntry[] {
  const table = {
    label: tableLabel ?? '統計表',
    url: buildEstatTableUrl(statsDataId),
  };
  if (isSsdsStatsDataId(statsDataId)) {
    const compilation = resolveAttribution(statsDataId, cdCat01).compilation;
    const originals = resolveProvenanceByParams(statsDataId, cdCat01)
      .map((survey) => surveyEntry(survey, []))
      .filter((entry): entry is DataSourceEntry => Boolean(entry));
    return [
      {
        label: compilation?.name ?? '社会・人口統計体系',
        organization: SSDS_ORGANIZATION,
        ...(compilation?.url ? { url: compilation.url } : {}),
        tables: [table],
      },
      ...originals,
    ];
  }
  const surveys = resolveProvenanceByParams(statsDataId, cdCat01)
    .map((survey) => surveyEntry(survey, [table]))
    .filter((entry): entry is DataSourceEntry => Boolean(entry));
  if (surveys.length > 0) return surveys;
  return [{ label: tableLabel ?? 'e-Stat 統計表', tables: [table] }];
}

function calculatedOperandKeys(metric: MetricConfig): string[] {
  const source = metric.source;
  if (source.kind === 'calculated') {
    const f = source.formula;
    if (f.op === 'divide') return [f.numerator, f.denominator];
    if (f.op === 'multiply' || f.op === 'subtract') return [f.left, f.right];
    if (f.op === 'per_population') return [f.numerator];
    return [];
  }
  if (source.kind === 'external' && source.fetcherKey === 'calculated') {
    const c = metric.calculation;
    return [
      c?.numeratorKey ?? c?.numeratorRankingKey ?? c?.numerator,
      c?.denominatorKey ?? c?.denominatorRankingKey ?? c?.denominator,
    ].filter((key): key is string => Boolean(key));
  }
  return [];
}

/** metric config (git TS) の出典行。calculated は分子/分母の出典をたどる。 */
export function resolveMetricDataSources(
  metric: MetricConfig,
  registry: MetricRegistry,
  depth = 0
): DataSourceEntry[] {
  if (depth > MAX_DEPTH) return [];
  const operands = calculatedOperandKeys(metric);
  if (operands.length > 0) {
    return mergeDataSourceEntries(
      operands.flatMap((key) => {
        const operand = registry[key];
        return operand
          ? resolveMetricDataSources(operand, registry, depth + 1)
          : [];
      })
    );
  }
  const source = metric.source;
  if (source.kind === 'estat') {
    return estatEntries(source.statsDataId, source.cdCat01, source.displayName);
  }
  if (source.kind === 'calculated') return [];
  const link = httpUrl(source.url);
  const tables =
    link && source.displayName ? [{ label: source.displayName, url: link }] : [];
  const surveys = resolveSourceProvenance(source, registry)
    .map((survey) => surveyEntry(survey, tables))
    .filter((entry): entry is DataSourceEntry => Boolean(entry));
  if (surveys.length > 0) return surveys;
  const label = nonEmpty(source.displayName);
  if (!label) return [];
  const license =
    source.kind === 'external' && isRecord(source.config.source)
      ? nonEmpty(source.config.source.license)
      : undefined;
  return [
    {
      label,
      ...(link ? { url: link } : {}),
      tables: [],
      ...(license ? { license } : {}),
    },
  ];
}

/** ranking item.json に焼き込まれた sourceConfig / attribution から出典行を作る (runtime 用)。 */
export function resolveRankingItemDataSources(input: {
  sourceConfig?: SourceProvenance | null;
  attribution?: SourceAttribution | null;
}): DataSourceEntry[] {
  const config = input.sourceConfig;
  const statsDataId = config?.statsDataId;
  if (statsDataId) {
    const cdCat01 =
      nonEmpty(config?.cdCat01) ?? nonEmpty(config?.estatParams?.cdCat01);
    return mergeDataSourceEntries(
      estatEntries(statsDataId, cdCat01, config?.survey?.name)
    );
  }
  const source = isRecord(config?.source)
    ? { name: nonEmpty(config.source.name), url: httpUrl(config.source.url) }
    : undefined;
  const link = source?.url;
  const tables =
    link && source?.name ? [{ label: source.name, url: link }] : [];
  const surveys = (input.attribution?.originalSurveys ?? [])
    .map((survey) => surveyEntry(survey, tables))
    .filter((entry): entry is DataSourceEntry => Boolean(entry));
  if (surveys.length > 0) return mergeDataSourceEntries(surveys);
  return source?.name
    ? [{ label: source.name, ...(link ? { url: link } : {}), tables: [] }]
    : [];
}

function parseDisplaySources(value: unknown): DataSourceEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): DataSourceEntry[] => {
    if (!isRecord(item)) return [];
    const label = nonEmpty(item.label);
    if (!label) return [];
    const surveyId = nonEmpty(item.surveyId);
    if (surveyId) {
      const entry = surveyEntry({ id: surveyId, name: label }, []);
      if (entry) return [entry];
    }
    const url = httpUrl(item.url);
    const organization = nonEmpty(item.organization);
    const license = nonEmpty(item.license);
    return [
      {
        label,
        ...(organization ? { organization } : {}),
        ...(url ? { url } : {}),
        tables: [],
        ...(license ? { license } : {}),
      },
    ];
  });
}

/**
 * blog chart source.json 1 件の出典行。
 * `displaySources` があればそれだけを使う (GIS 派生など調査を原典としない図の明示契約)。
 * 無ければ taxonomy と同じ参照 (e-Stat 表 / rankingKey / sourceName) から導出する。
 * 調査対象外 (`surveyScope: "not-applicable"`) の図もデータの出所は表示するので除外しない。
 * `app/geo/<slug>/` を参照する図は `extractGeoAnalysisSlugs` で geo item の sources を別途引く。
 */
export function resolveBlogChartDataSources(
  sourceData: unknown,
  registry: MetricRegistry
): DataSourceEntry[] {
  if (!isRecord(sourceData)) return [];
  if (sourceData.kind === 'authored') return [];
  const explicit = parseDisplaySources(sourceData.displaySources);
  if (explicit.length > 0) return mergeDataSourceEntries(explicit);

  const entries: DataSourceEntry[] = [];
  const records = nestedRecords(sourceData);
  for (const record of records) {
    const cdCat01 =
      typeof record.cdCat01 === 'string'
        ? record.cdCat01
        : isRecord(record.params) && typeof record.params.cdCat01 === 'string'
          ? record.params.cdCat01
          : undefined;
    for (const statsDataId of splitStatsDataIds(record.statsDataId)) {
      entries.push(
        ...estatEntries(statsDataId, cdCat01, nonEmpty(record.statsName))
      );
    }
  }
  const references = extractBlogChartSourceReferences(sourceData);
  for (const key of references.rankingKeys) {
    const metric = registry[key];
    if (metric) entries.push(...resolveMetricDataSources(metric, registry));
  }
  for (const record of records) {
    const sourceName = nonEmpty(record.sourceName);
    if (!sourceName) continue;
    const link = httpUrl(record.url);
    const tables = link ? [{ label: sourceName, url: link }] : [];
    const surveyId = resolveSurveyIdBySourceName(sourceName);
    const entry = surveyId
      ? surveyEntry({ id: surveyId, name: sourceName }, tables)
      : undefined;
    entries.push(
      entry ?? { label: sourceName, ...(link ? { url: link } : {}), tables: [] }
    );
  }
  return mergeDataSourceEntries(entries);
}

/** source.json が参照する Geo 分析 slug (`app/geo/<slug>/...`)。出典は geo item.json の sources にある。 */
export function extractGeoAnalysisSlugs(sourceData: unknown): string[] {
  if (!isRecord(sourceData)) return [];
  return [
    ...new Set(
      [...JSON.stringify(sourceData).matchAll(/app\/geo\/([a-z0-9-]+)\//g)].map(
        (match) => match[1]
      )
    ),
  ];
}

/** geo item.json の `sources[]` ({name,url,version?,license?}) を出典行へ。 */
export function resolveGeoItemDataSources(geoItem: unknown): DataSourceEntry[] {
  const item = isRecord(geoItem) && isRecord(geoItem.item) ? geoItem.item : geoItem;
  if (!isRecord(item) || !Array.isArray(item.sources)) return [];
  return mergeDataSourceEntries(
    item.sources.flatMap((source): DataSourceEntry[] => {
      if (!isRecord(source)) return [];
      const label = nonEmpty(source.name);
      if (!label) return [];
      const url = httpUrl(source.url);
      const license = nonEmpty(source.license);
      return [
        {
          label,
          ...(url ? { url } : {}),
          tables: [],
          ...(license ? { license } : {}),
        },
      ];
    })
  );
}
