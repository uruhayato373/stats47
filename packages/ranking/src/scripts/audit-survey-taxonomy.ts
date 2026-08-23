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
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { METRICS_REGISTRY } from "@stats47/data-configs";
import { THEME_CATALOGS } from "@stats47/data-configs/theme-catalog";

import surveysMaster from "../data/surveys.json";
import {
  resolveBlogChartSurveyTaxonomy,
  resolveSurveyTaxonomy,
  resolveThemeSurveyTaxonomy,
  type SurveySurfaceStatus,
} from "../survey/survey-taxonomy";

interface BlogSnapshotArticle {
  slug: string;
  format?: string | null;
  published?: boolean | null;
  hasCharts?: boolean | null;
}

interface BlogSnapshot {
  articles?: BlogSnapshotArticle[];
}

interface RatchetConfig {
  schemaVersion: number;
  maxStateAgeDays: number;
  ranking: { minActiveResolved: number; minActiveCoveragePct: number };
  theme: {
    minResolvedCharts: number;
    minCoveragePct: number;
    maxMissingLineageCharts: number;
  };
  blog: {
    minCharts: number;
    minResolvedCharts: number;
    minCoveragePct: number;
    maxUnresolvedCharts: number;
    maxMissingLineageCharts: number;
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const STATE_PATH = path.join(ROOT, ".claude/state/surveys/taxonomy.json");
const RATCHET_PATH = path.join(ROOT, ".claude/config/survey-taxonomy-ratchet.json");
const R2 = (process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp").replace(/\/+$/, "");
const args = process.argv.slice(2);
const offline = args.includes("--offline");
const check = args.includes("--check");
const tightenRatchet = args.includes("--tighten-ratchet");
const jsonIndex = args.indexOf("--json");
const jsonTarget = jsonIndex >= 0 && args[jsonIndex + 1] && !args[jsonIndex + 1].startsWith("--")
  ? path.resolve(ROOT, args[jsonIndex + 1])
  : null;
const jsonStdout = jsonIndex >= 0 && !jsonTarget;
const blogLimitIndex = args.indexOf("--blog-limit");
const blogLimit = blogLimitIndex >= 0 ? Number(args[blogLimitIndex + 1]) : null;
const masterIds = new Set((surveysMaster as Array<{ id: string }>).map((survey) => survey.id));

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function tallyStatus(rows: Array<{ status: SurveySurfaceStatus }>): Record<SurveySurfaceStatus, number> {
  const out: Record<SurveySurfaceStatus, number> = {
    resolved: 0,
    unresolved: 0,
    "not-applicable": 0,
    "missing-lineage": 0,
  };
  for (const row of rows) out[row.status] += 1;
  return out;
}

function auditRanking() {
  // `/ranking/*` survey taxonomy の母集団は既存 audit-survey-linkage と同じ
  // prefecture entity のみ。city/world 専用 metric を混ぜると二つの監査が食い違う。
  const metrics = Object.values(METRICS_REGISTRY).filter((metric) =>
    metric.entities?.includes("prefecture"),
  );
  const active = metrics.filter((metric) => metric.isActive === true);
  const allRows = metrics.map((metric) => ({
    key: metric.key,
    active: metric.isActive === true,
    resolution: resolveSurveyTaxonomy({ metricKeys: [metric.key] }, METRICS_REGISTRY),
  }));
  const resolved = allRows.filter((row) => row.resolution.surveys.length > 0);
  const activeResolved = resolved.filter((row) => row.active);
  const unresolved = allRows.filter((row) => row.resolution.surveys.length === 0);
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
    resolved: resolved.length,
    unresolved: unresolved.length,
    coveragePct: round((resolved.length / Math.max(metrics.length, 1)) * 100),
    activeResolved: activeResolved.length,
    activeUnresolved: activeUnresolved.length,
    activeCoveragePct: round((activeResolved.length / Math.max(active.length, 1)) * 100),
    activeUnresolvedKeys: activeUnresolved.map((row) => row.key).sort(),
    perSurveyActive: Object.fromEntries([...surveyCounts.entries()].sort(([a], [b]) => a.localeCompare(b))),
  };
}

function auditThemes() {
  const rows = Object.values(THEME_CATALOGS).flatMap((catalog) => {
    const result = resolveThemeSurveyTaxonomy(catalog, METRICS_REGISTRY);
    return result.charts.map((chart) => ({ themeKey: catalog.key, ...chart }));
  });
  const byStatus = tallyStatus(rows);
  const applicable = rows.length - byStatus["not-applicable"];
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
    charts: rows.length,
    applicableCharts: applicable,
    byStatus,
    coveragePct: round((byStatus.resolved / Math.max(applicable, 1)) * 100),
    unresolvedCharts: rows
      .filter((row) => row.status === "unresolved" || row.status === "missing-lineage")
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
        .map(([id, keys]) => [id, [...keys].sort()]),
    ),
  };
}

function noCache(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}__survey_taxonomy=${Date.now().toString(36)}`;
}

async function fetchText(key: string): Promise<string | null> {
  try {
    const response = await fetch(noCache(`${R2}/${key}`), { signal: AbortSignal.timeout(20_000) });
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

async function pool<T, R>(items: readonly T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        out[index] = await fn(items[index]);
      }
    }),
  );
  return out;
}

function chartBases(content: string): string[] {
  return [...new Set(
    [...content.matchAll(/\]\(data\/([^)]+?)\.svg(?:[?#][^)]*)?\)/g)].map((match) => match[1]),
  )];
}

async function auditBlog() {
  const snapshot = await fetchJson("app/blog/all.json") as BlogSnapshot | null;
  let articles = (snapshot?.articles ?? []).filter(
    (article) => article.published === true && article.hasCharts === true,
  );
  if (blogLimit && Number.isFinite(blogLimit)) articles = articles.slice(0, blogLimit);

  const articleRows = await pool(articles, 12, async (article) => {
    const ext = article.format === "mdx" ? "mdx" : "md";
    const content = await fetchText(`app/blog/${article.slug}/article.${ext}`);
    if (content === null) {
      return {
        slug: article.slug,
        charts: [{ base: "(article)", status: "missing-lineage" as const, surveyIds: [] as string[] }],
      };
    }
    const bases = chartBases(content);
    const charts = await pool(bases, 8, async (base) => {
      const source = await fetchJson(`app/blog/${article.slug}/data/${base}.source.json`);
      const result = resolveBlogChartSurveyTaxonomy(source, METRICS_REGISTRY);
      return { base, status: result.status, surveyIds: result.surveys.map((survey) => survey.id) };
    });
    return { slug: article.slug, charts };
  });

  const charts = articleRows.flatMap((article) =>
    article.charts.map((chart) => ({ slug: article.slug, ...chart })),
  );
  const byStatus = tallyStatus(charts);
  const applicable = charts.length - byStatus["not-applicable"];
  const perSurveyBlogs = new Map<string, Set<string>>();
  for (const article of articleRows) {
    for (const id of new Set(article.charts.flatMap((chart) => chart.surveyIds))) {
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
      .filter((chart) => chart.status === "unresolved" || chart.status === "missing-lineage")
      .map(({ slug, base, status }) => ({ slug, base, status })),
    perSurveyBlogs: Object.fromEntries(
      [...perSurveyBlogs.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, slugs]) => [id, [...slugs].sort()]),
    ),
  };
}

function loadState(): TaxonomyState | null {
  if (!fs.existsSync(STATE_PATH)) return null;
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf8")) as TaxonomyState;
}

function loadRatchet(): RatchetConfig | null {
  if (!fs.existsSync(RATCHET_PATH)) return null;
  return JSON.parse(fs.readFileSync(RATCHET_PATH, "utf8")) as RatchetConfig;
}

/** 改善値だけを ratchet へ反映する。既存下限を緩める更新は行わない。 */
function tightenRatchetConfig(state: TaxonomyState): void {
  const current = loadRatchet();
  if (!current) throw new Error(`${path.relative(ROOT, RATCHET_PATH)} が無い`);
  const next: RatchetConfig = {
    ...current,
    ranking: {
      minActiveResolved: Math.max(current.ranking.minActiveResolved, state.ranking.activeResolved),
      minActiveCoveragePct: Math.max(
        current.ranking.minActiveCoveragePct,
        state.ranking.activeCoveragePct,
      ),
    },
    theme: {
      minResolvedCharts: Math.max(current.theme.minResolvedCharts, state.theme.byStatus.resolved),
      minCoveragePct: Math.max(current.theme.minCoveragePct, state.theme.coveragePct),
      maxMissingLineageCharts: Math.min(
        current.theme.maxMissingLineageCharts,
        state.theme.byStatus["missing-lineage"],
      ),
    },
    blog: {
      minCharts: Math.max(current.blog.minCharts, state.blog.charts),
      minResolvedCharts: Math.max(current.blog.minResolvedCharts, state.blog.byStatus.resolved),
      minCoveragePct: Math.max(current.blog.minCoveragePct, state.blog.coveragePct),
      maxUnresolvedCharts: Math.min(
        current.blog.maxUnresolvedCharts,
        state.blog.byStatus.unresolved,
      ),
      maxMissingLineageCharts: Math.min(
        current.blog.maxMissingLineageCharts,
        state.blog.byStatus["missing-lineage"],
      ),
    },
  };
  fs.writeFileSync(RATCHET_PATH, JSON.stringify(next, null, 2) + "\n");
}

function validateState(
  state: TaxonomyState,
  currentRanking: ReturnType<typeof auditRanking>,
  currentTheme: ReturnType<typeof auditThemes>,
): string[] {
  const errors: string[] = [];
  const ratchet = loadRatchet();
  if (state.schemaVersion !== 1) errors.push(`schemaVersion=${state.schemaVersion} (expected 1)`);
  if (state.masterSurveyCount !== masterIds.size) {
    errors.push(`masterSurveyCount=${state.masterSurveyCount} / current=${masterIds.size}`);
  }
  if (JSON.stringify(state.ranking) !== JSON.stringify(currentRanking)) {
    errors.push("ranking taxonomy state が現行 MetricConfig と drift (full audit を再実行)");
  }
  if (JSON.stringify(state.theme) !== JSON.stringify(currentTheme)) {
    errors.push("theme taxonomy state が現行 ThemeCatalog と drift (full audit を再実行)");
  }
  for (const survey of state.surveys ?? []) {
    if (!masterIds.has(survey.surveyId)) errors.push(`state に master 非実在 survey: ${survey.surveyId}`);
  }
  if (!ratchet) {
    errors.push("survey taxonomy ratchet config が無い");
    return errors;
  }
  const ageDays = (Date.now() - new Date(state.generatedAt).getTime()) / 86_400_000;
  if (!Number.isFinite(ageDays) || ageDays > ratchet.maxStateAgeDays) {
    errors.push(`taxonomy state stale: ${round(ageDays, 1)}日 > ${ratchet.maxStateAgeDays}日`);
  }
  if (currentRanking.activeResolved < ratchet.ranking.minActiveResolved) {
    errors.push(`ranking active resolved ${currentRanking.activeResolved} < ${ratchet.ranking.minActiveResolved}`);
  }
  if (currentRanking.activeCoveragePct < ratchet.ranking.minActiveCoveragePct) {
    errors.push(`ranking active coverage ${currentRanking.activeCoveragePct}% < ${ratchet.ranking.minActiveCoveragePct}%`);
  }
  if (currentTheme.byStatus.resolved < ratchet.theme.minResolvedCharts) {
    errors.push(`theme resolved charts ${currentTheme.byStatus.resolved} < ${ratchet.theme.minResolvedCharts}`);
  }
  if (currentTheme.coveragePct < ratchet.theme.minCoveragePct) {
    errors.push(`theme coverage ${currentTheme.coveragePct}% < ${ratchet.theme.minCoveragePct}%`);
  }
  if (currentTheme.byStatus["missing-lineage"] > ratchet.theme.maxMissingLineageCharts) {
    errors.push(`theme missing-lineage ${currentTheme.byStatus["missing-lineage"]} > ${ratchet.theme.maxMissingLineageCharts}`);
  }
  if (state.blog.charts < ratchet.blog.minCharts) {
    errors.push(`blog charts ${state.blog.charts} < ${ratchet.blog.minCharts}`);
  }
  if (state.blog.byStatus.resolved < ratchet.blog.minResolvedCharts) {
    errors.push(`blog resolved charts ${state.blog.byStatus.resolved} < ${ratchet.blog.minResolvedCharts}`);
  }
  if (state.blog.coveragePct < ratchet.blog.minCoveragePct) {
    errors.push(`blog coverage ${state.blog.coveragePct}% < ${ratchet.blog.minCoveragePct}%`);
  }
  if (state.blog.byStatus.unresolved > ratchet.blog.maxUnresolvedCharts) {
    errors.push(`blog unresolved ${state.blog.byStatus.unresolved} > ${ratchet.blog.maxUnresolvedCharts}`);
  }
  if (state.blog.byStatus["missing-lineage"] > ratchet.blog.maxMissingLineageCharts) {
    errors.push(`blog missing-lineage ${state.blog.byStatus["missing-lineage"]} > ${ratchet.blog.maxMissingLineageCharts}`);
  }
  return errors;
}

function buildCrossIndex(
  ranking: ReturnType<typeof auditRanking>,
  theme: ReturnType<typeof auditThemes>,
  blog: Awaited<ReturnType<typeof auditBlog>>,
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
  if (offline && !previous) throw new Error(`${path.relative(ROOT, STATE_PATH)} が無い`);
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
    fs.writeFileSync(jsonTarget, JSON.stringify(state, null, 2) + "\n");
  } else if (jsonStdout) {
    process.stdout.write(JSON.stringify({ ...state, errors }, null, 2));
  } else {
    console.log(`survey taxonomy: master ${state.masterSurveyCount}`);
    console.log(
      `ranking active ${ranking.activeMetrics}: resolved ${ranking.activeResolved} / unresolved ${ranking.activeUnresolved} / coverage ${ranking.activeCoveragePct}%`,
    );
    console.log(
      `theme charts ${theme.charts}: resolved ${theme.byStatus.resolved} / unresolved ${theme.byStatus.unresolved} / missing ${theme.byStatus["missing-lineage"]} / n/a ${theme.byStatus["not-applicable"]} / coverage ${theme.coveragePct}%`,
    );
    console.log(
      `blog charts ${blog.charts}: resolved ${blog.byStatus.resolved} / unresolved ${blog.byStatus.unresolved} / missing ${blog.byStatus["missing-lineage"]} / n/a ${blog.byStatus["not-applicable"]} / coverage ${blog.coveragePct}%`,
    );
    if (jsonTarget) console.log(`state: ${path.relative(ROOT, jsonTarget)}`);
    for (const error of errors) console.error(`✗ ${error}`);
    if (check && errors.length === 0) console.log("✓ taxonomy state / freshness / ratchet 違反なし");
  }
  if (errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
