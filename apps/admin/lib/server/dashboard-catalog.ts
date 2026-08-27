import "server-only";

import type {
  DashboardCatalogResponse,
  DashboardPublisherTypeDTO,
  DashboardVerificationStatusDTO,
  ResearchDashboardDTO,
  ResearchStoryDTO,
} from "@/lib/contracts/types";
import { THEME_INDICATOR_SETS } from "@stats47/types";

import { cached, readJson, TTL } from "./state-io";

const CATALOG_PATH =
  ".claude/skills/theme/research-theme-catalog/reference/public-dashboard-catalog.json";
const STALE_DAYS = 180;
// ThemeCatalog から生成される軽量な一覧を利用する。climate は旧来の
// IndicatorSet のみで、ThemeCatalog の管理対象ではない。
const CURRENT_THEME_METADATA = THEME_INDICATOR_SETS.filter(
  (theme) => theme.key !== "climate"
);
const CURRENT_THEME_BY_KEY = new Map(
  CURRENT_THEME_METADATA.map((theme) => [theme.key, theme])
);

interface RawDashboard {
  id: string;
  title: string;
  publisher: string;
  publisherType: DashboardPublisherTypeDTO;
  officialUrl: string;
  status: DashboardVerificationStatusDTO;
  platform: string;
  notes?: string;
}

interface RawStory {
  id: string;
  dashboardId: string;
  category: string;
  title: string;
  question: string;
  storyPattern: string;
  indicatorFamilies: string[];
  visualizations: string[];
  geographyLevels: string[];
  stats47ThemeKeys: string[];
  sourceUrl: string;
  evidenceLevel: string;
  verifiedAt: string;
}

interface RawCatalog {
  schemaVersion: number;
  researchedAt: string;
  stats47ThemeKeys: string[];
  dashboards: RawDashboard[];
  stories: RawStory[];
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function ageDays(value: string): number {
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - timestamp) / 86_400_000);
}

function countBy(values: string[]): Array<{ key: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function collectDashboardCatalog(): DashboardCatalogResponse {
  const catalog = readJson<RawCatalog>(CATALOG_PATH);
  if (!Array.isArray(catalog.dashboards) || !Array.isArray(catalog.stories)) {
    throw new Error("dashboard catalog arrays are missing");
  }
  if (!Array.isArray(catalog.stats47ThemeKeys)) {
    throw new Error("dashboard catalog theme keys are missing");
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  if (catalog.schemaVersion !== 1) {
    errors.push(`未対応のスキーマバージョン: ${catalog.schemaVersion}`);
  }
  const dashboardIds = new Set(catalog.dashboards.map((item) => item.id));
  const declaredThemes = new Set(catalog.stats47ThemeKeys);
  const currentThemes = new Set(CURRENT_THEME_BY_KEY.keys());
  const coveredThemes = new Set(
    catalog.stories
      .flatMap((story) => story.stats47ThemeKeys ?? [])
      .filter((themeKey) => declaredThemes.has(themeKey))
  );

  for (const id of duplicateValues(catalog.dashboards.map((item) => item.id))) {
    errors.push(`ダッシュボードIDが重複: ${id}`);
  }
  for (const id of duplicateValues(catalog.stories.map((item) => item.id))) {
    errors.push(`ストーリーIDが重複: ${id}`);
  }
  for (const key of duplicateValues(catalog.stats47ThemeKeys)) {
    errors.push(`テーマキーが重複: ${key}`);
  }
  for (const themeKey of currentThemes) {
    if (!declaredThemes.has(themeKey)) {
      errors.push(`現行テーマがカタログ宣言にない: ${themeKey}`);
    }
  }
  for (const themeKey of declaredThemes) {
    if (!currentThemes.has(themeKey)) {
      errors.push(`存在しないテーマをカタログ宣言: ${themeKey}`);
    }
  }

  for (const dashboard of catalog.dashboards) {
    if (!isHttps(dashboard.officialUrl)) {
      errors.push(`公式URLがHTTPSではない: ${dashboard.id}`);
    }
    if (dashboard.status === "partial") {
      warnings.push(`部分確認: ${dashboard.title}`);
    }
  }

  const staleStories: RawStory[] = [];
  for (const story of catalog.stories) {
    if (!dashboardIds.has(story.dashboardId)) {
      errors.push(`参照先ダッシュボードがない: ${story.id}`);
    }
    if (!isHttps(story.sourceUrl)) {
      errors.push(`出典URLがHTTPSではない: ${story.id}`);
    }
    if (
      !Array.isArray(story.stats47ThemeKeys) ||
      story.stats47ThemeKeys.length === 0
    ) {
      errors.push(`テーマ未紐付け: ${story.id}`);
    }
    for (const themeKey of story.stats47ThemeKeys ?? []) {
      if (!declaredThemes.has(themeKey)) {
        errors.push(`未登録テーマを参照: ${story.id} → ${themeKey}`);
      }
    }
    if (ageDays(story.verifiedAt) > STALE_DAYS) staleStories.push(story);
  }

  for (const themeKey of declaredThemes) {
    if (!coveredThemes.has(themeKey))
      errors.push(`公式ストーリーがないテーマ: ${themeKey}`);
  }

  const resasStories = catalog.stories.filter(
    (story) => story.dashboardId === "resas"
  ).length;
  if (resasStories !== 40)
    errors.push(`RESAS分析が40件ではない: ${resasStories}件`);
  if (ageDays(catalog.researchedAt) > STALE_DAYS) {
    warnings.push(
      `カタログ調査日が${STALE_DAYS}日超過: ${catalog.researchedAt}`
    );
  }
  if (staleStories.length > 0) {
    warnings.push(
      `確認日が${STALE_DAYS}日超過したストーリー: ${staleStories.length}件`
    );
  }

  const storyCounts = new Map<string, number>();
  for (const story of catalog.stories) {
    storyCounts.set(
      story.dashboardId,
      (storyCounts.get(story.dashboardId) ?? 0) + 1
    );
  }

  const dashboards: ResearchDashboardDTO[] = catalog.dashboards
    .map((dashboard) => ({
      ...dashboard,
      notes: dashboard.notes ?? "",
      storyCount: storyCounts.get(dashboard.id) ?? 0,
    }))
    .sort(
      (a, b) => b.storyCount - a.storyCount || a.title.localeCompare(b.title)
    );
  const dashboardById = new Map(
    dashboards.map((dashboard) => [dashboard.id, dashboard])
  );

  const stories: ResearchStoryDTO[] = catalog.stories.map((story) => {
    const dashboard = dashboardById.get(story.dashboardId);
    return {
      ...story,
      dashboardTitle: dashboard?.title ?? story.dashboardId,
      dashboardStatus: dashboard?.status ?? "partial",
    };
  });

  const localDashboards = dashboards.filter(
    (dashboard) => dashboard.publisherType !== "national-government"
  ).length;
  const partialDashboards = dashboards.filter(
    (dashboard) => dashboard.status === "partial"
  ).length;

  return {
    researchedAt: catalog.researchedAt,
    sourcePath: CATALOG_PATH,
    summary: {
      dashboards: dashboards.length,
      localDashboards,
      stories: stories.length,
      resasStories,
      coveredThemes: coveredThemes.size,
      declaredThemes: declaredThemes.size,
      partialDashboards,
      staleStories: staleStories.length,
    },
    audit: {
      status:
        errors.length > 0 ? "fail" : warnings.length > 0 ? "warn" : "pass",
      errors,
      warnings,
    },
    filters: {
      themes: countBy(stories.flatMap((story) => story.stats47ThemeKeys)).map(
        (theme) => ({
          ...theme,
          label: CURRENT_THEME_BY_KEY.get(theme.key)?.title ?? theme.key,
        })
      ),
      patterns: countBy(stories.map((story) => story.storyPattern)),
    },
    dashboards,
    stories,
  };
}

export function dashboardCatalog(): DashboardCatalogResponse {
  return cached("dashboard-catalog", TTL.daily, collectDashboardCatalog);
}
