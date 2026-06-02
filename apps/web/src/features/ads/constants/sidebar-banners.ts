/**
 * サイドバーに固定表示する高単価アフィリエイトバナー (A8.net) の単一ソース。
 *
 * SSOT (AFFILIATE_ADS / category 連動) とは別の「ハウス枠」。
 * カテゴリに依存せず全ページ共通サイドバーに出す固定クリエイティブをここで一元管理する。
 * 追加・差し替えはこの配列だけを編集する (各ページの page.tsx に URL リテラルを散らさない)。
 */
export interface SidebarBannerConfig {
  id: string;
  href: string;
  imageUrl: string;
  trackingPixelUrl: string;
  width: number;
  height: number;
  label: string;
}

export const SIDEBAR_PROMO_BANNERS: SidebarBannerConfig[] = [
  // index 0: STRATEGY CAREER (エンジニア転職・高単価) 300x250
  {
    id: "strategy-career-300x250",
    href: "https://px.a8.net/svt/ejp?a8mat=4B5LK5+5YC2K2+5P1E+5YZ75",
    imageUrl:
      "https://www26.a8.net/svt/bgt?aid=260601701360&wid=001&eno=01&mid=s00000026573001003000&mc=1",
    trackingPixelUrl: "https://www10.a8.net/0.gif?a8mat=4B5LK5+5YC2K2+5P1E+5YZ75",
    width: 300,
    height: 250,
    label: "A8 sidebar banner (strategy career)",
  },
  // index 1: 就職エージェントneo 系 300x250
  {
    id: "neo-recruit-300x250",
    href: "https://px.a8.net/svt/ejp?a8mat=4B3RUY+AG9Z3M+5VRC+5YZ75",
    imageUrl:
      "https://www24.a8.net/svt/bgt?aid=260516554632&wid=001&eno=01&mid=s00000027444001003000&mc=1",
    trackingPixelUrl: "https://www19.a8.net/0.gif?a8mat=4B3RUY+AG9Z3M+5VRC+5YZ75",
    width: 300,
    height: 250,
    label: "A8 sidebar banner (recruit)",
  },
];
