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
 * 関連: docs/01_技術設計/02_データアーキテクチャ.md (metrics = Reference/再生成),
 *       コミット 67168f54 が残した follow-up の完成。
 */
import {
  buildRecipe,
  resolveAttribution,
  resolveMetricProvenance,
  type MetricConfig,
  type MetricRegistry,
  type ProvenanceSurvey,
} from "@stats47/data-configs";
import {
  resolveRankingReaderLabel,
  resolveRankingHook,
} from "@stats47/data-configs/prominence";
import { assertKnownColorScheme } from "@stats47/types";
import type { AreaType } from "@stats47/types";

import surveysMaster from "../data/surveys.json";

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
  // Authored presentation is complete and validated before snapshot generation.
  assertKnownColorScheme(config.visualization.colorScheme, `build-ranking-item(${config.key})`);
  return { ...config.visualization };
}

/** config が持つ複数の命名ゆれから計算種別を 1 つに正規化する */
const CALCULATION_TYPES = new Set(["ratio", "per_capita", "subtraction"]);

function resolveCalculationType(
  c: MetricConfig["calculation"],
): CalculationConfig["type"] | undefined {
  // 計算の種類は指標定義の type で決まる。
  const raw = c?.type;
  return raw && CALCULATION_TYPES.has(raw) ? (raw as CalculationConfig["type"]) : undefined;
}

function buildCalculation(config: MetricConfig): CalculationConfig | null {
  const c = config.calculation;
  // 正規化も calculation の型付き定義から生成する。
  const normalizationOptions: NormalizationOption[] | undefined =
    c?.normalizationOptions;
  if (!c && !normalizationOptions) return null;

  // ★`type` を焼く。焼かないと calculate-ranking-values.ts の
  //   `if (!calculation?.isCalculated || !calculation.type) return []` に必ず引っかかり、
  //   計算型 metric のオンデマンド取得が**全件空**になる (2026-07-30 に発見)。
  const type = resolveCalculationType(c);
  // 分子・分母キーも命名ゆれ (numeratorKey / numerator / numeratorRankingKey) を吸収する
  const numeratorKey = c?.numeratorKey;
  const denominatorKey = c?.denominatorKey;

  return {
    isCalculated: c?.isCalculated ?? false,
    ...(type ? { type } : {}),
    ...(numeratorKey ? { numeratorKey } : {}),
    ...(denominatorKey ? { denominatorKey } : {}),
    // ★期間換算とスケールも焼く。焼かないとランタイムの on-demand 計算だけが
    //   換算なしの生値を返し、正典 (app/stats) と食い違う。
    ...(c?.periodAlign ? { periodAlign: c.periodAlign } : {}),
    ...(typeof c?.scaleFactor === "number" ? { scaleFactor: c.scaleFactor } : {}),
    // ★`formula` (自由文字列) は焼かない。repo 全体で読むコードが 1 つも無く、
    //   実行と結びついていないため実装と乖離しうる。正確で実行可能な表現は
    //   sourceConfig.recipe が持つ (tabCombination / axisRatio / axisSum)。
    ...(normalizationOptions ? { normalizationOptions } : {}),
  };
}

/** Generate provenance from the same recipe used for ingestion and audits. */
function buildSourceProvenance(config: MetricConfig): SourceProvenance | null {
  const s = config.source;
  if (!s) return null;
  const recipe = buildRecipe(config);
  const name = "displayName" in s ? s.displayName : undefined;
  const url = "url" in s ? s.url : undefined;

  const provenance: SourceProvenance = { recipe };
  if (name || url) {
    provenance.source = { ...(name ? { name } : {}), ...(url ? { url } : {}) };
  }
  return provenance;
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
  const sourceConfig = buildSourceProvenance(config);

  return {
    rankingKey: config.key,
    areaType: "prefecture" as AreaType,
    rankingName: config.title,
    title: config.title,
    readerLabel: resolveRankingReaderLabel({
      rankingKey: config.key,
      title: config.title,
    }),
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
    sourceConfig,
    // ★builder が attribution を焼く。以前は per-url exporter だけが焼いていたため、
    //   generator が後から走ると attribution が消えていた (書き手が 2 系統あった)。
    //   exporter 側は焼かれた値をそのまま尊重する。
    attribution: resolveAttribution(sourceConfig?.recipe.estatParams?.statsDataId ?? sourceConfig?.recipe.refetch?.statsDataId, sourceConfig?.recipe.estatParams?.cdCat01 ?? sourceConfig?.recipe.refetch?.cdCat01),
    seoTitle: config.seoTitle ?? null,
    seoDescription: config.seoDescription ?? null,
    hook: resolveRankingHook({
      rankingKey: config.key,
      title: config.title,
      unit: config.unit ?? "",
    }),
    tags: (config.tags ?? []).map((tagKey) => ({ tagKey })),
    createdAt: ctx.existing?.createdAt ?? ctx.now,
    updatedAt: ctx.now,
  };
}
