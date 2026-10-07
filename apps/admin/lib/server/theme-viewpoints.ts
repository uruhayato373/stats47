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

import { datasetDir } from "../../../../config/datasets.mjs";
import { THEME_SELECTION_VIEWPOINTS } from "../../../../config/paths.mjs";
import { projectRoot } from "./project-root";
import { cached, fileExists, readJson, readText, TTL } from "./state-io";

/**
 * テーマの指標を選ぶ視点 (読み取り専用)。
 * 視点の定義は config/theme-selection-viewpoints.json、判定は data-configs の selection-viewpoints.ts、
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

/** 次に見直すテーマの候補 1 行。並べ方は「検索の表示回数が多い順」で、点数は付けない (根拠を列で見せる)。 */
export interface ViewpointCandidateRow {
  key: string;
  title: string;
  /** 最新の GSC 週次スナップショット (28 日) の /themes/<key> の表示回数。行が無ければ null */
  impressions: number | null;
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
  themeCount: number;
  primaryAndSecondaryCount: number;
  criteria: ViewpointCriterionRow[];
  rules: ViewpointRuleRow[];
  hits: Record<string, ViewpointHitRow[]>;
  candidates: ViewpointCandidateRow[];
  trend: ViewpointTrend;
}

const REVIEWS_DIR = ".claude/skills/theme/manage-theme-portfolio/reference/reviews";
const TREND_WEEKS = 8;
/** 承認待ちとみなす提案の新しさ。これより古い proposal-ready は放置された提案として、候補に戻す */
const PROPOSAL_FRESH_DAYS = 30;
const THEME_PAGE = /^https:\/\/stats47\.jp\/themes\/([a-z0-9-]+)\/?$/;

/** 最新週の pages.csv から /themes/<key> の 28 日表示回数を読む */
function latestThemeImpressions(): { week: string | null; byTheme: Map<string, number> } {
  const dir = datasetDir("gsc.snapshots");
  const abs = path.join(projectRoot(), dir);
  const weeks = fs.existsSync(abs) ? fs.readdirSync(abs).filter((w) => /^\d{4}-W\d{2}$/.test(w)).sort() : [];
  for (const week of weeks.reverse()) {
    const rel = path.join(dir, week, "pages.csv");
    if (!fileExists(rel)) continue;
    const byTheme = new Map<string, number>();
    for (const line of readText(rel).trim().split(/\r?\n/).slice(1)) {
      const [page, , impressions] = line.split(",");
      const key = page.match(THEME_PAGE)?.[1];
      if (key) byTheme.set(key, (byTheme.get(key) ?? 0) + Number(impressions));
    }
    return { week, byTheme };
  }
  return { week: null, byTheme: new Map() };
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

function readTrend(themesDir: string): ViewpointTrend {
  const rel = path.join(themesDir, "viewpoint-history.csv");
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
  const themesDir = datasetDir("themes.portfolio");
  const readState = <T,>(file: string, empty: T): T =>
    fileExists(path.join(themesDir, file)) ? readJson<T>(path.join(themesDir, file)) : empty;
  const gsc = latestThemeImpressions();
  const today = new Date().toISOString().slice(0, 10);
  const experiments = readState<{ experiments: Experiment[] }>("experiments.json", { experiments: [] });
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
        impressions: gsc.byTheme.get(c.key) ?? null,
        fixHits: count("fix"),
        reviewHits: count("review"),
        latestReview,
        pendingUntil: pendingUntil.get(c.key) ?? null,
        inFlight: isInFlight(latestReview, today),
      };
    })
    .sort((a, b) => Number(a.inFlight) - Number(b.inFlight) || (b.impressions ?? -1) - (a.impressions ?? -1) || b.fixHits - a.fixHits);

  return {
    gscWeek: gsc.week,
    candidates,
    trend: readTrend(themesDir),
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
