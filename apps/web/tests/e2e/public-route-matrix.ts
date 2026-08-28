export interface PublicRouteContract {
  readonly id: string;
  readonly path: string;
  readonly canonicalPath: string;
  readonly heading: string;
  readonly dataSelector: string;
}

export interface ThemeRouteContract extends PublicRouteContract {
  readonly expectedChartCount: number;
  readonly representativeTypes: readonly string[];
}

export const PUBLIC_ROUTE_MATRIX: readonly PublicRouteContract[] = [
  {
    id: "home",
    path: "/",
    canonicalPath: "/",
    heading: "日本の地域データを探す",
    dataSelector: 'main a[href^="/ranking/"]',
  },
  {
    id: "known-ranking",
    path: "/ranking/total-population",
    canonicalPath: "/ranking/total-population",
    heading: "総人口",
    dataSelector: 'table[aria-label*="都道府県別データ表"]',
  },
  {
    id: "category-detail",
    path: "/category/population",
    canonicalPath: "/category/population",
    heading: "人口・世帯",
    dataSelector: 'main a[href^="/ranking/"]',
  },
  {
    id: "survey-list",
    path: "/survey",
    canonicalPath: "/survey",
    heading: "調査別ランキング一覧",
    dataSelector: 'main a[href="/survey/census"]',
  },
  {
    id: "survey-detail",
    path: "/survey/census",
    canonicalPath: "/survey/census",
    heading: "国勢調査",
    dataSelector: 'main a[href^="/ranking/"]',
  },
  {
    id: "tag",
    path: "/tag/%E4%BA%BA%E5%8F%A3",
    canonicalPath: "/tag/%E4%BA%BA%E5%8F%A3",
    heading: "人口",
    dataSelector: 'main a[href^="/blog/"]',
  },
  {
    id: "prefecture",
    path: "/areas/28000",
    canonicalPath: "/areas/28000",
    heading: "兵庫県",
    dataSelector: 'main a[href^="/ranking/"]',
  },
  {
    id: "city-category",
    path: "/municipalities/themes/aging-society",
    canonicalPath: "/municipalities/themes/aging-society",
    heading: "市区町村の高齢化",
    dataSelector: 'main a[href^="/municipalities/ranking/"], main [role="status"]',
  },
] as const;

/** ThemeCatalog 9 component typesを、実在routeと期待chart数へ固定する。 */
export const THEME_ROUTE_MATRIX: readonly ThemeRouteContract[] = [
  {
    id: "theme-aging",
    path: "/themes/aging-society",
    canonicalPath: "/themes/aging-society",
    heading: "少子高齢化",
    dataSelector: '[data-theme-chart="true"]',
    expectedChartCount: 11,
    representativeTypes: ["line-chart", "composition-chart", "pyramid-chart", "markdown-section"],
  },
  {
    id: "theme-consumer-prices",
    path: "/themes/consumer-prices",
    canonicalPath: "/themes/consumer-prices",
    heading: "物価・消費",
    dataSelector: '[data-theme-chart="true"]',
    expectedChartCount: 3,
    representativeTypes: ["cpi-profile", "cpi-heatmap"],
  },
  {
    id: "theme-education",
    path: "/themes/education-culture",
    canonicalPath: "/themes/education-culture",
    heading: "教育・文化",
    dataSelector: '[data-theme-chart="true"]',
    expectedChartCount: 2,
    representativeTypes: ["donut-chart"],
  },
  {
    id: "theme-fishery",
    // Release CI は候補ブランチのコードと現在の本番 R2 snapshot を組み合わせて動く。
    // 全国チャートの scope override が R2 へ同期される前後のどちらでも、
    // component-type 契約を同じ全国表示で検証する。
    path: "/themes/fishery-marine?pref=all",
    canonicalPath: "/themes/fishery-marine",
    heading: "漁業（水産業）",
    dataSelector: '[data-theme-chart="true"]',
    expectedChartCount: 6,
    representativeTypes: ["mixed-chart"],
  },
  {
    id: "theme-local-finance",
    path: "/themes/local-finance",
    canonicalPath: "/themes/local-finance",
    heading: "地方財政",
    dataSelector: '[data-theme-chart="true"]',
    expectedChartCount: 4,
    representativeTypes: ["kpi-card"],
  },
] as const;
