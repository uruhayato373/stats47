/**
 * config (MetricConfig, git TS = SSOT) → RankingItem (R2 item.json の中身) を
 * 決定的に組み立てる純粋関数。
 *
 * 設計の核心: item.json を **入力にしない**。入力は config + values.json 由来の
 * 年集合のみ。これにより「config を変えれば item.json が決まる」不変条件を保証し、
 * DBレス移行で壊れた「item.json が de-facto SSOT」状態を解消する。
 *
 * tags は statsDataId から決定的導出不可な editorial データのため MetricConfig.tags を SSOT とする。
 * survey 紐付け (surveyIds/originalSurveys) は config.source から provenance 辞書で**決定的導出**して
 * 焼き込む (config.surveyId は手動オーバーライドとして優先)。正典: .claude/rules/survey-linkage-standards.md
 *
 * 関連: docs/01_技術設計/12_完全DBレス設計.md (metrics = Reference/再生成),
 *       コミット 67168f54 が残した follow-up の完成。
 */
import {
  resolveMetricProvenance,
  type MetricConfig,
  type MetricRegistry,
  type ProvenanceSurvey,
} from "@stats47/data-configs";
import type { AreaType } from "@stats47/types";

import surveysMaster from "../data/surveys.json";
import type {
  ColorSchemeType,
  D3ColorScheme,
  DivergingMidpoint,
  MinValueType,
} from "@stats47/visualization/d3";

import type {
  CalculationConfig,
  FeaturedValue,
  NormalizationOption,
  RankingItem,
  SourceProvenance,
  ValueDisplayConfig,
  VisualizationConfig,
} from "../types/ranking-item";

/** values.json (app/stats/<key>/values.json) から導出した、ビルドに必要な観測値メタ */
export interface ValuesContext {
  /** 観測がある年コード (4桁) の降順ユニーク配列 */
  yearCodes: string[];
  /** 最新年の「1位」(deriveFeaturedTop)。取れなければnull */
  latestTop?: FeaturedValue | null;
}

export interface BuildContext {
  /** values.json 由来。観測が一つも無い (404 / calculated 等) なら null */
  values: ValuesContext | null;
  /** createdAt/updatedAt 用 ISO タイムスタンプ (注入で決定性を確保) */
  now: string;
  /** 既存 item.json があれば createdAt を保持する (任意) */
  existing?: { createdAt?: string };
  /** calculated metric の分子/分母から survey を辿るための registry (任意) */
  registry?: MetricRegistry;
}

/** surveys.json に実在する id (合成 id や辞書の stale id を配信に出さないための照合集合) */
const SURVEY_MASTER_IDS = new Set(
  (surveysMaster as Array<{ id: string }>).map((s) => s.id),
);

/**
 * config.source → surveys マスタ実在の調査群を決定的導出する。
 * 優先順位: config.surveyId (手動オーバーライド) > provenance 辞書導出 > 空 (未分類)。
 * 合成 id (`ssds-src:` / `src:`) とマスタ非実在 id は配信に出さない。
 */
export function resolveSurveyLinkage(
  config: MetricConfig,
  registry?: MetricRegistry,
): { surveyIds: string[]; originalSurveys: ProvenanceSurvey[] } {
  const resolved = resolveMetricProvenance(config, registry).filter((s) =>
    SURVEY_MASTER_IDS.has(s.id),
  );
  if (config.surveyId && SURVEY_MASTER_IDS.has(config.surveyId)) {
    // 手動オーバーライドを先頭にし、辞書導出の残り (SSDS 複数原典) を後続に保つ
    const rest = resolved.filter((s) => s.id !== config.surveyId);
    const master = (surveysMaster as Array<{ id: string; name: string }>).find(
      (s) => s.id === config.surveyId,
    );
    const head: ProvenanceSurvey = { id: config.surveyId, name: master?.name ?? config.surveyId };
    const originalSurveys = [head, ...rest];
    return { surveyIds: originalSurveys.map((s) => s.id), originalSurveys };
  }
  return { surveyIds: resolved.map((s) => s.id), originalSurveys: resolved };
}

/** config.yearFormat に応じた yearName ("YYYY年度" / "YYYY年")。page-data-batch と同一規約 */
export function yearNameOf(yearCode: string, yearFormat: MetricConfig["yearFormat"]): string {
  return yearFormat === "fiscal" ? `${yearCode}年度` : `${yearCode}年`;
}

function buildYears(
  config: MetricConfig,
  values: ValuesContext | null,
): Pick<RankingItem, "latestYear" | "availableYears"> {
  if (!values || values.yearCodes.length === 0) {
    return { latestYear: null, availableYears: null };
  }
  const availableYears = values.yearCodes.map((yearCode) => ({
    yearCode,
    yearName: yearNameOf(yearCode, config.yearFormat),
  }));
  return { latestYear: availableYears[0], availableYears };
}

function buildValueDisplay(config: MetricConfig): ValueDisplayConfig {
  const d = config.display;
  return {
    conversionFactor: d?.conversionFactor ?? 1,
    decimalPlaces: d?.decimalPlaces ?? 0,
    ...(d?.displayUnit ? { displayUnit: d.displayUnit } : {}),
  };
}

function buildVisualization(config: MetricConfig): VisualizationConfig {
  const v = config.visualization;
  // config 側は colorScheme/colorSchemeType を string で持つ。値は妥当なため brand 型に cast。
  return {
    colorScheme: (v?.colorScheme ?? "interpolateBlues") as D3ColorScheme,
    colorSchemeType: (v?.colorSchemeType ?? "sequential") as ColorSchemeType,
    minValueType: (v?.minValueType ?? "data-min") as MinValueType,
    ...(v?.divergingMidpoint
      ? { divergingMidpoint: v.divergingMidpoint as DivergingMidpoint }
      : {}),
    ...(v?.divergingMidpointValue !== undefined
      ? { divergingMidpointValue: v.divergingMidpointValue }
      : {}),
    ...(v?.isReversed !== undefined ? { isReversed: v.isReversed } : {}),
    ...(v?.isSymmetrized !== undefined ? { isSymmetrized: v.isSymmetrized } : {}),
  };
}

function buildCalculation(config: MetricConfig): CalculationConfig | null {
  const c = config.calculation;
  // normalizationOptions は legacy で display 側に入る metric もある
  const normalizationOptions: NormalizationOption[] | undefined =
    (c?.normalizationOptions as NormalizationOption[] | undefined) ??
    (config.display?.normalizationOptions as NormalizationOption[] | undefined);
  if (!c && !normalizationOptions) return null;
  return {
    isCalculated: c?.isCalculated ?? false,
    ...(c?.numeratorKey ? { numeratorKey: c.numeratorKey } : {}),
    ...(c?.denominatorKey ? { denominatorKey: c.denominatorKey } : {}),
    ...(c?.formula ? { formula: c.formula } : {}),
    ...(normalizationOptions ? { normalizationOptions } : {}),
  };
}

/** config.source (取り込み union) → 表示用 SourceProvenance に再構築 */
function buildSourceProvenance(config: MetricConfig): SourceProvenance | null {
  const s = config.source;
  if (!s) return null;
  const name = "displayName" in s ? s.displayName : undefined;
  const url = "url" in s ? s.url : undefined;
  const provenance: SourceProvenance = {};
  if (s.kind === "estat") {
    if (s.statsDataId) provenance.statsDataId = s.statsDataId;
    if (s.cdCat01) provenance.cdCat01 = s.cdCat01;
    if (s.cdCat02) provenance.cdCat02 = s.cdCat02;
  }
  if (name || url) {
    provenance.source = { ...(name ? { name } : {}), ...(url ? { url } : {}) };
  }
  return Object.keys(provenance).length > 0 ? provenance : null;
}

/**
 * MetricConfig → RankingItem。areaType は常に "prefecture"。
 * 計算系・外部系 metric は values=null で latestYear/availableYears が null になる。
 */
export function buildRankingItemFromMetric(
  config: MetricConfig,
  ctx: BuildContext,
): RankingItem {
  const { latestYear, availableYears } = buildYears(config, ctx.values);
  const { surveyIds, originalSurveys } = resolveSurveyLinkage(config, ctx.registry);

  return {
    rankingKey: config.key,
    areaType: "prefecture" as AreaType,
    rankingName: config.title,
    title: config.title,
    ...(config.subtitle ? { subtitle: config.subtitle } : {}),
    unit: config.unit,
    categoryKey: config.category,
    additionalCategories: config.additionalCategories ?? null,
    ...(config.groupKey ? { groupKey: config.groupKey } : {}),
    ...(config.note ? { annotation: config.note } : {}),
    ...(config.description ? { description: config.description } : {}),
    latestYear,
    availableYears,
    latestTop: ctx.values?.latestTop ?? null,
    isActive: config.isActive ?? false,
    valueDisplay: buildValueDisplay(config),
    visualization: buildVisualization(config),
    calculation: buildCalculation(config),
    surveyId: config.surveyId ?? surveyIds[0] ?? null,
    surveyIds,
    originalSurveys,
    dataSourceId: config.source?.kind ?? "estat",
    sourceConfig: buildSourceProvenance(config),
    seoTitle: config.seoTitle ?? null,
    seoDescription: config.seoDescription ?? null,
    isFeatured: config.isFeatured ?? false,
    featuredOrder: config.featuredOrder ?? 0,
    tags: (config.tags ?? []).map((tagKey) => ({ tagKey })),
    createdAt: ctx.existing?.createdAt ?? ctx.now,
    updatedAt: ctx.now,
  };
}
