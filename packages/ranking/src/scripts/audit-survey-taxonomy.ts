/**
 * ranking / ThemeCatalog chart / blog chart を横断する survey taxonomy 監査。
 *
 * - ranking: MetricConfig を `resolveSurveyLinkage` と同じ core で全件解決
 * - theme: ThemeCatalog の metricKey + 全 chart e-Stat 依存を解決
 * - blog: R2 article.md が参照する全 SVG の source.json を解決
 *
 * 未解決を偽の survey で埋めず、状態と縮小専用 ratchet で可視化する。
 * 正典: `.claude/rules/survey-linkage-standards.md`
 *
 * Usage:
 *   npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts
 *   npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --json .claude/state/surveys/taxonomy.json
 *   npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --json .claude/state/surveys/taxonomy.json --tighten-ratchet
 *   npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --offline --check
 *   npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --local-r2
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { METRICS_REGISTRY } from '@stats47/data-configs';
import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';

import surveysMaster from '../data/surveys.json';
import {
  resolveBlogChartSurveyTaxonomy,
  resolveSurveyTaxonomy,
  resolveThemeSurveyTaxonomy,
  type SurveySurfaceStatus,
} from '../survey/survey-taxonomy';

interface BlogSnapshotArticle {
  slug: string;
  format?: string | null;
  published?: boolean | null;
  hasCharts?: boolean | null;
  surveyIds?: string[];
  /** 記事末尾「データ出典」の行 (export-blog-snapshot が chart lineage から焼く)。未定義 = 旧 snapshot */
  sources?: unknown[];
}

interface BlogSnapshot {
  schemaVersion?: number;
  articles?: BlogSnapshotArticle[];
  surveyArticleIndex?: Record<string, string[]>;
}

interface RatchetConfig {
  schemaVersion: number;
  maxStateAgeDays: number;
  ranking: { minActiveResolved: number; minActiveCoveragePct: number };
  theme: {
    minResolvedCharts: number;
    minCoveragePct: number;
    maxMissingLineageCharts: number;
    minResolvedMetricGroups: number;
    minMetricGroupCoveragePct: number;
    maxMissingLineageMetricGroups: number;
  };
  blog: {
    minCharts: number;
    minResolvedCharts: number;
    minCoveragePct: number;
    maxUnresolvedCharts: number;
    maxMissingLineageCharts: number;
    /**
     * 出典表示の悪化防止 (2026-09-25〜)。未設定の間は計測と表示だけ行う。
     * - 本文に手書きの「データ出典」節が残る公開記事 (Kindle 書籍の章は本文を変えないので残る)
     * - 図があるのに出典を 1 件も出せない公開記事
     * - snapshot に sources が焼かれていない公開記事 (true で 0 件を要求)
     */
    maxLegacyDataSourceSectionArticles?: number;
    maxSourcelessChartArticles?: number;
    requireSnapshotSources?: boolean;
  };
}

interface TaxonomyState {
  schemaVersion: number;
  generatedAt: string;
  masterSurveyCount: number;
  ranking: ReturnType<typeof auditRanking>;
  theme: ReturnType<typeof auditThemes>;
  blog: Awaited<ReturnType<typeof auditBlog>>;
  surveys: Array<{
    surveyId: string;
    rankingCount: number;
    themeKeys: string[];
    blogSlugs: string[];
  }>;
}

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../..'
);
const STATE_PATH = path.join(ROOT, '.claude/state/surveys/taxonomy.json');
const RATCHET_PATH = path.join(
  ROOT,
  '.claude/config/survey-taxonomy-ratchet.json'
);
const R2 = (
  process.env.R2_PUBLIC_FETCH_URL || 'https://storage.stats47.jp'
).replace(/\/+$/, '');
const args = process.argv.slice(2);
const offline = args.includes('--offline');
const localR2 = args.includes('--local-r2');
const check = args.includes('--check');
const tightenRatchet = args.includes('--tighten-ratchet');
const jsonIndex = args.indexOf('--json');
const jsonTarget =
  jsonIndex >= 0 && args[jsonIndex + 1] && !args[jsonIndex + 1].startsWith('--')
    ? path.resolve(ROOT, args[jsonIndex + 1])
    : null;
const jsonStdout = jsonIndex >= 0 && !jsonTarget;
const blogLimitIndex = args.indexOf('--blog-limit');
const blogLimit = blogLimitIndex >= 0 ? Number(args[blogLimitIndex + 1]) : null;
const masterIds = new Set(
  (surveysMaster as Array<{ id: string }>).map((survey) => survey.id)
);

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function tallyStatus(
  rows: Array<{ status: SurveySurfaceStatus }>
): Record<SurveySurfaceStatus, number> {
  const out: Record<SurveySurfaceStatus, number> = {
    resolved: 0,
    unresolved: 0,
    'not-applicable': 0,
    'missing-lineage': 0,
  };
  for (const row of rows) out[row.status] += 1;
  return out;
}

function auditRanking() {
  // `/ranking/*` survey taxonomy の母集団は既存 audit-survey-linkage と同じ
  // prefecture entity のみ。city/world 専用 metric を混ぜると二つの監査が食い違う。
  const metrics = Object.values(METRICS_REGISTRY).filter((metric) =>
    metric.entities?.includes('prefecture')
  );
  const active = metrics.filter((metric) => metric.isActive === true);
  const allRows = metrics.map((metric) => ({
    key: metric.key,
    active: metric.isActive === true,
    notApplicable: metric.surveyScope === 'not-applicable',
    resolution: resolveSurveyTaxonomy(
      { metricKeys: [metric.key] },
      METRICS_REGISTRY
    ),
  }));
  const applicable = allRows.filter((row) => !row.notApplicable);
  const activeApplicable = applicable.filter((row) => row.active);
  const notApplicable = allRows.filter((row) => row.notApplicable);
  const activeNotApplicable = notApplicable.filter((row) => row.active);
  const resolved = applicable.filter(
    (row) => row.resolution.surveys.length > 0
  );
  const activeResolved = resolved.filter((row) => row.active);
  const unresolved = applicable.filter(
    (row) => row.resolution.surveys.length === 0
  );
  const activeUnresolved = unresolved.filter((row) => row.active);
  const surveyCounts = new Map<string, number>();
  for (const row of allRows.filter((item) => item.active)) {
    for (const survey of row.resolution.surveys) {
      surveyCounts.set(survey.id, (surveyCounts.get(survey.id) ?? 0) + 1);
    }
  }
  return {
    metrics: metrics.length,
    activeMetrics: active.length,
    applicableMetrics: applicable.length,
    activeApplicableMetrics: activeApplicable.length,
    notApplicable: notApplicable.length,
    activeNotApplicable: activeNotApplicable.length,
    resolved: resolved.length,
    unresolved: unresolved.length,
    coveragePct: round(
      (resolved.length / Math.max(applicable.length, 1)) * 100
    ),
    activeResolved: activeResolved.length,
    activeUnresolved: activeUnresolved.length,
    activeCoveragePct: round(
      (activeResolved.length / Math.max(activeApplicable.length, 1)) * 100
    ),
    activeNotApplicableKeys: activeNotApplicable.map((row) => row.key).sort(),
    activeUnresolvedKeys: activeUnresolved.map((row) => row.key).sort(),
    perSurveyActive: Object.fromEntries(
      [...surveyCounts.entries()].sort(([a], [b]) => a.localeCompare(b))
    ),
  };
}

function auditThemes() {
  const groups = Object.values(THEME_CATALOGS).flatMap((catalog) =>
    resolveThemeSurveyTaxonomy(catalog, METRICS_REGISTRY).metricGroups.map(
      (group) => ({ themeKey: catalog.key, ...group })
    )
  );
  const groupStatus = tallyStatus(groups);
  const applicableGroups = groups.length - groupStatus['not-applicable'];
  const rows = Object.values(THEME_CATALOGS).flatMap((catalog) => {
    const result = resolveThemeSurveyTaxonomy(catalog, METRICS_REGISTRY);
    return result.charts.map((chart) => ({ themeKey: catalog.key, ...chart }));
  });
  const byStatus = tallyStatus(rows);
  const applicable = rows.length - byStatus['not-applicable'];
  const surveyThemes = new Map<string, Set<string>>();
  for (const catalog of Object.values(THEME_CATALOGS)) {
    const result = resolveThemeSurveyTaxonomy(catalog, METRICS_REGISTRY);
    for (const survey of result.surveys) {
      const set = surveyThemes.get(survey.id) ?? new Set<string>();
      set.add(catalog.key);
      surveyThemes.set(survey.id, set);
    }
  }
  return {
    themes: Object.keys(THEME_CATALOGS).length,
    metricGroups: {
      total: groups.length,
      byStatus: groupStatus,
      coveragePct: round((groupStatus.resolved / Math.max(applicableGroups, 1)) * 100),
      unresolved: groups.filter((group) =>
        group.status === 'unresolved' || group.status === 'missing-lineage'
      ).map(({ themeKey, componentKey, status, unresolvedMetricKeys }) => ({
        themeKey, groupKey: componentKey, status, unresolvedMetricKeys,
      })),
    },
    charts: rows.length,
    applicableCharts: applicable,
    byStatus,
    coveragePct: round((byStatus.resolved / Math.max(applicable, 1)) * 100),
    unresolvedCharts: rows
      .filter(
        (row) => row.status === 'unresolved' || row.status === 'missing-lineage'
      )
      .map((row) => ({
        themeKey: row.themeKey,
        componentKey: row.componentKey,
        status: row.status,
        unresolvedMetricKeys: row.unresolvedMetricKeys,
        unresolvedEstatReferences: row.unresolvedEstatReferences,
      })),
    perSurveyThemes: Object.fromEntries(
      [...surveyThemes.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, keys]) => [id, [...keys].sort()])
    ),
  };
}

function noCache(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}__survey_taxonomy=${Date.now().toString(36)}`;
}

async function fetchText(key: string): Promise<string | null> {
  if (localR2) {
    const target = path.join(ROOT, '.local/r2', key);
    return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  }
  try {
    const response = await fetch(noCache(`${R2}/${key}`), {
      signal: AbortSignal.timeout(20_000),
    });
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

async function fetchJson(key: string): Promise<unknown | null> {
  const text = await fetchText(key);
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function pool<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        out[index] = await fn(items[index]);
      }
    })
  );
  return out;
}

function chartBases(content: string): string[] {
  return [
    ...new Set(
      [...content.matchAll(/\]\(data\/([^)]+?)\.svg(?:[?#][^)]*)?\)/g)].map(
        (match) => match[1]
      )
    ),
  ];
}

/** 本文に手書きされた旧「データ出典」節。出典はページ末尾の DataSourceList が chart lineage から出す */
const LEGACY_DATA_SOURCE_HEADING = /^#{2,4}\s*データ出典\s*$/m;

function articleRankingKeys(content: string): string[] {
  return [
    ...new Set(
      [
        ...content.matchAll(/\]\(\/ranking\/([a-z0-9-]+)\/?(?:[?#][^)]*)?\)/g),
      ].map((match) => match[1])
    ),
  ];
}

async function auditBlog() {
  const snapshot = (await fetchJson(
    'app/blog/all.json'
  )) as BlogSnapshot | null;
  let articles = (snapshot?.articles ?? []).filter(
    (article) => article.published === true
  );
  if (blogLimit && Number.isFinite(blogLimit))
    articles = articles.slice(0, blogLimit);

  const articleRows = await pool(articles, 12, async (article) => {
    const ext = article.format === 'mdx' ? 'mdx' : 'md';
    const content = await fetchText(`app/blog/${article.slug}/article.${ext}`);
    if (content === null) {
      return {
        slug: article.slug,
        snapshotSurveyIds: article.surveyIds ?? [],
        rankingSurveyIds: [] as string[],
        legacyDataSourceSection: false,
        sourcesBaked: article.sources !== undefined,
        sourceCount: article.sources?.length ?? 0,
        charts: [
          {
            base: '(article)',
            status: 'missing-lineage' as const,
            surveyIds: [] as string[],
          },
        ],
      };
    }
    const rankingSurveyIds = resolveSurveyTaxonomy(
      { metricKeys: articleRankingKeys(content) },
      METRICS_REGISTRY
    ).surveys.map((survey) => survey.id);
    const bases = chartBases(content);
    const charts = await pool(bases, 8, async (base) => {
      const source = await fetchJson(
        `app/blog/${article.slug}/data/${base}.source.json`
      );
      const result = resolveBlogChartSurveyTaxonomy(source, METRICS_REGISTRY);
      return {
        base,
        status: result.status,
        surveyIds: result.surveys.map((survey) => survey.id),
      };
    });
    return {
      slug: article.slug,
      snapshotSurveyIds: article.surveyIds ?? [],
      rankingSurveyIds,
      legacyDataSourceSection: LEGACY_DATA_SOURCE_HEADING.test(content),
      sourcesBaked: article.sources !== undefined,
      sourceCount: article.sources?.length ?? 0,
      charts,
    };
  });

  const charts = articleRows.flatMap((article) =>
    article.charts.map((chart) => ({ slug: article.slug, ...chart }))
  );
  const byStatus = tallyStatus(charts);
  const applicable = charts.length - byStatus['not-applicable'];
  const perSurveyBlogs = new Map<string, Set<string>>();
  const snapshotLineageMissingArticles: Array<{
    slug: string;
    surveyIds: string[];
  }> = [];
  const snapshotIndexMissingArticles: Array<{
    slug: string;
    surveyIds: string[];
  }> = [];
  for (const article of articleRows) {
    const derivedSurveyIds = [
      ...new Set([
        ...article.rankingSurveyIds,
        ...article.charts.flatMap((chart) => chart.surveyIds),
      ]),
    ].sort();
    const snapshotSurveyIdSet = new Set(article.snapshotSurveyIds);
    const missingSurveyIds = derivedSurveyIds.filter(
      (id) => !snapshotSurveyIdSet.has(id)
    );
    if (missingSurveyIds.length > 0) {
      snapshotLineageMissingArticles.push({
        slug: article.slug,
        surveyIds: missingSurveyIds,
      });
    }
    const missingIndexIds = derivedSurveyIds.filter(
      (id) => !(snapshot?.surveyArticleIndex?.[id] ?? []).includes(article.slug)
    );
    if (missingIndexIds.length > 0) {
      snapshotIndexMissingArticles.push({
        slug: article.slug,
        surveyIds: missingIndexIds,
      });
    }
    for (const id of derivedSurveyIds) {
      const set = perSurveyBlogs.get(id) ?? new Set<string>();
      set.add(article.slug);
      perSurveyBlogs.set(id, set);
    }
  }
  return {
    articles: articles.length,
    charts: charts.length,
    applicableCharts: applicable,
    byStatus,
    coveragePct: round((byStatus.resolved / Math.max(applicable, 1)) * 100),
    unresolvedCharts: charts
      .filter(
        (chart) =>
          chart.status === 'unresolved' || chart.status === 'missing-lineage'
      )
      .map(({ slug, base, status }) => ({ slug, base, status })),
    snapshotSchemaVersion: snapshot?.schemaVersion ?? 1,
    dataSources: {
      legacySectionArticles: articleRows
        .filter((article) => article.legacyDataSourceSection)
        .map((article) => article.slug)
        .sort(),
      sourcelessChartArticles: articleRows
        .filter(
          (article) =>
            article.sourcesBaked &&
            article.sourceCount === 0 &&
            article.charts.some((chart) => chart.base !== '(article)')
        )
        .map((article) => article.slug)
        .sort(),
      snapshotSourcesMissingArticles: articleRows
        .filter((article) => !article.sourcesBaked)
        .map((article) => article.slug)
        .sort(),
    },
    snapshotLineageMissingArticles,
    snapshotIndexMissingArticles,
    perSurveyBlogs: Object.fromEntries(
      [...perSurveyBlogs.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, slugs]) => [id, [...slugs].sort()])
    ),
  };
}

function loadState(): TaxonomyState | null {
  if (!fs.existsSync(STATE_PATH)) return null;
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) as TaxonomyState;
}

function loadRatchet(): RatchetConfig | null {
  if (!fs.existsSync(RATCHET_PATH)) return null;
  return JSON.parse(fs.readFileSync(RATCHET_PATH, 'utf8')) as RatchetConfig;
}

/** 設定済みの上限だけを改善方向へ詰める。未設定 (導入前) の上限は勝手に作らない。 */
function tightenOptionalMax<K extends string>(
  key: K,
  current: number | undefined,
  observed: number | undefined
): Partial<Record<K, number>> {
  if (current === undefined) return {};
  return { [key]: observed === undefined ? current : Math.min(current, observed) } as Partial<
    Record<K, number>
  >;
}

/** 改善値だけを ratchet へ反映する。既存下限を緩める更新は行わない。 */
function tightenRatchetConfig(state: TaxonomyState): void {
  const current = loadRatchet();
  if (!current) throw new Error(`${path.relative(ROOT, RATCHET_PATH)} が無い`);
  const next: RatchetConfig = {
    ...current,
    ranking: {
      minActiveResolved: Math.max(
        current.ranking.minActiveResolved,
        state.ranking.activeResolved
      ),
      minActiveCoveragePct: Math.max(
        current.ranking.minActiveCoveragePct,
        state.ranking.activeCoveragePct
      ),
    },
    theme: {
      minResolvedMetricGroups: Math.max(current.theme.minResolvedMetricGroups, state.theme.metricGroups.byStatus.resolved),
      minMetricGroupCoveragePct: Math.max(current.theme.minMetricGroupCoveragePct, state.theme.metricGroups.coveragePct),
      maxMissingLineageMetricGroups: Math.min(current.theme.maxMissingLineageMetricGroups, state.theme.metricGroups.byStatus['missing-lineage']),
      minResolvedCharts: Math.max(
        current.theme.minResolvedCharts,
        state.theme.byStatus.resolved
      ),
      minCoveragePct: Math.max(
        current.theme.minCoveragePct,
        state.theme.coveragePct
      ),
      maxMissingLineageCharts: Math.min(
        current.theme.maxMissingLineageCharts,
        state.theme.byStatus['missing-lineage']
      ),
    },
    blog: {
      minCharts: Math.max(current.blog.minCharts, state.blog.charts),
      minResolvedCharts: Math.max(
        current.blog.minResolvedCharts,
        state.blog.byStatus.resolved
      ),
      minCoveragePct: Math.max(
        current.blog.minCoveragePct,
        state.blog.coveragePct
      ),
      maxUnresolvedCharts: Math.min(
        current.blog.maxUnresolvedCharts,
        state.blog.byStatus.unresolved
      ),
      maxMissingLineageCharts: Math.min(
        current.blog.maxMissingLineageCharts,
        state.blog.byStatus['missing-lineage']
      ),
      ...tightenOptionalMax(
        'maxLegacyDataSourceSectionArticles',
        current.blog.maxLegacyDataSourceSectionArticles,
        state.blog.dataSources?.legacySectionArticles.length
      ),
      ...tightenOptionalMax(
        'maxSourcelessChartArticles',
        current.blog.maxSourcelessChartArticles,
        state.blog.dataSources?.sourcelessChartArticles.length
      ),
      ...(current.blog.requireSnapshotSources !== undefined
        ? { requireSnapshotSources: current.blog.requireSnapshotSources }
        : {}),
    },
  };
  fs.writeFileSync(RATCHET_PATH, JSON.stringify(next, null, 2) + '\n');
}

function validateState(
  state: TaxonomyState,
  currentRanking: ReturnType<typeof auditRanking>,
  currentTheme: ReturnType<typeof auditThemes>
): string[] {
  const errors: string[] = [];
  const ratchet = loadRatchet();
  if (state.schemaVersion !== 1)
    errors.push(`schemaVersion=${state.schemaVersion} (expected 1)`);
  if (state.masterSurveyCount !== masterIds.size) {
    errors.push(
      `masterSurveyCount=${state.masterSurveyCount} / current=${masterIds.size}`
    );
  }
  if (JSON.stringify(state.ranking) !== JSON.stringify(currentRanking)) {
    errors.push(
      'ranking taxonomy state が現行 MetricConfig と drift (full audit を再実行)'
    );
  }
  if (JSON.stringify(state.theme) !== JSON.stringify(currentTheme)) {
    errors.push(
      'theme taxonomy state が現行 ThemeCatalog と drift (full audit を再実行)'
    );
  }
  for (const survey of state.surveys ?? []) {
    if (!masterIds.has(survey.surveyId))
      errors.push(`state に master 非実在 survey: ${survey.surveyId}`);
  }
  if (!ratchet) {
    errors.push('survey taxonomy ratchet config が無い');
    return errors;
  }
  const ageDays =
    (Date.now() - new Date(state.generatedAt).getTime()) / 86_400_000;
  if (!Number.isFinite(ageDays) || ageDays > ratchet.maxStateAgeDays) {
    errors.push(
      `taxonomy state stale: ${round(ageDays, 1)}日 > ${ratchet.maxStateAgeDays}日`
    );
  }
  if (currentRanking.activeResolved < ratchet.ranking.minActiveResolved) {
    errors.push(
      `ranking active resolved ${currentRanking.activeResolved} < ${ratchet.ranking.minActiveResolved}`
    );
  }
  if (currentRanking.activeCoveragePct < ratchet.ranking.minActiveCoveragePct) {
    errors.push(
      `ranking active coverage ${currentRanking.activeCoveragePct}% < ${ratchet.ranking.minActiveCoveragePct}%`
    );
  }
  if (currentTheme.byStatus.resolved < ratchet.theme.minResolvedCharts) {
    errors.push(
      `theme resolved charts ${currentTheme.byStatus.resolved} < ${ratchet.theme.minResolvedCharts}`
    );
  }
  if (currentTheme.coveragePct < ratchet.theme.minCoveragePct) {
    errors.push(
      `theme coverage ${currentTheme.coveragePct}% < ${ratchet.theme.minCoveragePct}%`
    );
  }
  if (currentTheme.metricGroups.byStatus.resolved < ratchet.theme.minResolvedMetricGroups) {
    errors.push(`theme resolved metric groups ${currentTheme.metricGroups.byStatus.resolved} < ${ratchet.theme.minResolvedMetricGroups}`);
  }
  if (currentTheme.metricGroups.coveragePct < ratchet.theme.minMetricGroupCoveragePct) {
    errors.push(`theme metric group coverage ${currentTheme.metricGroups.coveragePct}% < ${ratchet.theme.minMetricGroupCoveragePct}%`);
  }
  if (currentTheme.metricGroups.byStatus['missing-lineage'] > ratchet.theme.maxMissingLineageMetricGroups) {
    errors.push(`theme metric groups missing lineage ${currentTheme.metricGroups.byStatus['missing-lineage']} > ${ratchet.theme.maxMissingLineageMetricGroups}`);
  }
  if (
    currentTheme.byStatus['missing-lineage'] >
    ratchet.theme.maxMissingLineageCharts
  ) {
    errors.push(
      `theme missing-lineage ${currentTheme.byStatus['missing-lineage']} > ${ratchet.theme.maxMissingLineageCharts}`
    );
  }
  if (state.blog.charts < ratchet.blog.minCharts) {
    errors.push(`blog charts ${state.blog.charts} < ${ratchet.blog.minCharts}`);
  }
  if (state.blog.byStatus.resolved < ratchet.blog.minResolvedCharts) {
    errors.push(
      `blog resolved charts ${state.blog.byStatus.resolved} < ${ratchet.blog.minResolvedCharts}`
    );
  }
  if (state.blog.coveragePct < ratchet.blog.minCoveragePct) {
    errors.push(
      `blog coverage ${state.blog.coveragePct}% < ${ratchet.blog.minCoveragePct}%`
    );
  }
  if (state.blog.byStatus.unresolved > ratchet.blog.maxUnresolvedCharts) {
    errors.push(
      `blog unresolved ${state.blog.byStatus.unresolved} > ${ratchet.blog.maxUnresolvedCharts}`
    );
  }
  if (
    state.blog.byStatus['missing-lineage'] >
    ratchet.blog.maxMissingLineageCharts
  ) {
    errors.push(
      `blog missing-lineage ${state.blog.byStatus['missing-lineage']} > ${ratchet.blog.maxMissingLineageCharts}`
    );
  }
  if ((state.blog.snapshotLineageMissingArticles?.length ?? 0) > 0) {
    errors.push(
      `blog snapshot surveyIds 欠落 ${state.blog.snapshotLineageMissingArticles.length}記事 ` +
        '(export-blog-snapshot.ts を再実行)'
    );
  }
  if ((state.blog.snapshotIndexMissingArticles?.length ?? 0) > 0) {
    errors.push(
      `blog snapshot surveyArticleIndex 欠落 ${state.blog.snapshotIndexMissingArticles.length}記事 ` +
        '(schemaVersion 2 snapshot を再生成)'
    );
  }
  const dataSources = state.blog.dataSources;
  if (dataSources) {
    const { maxLegacyDataSourceSectionArticles, maxSourcelessChartArticles, requireSnapshotSources } =
      ratchet.blog;
    if (
      maxLegacyDataSourceSectionArticles !== undefined &&
      dataSources.legacySectionArticles.length > maxLegacyDataSourceSectionArticles
    ) {
      errors.push(
        `blog 手書きのデータ出典節 ${dataSources.legacySectionArticles.length}記事 > ${maxLegacyDataSourceSectionArticles} ` +
          '(migrate-data-source-sections.ts で移行。出典は chart source.json に記録)'
      );
    }
    if (
      maxSourcelessChartArticles !== undefined &&
      dataSources.sourcelessChartArticles.length > maxSourcelessChartArticles
    ) {
      errors.push(
        `blog 出典 0 件の図付き記事 ${dataSources.sourcelessChartArticles.length}記事 > ${maxSourcelessChartArticles} ` +
          '(source.json に displaySources を付ける: backfill-display-sources.ts)'
      );
    }
    if (requireSnapshotSources && dataSources.snapshotSourcesMissingArticles.length > 0) {
      errors.push(
        `blog snapshot sources 未焼き込み ${dataSources.snapshotSourcesMissingArticles.length}記事 ` +
          '(export-blog-snapshot.ts を再実行)'
      );
    }
  }
  return errors;
}

function buildCrossIndex(
  ranking: ReturnType<typeof auditRanking>,
  theme: ReturnType<typeof auditThemes>,
  blog: Awaited<ReturnType<typeof auditBlog>>
) {
  return [...masterIds].sort().map((surveyId) => ({
    surveyId,
    rankingCount: ranking.perSurveyActive[surveyId] ?? 0,
    themeKeys: theme.perSurveyThemes[surveyId] ?? [],
    blogSlugs: blog.perSurveyBlogs[surveyId] ?? [],
  }));
}

async function main() {
  const ranking = auditRanking();
  const theme = auditThemes();
  const previous = loadState();
  if (offline && !previous)
    throw new Error(`${path.relative(ROOT, STATE_PATH)} が無い`);
  const blog = offline ? previous!.blog : await auditBlog();
  const state: TaxonomyState = {
    schemaVersion: 1,
    generatedAt: offline ? previous!.generatedAt : new Date().toISOString(),
    masterSurveyCount: masterIds.size,
    ranking,
    theme,
    blog,
    surveys: buildCrossIndex(ranking, theme, blog),
  };
  if (tightenRatchet) tightenRatchetConfig(state);
  const errors = check ? validateState(previous ?? state, ranking, theme) : [];

  if (jsonTarget) {
    fs.mkdirSync(path.dirname(jsonTarget), { recursive: true });
    fs.writeFileSync(jsonTarget, JSON.stringify(state, null, 2) + '\n');
  } else if (jsonStdout) {
    process.stdout.write(JSON.stringify({ ...state, errors }, null, 2));
  } else {
    console.log(`survey taxonomy: master ${state.masterSurveyCount}`);
    console.log(
      `ranking active ${ranking.activeMetrics}: resolved ${ranking.activeResolved} / unresolved ${ranking.activeUnresolved} / n/a ${ranking.activeNotApplicable} / coverage ${ranking.activeCoveragePct}%`
    );
    console.log(
      `theme charts ${theme.charts}: resolved ${theme.byStatus.resolved} / unresolved ${theme.byStatus.unresolved} / missing ${theme.byStatus['missing-lineage']} / n/a ${theme.byStatus['not-applicable']} / coverage ${theme.coveragePct}%`
    );
    console.log(`theme metric groups ${theme.metricGroups.total}: resolved ${theme.metricGroups.byStatus.resolved} / coverage ${theme.metricGroups.coveragePct}%`);
    console.log(
      `blog charts ${blog.charts}: resolved ${blog.byStatus.resolved} / unresolved ${blog.byStatus.unresolved} / missing ${blog.byStatus['missing-lineage']} / n/a ${blog.byStatus['not-applicable']} / coverage ${blog.coveragePct}%`
    );
    // 週次 Issue はこのログ末尾を載せる。件数だけだと直す対象が分からないので図を名指しする
    for (const chart of blog.unresolvedCharts.slice(0, 20)) {
      console.log(`  ✗ blog ${chart.status}: ${chart.slug} / ${chart.base}`);
    }
    if (blog.unresolvedCharts.length > 20) {
      console.log(`  … 他 ${blog.unresolvedCharts.length - 20} 件 (state の blog.unresolvedCharts)`);
    }
    if (blog.dataSources) {
      const { legacySectionArticles, sourcelessChartArticles, snapshotSourcesMissingArticles } =
        blog.dataSources;
      console.log(
        `blog data sources: 手書き節 ${legacySectionArticles.length} / 出典 0 件の図付き記事 ${sourcelessChartArticles.length} / sources 未焼き込み ${snapshotSourcesMissingArticles.length}`
      );
      for (const slug of sourcelessChartArticles.slice(0, 20)) {
        console.log(`  ✗ blog sourceless: ${slug}`);
      }
    }
    console.log(
      `blog snapshot v${blog.snapshotSchemaVersion ?? 1}: surveyIds missing ${blog.snapshotLineageMissingArticles?.length ?? 0} / reverse-index missing ${blog.snapshotIndexMissingArticles?.length ?? 0}`
    );
    if (jsonTarget) console.log(`state: ${path.relative(ROOT, jsonTarget)}`);
    for (const error of errors) console.error(`✗ ${error}`);
    if (check && errors.length === 0)
      console.log('✓ taxonomy state / freshness / ratchet 違反なし');
  }
  if (errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
