import "server-only";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { THEME_CATALOGS } from "@stats47/data-configs/theme-catalog";
import {
  countAdoptionCriteria,
  evaluateSelectionViewpoints,
  type MachineViewpointId,
  type ViewpointHit,
} from "@stats47/data-configs/theme-selection-viewpoints";

import fs from "node:fs";
import path from "node:path";

import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";
import { THEME_SELECTION_VIEWPOINTS } from "../../../../config/paths.mjs";
import { projectRoot } from "./project-root";
import { cached, fileExists, readJson, readText, TTL } from "./state-io";

/**
 * テーマの指標を選ぶ視点 (読み取り専用)。
 * 視点の定義は data/themes/viewpoints/selection.json、判定は data-configs の selection-viewpoints.ts、
 * 対象は ThemeCatalog (data/themes/catalogs/)。ここは三つを突き合わせて並べるだけで、判定を複製しない。
 */

type ViewpointConfig = {
  adoptionCriteria: Array<{ id: string; label: string; question: string }>;
  rules: Array<{
    id: string;
    title: string;
    statement: string;
    severity: "fix" | "review";
    check: { kind: "machine" | "review" };
  }>;
};

export interface ViewpointThemeCount {
  key: string;
  title: string;
  count: number;
}

export interface ViewpointRuleRow {
  id: string;
  title: string;
  statement: string;
  severity: "fix" | "review";
  checkKind: "machine" | "review";
  /** 人が確かめる規則は null (機械では数えない) */
  hitCount: number | null;
  themes: ViewpointThemeCount[];
}

export interface ViewpointCriterionRow {
  id: string;
  label: string;
  question: string;
  usage: number;
}

export interface ViewpointHitRow extends ViewpointHit {
  themeTitle: string;
}

/** テーマの採点表の 1 行。並べ方は「検索の表示回数が多い順」で、点数は付けない (根拠を列で見せる)。 */
export interface ViewpointCandidateRow {
  key: string;
  title: string;
  /**
   * 全ルート込み (全国版 + 県別 + 市区町村別) の直近 28 日の検索の表示回数。集計が無ければ null。
   * 表示の 94% は県別ページにあるので、全国版の 1 URL だけでは需要を読み違える (2026-11-14)
   */
  impressions: number | null;
  clicks: number | null;
  /** クリック率 (0〜1)。表示が無ければ null */
  ctr: number | null;
  /** 週次の品質監査の判定 (ok・gaps・stale・unknown)。一覧表に無ければ null */
  dataQuality: string | null;
  /** 読みやすさの品質基準の違反の種類 (直近の計測。県別と全国版・スマホ幅とデスクトップ幅の合算)。計測が無ければ null */
  uiViolations: string[] | null;
  fixHits: number;
  reviewHits: number;
  /** 最新の提案文書の日付と status。無ければ null */
  latestReview: { date: string; status: string } | null;
  /** 判定待ちの実験の d56 (この日より前に出すと観測に混ざる)。無ければ null */
  pendingUntil: string | null;
  /** 提案が承認待ちか、実装済みで公開待ちのテーマ (いま新しく見直す対象ではない) */
  inFlight: boolean;
}

/** 週ごとの該当件数 (data/themes/viewpoint-history.csv)。規則ごとに古い週から並ぶ */
export interface ViewpointTrend {
  weeks: string[];
  byRule: Record<string, Array<number | null>>;
}

export interface ThemeViewpointSummary {
  /** 表示回数を読んだ GSC スナップショットの週 (無ければ null) */
  gscWeek: string | null;
  /** 読みやすさの品質基準を測った日 (data/themes/ui-weight/ の最新。無ければ null) */
  uiMeasuredOn: string | null;
  themeCount: number;
  primaryAndSecondaryCount: number;
  criteria: ViewpointCriterionRow[];
  rules: ViewpointRuleRow[];
  hits: Record<string, ViewpointHitRow[]>;
  candidates: ViewpointCandidateRow[];
  trend: ViewpointTrend;
}

const REVIEWS_DIR = datasetDir("themes.reviews");
const TREND_WEEKS = 8;
/** 承認待ちとみなす提案の新しさ。これより古い proposal-ready は放置された提案として、候補に戻す */
const PROPOSAL_FRESH_DAYS = 30;

type PortfolioTheme = {
  themeKey: string;
  dataQualityStatus?: string;
  metricsAllRoutes28d?: { gsc?: { weeks?: string[]; impressions?: number; clicks?: number; ctr?: number } };
};

/** テーマの一覧表 (themes.portfolio) から、全ルート込みの直近 28 日の検索の実績と品質の判定を読む */
function portfolioByTheme(): { week: string | null; byTheme: Map<string, PortfolioTheme> } {
  const rel = datasetPath("themes.portfolio");
  if (!fileExists(rel)) return { week: null, byTheme: new Map() };
  const themes = readJson<{ themes: PortfolioTheme[] }>(rel).themes;
  const week = themes.map((t) => t.metricsAllRoutes28d?.gsc?.weeks?.at(-1)).find(Boolean) ?? null;
  return { week, byTheme: new Map(themes.map((t) => [t.themeKey, t])) };
}

/** 読みやすさの品質基準の直近の計測 (measure-theme-weight.mjs) から、テーマごとの違反の種類を読む */
function latestUiViolations(): { measuredOn: string | null; byTheme: Map<string, string[]> } {
  const dir = datasetDir("themes.ui-weight");
  const abs = path.join(projectRoot(), dir);
  const latest = fs.existsSync(abs) ? fs.readdirSync(abs).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().at(-1) : undefined;
  if (!latest) return { measuredOn: null, byTheme: new Map() };
  const rows = readJson<{ rows: Array<{ themeKey: string; violations?: string[] }> }>(path.join(dir, latest)).rows;
  // 品質基準を数える前の古い計測 (violations を持たない) は「計測なし」として扱う
  if (!rows.some((r) => Array.isArray(r.violations))) return { measuredOn: null, byTheme: new Map() };
  const byTheme = new Map<string, Set<string>>();
  for (const r of rows) {
    const set = byTheme.get(r.themeKey) ?? new Set<string>();
    for (const code of r.violations ?? []) set.add(code);
    byTheme.set(r.themeKey, set);
  }
  return { measuredOn: latest.slice(0, -5), byTheme: new Map([...byTheme].map(([key, set]) => [key, [...set].sort()])) };
}

function isInFlight(review: { date: string; status: string } | null, today: string): boolean {
  if (!review) return false;
  if (review.status === "implemented-pending-release") return true;
  if (review.status !== "proposal-ready") return false;
  const ageDays = (Date.parse(today) - Date.parse(review.date)) / 86_400_000;
  return ageDays <= PROPOSAL_FRESH_DAYS;
}

type Experiment = { themeKey: string; verdict?: string; evaluateAt?: { d56?: string } };

function latestReviews(): Map<string, { date: string; status: string }> {
  const dir = path.join(projectRoot(), REVIEWS_DIR);
  const latest = new Map<string, { date: string; status: string }>();
  if (!fs.existsSync(dir)) return latest;
  for (const file of fs.readdirSync(dir).sort()) {
    const m = file.match(/^(\d{4}-\d{2}-\d{2})-theme-(.+)\.md$/);
    if (!m) continue;
    const status = readText(path.join(REVIEWS_DIR, file)).match(/^status:\s*(\S+)/m)?.[1] ?? "unknown";
    latest.set(m[2], { date: m[1], status });
  }
  return latest;
}

function readTrend(): ViewpointTrend {
  const rel = datasetPath("themes.viewpoint-history");
  if (!fileExists(rel)) return { weeks: [], byRule: {} };
  const rows = readText(rel).trim().split(/\r?\n/).slice(1).map((line) => line.split(","));
  const weeks = [...new Set(rows.map(([week]) => week))].sort().slice(-TREND_WEEKS);
  const byRule: Record<string, Array<number | null>> = {};
  for (const [week, rule, hits] of rows) {
    const i = weeks.indexOf(week);
    if (i < 0) continue;
    byRule[rule] ??= weeks.map(() => null);
    byRule[rule][i] = Number(hits);
  }
  return { weeks, byRule };
}

function buildSummary(): ThemeViewpointSummary {
  const config = readJson<ViewpointConfig>(THEME_SELECTION_VIEWPOINTS);
  const catalogs = Object.values(THEME_CATALOGS);
  const titles = new Map(catalogs.map((c) => [c.key, c.title]));
  const evaluated = evaluateSelectionViewpoints(catalogs, METRICS_REGISTRY);
  const usage = countAdoptionCriteria(catalogs);

  const hits: Record<string, ViewpointHitRow[]> = {};
  const rules = config.rules.map((rule): ViewpointRuleRow => {
    const ruleHits = rule.check.kind === "machine" ? evaluated[rule.id as MachineViewpointId] : undefined;
    if (!ruleHits) {
      return { ...rule, checkKind: rule.check.kind, hitCount: null, themes: [] };
    }
    hits[rule.id] = ruleHits.map((h) => ({ ...h, themeTitle: titles.get(h.themeKey) ?? h.themeKey }));
    const byTheme = new Map<string, number>();
    for (const h of ruleHits) byTheme.set(h.themeKey, (byTheme.get(h.themeKey) ?? 0) + 1);
    return {
      ...rule,
      checkKind: rule.check.kind,
      hitCount: ruleHits.length,
      themes: [...byTheme.entries()]
        .map(([key, count]) => ({ key, title: titles.get(key) ?? key, count }))
        .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
    };
  });

  const severity = new Map(config.rules.map((r) => [r.id, r.severity]));
  const portfolio = portfolioByTheme();
  const ui = latestUiViolations();
  const today = new Date().toISOString().slice(0, 10);
  const experimentsPath = datasetPath("themes.experiments");
  const experiments = fileExists(experimentsPath)
    ? readJson<{ experiments: Experiment[] }>(experimentsPath)
    : { experiments: [] };
  const pendingUntil = new Map<string, string>();
  for (const e of experiments.experiments) {
    const d56 = e.evaluateAt?.d56;
    if (e.verdict !== "pending" || !d56) continue;
    if (!pendingUntil.has(e.themeKey) || d56 > pendingUntil.get(e.themeKey)!) pendingUntil.set(e.themeKey, d56);
  }
  const reviews = latestReviews();
  const candidates = catalogs
    .map((c): ViewpointCandidateRow => {
      const count = (sev: "fix" | "review") =>
        Object.entries(evaluated).reduce(
          (n, [rule, list]) => n + (severity.get(rule) === sev ? list.filter((h) => h.themeKey === c.key).length : 0),
          0,
        );
      const latestReview = reviews.get(c.key) ?? null;
      return {
        key: c.key,
        title: c.title,
        impressions: portfolio.byTheme.get(c.key)?.metricsAllRoutes28d?.gsc?.impressions ?? null,
        clicks: portfolio.byTheme.get(c.key)?.metricsAllRoutes28d?.gsc?.clicks ?? null,
        ctr: portfolio.byTheme.get(c.key)?.metricsAllRoutes28d?.gsc?.ctr ?? null,
        dataQuality: portfolio.byTheme.get(c.key)?.dataQualityStatus ?? null,
        uiViolations: ui.measuredOn ? (ui.byTheme.get(c.key) ?? []) : null,
        fixHits: count("fix"),
        reviewHits: count("review"),
        latestReview,
        pendingUntil: pendingUntil.get(c.key) ?? null,
        inFlight: isInFlight(latestReview, today),
      };
    })
    .sort((a, b) => Number(a.inFlight) - Number(b.inFlight) || (b.impressions ?? -1) - (a.impressions ?? -1) || b.fixHits - a.fixHits);

  return {
    gscWeek: portfolio.week,
    uiMeasuredOn: ui.measuredOn,
    candidates,
    trend: readTrend(),
    themeCount: catalogs.length,
    primaryAndSecondaryCount: catalogs.reduce(
      (n, c) => n + c.metrics.filter((m) => m.role !== "context").length,
      0,
    ),
    criteria: config.adoptionCriteria.map((c) => ({ ...c, usage: usage[c.id] ?? 0 })),
    rules,
    hits,
  };
}

export function themeViewpointSummary(): ThemeViewpointSummary {
  return cached("theme-viewpoints", TTL.daily, buildSummary);
}
