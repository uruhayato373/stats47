/**
 * survey taxonomy の横断解決 core。
 *
 * ranking / theme chart / blog chart は surveyId を個別に持たない。
 * それぞれが持つ metricKey または e-Stat param を、この core から既存の
 * `resolveSurveyLinkage` / `resolveProvenanceByParams` へ渡して派生する。
 *
 * 正典: `.claude/rules/survey-linkage-standards.md`
 */
import {
  resolveProvenanceByParams,
  resolveSurveyIdBySourceName,
  type MetricRegistry,
  type ProvenanceSurvey,
} from "@stats47/data-configs";
import {
  collectChartDependencies,
  type ThemeCatalog,
} from "@stats47/data-configs/theme-catalog";

import surveysMaster from "../data/surveys.json";
import { resolveSurveyLinkage } from "../builders/build-ranking-item-from-metric";

export interface SurveyEstatReference {
  statsDataId: string;
  cdCat01?: string;
}

export interface SurveyTaxonomyInput {
  metricKeys?: readonly string[];
  estatReferences?: readonly SurveyEstatReference[];
  sourceNames?: readonly string[];
}

export interface SurveyTaxonomyResolution {
  surveys: ProvenanceSurvey[];
  resolvedMetricKeys: string[];
  unresolvedMetricKeys: string[];
  resolvedEstatReferences: SurveyEstatReference[];
  unresolvedEstatReferences: SurveyEstatReference[];
  resolvedSourceNames: string[];
  unresolvedSourceNames: string[];
}

export type SurveySurfaceStatus =
  | "resolved"
  | "unresolved"
  | "not-applicable"
  | "missing-lineage";

export interface ThemeChartSurveyTaxonomy {
  componentKey: string;
  componentType: string;
  status: SurveySurfaceStatus;
  surveys: ProvenanceSurvey[];
  metricKeys: string[];
  estatReferences: SurveyEstatReference[];
  unresolvedMetricKeys: string[];
  unresolvedEstatReferences: SurveyEstatReference[];
}

export interface ThemeSurveyTaxonomy {
  themeKey: string;
  surveys: ProvenanceSurvey[];
  metrics: SurveyTaxonomyResolution;
  charts: ThemeChartSurveyTaxonomy[];
}

export interface BlogChartSourceReferences {
  rankingKeys: string[];
  statsDataIds: string[];
  estatReferences: SurveyEstatReference[];
  sourceNames: string[];
}

export interface BlogChartSurveyTaxonomy {
  kind: string | null;
  status: SurveySurfaceStatus;
  surveys: ProvenanceSurvey[];
  references: BlogChartSourceReferences;
  unresolvedMetricKeys: string[];
  unresolvedEstatReferences: SurveyEstatReference[];
  unresolvedSourceNames: string[];
}

const MASTER_BY_ID = new Map(
  (surveysMaster as Array<{ id: string; name: string }>).map((survey) => [survey.id, survey]),
);
const MASTER_IDS = new Set(MASTER_BY_ID.keys());

const NON_SURVEY_BLOG_KINDS = new Set(["authored"]);

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function dedupeSurveys(surveys: readonly ProvenanceSurvey[]): ProvenanceSurvey[] {
  const byId = new Map<string, ProvenanceSurvey>();
  for (const survey of surveys) {
    if (!MASTER_IDS.has(survey.id) || byId.has(survey.id)) continue;
    const master = MASTER_BY_ID.get(survey.id);
    byId.set(survey.id, { id: survey.id, name: master?.name ?? survey.name });
  }
  return [...byId.values()];
}

/** master に実在する survey id だけを名称付きで返す。snapshot の id 復元用。 */
export function getSurveyTaxonomyEntries(ids: readonly string[]): ProvenanceSurvey[] {
  return unique(ids).flatMap((id) => {
    const survey = MASTER_BY_ID.get(id);
    return survey ? [{ id: survey.id, name: survey.name }] : [];
  });
}

/**
 * metricKey / e-Stat param を master 実在 survey へ解決する唯一の横断入口。
 * 未解決を空に丸めず参照単位で返し、audit が取りこぼしを可視化できるようにする。
 */
export function resolveSurveyTaxonomy(
  input: SurveyTaxonomyInput,
  registry: MetricRegistry,
): SurveyTaxonomyResolution {
  const surveys: ProvenanceSurvey[] = [];
  const resolvedMetricKeys: string[] = [];
  const unresolvedMetricKeys: string[] = [];
  const resolvedEstatReferences: SurveyEstatReference[] = [];
  const unresolvedEstatReferences: SurveyEstatReference[] = [];
  const resolvedSourceNames: string[] = [];
  const unresolvedSourceNames: string[] = [];

  for (const key of unique(input.metricKeys ?? [])) {
    const metric = registry[key];
    if (!metric) {
      unresolvedMetricKeys.push(key);
      continue;
    }
    const resolved = resolveSurveyLinkage(metric, registry).originalSurveys;
    const valid = dedupeSurveys(resolved);
    if (valid.length === 0) unresolvedMetricKeys.push(key);
    else {
      resolvedMetricKeys.push(key);
      surveys.push(...valid);
    }
  }

  const seenEstat = new Set<string>();
  for (const reference of input.estatReferences ?? []) {
    if (!reference.statsDataId) continue;
    const identity = `${reference.statsDataId}::${reference.cdCat01 ?? ""}`;
    if (seenEstat.has(identity)) continue;
    seenEstat.add(identity);
    const resolved = dedupeSurveys(
      resolveProvenanceByParams(reference.statsDataId, reference.cdCat01),
    );
    if (resolved.length === 0) unresolvedEstatReferences.push(reference);
    else {
      resolvedEstatReferences.push(reference);
      surveys.push(...resolved);
    }
  }

  for (const sourceName of unique(input.sourceNames ?? [])) {
    const surveyId = resolveSurveyIdBySourceName(sourceName);
    const entries = surveyId ? getSurveyTaxonomyEntries([surveyId]) : [];
    if (entries.length === 0) unresolvedSourceNames.push(sourceName);
    else {
      resolvedSourceNames.push(sourceName);
      surveys.push(...entries);
    }
  }

  return {
    surveys: dedupeSurveys(surveys),
    resolvedMetricKeys,
    unresolvedMetricKeys,
    resolvedEstatReferences,
    unresolvedEstatReferences,
    resolvedSourceNames,
    unresolvedSourceNames,
  };
}

function chartMetricKeys(chart: ThemeCatalog["charts"][number]): string[] {
  return unique(chart.relatedRankingKeys ?? []);
}

/** ThemeCatalog の metric と全 chart を survey taxonomy へ決定的に接続する。 */
export function resolveThemeSurveyTaxonomy(
  catalog: ThemeCatalog,
  registry: MetricRegistry,
): ThemeSurveyTaxonomy {
  const metrics = resolveSurveyTaxonomy(
    { metricKeys: catalog.metrics.map((metric) => metric.rankingKey) },
    registry,
  );
  const charts = catalog.charts.map((chart): ThemeChartSurveyTaxonomy => {
    if (chart.componentType === "markdown-section") {
      return {
        componentKey: chart.componentKey,
        componentType: chart.componentType,
        status: "not-applicable",
        surveys: [],
        metricKeys: [],
        estatReferences: [],
        unresolvedMetricKeys: [],
        unresolvedEstatReferences: [],
      };
    }

    const metricKeys = chartMetricKeys(chart);
    const estatReferences = collectChartDependencies(chart).requests.map((request) => ({
      statsDataId: request.statsDataId,
      ...(request.filters.cdCat01 ? { cdCat01: request.filters.cdCat01 } : {}),
    }));
    const resolution = resolveSurveyTaxonomy({ metricKeys, estatReferences }, registry);
    const hasReferences = metricKeys.length > 0 || estatReferences.length > 0;

    return {
      componentKey: chart.componentKey,
      componentType: chart.componentType,
      status:
        resolution.surveys.length > 0
          ? "resolved"
          : hasReferences
            ? "unresolved"
            : "missing-lineage",
      surveys: resolution.surveys,
      metricKeys,
      estatReferences,
      unresolvedMetricKeys: resolution.unresolvedMetricKeys,
      unresolvedEstatReferences: resolution.unresolvedEstatReferences,
    };
  });

  return {
    themeKey: catalog.key,
    surveys: dedupeSurveys([
      ...metrics.surveys,
      ...charts.flatMap((chart) => chart.surveys),
    ]),
    metrics,
    charts,
  };
}

function splitReferenceValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(splitReferenceValues);
  if (typeof value !== "string") return [];
  return value
    .split(/[+|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitStatsDataIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(splitStatsDataIds);
  if (typeof value !== "string") return [];
  return value
    .split(/[/+|,]/)
    .map((item) => item.trim())
    .filter((item) => /^\d{10,}$/.test(item));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nestedRecords(source: Record<string, unknown>): Record<string, unknown>[] {
  return [
    source,
    ...(Array.isArray(source.inputs) ? source.inputs.filter(isRecord) : []),
    ...(Array.isArray(source.sources) ? source.sources.filter(isRecord) : []),
    ...(Array.isArray(source.derivedFrom) ? source.derivedFrom.filter(isRecord) : []),
  ];
}

/** blog chart source.json から taxonomy が読む参照だけを決定的に抽出する。 */
export function extractBlogChartSourceReferences(sourceData: unknown): BlogChartSourceReferences {
  if (!isRecord(sourceData)) {
    return { rankingKeys: [], statsDataIds: [], estatReferences: [], sourceNames: [] };
  }

  const nested = nestedRecords(sourceData);
  const rankingKeys = unique([
    ...splitReferenceValues(sourceData.rankingKey),
    ...splitReferenceValues(sourceData.rankingKeys),
    ...splitReferenceValues(sourceData.xKey),
    ...splitReferenceValues(sourceData.yKey),
    ...splitReferenceValues(sourceData.xRankingKey),
    ...splitReferenceValues(sourceData.yRankingKey),
    ...nested.flatMap((item) => splitReferenceValues(item.rankingKey)),
    ...(Array.isArray(sourceData.derivedFrom)
      ? sourceData.derivedFrom.flatMap((item) =>
          typeof item === "string" ? splitReferenceValues(item) : [],
        )
      : []),
    ...[...JSON.stringify(sourceData).matchAll(/(?:r2:)?app\/ranking\/([^/"\s{}]+)\/values\.json/g)]
      .map((match) => match[1]),
  ]).filter((item) => !item.includes("/") && !item.includes(":"));

  const estatReferences: SurveyEstatReference[] = [];
  for (const item of nested) {
    const ids = splitStatsDataIds(item.statsDataId);
    const cdCat01 = typeof item.cdCat01 === "string" ? item.cdCat01 : undefined;
    for (const statsDataId of ids) {
      estatReferences.push({ statsDataId, ...(cdCat01 ? { cdCat01 } : {}) });
    }
  }
  const statsDataIds = unique(estatReferences.map((reference) => reference.statsDataId));
  const sourceNames = unique(
    nested.flatMap((item) => splitReferenceValues(item.sourceName)),
  );

  return { rankingKeys, statsDataIds, estatReferences, sourceNames };
}

/** blog chart source.json 1 件を survey taxonomy へ接続する。 */
export function resolveBlogChartSurveyTaxonomy(
  sourceData: unknown,
  registry: MetricRegistry,
): BlogChartSurveyTaxonomy {
  if (!isRecord(sourceData)) {
    return {
      kind: null,
      status: "missing-lineage",
      surveys: [],
      references: { rankingKeys: [], statsDataIds: [], estatReferences: [], sourceNames: [] },
      unresolvedMetricKeys: [],
      unresolvedEstatReferences: [],
      unresolvedSourceNames: [],
    };
  }
  const kind = typeof sourceData.kind === "string" ? sourceData.kind : null;
  const references = extractBlogChartSourceReferences(sourceData);
  if (kind && NON_SURVEY_BLOG_KINDS.has(kind)) {
    return {
      kind,
      status: "not-applicable",
      surveys: [],
      references,
      unresolvedMetricKeys: [],
      unresolvedEstatReferences: [],
      unresolvedSourceNames: [],
    };
  }
  if (kind === "manual" && references.sourceNames.length === 0) {
    return {
      kind,
      status: "not-applicable",
      surveys: [],
      references,
      unresolvedMetricKeys: [],
      unresolvedEstatReferences: [],
      unresolvedSourceNames: [],
    };
  }
  const resolution = resolveSurveyTaxonomy(
    {
      metricKeys: references.rankingKeys,
      estatReferences: references.estatReferences,
      sourceNames: references.sourceNames,
    },
    registry,
  );
  const hasReferences =
    references.rankingKeys.length > 0 ||
    references.estatReferences.length > 0 ||
    references.sourceNames.length > 0;
  return {
    kind,
    status:
      resolution.surveys.length > 0
        ? "resolved"
        : hasReferences
          ? "unresolved"
          : "missing-lineage",
    surveys: resolution.surveys,
    references,
    unresolvedMetricKeys: resolution.unresolvedMetricKeys,
    unresolvedEstatReferences: resolution.unresolvedEstatReferences,
    unresolvedSourceNames: resolution.unresolvedSourceNames,
  };
}
