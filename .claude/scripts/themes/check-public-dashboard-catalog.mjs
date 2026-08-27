#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
export const CATALOG_PATH = path.join(
  ROOT,
  '.claude/skills/theme/research-theme-catalog/reference/public-dashboard-catalog.json'
);

const EXPECTED_RESAS_CATEGORY_COUNTS = Object.freeze({
  marketing: 6,
  tourism: 6,
  population: 8,
  industry: 6,
  'regional-economy-circulation': 5,
  'agriculture-forestry-fisheries': 7,
  'medical-care': 2,
});

const EXPECTED_RESAS_TITLES = new Set([
  '生活用品消費分析',
  '生産・消費地分析',
  '滞留人口メッシュ分析',
  '通過人口メッシュ分析',
  '事業所立地分析',
  '将来人口メッシュ分析',
  '観光地分析',
  '宿泊者分析',
  '国内観光消費分析',
  'インバウンド消費分析',
  'クレジットカード消費地分析',
  'クレジットカード消費額分析',
  '人口構成分析',
  '人口増減分析',
  '自然増減分析',
  '社会増減分析',
  '新卒者就職・進学分析',
  '通勤通学人口分析',
  '将来人口推計分析',
  '地域人口メッシュ分析',
  '産業構造分析',
  '製造品出荷額分析',
  '経営環境分析',
  '中小企業経営分析',
  '地域ビジネス環境分析',
  '地域経済総合分析',
  '地域経済循環分析',
  '生産分析',
  '分配分析',
  '支出分析',
  '影響力感応度分析',
  '農業経営体分析',
  '林業経営体分析',
  '海面漁業経営体分析',
  '内水面漁業経営体分析',
  '湖沼漁業経営体分析',
  '冷凍・冷蔵工場分析',
  '水産加工工場分析',
  '医療需給分析',
  '介護需給分析',
]);

const ALLOWED_PUBLISHER_TYPES = new Set([
  'national-government',
  'prefecture',
  'municipality',
]);
const ALLOWED_DASHBOARD_STATUSES = new Set(['verified', 'partial']);
const ALLOWED_PATTERNS = new Set([
  'overview',
  'map-to-detail',
  'trend-and-comparison',
  'composition-and-driver',
  'flow',
  'supply-demand',
  'correlation',
  'scenario',
  'policy-progress',
  'catalog-exploration',
]);
const ALLOWED_VISUALIZATIONS = new Set([
  'kpi',
  'choropleth',
  'mesh-map',
  'point-map',
  'line',
  'bar',
  'stacked-bar',
  'pyramid',
  'scatter',
  'radar',
  'ranking-table',
  'flow-map',
  'sankey',
  'heatmap',
  'treemap',
  'donut',
  'table',
  'policy-progress',
]);
const ALLOWED_GEOGRAPHIES = new Set([
  'world',
  'japan',
  'prefecture',
  'municipality',
  'mesh',
  'facility',
]);
const ALLOWED_EVIDENCE_LEVELS = new Set([
  'official-page',
  'official-index',
  'official-pdf',
  'embedded-dashboard',
]);
const ALLOWED_THEME_KEYS = new Set([
  'aging-society',
  'consumer-prices',
  'education-culture',
  'fishery-marine',
  'foreign-residents',
  'healthcare',
  'labor-mobility',
  'labor-wages',
  'living-housing',
  'local-economy',
  'local-finance',
  'manufacturing',
  'occupation-salary',
  'population-dynamics',
  'ports',
  'railway',
  'real-income',
  'roads',
  'safety',
  'tourism',
]);
const OFFICIAL_HOSTS = new Set([
  'resas.go.jp',
  'www.digital.go.jp',
  'dashboard.e-stat.go.jp',
  'www.maff.go.jp',
  'www.chisou.go.jp',
  'www.mlit.go.jp',
  'tdb.metro.tokyo.lg.jp',
  'www.pref.osaka.lg.jp',
  'www.city.kobe.lg.jp',
  'www.city.sapporo.jp',
  'www.city.nagoya.jp',
  'www2.city.kyoto.lg.jp',
  'www.pref.hiroshima.lg.jp',
]);

function isDate(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  );
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOfficialHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && OFFICIAL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function duplicateIds(items) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }
  return [...duplicates];
}

function add(errors, condition, message) {
  if (!condition) errors.push(message);
}

export function loadCatalog(catalogPath = CATALOG_PATH) {
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

export function validateCatalog(catalog) {
  const errors = [];
  const warnings = [];

  add(errors, catalog?.schemaVersion === 1, 'schemaVersion must be 1');
  add(errors, isDate(catalog?.researchedAt), 'researchedAt must be YYYY-MM-DD');
  add(
    errors,
    Array.isArray(catalog?.dashboards) && catalog.dashboards.length > 0,
    'dashboards must be non-empty'
  );
  add(
    errors,
    Array.isArray(catalog?.stories) && catalog.stories.length > 0,
    'stories must be non-empty'
  );
  add(
    errors,
    Array.isArray(catalog?.stats47ThemeKeys) &&
      catalog.stats47ThemeKeys.length > 0,
    'stats47ThemeKeys must be non-empty'
  );
  if (errors.length)
    return {
      errors,
      warnings,
      summary: {
        dashboards: 0,
        stories: 0,
        resasStories: 0,
        localDashboards: 0,
        themeKeys: 0,
      },
    };

  for (const duplicate of duplicateIds(catalog.dashboards))
    errors.push(`duplicate dashboard id: ${duplicate}`);
  for (const duplicate of duplicateIds(catalog.stories))
    errors.push(`duplicate story id: ${duplicate}`);

  const dashboardIds = new Set();
  for (const dashboard of catalog.dashboards) {
    add(errors, isNonEmptyString(dashboard.id), 'dashboard id is required');
    add(
      errors,
      isNonEmptyString(dashboard.title),
      `dashboard ${dashboard.id}: title is required`
    );
    add(
      errors,
      isNonEmptyString(dashboard.publisher),
      `dashboard ${dashboard.id}: publisher is required`
    );
    add(
      errors,
      ALLOWED_PUBLISHER_TYPES.has(dashboard.publisherType),
      `dashboard ${dashboard.id}: invalid publisherType ${dashboard.publisherType}`
    );
    add(
      errors,
      ALLOWED_DASHBOARD_STATUSES.has(dashboard.status),
      `dashboard ${dashboard.id}: invalid status ${dashboard.status}`
    );
    add(
      errors,
      isOfficialHttpsUrl(dashboard.officialUrl),
      `dashboard ${dashboard.id}: officialUrl is not an allowlisted official HTTPS URL`
    );
    dashboardIds.add(dashboard.id);
  }

  for (const story of catalog.stories) {
    const prefix = `story ${story.id}`;
    add(errors, isNonEmptyString(story.id), 'story id is required');
    add(
      errors,
      dashboardIds.has(story.dashboardId),
      `${prefix}: unknown dashboardId ${story.dashboardId}`
    );
    add(
      errors,
      isNonEmptyString(story.category),
      `${prefix}: category is required`
    );
    add(errors, isNonEmptyString(story.title), `${prefix}: title is required`);
    add(
      errors,
      isNonEmptyString(story.question) && story.question.endsWith('か'),
      `${prefix}: question must be a Japanese question ending in か`
    );
    add(
      errors,
      ALLOWED_PATTERNS.has(story.storyPattern),
      `${prefix}: invalid storyPattern ${story.storyPattern}`
    );
    add(
      errors,
      Array.isArray(story.indicatorFamilies) &&
        story.indicatorFamilies.length > 0,
      `${prefix}: indicatorFamilies must be non-empty`
    );
    add(
      errors,
      Array.isArray(story.visualizations) && story.visualizations.length > 0,
      `${prefix}: visualizations must be non-empty`
    );
    add(
      errors,
      Array.isArray(story.geographyLevels) && story.geographyLevels.length > 0,
      `${prefix}: geographyLevels must be non-empty`
    );
    add(
      errors,
      Array.isArray(story.stats47ThemeKeys) &&
        story.stats47ThemeKeys.length > 0,
      `${prefix}: stats47ThemeKeys must be non-empty`
    );
    add(
      errors,
      isOfficialHttpsUrl(story.sourceUrl),
      `${prefix}: sourceUrl is not an allowlisted official HTTPS URL`
    );
    add(
      errors,
      ALLOWED_EVIDENCE_LEVELS.has(story.evidenceLevel),
      `${prefix}: invalid evidenceLevel ${story.evidenceLevel}`
    );
    add(
      errors,
      isDate(story.verifiedAt),
      `${prefix}: verifiedAt must be YYYY-MM-DD`
    );
    for (const visualization of story.visualizations ?? []) {
      add(
        errors,
        ALLOWED_VISUALIZATIONS.has(visualization),
        `${prefix}: invalid visualization ${visualization}`
      );
    }
    for (const geography of story.geographyLevels ?? []) {
      add(
        errors,
        ALLOWED_GEOGRAPHIES.has(geography),
        `${prefix}: invalid geography ${geography}`
      );
    }
    for (const themeKey of story.stats47ThemeKeys ?? []) {
      add(
        errors,
        ALLOWED_THEME_KEYS.has(themeKey),
        `${prefix}: unknown stats47 theme ${themeKey}`
      );
    }
    if (
      new Set(story.indicatorFamilies ?? []).size !==
      (story.indicatorFamilies ?? []).length
    ) {
      errors.push(`${prefix}: duplicate indicatorFamilies`);
    }
    if (
      new Set(story.visualizations ?? []).size !==
      (story.visualizations ?? []).length
    ) {
      errors.push(`${prefix}: duplicate visualizations`);
    }
    if (
      new Set(story.stats47ThemeKeys ?? []).size !==
      (story.stats47ThemeKeys ?? []).length
    ) {
      errors.push(`${prefix}: duplicate stats47ThemeKeys`);
    }
  }

  const resasStories = catalog.stories.filter(
    (story) => story.dashboardId === 'resas'
  );
  add(
    errors,
    resasStories.length === 40,
    `RESAS inventory must contain 40 stories; found ${resasStories.length}`
  );
  for (const [category, expected] of Object.entries(
    EXPECTED_RESAS_CATEGORY_COUNTS
  )) {
    const actual = resasStories.filter(
      (story) => story.category === category
    ).length;
    add(
      errors,
      actual === expected,
      `RESAS category ${category}: expected ${expected}, found ${actual}`
    );
  }
  const actualResasTitles = new Set(resasStories.map((story) => story.title));
  for (const title of EXPECTED_RESAS_TITLES) {
    add(errors, actualResasTitles.has(title), `RESAS story missing: ${title}`);
  }
  for (const title of actualResasTitles) {
    add(
      errors,
      EXPECTED_RESAS_TITLES.has(title),
      `unexpected RESAS story: ${title}`
    );
  }

  const localDashboards = catalog.dashboards.filter(
    (dashboard) => dashboard.publisherType !== 'national-government'
  ).length;
  add(
    errors,
    localDashboards >= 7,
    `local-government dashboard coverage must be >= 7; found ${localDashboards}`
  );
  add(
    errors,
    catalog.dashboards.length >= 15,
    `dashboard source coverage must be >= 15; found ${catalog.dashboards.length}`
  );
  add(
    errors,
    catalog.stories.length >= 71,
    `story coverage must be >= 71; found ${catalog.stories.length}`
  );

  const coveredThemeKeys = new Set(
    catalog.stories.flatMap((story) => story.stats47ThemeKeys)
  );
  const declaredThemeKeys = new Set(catalog.stats47ThemeKeys);
  add(
    errors,
    declaredThemeKeys.size === catalog.stats47ThemeKeys.length,
    'stats47ThemeKeys must not contain duplicates'
  );
  for (const themeKey of ALLOWED_THEME_KEYS) {
    add(
      errors,
      declaredThemeKeys.has(themeKey),
      `stats47ThemeKeys is missing current theme: ${themeKey}`
    );
    add(
      errors,
      coveredThemeKeys.has(themeKey),
      `stats47 theme has no dashboard story: ${themeKey}`
    );
  }
  for (const themeKey of declaredThemeKeys) {
    add(
      errors,
      ALLOWED_THEME_KEYS.has(themeKey),
      `stats47ThemeKeys contains unknown theme: ${themeKey}`
    );
  }

  const verified = new Date(`${catalog.researchedAt}T00:00:00Z`);
  for (const dashboard of catalog.dashboards) {
    if (dashboard.status === 'partial')
      warnings.push(`partial dashboard: ${dashboard.id} (${dashboard.notes})`);
  }
  for (const story of catalog.stories) {
    const ageDays = Math.floor(
      (verified - new Date(`${story.verifiedAt}T00:00:00Z`)) / 86_400_000
    );
    if (ageDays > 180)
      warnings.push(`stale story evidence: ${story.id} (${ageDays} days)`);
  }

  return {
    errors,
    warnings,
    summary: {
      dashboards: catalog.dashboards.length,
      stories: catalog.stories.length,
      resasStories: resasStories.length,
      localDashboards,
      themeKeys: coveredThemeKeys.size,
    },
  };
}

function parseFlag(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function printQuery(catalog, themeKey, dashboardId) {
  const stories = catalog.stories.filter((story) => {
    if (themeKey && !story.stats47ThemeKeys.includes(themeKey)) return false;
    if (dashboardId && story.dashboardId !== dashboardId) return false;
    return true;
  });
  console.log(`target=${stories.length} inspected=${stories.length}`);
  console.log('Story ID | Dashboard | Title | Pattern | Question | Source');
  console.log('--- | --- | --- | --- | --- | ---');
  for (const story of stories) {
    console.log(
      `${story.id} | ${story.dashboardId} | ${story.title} | ${story.storyPattern} | ${story.question} | ${story.sourceUrl}`
    );
  }
}

export function main() {
  const catalog = loadCatalog();
  const result = validateCatalog(catalog);
  const themeKey = parseFlag('--theme');
  const dashboardId = parseFlag('--dashboard');
  const asJson = process.argv.includes('--json');

  if (themeKey || dashboardId) {
    if (themeKey && !ALLOWED_THEME_KEYS.has(themeKey)) {
      console.error(`unknown theme key: ${themeKey}`);
      process.exitCode = 1;
      return;
    }
    if (
      dashboardId &&
      !catalog.dashboards.some((dashboard) => dashboard.id === dashboardId)
    ) {
      console.error(`unknown dashboard id: ${dashboardId}`);
      process.exitCode = 1;
      return;
    }
    printQuery(catalog, themeKey, dashboardId);
    return;
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const { dashboards, stories, resasStories, localDashboards, themeKeys } =
      result.summary;
    console.log(
      `public-dashboard-catalog: target=${stories} inspected=${stories}`
    );
    console.log(
      `dashboards=${dashboards} local-government=${localDashboards} stories=${stories} RESAS=${resasStories}/40 theme-coverage=${themeKeys}/${catalog.stats47ThemeKeys.length}`
    );
    for (const warning of result.warnings) console.warn(`WARN ${warning}`);
    for (const error of result.errors) console.error(`ERROR ${error}`);
    if (!result.errors.length)
      console.log('PASS public dashboard catalog contract');
  }
  if (result.errors.length) process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  main();
