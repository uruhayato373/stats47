import {
  parseStatSeriesRefs,
  type StatSeriesRef,
} from "@stats47/data-configs/theme-catalog";

type EstatParams = Record<string, string>;

export interface LineChartComponentProps {
  /** legacy（期限: 2026-09-30、削除条件: 全 line-chart の seriesRefs 移行完了）。 */
  estatParams?: EstatParams | EstatParams[];
  /** MetricConfig から生成済みの R2 系列参照。生の取得・換算 recipe を持たない。 */
  seriesRefs?: StatSeriesRef[];
  labels?: string[];
  seriesColors?: string[];
  showLatestValues?: boolean;
}

export interface MixedChartComponentProps {
  columnParams: EstatParams[];
  lineParams: EstatParams[];
  columnLabels?: string[];
  lineLabels?: string[];
  leftUnit?: string;
  rightUnit?: string;
  columnColors?: string[];
  lineColors?: string[];
}

export interface CompositionChartComponentProps {
  statsDataId: string;
  segments: Array<{ code: string; label: string; color?: string }>;
  totalCode?: string;
  defaultTab?: "composition" | "trend";
}

export interface DonutChartComponentProps {
  statsDataId: string;
  categories: Array<{ code: string; label: string; color: string }>;
  topN?: number;
}

export interface CpiChartComponentProps {
  statsDataId: string;
  excludeCodes?: string[];
  year?: string;
}

type ThemeDbChartComponentProps =
  | { componentType: "line-chart"; props: LineChartComponentProps }
  | { componentType: "mixed-chart"; props: MixedChartComponentProps }
  | { componentType: "composition-chart"; props: CompositionChartComponentProps }
  | { componentType: "donut-chart"; props: DonutChartComponentProps }
  | { componentType: "cpi-profile"; props: CpiChartComponentProps }
  | { componentType: "cpi-heatmap"; props: CpiChartComponentProps };

export function parseThemeDbChartComponentProps(
  componentType: string,
  props: Record<string, unknown>,
): ThemeDbChartComponentProps | null {
  if (componentType === "line-chart") {
    const parsed = parseLineChartComponentProps(props);
    return parsed ? { componentType, props: parsed } : null;
  }
  if (componentType === "mixed-chart") {
    const parsed = parseMixedChartComponentProps(props);
    return parsed ? { componentType, props: parsed } : null;
  }
  if (componentType === "composition-chart") {
    const parsed = parseCompositionChartComponentProps(props);
    return parsed ? { componentType, props: parsed } : null;
  }
  if (componentType === "donut-chart") {
    const parsed = parseDonutChartComponentProps(props);
    return parsed ? { componentType, props: parsed } : null;
  }
  if (componentType === "cpi-profile" || componentType === "cpi-heatmap") {
    const parsed = parseCpiChartComponentProps(props);
    return parsed ? { componentType, props: parsed } : null;
  }
  return null;
}

function parseLineChartComponentProps(
  props: Record<string, unknown>,
): LineChartComponentProps | null {
  const estatParams = parseEstatParamsOrList(props.estatParams);
  const seriesRefs = parseStatSeriesRefs(props.seriesRefs);
  if ((!estatParams && !seriesRefs) || (estatParams && seriesRefs)) return null;

  return {
    estatParams: estatParams ?? undefined,
    seriesRefs: seriesRefs ?? undefined,
    labels: parseStringArray(props.labels),
    seriesColors: parseStringArray(props.seriesColors),
    showLatestValues:
      typeof props.showLatestValues === "boolean"
        ? props.showLatestValues
        : undefined,
  };
}

function parseMixedChartComponentProps(
  props: Record<string, unknown>,
): MixedChartComponentProps | null {
  const columnParams = parseEstatParamsList(props.columnParams);
  const lineParams = parseEstatParamsList(props.lineParams);
  if (!columnParams || !lineParams) return null;

  return {
    columnParams,
    lineParams,
    columnLabels: parseStringArray(props.columnLabels),
    lineLabels: parseStringArray(props.lineLabels),
    leftUnit: parseOptionalString(props.leftUnit),
    rightUnit: parseOptionalString(props.rightUnit),
    columnColors: parseStringArray(props.columnColors),
    lineColors: parseStringArray(props.lineColors),
  };
}

function parseCompositionChartComponentProps(
  props: Record<string, unknown>,
): CompositionChartComponentProps | null {
  const statsDataId = parseOptionalString(props.statsDataId);
  const segments = parseSegments(props.segments);
  if (!statsDataId || !segments || segments.length === 0) return null;

  const defaultTab =
    props.defaultTab === "composition" || props.defaultTab === "trend"
      ? props.defaultTab
      : undefined;

  return {
    statsDataId,
    segments,
    totalCode: parseOptionalString(props.totalCode),
    defaultTab,
  };
}

function parseDonutChartComponentProps(
  props: Record<string, unknown>,
): DonutChartComponentProps | null {
  const statsDataId = parseOptionalString(props.statsDataId);
  const categories = parseDonutCategories(props.categories);
  if (!statsDataId || !categories || categories.length === 0) return null;

  const topN =
    typeof props.topN === "number" && Number.isFinite(props.topN) && props.topN > 0
      ? Math.floor(props.topN)
      : undefined;

  return { statsDataId, categories, topN };
}

function parseCpiChartComponentProps(
  props: Record<string, unknown>,
): CpiChartComponentProps | null {
  const statsDataId = parseOptionalString(props.statsDataId);
  if (!statsDataId) return null;

  return {
    statsDataId,
    excludeCodes: parseStringArray(props.excludeCodes),
    year: parseOptionalString(props.year),
  };
}

function parseEstatParamsOrList(value: unknown): EstatParams | EstatParams[] | null {
  return Array.isArray(value) ? parseEstatParamsList(value) : parseEstatParams(value);
}

function parseEstatParamsList(value: unknown): EstatParams[] | null {
  if (!Array.isArray(value)) return null;
  const params = value.map(parseEstatParams);
  if (params.some((p) => p === null)) return null;
  return params as EstatParams[];
}

function parseEstatParams(value: unknown): EstatParams | null {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.length === 0) return null;
  if (entries.some(([, v]) => typeof v !== "string")) return null;
  return value as EstatParams;
}

function parseSegments(value: unknown): CompositionChartComponentProps["segments"] | null {
  if (!Array.isArray(value)) return null;
  const segments = value.map((item) => {
    if (!isRecord(item)) return null;
    const code = parseOptionalString(item.code);
    const label = parseOptionalString(item.label);
    if (!code || !label) return null;
    return { code, label, color: parseOptionalString(item.color) };
  });
  if (segments.some((item) => item === null)) return null;
  return segments as CompositionChartComponentProps["segments"];
}

function parseDonutCategories(value: unknown): DonutChartComponentProps["categories"] | null {
  if (!Array.isArray(value)) return null;
  const categories = value.map((item) => {
    if (!isRecord(item)) return null;
    const code = parseOptionalString(item.code);
    const label = parseOptionalString(item.label);
    const color = parseOptionalString(item.color);
    if (!code || !label || !color) return null;
    return { code, label, color };
  });
  if (categories.some((item) => item === null)) return null;
  return categories as DonutChartComponentProps["categories"];
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.every((item) => typeof item === "string") ? value : undefined;
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * componentType drift ガード (type-check 時のみ・runtime 実体なし)。
 *
 * このファイルのチャート型 SSOT `ThemeDbChartComponentProps` の componentType が、
 * packages 側の `CatalogComponentType` (`@stats47/data-configs`、ThemeCatalog が使う複製 union) に
 * **すべて含まれる**ことを型レベルで保証する。テーマ renderer にチャート型を追加したのに
 * カタログ union へ足し忘れると `tsc --noEmit` が失敗する。
 *
 * 注: 非チャート型 (kpi-card / markdown-section / pyramid-chart) は
 * ThemeDbChartComponentProps に含まれず ThemeMetricsDashboard 側で個別描画されるため対象外。
 * export しない (knip の unused export 検出を避け、常に import される本ファイルで生存させる)。
 */
type Expect<T extends true> = T;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ThemeChartTypeDriftGuard = Expect<
  ThemeDbChartComponentProps["componentType"] extends import("@stats47/data-configs").CatalogComponentType
    ? true
    : false
>;
