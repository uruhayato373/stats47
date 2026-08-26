/**
 * テーマ chart の e-Stat 依存抽出 (CROSS-PAGE-DATA-SSOT-01 WP4)
 *
 * ★これまで「期待する取得集合」を機械抽出する共通実装が無く、catalog validator /
 *   snapshot generator / live 監査がそれぞれ別の見方をしていた。その結果、live 監査は
 *   130 request しか見ず、pyramid の 34 request (props 外) や composition/donut の展開が
 *   期待集合から漏れていた。ここを **唯一の依存 collector** にして 3 者が同じ集合を使う。
 *
 * 芯: componentType の switch は **exhaustive**。未知種別は skip せず throw する
 *   (依存の取りこぼし = 監査が緑なのに実は見ていない、を構造的に防ぐ)。
 *
 * 依存は (a) 正典 R2 metric 参照と (b) 移行前の e-Stat request の2系統。
 * R2移行済みchartを依存0として扱わずmetricKeyを列挙し、legacy request（期限: 2026-09-30、削除条件: 全chartのR2移行完了）だけをlive e-Stat監査へ渡す。
 */
import { enumeratePyramidCategoryCodes, PYRAMID_STATS_DATA_ID } from "./population-pyramid-deps";
import { parseStatSeriesRefs, type StatSeriesRef } from "./stat-series-ref";
import type { CatalogChart, CatalogComponentType } from "./types";

/** 1 つの e-Stat request 依存。statsDataId + 任意のカテゴリ/タブ等のフィルタ。 */
export interface EstatRequestDep {
  statsDataId: string;
  /** cdCat01 等のフィルタ (request identity に含む)。無ければ表全体。 */
  filters: Record<string, string>;
}

export interface ChartDependencies {
  componentKey: string;
  componentType: CatalogComponentType;
  /** 正典 R2 metric 参照。取得 recipe は参照先 MetricConfig が持つ。 */
  metricRefs: StatSeriesRef[];
  /** 移行前の生 e-Stat request。WP6 で 0 へ縮小する。 */
  requests: EstatRequestDep[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** estatParams 1 件 → EstatRequestDep (statsDataId を分離し残りを filters に)。 */
function toRequest(params: Record<string, unknown>): EstatRequestDep | null {
  const statsDataId = params.statsDataId;
  if (typeof statsDataId !== "string" || statsDataId.length === 0) return null;
  const filters: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === "statsDataId") continue;
    if (typeof v === "string") filters[k] = v;
  }
  return { statsDataId, filters };
}

function estatParamsList(value: unknown): EstatRequestDep[] {
  const list = Array.isArray(value) ? value : [value];
  const reqs: EstatRequestDep[] = [];
  for (const p of list) {
    if (isRecord(p)) {
      const r = toRequest(p);
      if (r) reqs.push(r);
    }
  }
  return reqs;
}

/** statsDataId × コード配列 → per-code request (composition/donut/pyramid の展開)。 */
function expandByCode(statsDataId: string, codes: string[]): EstatRequestDep[] {
  return codes.map((code) => ({ statsDataId, filters: { cdCat01: code } }));
}

/**
 * 1 chart の e-Stat 依存を列挙する (pure)。exhaustive switch・未知種別は throw。
 */
export function collectChartDependencies(chart: CatalogChart): ChartDependencies {
  const props = (chart.componentProps ?? {}) as Record<string, unknown>;
  const requests: EstatRequestDep[] = [];
  const metricRefs: StatSeriesRef[] = [];

  switch (chart.componentType) {
    case "line-chart":
      metricRefs.push(...(parseStatSeriesRefs(props.seriesRefs) ?? []));
      requests.push(...estatParamsList(props.estatParams));
      break;
    case "mixed-chart":
      requests.push(...estatParamsList(props.columnParams));
      requests.push(...estatParamsList(props.lineParams));
      break;
    case "composition-chart": {
      const statsDataId = typeof props.statsDataId === "string" ? props.statsDataId : null;
      const segs = Array.isArray(props.segments) ? props.segments : [];
      const codes = segs
        .map((s) => (isRecord(s) && typeof s.code === "string" ? s.code : null))
        .filter((c): c is string => c !== null);
      if (typeof props.totalCode === "string") codes.push(props.totalCode);
      if (statsDataId) requests.push(...expandByCode(statsDataId, codes));
      break;
    }
    case "donut-chart": {
      const statsDataId = typeof props.statsDataId === "string" ? props.statsDataId : null;
      const cats = Array.isArray(props.categories) ? props.categories : [];
      const codes = cats
        .map((c) => (isRecord(c) && typeof c.code === "string" ? c.code : null))
        .filter((c): c is string => c !== null);
      if (statsDataId) requests.push(...expandByCode(statsDataId, codes));
      break;
    }
    case "cpi-profile":
    case "cpi-heatmap":
      // CPI は表全体を 1 request で取り excludeCodes/year で client 側フィルタする。
      if (typeof props.statsDataId === "string") {
        requests.push({ statsDataId: props.statsDataId, filters: {} });
      }
      break;
    case "kpi-card":
      // estatParams があれば 1 request。無ければ ranking 由来 (R2)。
      if (props.estatParams !== undefined) requests.push(...estatParamsList(props.estatParams));
      break;
    case "pyramid-chart":
      // props は空。依存 (statsDataId × 34 の年齢×性別) は SSOT から展開する。
      requests.push(
        ...enumeratePyramidCategoryCodes().map((c) => ({
          statsDataId: PYRAMID_STATS_DATA_ID,
          filters: { cdCat01: c.code },
        })),
      );
      break;
    case "markdown-section":
      // 考察テキスト。データ依存なし。
      break;
    default: {
      const exhaustive: never = chart.componentType;
      throw new Error(`未知の componentType の依存を抽出できない: ${String(exhaustive)}`);
    }
  }
  return { componentKey: chart.componentKey, componentType: chart.componentType, metricRefs, requests };
}

/** request の一意キー (dedup / 監査突合用)。 */
export function requestKey(r: EstatRequestDep): string {
  const filters = Object.keys(r.filters)
    .sort()
    .map((k) => `${k}=${r.filters[k]}`)
    .join("&");
  return filters ? `${r.statsDataId}?${filters}` : r.statsDataId;
}

export interface ThemeDependencySet {
  /** chart ごとの依存 */
  perChart: ChartDependencies[];
  /** 全 request の総数 (chart をまたいだ重複を含む) */
  totalRequests: number;
  /** distinct な request キー集合 (ソート済み) */
  distinctRequests: string[];
  /** R2 metric 参照の総数 (chart 間重複を含む)。 */
  totalMetricRefs: number;
  /** R2 metricKey の distinct 集合。 */
  distinctMetricKeys: string[];
}

/** 全カタログの期待依存集合を列挙する (pure)。validator / generator / audit が共有する。 */
export function collectThemeDataDependencies(
  catalogs: Array<{ charts: CatalogChart[] }>,
): ThemeDependencySet {
  const perChart: ChartDependencies[] = [];
  const distinct = new Set<string>();
  const distinctMetricKeys = new Set<string>();
  let total = 0;
  let totalMetricRefs = 0;
  for (const cat of catalogs) {
    for (const chart of cat.charts) {
      const deps = collectChartDependencies(chart);
      perChart.push(deps);
      for (const ref of deps.metricRefs) {
        totalMetricRefs += 1;
        distinctMetricKeys.add(ref.metricKey);
      }
      for (const r of deps.requests) {
        total += 1;
        distinct.add(requestKey(r));
      }
    }
  }
  return {
    perChart,
    totalRequests: total,
    distinctRequests: [...distinct].sort(),
    totalMetricRefs,
    distinctMetricKeys: [...distinctMetricKeys].sort(),
  };
}

/** distinct request 1 件 + 由来 (どのテーマ・チャートで初出したか。監査の失敗報告に使う)。 */
export interface RequestWithProvenance {
  key: string;
  request: EstatRequestDep;
  themeKey: string;
  componentKey: string;
  componentType: CatalogComponentType;
}

export interface ThemeDependencyProvenanceSet {
  /** distinct request (key 昇順)。初出のテーマ/チャートを provenance として保持する。 */
  distinct: RequestWithProvenance[];
  /** 全 request の総数 (chart をまたいだ重複を含む)。 */
  totalRequests: number;
}

/**
 * テーマ key を保持したまま期待依存集合を列挙する (pure)。
 *
 * `collectThemeDataDependencies` (set-only) と同じ per-chart core (`collectChartDependencies`)
 * を使うので二重実装にならない。live 監査が「どのテーマ・チャートの request か」を報告できるよう
 * 由来を持たせる。distinct は key の初出順ではなく key 昇順で安定させる (ミラーを決定的にする)。
 */
export function collectThemeDataDependenciesWithProvenance(
  catalogs: Record<string, { charts: CatalogChart[] }>,
): ThemeDependencyProvenanceSet {
  const byKey = new Map<string, RequestWithProvenance>();
  let total = 0;
  for (const [themeKey, cat] of Object.entries(catalogs)) {
    for (const chart of cat.charts) {
      const deps = collectChartDependencies(chart);
      for (const r of deps.requests) {
        total += 1;
        const key = requestKey(r);
        if (!byKey.has(key)) {
          byKey.set(key, {
            key,
            request: r,
            themeKey,
            componentKey: chart.componentKey,
            componentType: chart.componentType,
          });
        }
      }
    }
  }
  const distinct = [...byKey.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return { distinct, totalRequests: total };
}

/** live 監査 (.mjs・素の node) が読む依存ミラーの JSON 形。決定的 (key 昇順)。 */
export interface ThemeDependencyMirror {
  /** ミラーの由来 (人が読む注記。正典が変わったら再生成する)。 */
  generatedFrom: string;
  /** 全 request の総数 (chart をまたいだ重複を含む)。 */
  totalRequests: number;
  /** distinct request 数 (= requests.length)。 */
  distinctRequests: number;
  requests: Array<{
    key: string;
    statsDataId: string;
    filters: Record<string, string>;
    themeKey: string;
    componentKey: string;
    componentType: CatalogComponentType;
  }>;
}

/**
 * 依存ミラー (JSON) を組み立てる (pure)。generator と parity test が共有する単一ソース。
 * .mjs 監査は TS を import できないので、ここから機械生成した JSON を読む
 * (unit-semantics の TS 正典 → .mjs 鏡と同じ二層 SSOT)。
 */
export function buildThemeDependencyMirror(
  catalogs: Record<string, { charts: CatalogChart[] }>,
): ThemeDependencyMirror {
  const { distinct, totalRequests } = collectThemeDataDependenciesWithProvenance(catalogs);
  return {
    generatedFrom: "collectThemeDataDependenciesWithProvenance(THEME_CATALOGS)",
    totalRequests,
    distinctRequests: distinct.length,
    requests: distinct.map((d) => ({
      key: d.key,
      statsDataId: d.request.statsDataId,
      filters: d.request.filters,
      themeKey: d.themeKey,
      componentKey: d.componentKey,
      componentType: d.componentType,
    })),
  };
}
