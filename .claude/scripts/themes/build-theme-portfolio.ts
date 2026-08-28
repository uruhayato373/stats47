/**
 * build-theme-portfolio.ts — テーマポートフォリオ state の決定的 builder (upsert)
 *
 * 機械項目 (カタログ由来の指標数・chart 数・selection 未記入・レビュー対応付け・
 * officialSourceReviewedAt) を ThemeCatalog / IndicatorSet / レビュー文書から毎回再導出し、
 * 意味項目 (lifecycleStatus / currentHypothesis / evidenceRefs / metrics / nextReviewAt) は
 * 既存値を保持する (blog remediation-queue と同じ upsert 思想)。
 * 意味項目の変更も本スクリプトの --set 経由で行う (portfolio.json の手編集禁止)。
 *
 * schema・判定規律の正典: .claude/state/themes/README.md
 * 運用設計: .claude/skills/theme/manage-theme-portfolio/reference/テーマポートフォリオ運用.md
 *
 * Usage:
 *   npx tsx .claude/scripts/themes/build-theme-portfolio.ts                 # 機械項目の再導出 (upsert)
 *   npx tsx .claude/scripts/themes/build-theme-portfolio.ts --set <themeKey> \
 *     [--lifecycle <status>] [--hypothesis "<text>"] [--add-evidence <ref>]
 *     [--remove-evidence <ref>] [--next-review YYYY-MM-DD]
 *
 * 実行後は必ず validate-theme-state.mjs を通すこと (根拠なし判定は validator が弾く)。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { THEME_CATALOGS } from "../../../packages/data-configs/src/theme-catalog/index";
import { CLIMATE_SET } from "../../../packages/types/src/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/themes");
const REVIEW_DIR = path.join(PROJECT_ROOT, ".claude/skills/theme/manage-theme-portfolio/reference/reviews");
const PORTFOLIO = path.join(STATE_DIR, "portfolio.json");
const EXPERIMENTS = path.join(STATE_DIR, "experiments.json");

const LEGACY_SETS: Record<string, unknown> = {
  climate: CLIMATE_SET,
};

type MetricEntry = { role?: string; selection?: { surveyedAt?: string } };

interface ThemeEntry {
  themeKey: string;
  catalogStatus: "catalog" | "legacy";
  lifecycleStatus: string;
  reviewStatus: "reviewed" | "review-missing" | "stale";
  reviewGate: string | null;
  reviewDocRef: string | null;
  latestDataYear: string | null;
  primaryMetricCount: number;
  secondaryMetricCount: number;
  contextMetricCount: number;
  selectionMissingCount: number | null;
  chartCount: number | null;
  officialSourceReviewedAt: string | null;
  gscSnapshotRef: string | null;
  ga4SnapshotRef: string | null;
  metrics: Record<string, { status: string; windowDays?: number } & Record<string, unknown>>;
  contentCoverage: { relatedArticles: number | null };
  dataQualityStatus: string;
  currentHypothesis: string | null;
  nextReviewAt: string | null;
  evidenceRefs: string[];
}

function findReviewDoc(themeKey: string): { ref: string; date: string | null; gate: string | null } | null {
  const files = fs
    .readdirSync(REVIEW_DIR)
    .filter((f) => new RegExp(`^\\d{4}-\\d{2}-\\d{2}-theme-${themeKey}\\.md$`).test(f))
    .sort(); // 複数あれば最新日付
  if (files.length === 0) return null;
  const f = files[files.length - 1];
  const src = fs.readFileSync(path.join(REVIEW_DIR, f), "utf8");
  const date = src.match(/^date:\s*(\S+)/m)?.[1] ?? null;
  const gate = src.match(/^status:\s*(\S+)/m)?.[1] ?? null;
  return { ref: `.claude/skills/theme/manage-theme-portfolio/reference/reviews/${f}`, date, gate };
}

function deriveMechanical(themeKey: string): Partial<ThemeEntry> {
  const catalog = (THEME_CATALOGS as Record<string, { metrics?: MetricEntry[]; charts?: unknown[] }>)[themeKey];
  const review = findReviewDoc(themeKey);
  const base: Partial<ThemeEntry> = {
    themeKey,
    catalogStatus: catalog ? "catalog" : "legacy",
    reviewStatus: review ? "reviewed" : "review-missing",
    reviewGate: review?.gate ?? null,
    reviewDocRef: review?.ref ?? null,
  };
  const metrics: MetricEntry[] = catalog
    ? catalog.metrics ?? []
    : ((LEGACY_SETS[themeKey] as { metrics?: MetricEntry[] } | undefined)?.metrics ?? []);
  base.primaryMetricCount = metrics.filter((m) => m.role === "primary").length;
  base.secondaryMetricCount = metrics.filter((m) => m.role === "secondary").length;
  base.contextMetricCount = metrics.filter((m) => m.role === "context").length;
  if (catalog) {
    base.selectionMissingCount = metrics.filter(
      (m) => (m.role === "primary" || m.role === "secondary") && !m.selection,
    ).length;
    base.chartCount = (catalog.charts ?? []).length;
    const surveyed = metrics
      .map((m) => m.selection?.surveyedAt)
      .filter((d): d is string => Boolean(d))
      .sort();
    base.officialSourceReviewedAt = surveyed[surveyed.length - 1] ?? review?.date ?? null;
  } else {
    base.selectionMissingCount = null; // legacy は selection 概念なし
    base.chartCount = null;
    base.officialSourceReviewedAt = review?.date ?? null;
  }
  return base;
}

function defaults(themeKey: string, mech: Partial<ThemeEntry>): ThemeEntry {
  return {
    themeKey,
    catalogStatus: "catalog",
    lifecycleStatus: "keep",
    reviewStatus: "review-missing",
    reviewGate: null,
    reviewDocRef: null,
    latestDataYear: null, // PR-3 (R2 集計) で埋める
    primaryMetricCount: 0,
    secondaryMetricCount: 0,
    contextMetricCount: 0,
    selectionMissingCount: null,
    chartCount: null,
    officialSourceReviewedAt: null,
    gscSnapshotRef: null, // PR-3 で埋める
    ga4SnapshotRef: null,
    metrics: {
      // PR-3 の集計前は「判定に使える標本なし」= insufficient-data (数値は持たない)
      gsc: { status: "insufficient-data", windowDays: 0 },
      ga4: { status: "insufficient-data", windowDays: 0 },
      internalNav: { status: "not-instrumented" }, // GA4 未計装 (doc 25 §1.3)
    },
    contentCoverage: { relatedArticles: null },
    dataQualityStatus: "unknown",
    currentHypothesis: null,
    nextReviewAt: "2026-10-01",
    evidenceRefs: mech.reviewDocRef ? [mech.reviewDocRef] : [],
    ...mech,
  } as ThemeEntry;
}

function load<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function main() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const pf = load(PORTFOLIO, { schemaVersion: 1, generatedAt: null as string | null, themes: [] as ThemeEntry[] });
  const byKey = new Map(pf.themes.map((t) => [t.themeKey, t]));

  const args = process.argv.slice(2);
  const setIdx = args.indexOf("--set");
  if (setIdx >= 0) {
    // ── 意味項目の更新モード (手編集の代替・script 経由の書き込み口) ──
    const key = args[setIdx + 1];
    const entry = byKey.get(key);
    if (!entry) {
      console.error(`✗ ${key} は portfolio に存在しない (先に build を実行)`);
      process.exit(1);
    }
    const getOpt = (name: string) => {
      const i = args.indexOf(name);
      return i >= 0 ? args[i + 1] : undefined;
    };
    const lc = getOpt("--lifecycle");
    if (lc) entry.lifecycleStatus = lc;
    const hyp = getOpt("--hypothesis");
    if (hyp) entry.currentHypothesis = hyp;
    const ev = getOpt("--add-evidence");
    if (ev && !entry.evidenceRefs.includes(ev)) entry.evidenceRefs.push(ev);
    const removedEvidence = getOpt("--remove-evidence");
    if (removedEvidence) {
      entry.evidenceRefs = entry.evidenceRefs.filter((ref) => ref !== removedEvidence);
    }
    const nr = getOpt("--next-review");
    if (nr) entry.nextReviewAt = nr;
    console.log(`set: ${key} lifecycle=${entry.lifecycleStatus} evidence=${entry.evidenceRefs.length}`);
  } else {
    // ── 機械項目の再導出モード (upsert) ──
    const catalogKeys = Object.keys(THEME_CATALOGS);
    const allKeys = [...new Set([...catalogKeys, ...Object.keys(LEGACY_SETS)])].sort();
    for (const key of allKeys) {
      const mech = deriveMechanical(key);
      const existing = byKey.get(key);
      if (existing) {
        Object.assign(existing, mech); // 機械項目のみ上書き (意味項目は保持)
      } else {
        byKey.set(key, defaults(key, mech));
      }
    }
    pf.themes = [...byKey.values()].sort((a, b) => a.themeKey.localeCompare(b.themeKey));
    console.log(`build: ${pf.themes.length} themes (catalog ${catalogKeys.length} / legacy ${Object.keys(LEGACY_SETS).length})`);
  }

  pf.generatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(PORTFOLIO, JSON.stringify(pf, null, 2) + "\n");

  if (!fs.existsSync(EXPERIMENTS)) {
    fs.writeFileSync(EXPERIMENTS, JSON.stringify({ schemaVersion: 1, experiments: [] }, null, 2) + "\n");
    console.log("experiments.json 初期化 (空)");
  }
  console.log(`→ ${PORTFOLIO}`);
}

main();
