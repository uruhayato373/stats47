import { THEME_INDICATOR_SETS } from "@stats47/types";

export const DASHBOARD_CATALOG_REL =
  ".claude/skills/theme/research-theme-catalog/reference/public-dashboard-catalog.json";

export function makeDashboardCatalogFixture(options?: {
  duplicateStoryId?: boolean;
  omitTheme?: string;
}): string {
  const themes = THEME_INDICATOR_SETS.filter(
    (theme) => theme.key !== "climate" && theme.key !== options?.omitTheme
  ).map((theme) => theme.key);
  const stories = Array.from({ length: 40 }, (_, index) => ({
    id:
      options?.duplicateStoryId && index === 1
        ? "resas-story-0"
        : `resas-story-${index}`,
    dashboardId: "resas",
    category: index === 0 ? "population" : "local-economy",
    title: `RESAS分析${index + 1}`,
    question: `地域差をどう把握するか`,
    storyPattern: index === 0 ? "scenario" : "overview",
    indicatorFamilies: ["人口", "地域経済"],
    visualizations: ["line", "choropleth"],
    geographyLevels: ["prefecture", "municipality"],
    stats47ThemeKeys: index === 0 ? themes : ["local-economy"],
    sourceUrl: "https://resas.go.jp/",
    evidenceLevel: "official-page",
    verifiedAt: "2026-08-25",
  }));

  return JSON.stringify(
    {
      schemaVersion: 1,
      researchedAt: "2026-08-25",
      stats47ThemeKeys: themes,
      dashboards: [
        {
          id: "resas",
          title: "RESAS 地域経済分析システム",
          publisher: "内閣府・中小企業庁",
          publisherType: "national-government",
          officialUrl: "https://resas.go.jp/",
          status: "verified",
          platform: "custom",
          notes: "fixture",
        },
        {
          id: "local-dashboard",
          title: "自治体ダッシュボード",
          publisher: "テスト市",
          publisherType: "municipality",
          officialUrl: "https://www.city.kobe.lg.jp/",
          status: "partial",
          platform: "tableau",
          notes: "部分確認fixture",
        },
      ],
      stories,
    },
    null,
    2
  );
}
