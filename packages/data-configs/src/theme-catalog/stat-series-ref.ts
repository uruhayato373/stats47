import { isYAxisConfig } from '@stats47/types';
/** Typed metric-ID series references, shared by catalog validation and R2 readers. */
import { isChartColorRole, type ChartColorRole } from "./chart-color-role";
import { parseFaqMarkdown } from "./faq-markdown";
import type { CatalogComponentType } from "./types";

// ChartColorRole の SSOT は chart-color-role.ts (resolver と parity テストの単一ソース)。
// 再 export はしない (index が chart-color-role から出すので二重 export を避ける)。

/**
 * metricKey が登録済みかを判定する関数。この module は全指標の registry を import しない
 * (ブラウザ向けの部品が型や解析だけを読むたびに指標定義 2,600 件超を巻き込むため)。
 * registry で確かめる版は `./registered-series-ref` にある。
 */
export type MetricKeyCheck = (metricKey: string) => boolean;

/** ブラウザ側の解析用。登録の確認はカタログ検査とサーバー側の解析で済ませてある。 */
export const SKIP_METRIC_REGISTRATION_CHECK: MetricKeyCheck = () => true;

/** 地域選択。既定は都道府県、`national` で全国系列。 */
export type AreaSelection = "prefecture" | "national";

/**
 * R2 上の 1 metric を指す型付き系列参照。**変換式・倍率・生 e-Stat コードを持たない。**
 * 単位・スケールは metric 側 (MetricConfig / WrittenStatsMeta) が持つ (WP3)。
 */
export interface StatSeriesRef {
  /** METRICS_REGISTRY のキー = R2 `app/ranking/<metricKey>/values.json` を指す */
  metricKey: string;
  /** 特定年に固定する場合 (4 桁)。省略時は最新 / 全年 */
  year?: string;
  /** 都道府県 or 全国 */
  area?: AreaSelection;
  /** 凡例・タブ表示ラベル */
  label?: string;
  /** 色は意味ロールで解決する (色コードを持たない) */
  colorRole?: ChartColorRole;
}


export interface LineChartComponentProps {
  seriesRefs: StatSeriesRef[];
  labels?: string[];
  seriesColors?: string[];
  showLatestValues?: boolean;
  yAxisConfig?: import('@stats47/types').YAxisConfig;
}

export interface MixedChartComponentProps {
  columnSeriesRefs: StatSeriesRef[];
  lineSeriesRefs: StatSeriesRef[];
  columnLabels?: string[];
  lineLabels?: string[];
  leftUnit?: string;
  rightUnit?: string;
  columnColors?: string[];
  lineColors?: string[];
}

export interface CompositionChartComponentProps {
  seriesRefs: StatSeriesRef[];
  defaultTab?: "composition" | "trend";
}

export interface DonutChartComponentProps {
  seriesRefs: StatSeriesRef[];
  topN?: number;
}

export interface CpiChartComponentProps {
  seriesRefs: StatSeriesRef[];
  year?: string;
}

export interface PyramidChartComponentProps {
  seriesRefs: StatSeriesRef[];
}

export interface KpiChartComponentProps {
  seriesRefs?: StatSeriesRef[];
  unit?: string;
}

export interface MarkdownChartComponentProps {
  markdown: string;
  displayMode?: 'prose' | 'faq';
  subtitle?: string;
  sources?: { label: string; url?: string }[];
}

/** runtime が扱う 6 chart の共有 discriminated union。 */
export type ThemeDbChartComponentProps =
  | { componentType: "line-chart"; props: LineChartComponentProps }
  | { componentType: "mixed-chart"; props: MixedChartComponentProps }
  | { componentType: "composition-chart"; props: CompositionChartComponentProps }
  | { componentType: "donut-chart"; props: DonutChartComponentProps }
  | { componentType: "cpi-profile"; props: CpiChartComponentProps }
  | { componentType: "cpi-heatmap"; props: CpiChartComponentProps };

// ---- 現行 componentProps の discriminated-union 検証 ----

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isStatSeriesRef(v: unknown, isKnownMetric: MetricKeyCheck): v is StatSeriesRef {
  if (!isRecord(v) || !nonEmptyString(v.metricKey) || !isKnownMetric(v.metricKey)) return false;
  if (!hasOnlyKeys(v, ["metricKey", "year", "area", "label", "colorRole"])) return false;
  if (v.year !== undefined && (typeof v.year !== "string" || !/^\d{4}$/.test(v.year))) {
    return false;
  }
  if (v.area !== undefined && v.area !== "prefecture" && v.area !== "national") {
    return false;
  }
  if (v.label !== undefined && !nonEmptyString(v.label)) return false;
  if (v.colorRole !== undefined && !isChartColorRole(v.colorRole)) return false;
  return true;
}

/** runtime / validator が共有する seriesRefs parser。無効・空配列は null。 */
export function parseStatSeriesRefsWith(v: unknown, isKnownMetric: MetricKeyCheck): StatSeriesRef[] | null {
  if (!Array.isArray(v) || v.length === 0 || !v.every((item) => isStatSeriesRef(item, isKnownMetric))) return null;
  return v;
}


function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(nonEmptyString);
}


function isRankingLinks(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(
      (item) =>
        isRecord(item) &&
        hasOnlyKeys(item, ["label", "url"]) &&
        nonEmptyString(item.label) &&
        nonEmptyString(item.url),
    )
  );
}

function isMarkdownSources(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.every(
      (item) =>
        isRecord(item) &&
        hasOnlyKeys(item, ["label", "url"]) &&
        nonEmptyString(item.label) &&
        (item.url === undefined || nonEmptyString(item.url)),
    )
  );
}

const GENERATED_PROP_KEYS = ["annotation", "rankingLinks"] as const;

function validateKnownKeys(
  componentType: string,
  props: Record<string, unknown>,
  componentKeys: readonly string[],
): string[] {
  const allowed = new Set<string>([...componentKeys, ...GENERATED_PROP_KEYS]);
  return Object.keys(props)
    .filter((key) => !allowed.has(key))
    .map((key) => `${componentType}: 未知の field "${key}"`);
}

function validateGeneratedProps(props: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (props.annotation !== undefined && !nonEmptyString(props.annotation)) {
    errors.push("annotation は空でない string にする");
  }
  if (props.rankingLinks !== undefined && !isRankingLinks(props.rankingLinks)) {
    errors.push("rankingLinks は {label,url} の非空配列にする");
  }
  return errors;
}

/**
 * componentType ごとに componentProps の必須フィールドを検証する (errors[] を返す)。
 * exhaustive switch。未知の componentType は skip せず error にする (依存の取りこぼしを防ぐ)。
 */
export function validateChartPropsWith(
  componentType: string,
  props: Record<string, unknown>,
  isKnownMetric: MetricKeyCheck,
): string[] {
  const errors: string[] = [];
  let allowed: string[] = [];
  const need = (valid: boolean, message: string) => { if (!valid) errors.push(componentType + ': ' + message); };
  const refs = (key: string) => need(parseStatSeriesRefsWith(props[key], isKnownMetric) !== null, key + ' は登録済み metricKey の非空配列');
  switch (componentType as CatalogComponentType) {
    case 'line-chart':
      allowed = ['seriesRefs', 'labels', 'seriesColors', 'showLatestValues', 'yAxisConfig'];refs('seriesRefs');
      if (props.yAxisConfig !== undefined) need(isYAxisConfig(props.yAxisConfig), 'yAxisConfig が不正');
      if (props.showLatestValues !== undefined) need(typeof props.showLatestValues === 'boolean', 'showLatestValues はboolean');
      break;
    case 'mixed-chart':
      allowed = ['columnSeriesRefs', 'lineSeriesRefs', 'columnLabels', 'lineLabels', 'leftUnit', 'rightUnit', 'columnColors', 'lineColors'];refs('columnSeriesRefs');refs('lineSeriesRefs');break;
    case 'composition-chart':
      allowed = ['seriesRefs', 'defaultTab'];refs('seriesRefs');
      if (props.defaultTab !== undefined) need(props.defaultTab === 'composition' || props.defaultTab === 'trend', 'defaultTab が不正');break;
    case 'donut-chart':
      allowed = ['seriesRefs', 'topN'];refs('seriesRefs');
      if (props.topN !== undefined) need(Number.isInteger(props.topN) && Number(props.topN) > 0, 'topN は正の整数');break;
    case 'cpi-profile': case 'cpi-heatmap': allowed = ['seriesRefs', 'year'];refs('seriesRefs');
      if (props.year !== undefined) need(typeof props.year === 'string' && /^\d{4}$/.test(props.year), 'year は4桁年');break;
    case 'pyramid-chart': allowed = ['seriesRefs'];need(parseStatSeriesRefsWith(props.seriesRefs, isKnownMetric)?.length === 34, '年齢×性別metric34件が必要');break;
    case 'kpi-card': allowed = ['seriesRefs', 'unit'];
      if (props.seriesRefs !== undefined) need(parseStatSeriesRefsWith(props.seriesRefs, isKnownMetric)?.length === 1, 'metric1件が必要');break;
    case 'markdown-section':
      allowed = ['markdown', 'displayMode', 'subtitle', 'sources'];need(nonEmptyString(props.markdown), '本文が必要');
      if (props.displayMode !== undefined) need(props.displayMode === 'prose' || props.displayMode === 'faq', 'displayMode が不正');
      if (props.displayMode === 'faq') { const parsed = parseFaqMarkdown(props.markdown);need(parsed.ok, parsed.ok ? '' : parsed.error); }
      if (props.sources !== undefined) need(isMarkdownSources(props.sources), 'sources が不正');break;
    default: errors.push('未知のcomponentType: ' + componentType);
  }
  for (const key of ['labels', 'seriesColors', 'columnLabels', 'lineLabels', 'columnColors', 'lineColors']) if (props[key] !== undefined) need(isStringArray(props[key]), key + ' はstring配列');
  for (const key of ['unit', 'leftUnit', 'rightUnit', 'subtitle']) if (props[key] !== undefined) need(nonEmptyString(props[key]), key + ' は空でないstring');
  errors.push(...validateKnownKeys(componentType, props, allowed), ...validateGeneratedProps(props));
  return errors;
}

/** catalog validator と runtime が同じ schema を使う唯一の parser。 */
export function parseThemeDbChartComponentPropsWith(
  componentType: string,
  props: Record<string, unknown>,
  isKnownMetric: MetricKeyCheck,
): ThemeDbChartComponentProps | null {
  if (validateChartPropsWith(componentType, props, isKnownMetric).length > 0) return null;
  switch (componentType) {
    case "line-chart":
      return { componentType, props: props as unknown as LineChartComponentProps };
    case "mixed-chart":
      return { componentType, props: props as unknown as MixedChartComponentProps };
    case "composition-chart":
      return { componentType, props: props as unknown as CompositionChartComponentProps };
    case "donut-chart":
      return { componentType, props: props as unknown as DonutChartComponentProps };
    case "cpi-profile":
    case "cpi-heatmap":
      return { componentType, props: props as unknown as CpiChartComponentProps };
    default:
      return null;
  }
}
