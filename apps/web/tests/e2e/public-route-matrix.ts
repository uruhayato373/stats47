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
    // 2026-10-31 に市区町村のテーマの slug と題名を都道府県のテーマにそろえた (IA-REGION-THEME-01 ④)
    heading: "市区町村別の少子高齢化",
    dataSelector: 'main a[href^="/municipalities/ranking/"], main [role="status"]',
  },
] as const;

/** 公開中のThemeCatalog component typesを、実在routeと期待chart数へ固定する。
 * KPIは地方財政の専用章で検証する。 */
export const THEME_ROUTE_MATRIX: readonly ThemeRouteContract[] = [
  {
    id: "theme-aging",
    // 県のデータが要る図 (人口ピラミッド・物価プロファイル) を含むので、県のページで検証する。テーマのページは
    // 2026-10-30 から常に 47 都道府県の表示で、これらの図は「都道府県を選択すると…」の案内になる (旧: 既定で兵庫県を表示していた)
    path: "/areas/28000/aging-society",
    canonicalPath: "/areas/28000/aging-society",
    heading: "少子高齢化",
    dataSelector: '[data-theme-chart="true"]',
    // 2026-10-07 (#1085): 「高齢世帯の推移」を外し、図は推移・構成・ピラミッドの 3 枚
    expectedChartCount: 3,
    representativeTypes: ["line-chart", "composition-chart", "pyramid-chart", "markdown-section"],
  },
  {
    id: "theme-consumer-prices",
    // 県のデータが要る図 (人口ピラミッド・物価プロファイル) を含むので、県のページで検証する。テーマのページは
    // 2026-10-30 から常に 47 都道府県の表示で、これらの図は「都道府県を選択すると…」の案内になる (旧: 既定で兵庫県を表示していた)
    path: "/areas/28000/consumer-prices",
    canonicalPath: "/areas/28000/consumer-prices",
    heading: "物価・消費",
    dataSelector: '[data-theme-chart="true"]',
    // 2026-10-08: 総合 1 本の折れ線を 12 費目 × 年の cpi-heatmap に作り替えた (図は物価プロファイルと 2 枚)。
    // PR の E2E は図の定義を PR の生成物から読む (.github/scripts/r2-overlay-server.mjs)
    expectedChartCount: 2,
    representativeTypes: ["cpi-profile", "cpi-heatmap"],
  },
  {
    id: "theme-education",
    // 2026-11-01 から /themes/* は公式の全国の値だけを見せ、県の系列を読む図 (折れ線・構成比・ドーナツ) を出さない。
    // 図は県のページで検証する (theme-catalog-standards.md §3.0「地域ごとに出す指標を変える」)
    path: "/areas/28000/education-culture",
    canonicalPath: "/areas/28000/education-culture",
    heading: "教育・文化",
    dataSelector: '[data-theme-chart="true"]',
    expectedChartCount: 2,
    representativeTypes: ["line-chart", "composition-chart"],
  },
  {
    id: "theme-fishery",
    // 2026-11-01 から県のページで検証する (theme-education と同じ理由)
    path: "/areas/28000/fishery-marine",
    canonicalPath: "/areas/28000/fishery-marine",
    heading: "漁業（水産業）",
    dataSelector: '[data-theme-chart="true"]',
    // 2026-10-07 (#1085): 指標カードと重複する 4 図を外し、海面漁業産出額の長期推移 1 枚だけ
    expectedChartCount: 1,
    representativeTypes: ["line-chart"],
  },
  // theme-local-economy は 2026-10-07 (#1085) で図を外し、指標カードと比較カードだけになったため対象外
  {
    id: "theme-healthcare",
    // 2026-11-01 から県のページで検証する (theme-education と同じ理由)
    path: "/areas/28000/healthcare",
    canonicalPath: "/areas/28000/healthcare",
    heading: "医療・健康",
    dataSelector: '[data-theme-chart="true"]',
    expectedChartCount: 4,
    representativeTypes: ["donut-chart", "composition-chart"],
  },
  {
    id: "theme-local-finance",
    // 決算カードは選択した県の会計を描く。全国ページでは県を代入しない。
    path: "/areas/28000/local-finance",
    canonicalPath: "/areas/28000/local-finance",
    heading: "地方財政",
    dataSelector: '[data-theme-chart="true"]',
    expectedChartCount: 4,
    representativeTypes: ["kpi-card"],
  },
] as const;
