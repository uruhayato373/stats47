/**
 * StatSeriesRef — チャートが読む「1 系列 = R2 上の 1 metric」への型付き参照 (WP1)
 *
 * 現状の ThemeCatalog は各 chart の `componentProps` を `Record<string, unknown>` に丸投げし、
 * 生の e-Stat パラメータ (statsDataId/cdCat01) を持つ。WP1 は 2 つを入れる:
 *   (a) 目標参照モデル `StatSeriesRef` — データ変換式を**持たない**。metricKey で R2 の metric を指し、
 *       表示 label と色 role だけを添える。全 9 componentType の系列がこの 1 モデルで表せることを
 *       fixture で確認する (WP6 の R2 参照移行の土台)。
 *   (b) 現行 componentProps の chart 種別ごと discriminated-union 検証 `validateChartProps`。
 *       これまで catalog validator は componentType が union に入るかしか見ておらず、props の
 *       形 (必須フィールド) を検査していなかった。exhaustive switch で未知種別は skip せず error。
 *
 * 規約: `.claude/rules/theme-catalog-standards.md` / backlog `CROSS-PAGE-DATA-SSOT-01` WP1
 */
import { isChartColorRole, type ChartColorRole } from "./chart-color-role";
import { parseFaqMarkdown } from "./faq-markdown";
import type { CatalogComponentType } from "./types";
import { getMetricConfig } from "../registry";

// ChartColorRole の SSOT は chart-color-role.ts (resolver と parity テストの単一ソース)。
// 再 export はしない (index が chart-color-role から出すので二重 export を避ける)。

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

/**
 * line chart のうち R2 `StatSeriesRef` へ移行済みの component key。
 *
 * 移行済みチャートが生の e-Stat recipe へ戻る回帰を validator で拒否する shrink-only
 * ratchet。CROSS-PAGE-DATA-SSOT-01 WP6 の wave ごとに追加し、最終的には全 line chart を
 * 型付き参照へ移す。
 */
export const MIGRATED_LINE_SERIES_REF_COMPONENT_KEYS: ReadonlySet<string> = new Set([
  "labor-wages-gender-gap",
  "theme-occ-medical-trend",
  "theme-economy-income-wage",
]);

/** KPI card のうち R2 `StatSeriesRef` へ移行済みの component key。 */
export const MIGRATED_KPI_SERIES_REF_COMPONENT_KEYS: ReadonlySet<string> = new Set([
  "kpi-lf-current-balance",
]);

export type EstatParams = Record<string, string>;

export interface LineChartComponentProps {
  estatParams?: EstatParams | EstatParams[];
  seriesRefs?: StatSeriesRef[];
  labels?: string[];
  seriesColors?: string[];
  showLatestValues?: boolean;
  yAxisConfig?: {
    mode: "auto" | "sync" | "fixed";
    domain?: [number, number];
  };
}

export interface MixedChartComponentProps {
  columnParams?: EstatParams[];
  lineParams?: EstatParams[];
  columnSeriesRefs?: StatSeriesRef[];
  lineSeriesRefs?: StatSeriesRef[];
  columnLabels?: string[];
  lineLabels?: string[];
  leftUnit?: string;
  rightUnit?: string;
  columnColors?: string[];
  lineColors?: string[];
}

export interface CompositionChartComponentProps {
  statsDataId?: string;
  segments?: Array<{ code: string; label: string; color?: string }>;
  seriesRefs?: StatSeriesRef[];
  totalCode?: string;
  defaultTab?: "composition" | "trend";
}

export interface DonutChartComponentProps {
  statsDataId?: string;
  categories?: Array<{ code: string; label: string; color: string }>;
  seriesRefs?: StatSeriesRef[];
  topN?: number;
}

export interface CpiChartComponentProps {
  statsDataId?: string;
  seriesRefs?: StatSeriesRef[];
  excludeCodes?: string[];
  year?: string;
}

export interface PyramidChartComponentProps {
  seriesRefs: StatSeriesRef[];
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

/** e-Stat パラメータ 1 件 (statsDataId 必須、全値 string)。 */
function isEstatParams(v: unknown): boolean {
  return (
    isRecord(v) &&
    nonEmptyString(v.statsDataId) &&
    Object.values(v).every((x) => typeof x === "string")
  );
}

function isEstatParamsList(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0 && v.every(isEstatParams);
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isStatSeriesRef(v: unknown): v is StatSeriesRef {
  if (!isRecord(v) || !nonEmptyString(v.metricKey) || !getMetricConfig(v.metricKey)) return false;
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
export function parseStatSeriesRefs(v: unknown): StatSeriesRef[] | null {
  if (!Array.isArray(v) || v.length === 0 || !v.every(isStatSeriesRef)) return null;
  return v;
}

/**
 * seriesRefs と relatedRankingKeys / ThemeCatalog.metrics shortLabel の対応を検証する。
 * recipe は metricKey の先で MetricConfig が一元管理し、表示名も同テーマの指標ラベルを再利用する。
 */
export function validateStatSeriesRefAlignment(
  props: Record<string, unknown>,
  relatedRankingKeys: readonly string[],
  metricLabels: ReadonlyMap<string, string>,
): string[] {
  if (props.seriesRefs === undefined) return [];
  const refs = parseStatSeriesRefs(props.seriesRefs);
  if (!refs) return ["seriesRefs は1件以上の有効な StatSeriesRef 配列にする"];

  // 非公開の theme-only metric はデータ取得SSOTであり、/ranking へのナビゲーション対象ではない。
  // 1件でも含む複合chartは relatedRankingKeys と1:1にせず、公開済みの代表指標へ案内する。
  // 「表示不要のmetricを無理にランキング化しない」という ThemeCatalog 契約を優先する。
  if (refs.some((ref) => getMetricConfig(ref.metricKey)?.isActive === false)) return [];

  const errors: string[] = [];
  if (refs.length !== relatedRankingKeys.length) {
    errors.push(
      `seriesRefs (${refs.length}) と relatedRankingKeys (${relatedRankingKeys.length}) の要素数が不一致`,
    );
  }
  for (let index = 0; index < refs.length; index += 1) {
    const ref = refs[index];
    const relatedKey = relatedRankingKeys[index];
    if (ref.metricKey !== relatedKey) {
      errors.push(
        `系列${index + 1}: metricKey "${ref.metricKey}" と relatedRankingKeys "${String(relatedKey)}" が不一致`,
      );
    }
    const expectedLabel = metricLabels.get(ref.metricKey);
    if (ref.label !== undefined && expectedLabel !== undefined && ref.label !== expectedLabel) {
      errors.push(
        `系列${index + 1}: label "${ref.label}" は ThemeCatalog.metrics の shortLabel "${expectedLabel}" と一致させる`,
      );
    }
  }
  return errors;
}

/** 移行済み key が legacy recipe（期限: 2026-09-30、削除条件: 全chartのR2移行完了）へ戻っていないかを検証する。 */
export function validateMigratedSeriesRefContract(
  componentKey: string,
  props: Record<string, unknown>,
): string[] {
  if (
    !MIGRATED_LINE_SERIES_REF_COMPONENT_KEYS.has(componentKey) &&
    !MIGRATED_KPI_SERIES_REF_COMPONENT_KEYS.has(componentKey)
  ) {
    return [];
  }
  return parseStatSeriesRefs(props.seriesRefs)
    ? []
    : ["移行済み chart は生の estatParams ではなく seriesRefs を使う"];
}

/** {code,label} を必須とする配列 (composition segments)。 */
function isCodeLabelList(v: unknown, requireColor: boolean): boolean {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(
      (item) =>
        isRecord(item) &&
        hasOnlyKeys(item, ["code", "label", "color"]) &&
        nonEmptyString(item.code) &&
        nonEmptyString(item.label) &&
        (item.color === undefined || nonEmptyString(item.color)) &&
        (!requireColor || nonEmptyString(item.color)),
    )
  );
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(nonEmptyString);
}

function isYAxisConfig(v: unknown): boolean {
  if (!isRecord(v) || !hasOnlyKeys(v, ["mode", "domain"])) return false;
  if (v.mode !== "auto" && v.mode !== "sync" && v.mode !== "fixed") return false;
  if (v.domain === undefined) return v.mode !== "fixed";
  return (
    v.mode === "fixed" &&
    Array.isArray(v.domain) &&
    v.domain.length === 2 &&
    v.domain.every((value) => typeof value === "number" && Number.isFinite(value))
  );
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
export function validateChartProps(
  componentType: string,
  props: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  let knownKeys: readonly string[] | null = null;
  const need = (cond: boolean, msg: string) => {
    if (!cond) errors.push(msg);
  };

  switch (componentType as CatalogComponentType) {
    case "line-chart":
      {
      knownKeys = ["estatParams", "seriesRefs", "labels", "seriesColors", "showLatestValues", "yAxisConfig"];
      const hasEstatParams =
        isEstatParams(props.estatParams) || isEstatParamsList(props.estatParams);
      const hasSeriesRefs = parseStatSeriesRefs(props.seriesRefs) !== null;
      if (props.estatParams !== undefined) {
        need(hasEstatParams, "line-chart: estatParams は statsDataId を含む object または非空配列");
      }
      if (props.seriesRefs !== undefined) {
        need(hasSeriesRefs, "line-chart: seriesRefs は登録済み metricKey の非空配列");
      }
      need(
        hasEstatParams || hasSeriesRefs,
        "line-chart: estatParams または seriesRefs (非空配列) が必要",
      );
      need(
        !(hasEstatParams && hasSeriesRefs),
        "line-chart: seriesRefs と estatParams は同時指定できない",
      );
      if (props.labels !== undefined) need(isStringArray(props.labels), "line-chart: labels は string 配列");
      if (props.seriesColors !== undefined) need(isStringArray(props.seriesColors), "line-chart: seriesColors は string 配列");
      if (props.showLatestValues !== undefined) need(typeof props.showLatestValues === "boolean", "line-chart: showLatestValues は boolean");
      if (props.yAxisConfig !== undefined) need(isYAxisConfig(props.yAxisConfig), "line-chart: yAxisConfig が不正");
      break;
      }
    case "mixed-chart":
      knownKeys = ["columnParams", "lineParams", "columnSeriesRefs", "lineSeriesRefs", "columnLabels", "lineLabels", "leftUnit", "rightUnit", "columnColors", "lineColors"];
      {
        const hasRawColumns = isEstatParamsList(props.columnParams);
        const hasRawLines = isEstatParamsList(props.lineParams);
        const columnRefs = parseStatSeriesRefs(props.columnSeriesRefs);
        const lineRefs = parseStatSeriesRefs(props.lineSeriesRefs);
        const hasRaw = hasRawColumns && hasRawLines;
        const hasAnyRaw = props.columnParams !== undefined || props.lineParams !== undefined;
        const hasRefs = columnRefs !== null && lineRefs !== null;
        const hasAnyRefs =
          props.columnSeriesRefs !== undefined || props.lineSeriesRefs !== undefined;
        need(hasRaw || hasRefs, "mixed-chart: column/line の raw params または typed refs が必要");
        need(!(hasAnyRaw && hasAnyRefs), "mixed-chart: raw params と typed refs は同時指定できない");
        need(
          props.columnParams === undefined || hasRawColumns,
          "mixed-chart: columnParams は非空配列",
        );
        need(
          props.lineParams === undefined || hasRawLines,
          "mixed-chart: lineParams は非空配列",
        );
        need(
          props.columnSeriesRefs === undefined || columnRefs !== null,
          "mixed-chart: columnSeriesRefs は登録済み metricKey の非空配列",
        );
        need(
          props.lineSeriesRefs === undefined || lineRefs !== null,
          "mixed-chart: lineSeriesRefs は登録済み metricKey の非空配列",
        );
      }
      for (const key of ["columnLabels", "lineLabels", "columnColors", "lineColors"] as const) {
        if (props[key] !== undefined) need(isStringArray(props[key]), `mixed-chart: ${key} は string 配列`);
      }
      for (const key of ["leftUnit", "rightUnit"] as const) {
        if (props[key] !== undefined) need(nonEmptyString(props[key]), `mixed-chart: ${key} は空でない string`);
      }
      break;
    case "composition-chart":
      knownKeys = ["statsDataId", "segments", "seriesRefs", "totalCode", "defaultTab"];
      {
        const hasRaw = nonEmptyString(props.statsDataId) && isCodeLabelList(props.segments, false);
        const refs = parseStatSeriesRefs(props.seriesRefs);
        const hasAnyRaw = props.statsDataId !== undefined || props.segments !== undefined;
        const hasAnyRefs = props.seriesRefs !== undefined;
        need(hasRaw || refs !== null, "composition-chart: raw recipe または typed refs が必要");
        need(!(hasAnyRaw && hasAnyRefs), "composition-chart: raw recipe と typed refs は同時指定できない");
        need(!hasAnyRefs || refs !== null, "composition-chart: seriesRefs は登録済み metricKey の非空配列");
        need(!hasAnyRaw || hasRaw, "composition-chart: raw recipe は statsDataId と segments を両方指定する");
      }
      if (props.totalCode !== undefined) need(nonEmptyString(props.totalCode), "composition-chart: totalCode は空でない string");
      if (props.defaultTab !== undefined) need(props.defaultTab === "composition" || props.defaultTab === "trend", "composition-chart: defaultTab が不正");
      break;
    case "donut-chart":
      knownKeys = ["statsDataId", "categories", "seriesRefs", "topN"];
      {
        const hasRaw = nonEmptyString(props.statsDataId) && isCodeLabelList(props.categories, true);
        const refs = parseStatSeriesRefs(props.seriesRefs);
        const hasAnyRaw = props.statsDataId !== undefined || props.categories !== undefined;
        const hasAnyRefs = props.seriesRefs !== undefined;
        need(hasRaw || refs !== null, "donut-chart: raw recipe または typed refs が必要");
        need(!(hasAnyRaw && hasAnyRefs), "donut-chart: raw recipe と typed refs は同時指定できない");
        need(!hasAnyRefs || refs !== null, "donut-chart: seriesRefs は登録済み metricKey の非空配列");
        need(!hasAnyRaw || hasRaw, "donut-chart: raw recipe は statsDataId と categories を両方指定する");
      }
      if (props.topN !== undefined) need(Number.isInteger(props.topN) && (props.topN as number) > 0, "donut-chart: topN は正の整数");
      break;
    case "cpi-profile":
    case "cpi-heatmap":
      knownKeys = ["statsDataId", "seriesRefs", "excludeCodes", "year"];
      {
        const hasRaw = nonEmptyString(props.statsDataId);
        const refs = parseStatSeriesRefs(props.seriesRefs);
        const hasRefs = refs !== null;
        need(hasRaw || hasRefs, `${componentType}: statsDataId または seriesRefs が必要`);
        need(!(hasRaw && hasRefs), `${componentType}: raw recipe と typed refs は同時指定できない`);
        if (props.seriesRefs !== undefined) {
          need(hasRefs, `${componentType}: seriesRefs は登録済み metricKey の非空配列`);
        }
      }
      if (props.excludeCodes !== undefined) need(isStringArray(props.excludeCodes), `${componentType}: excludeCodes は string 配列`);
      if (props.year !== undefined) need(nonEmptyString(props.year), `${componentType}: year は空でない string`);
      break;
    case "kpi-card":
      {
        knownKeys = ["estatParams", "seriesRefs", "unit"];
        // データは estatParams / seriesRefs / rankingLink のいずれか。ranking 駆動は props 無しでも可。
        const refs = parseStatSeriesRefs(props.seriesRefs);
        if (props.estatParams !== undefined) {
          need(
            isEstatParams(props.estatParams) || isEstatParamsList(props.estatParams),
            "kpi-card: estatParams は object か非空配列",
          );
        }
        if (props.seriesRefs !== undefined) {
          need(refs?.length === 1, "kpi-card: seriesRefs は登録済み metricKey 1件の配列");
        }
        need(
          !(props.estatParams !== undefined && refs !== null),
          "kpi-card: seriesRefs と estatParams は同時指定できない",
        );
        if (props.unit !== undefined) {
          need(nonEmptyString(props.unit), "kpi-card: unit は空でない string");
        }
        break;
      }
    case "markdown-section":
      knownKeys = ["markdown", "displayMode", "subtitle", "sources"];
      need(nonEmptyString(props.markdown), "markdown-section: markdown (本文) が必要");
      need(
        props.displayMode === undefined ||
          props.displayMode === "prose" ||
          props.displayMode === "faq",
        "markdown-section: displayMode は prose または faq",
      );
      if (props.displayMode === "faq") {
        const parsed = parseFaqMarkdown(props.markdown);
        need(parsed.ok, `markdown-section: ${parsed.ok ? "" : parsed.error}`);
      }
      if (props.subtitle !== undefined) need(nonEmptyString(props.subtitle), "markdown-section: subtitle は空でない string");
      if (props.sources !== undefined) need(isMarkdownSources(props.sources), "markdown-section: sources は {label,url?} 配列");
      break;
    case "pyramid-chart":
      knownKeys = ["seriesRefs"];
      need(
        parseStatSeriesRefs(props.seriesRefs)?.length === 34,
        "pyramid-chart: seriesRefs は登録済み年齢×性別metric 34件の配列",
      );
      break;
    default:
      errors.push(`未知の componentType: ${componentType} (依存抽出の対象外になる)`);
  }
  if (knownKeys) errors.push(...validateKnownKeys(componentType, props, knownKeys));
  errors.push(...validateGeneratedProps(props));
  return errors;
}

/** catalog validator と runtime が同じ schema を使う唯一の parser。 */
export function parseThemeDbChartComponentProps(
  componentType: string,
  props: Record<string, unknown>,
): ThemeDbChartComponentProps | null {
  if (validateChartProps(componentType, props).length > 0) return null;
  switch (componentType) {
    case "line-chart":
      return { componentType, props: props as LineChartComponentProps };
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
