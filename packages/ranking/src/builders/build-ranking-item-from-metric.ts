/**
 * config (MetricConfig, git TS = SSOT) → RankingItem (R2 item.json の中身) を
 * 決定的に組み立てる純粋関数。
 *
 * 設計の核心: item.json を **入力にしない**。入力は config + values.json 由来の
 * 年集合のみ。これにより「config を変えれば item.json が決まる」不変条件を保証し、
 * DBレス移行で壊れた「item.json が de-facto SSOT」状態を解消する。
 *
 * surveyId / tags は statsDataId から決定的導出不可な editorial データのため
 * MetricConfig.surveyId / MetricConfig.tags (backfill 済) を SSOT とする。
 *
 * 関連: docs/01_技術設計/19_完全DBレス設計.md (metrics = Reference/再生成),
 *       コミット 67168f54 が残した follow-up の完成。
 */
import type { MetricConfig } from "@stats47/data-configs";
import type { AreaType } from "@stats47/types";
import type {
  ColorSchemeType,
  D3ColorScheme,
  DivergingMidpoint,
  MinValueType,
} from "@stats47/visualization/d3";

import type {
  CalculationConfig,
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
}

export interface BuildContext {
  /** values.json 由来。観測が一つも無い (404 / calculated 等) なら null */
  values: ValuesContext | null;
  /** createdAt/updatedAt 用 ISO タイムスタンプ (注入で決定性を確保) */
  now: string;
  /** 既存 item.json があれば createdAt を保持する (任意) */
  existing?: { createdAt?: string };
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
    isActive: config.isActive ?? false,
    valueDisplay: buildValueDisplay(config),
    visualization: buildVisualization(config),
    calculation: buildCalculation(config),
    surveyId: config.surveyId ?? null,
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
