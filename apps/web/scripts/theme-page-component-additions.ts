/**
 * テーマダッシュボード (page_components / pageType="theme") に追加する
 * チャート定義の **単一ソース**。
 *
 * 2 つのコンシューマで共有する (定義の drift を防ぐ):
 *   - seed-theme-page-components.ts        … ローカルビルド DB へ idempotent INSERT (Mac SSOT 用)
 *   - sync-theme-additions-to-r2.ts        … 本番 R2 snapshot へ直接マージ反映 (即時ライブ用)
 *
 * estatParams は packages/data-configs/src/metrics/<key>.ts の `source`
 * (statsDataId / cdCat01) を転記したもの。手入力した推測値ではない。
 *
 * チャートタイプは ThemeDbChartRenderer 対応の line-chart のみを使用
 * (確実に描画されるため)。section は ThemeMetricsDashboard では無視されるので null。
 */

export interface ThemeComponentDef {
  componentKey: string;
  componentType: string;
  title: string;
  componentProps: Record<string, unknown>;
  sourceName: string;
  sourceLink: string | null;
  rankingLink: string | null;
  sortOrder: number;
}

const SSDS = "https://www.stat.go.jp/data/ssds/index.htm";

/** themeKey → 追加チャート定義 */
export const THEME_COMPONENT_ADDITIONS: Record<string, ThemeComponentDef[]> = {
  // ───────────────────────── 暮らし・住まい (既存 2 chart を拡充) ─────────────────────────
  "living-housing": [
    {
      componentKey: "lh-dwelling-floor-area-trend",
      componentType: "line-chart",
      title: "1住宅当たり延べ床面積の推移",
      componentProps: {
        estatParams: [{ statsDataId: "0000020308", cdCat01: "#H02103" }],
        labels: ["1住宅当たり延べ面積"],
        seriesColors: ["#06b6d4"],
      },
      sourceName: "住宅・土地統計調査",
      sourceLink: SSDS,
      rankingLink: "/ranking/dwelling-per-floor-area",
      sortOrder: 110,
    },
    {
      componentKey: "lh-marriage-divorce-trend",
      componentType: "line-chart",
      title: "婚姻件数・離婚件数の推移",
      componentProps: {
        estatParams: [
          { statsDataId: "0000010101", cdCat01: "A9101" },
          { statsDataId: "0000010101", cdCat01: "A9201" },
        ],
        labels: ["婚姻件数", "離婚件数"],
        seriesColors: ["#3b82f6", "#ef4444"],
      },
      sourceName: "人口動態調査",
      sourceLink: SSDS,
      rankingLink: "/ranking/marriages",
      sortOrder: 120,
    },
    {
      componentKey: "lh-pop-density-trend",
      componentType: "line-chart",
      title: "可住地人口密度の推移",
      componentProps: {
        estatParams: [{ statsDataId: "0000010201", cdCat01: "#A01202" }],
        labels: ["可住地人口密度"],
        seriesColors: ["#8b5cf6"],
      },
      sourceName: "国勢調査",
      sourceLink: SSDS,
      rankingLink: "/ranking/population-density-per-km2-inhabitable-area",
      sortOrder: 130,
    },
  ],

  // ───────────────────────── 港湾 (新規) ─────────────────────────
  ports: [
    {
      componentKey: "ports-cargo-trend",
      componentType: "line-chart",
      title: "輸出入 海上貨物量の推移",
      componentProps: {
        estatParams: [
          { statsDataId: "0003130738", cdCat01: "110" },
          { statsDataId: "0003130738", cdCat01: "120" },
        ],
        labels: ["輸出", "輸入"],
        seriesColors: ["#3b82f6", "#f59e0b"],
      },
      sourceName: "港湾統計",
      sourceLink: SSDS,
      rankingLink: "/ranking/port-cargo-total",
      sortOrder: 10,
    },
    {
      componentKey: "ports-container-trend",
      componentType: "line-chart",
      title: "コンテナ取扱個数の推移",
      componentProps: {
        estatParams: [{ statsDataId: "0003130688", cdCat01: "100" }],
        labels: ["コンテナ個数"],
        seriesColors: ["#06b6d4"],
      },
      sourceName: "港湾統計",
      sourceLink: SSDS,
      rankingLink: "/ranking/port-container-count",
      sortOrder: 20,
    },
    {
      componentKey: "ports-passengers-trend",
      componentType: "line-chart",
      title: "港湾旅客数の推移",
      componentProps: {
        estatParams: [{ statsDataId: "0003130737", cdCat01: "100" }],
        labels: ["港湾旅客数"],
        seriesColors: ["#22c55e"],
      },
      sourceName: "港湾統計",
      sourceLink: SSDS,
      rankingLink: "/ranking/port-passengers-total",
      sortOrder: 30,
    },
  ],

  // ───────────────────────── 鉄道 (新規) ─────────────────────────
  railway: [
    {
      componentKey: "railway-passenger-trend",
      componentType: "line-chart",
      title: "鉄道輸送人員の推移（JR・民鉄）",
      componentProps: {
        estatParams: [
          { statsDataId: "0000010103", cdCat01: "C3704" },
          { statsDataId: "0000010103", cdCat01: "C3705" },
        ],
        labels: ["JR", "民鉄"],
        seriesColors: ["#3b82f6", "#f59e0b"],
      },
      sourceName: "社会・人口統計体系",
      sourceLink: SSDS,
      rankingLink: "/ranking/jr-passenger-transport",
      sortOrder: 10,
    },
    {
      componentKey: "railway-freight-trend",
      componentType: "line-chart",
      title: "JR貨物発送量の推移",
      componentProps: {
        estatParams: [{ statsDataId: "0000010103", cdCat01: "C3702" }],
        labels: ["JR貨物発送量"],
        seriesColors: ["#8b5cf6"],
      },
      sourceName: "社会・人口統計体系",
      sourceLink: SSDS,
      rankingLink: "/ranking/jr-freight-shipment",
      sortOrder: 20,
    },
  ],

  // ───────────────────────── 道路 (新規) ─────────────────────────
  roads: [
    {
      componentKey: "roads-length-trend",
      componentType: "line-chart",
      title: "道路実延長・高速道路延長の推移",
      componentProps: {
        estatParams: [
          { statsDataId: "0000010108", cdCat01: "H711001" },
          { statsDataId: "0000010108", cdCat01: "H7113" },
        ],
        labels: ["道路実延長(高速含む)", "高速道路延長"],
        seriesColors: ["#3b82f6", "#ef4444"],
      },
      sourceName: "社会・人口統計体系",
      sourceLink: SSDS,
      rankingLink: "/ranking/road-total-length-with-expressway",
      sortOrder: 10,
    },
    {
      componentKey: "roads-density-trend",
      componentType: "line-chart",
      title: "可住地面積当たり道路延長（道路密度）の推移",
      componentProps: {
        estatParams: [{ statsDataId: "0000010208", cdCat01: "#H06401" }],
        labels: ["道路密度"],
        seriesColors: ["#06b6d4"],
      },
      sourceName: "社会・人口統計体系",
      sourceLink: SSDS,
      rankingLink: "/ranking/road-length-per-km2",
      sortOrder: 20,
    },
    {
      componentKey: "roads-traffic-trend",
      componentType: "line-chart",
      title: "道路平均交通量の推移",
      componentProps: {
        estatParams: [{ statsDataId: "0000010208", cdCat01: "#H06413" }],
        labels: ["平均交通量"],
        seriesColors: ["#f59e0b"],
      },
      sourceName: "社会・人口統計体系",
      sourceLink: SSDS,
      rankingLink: "/ranking/average-road-traffic-volume",
      sortOrder: 30,
    },
  ],
};
