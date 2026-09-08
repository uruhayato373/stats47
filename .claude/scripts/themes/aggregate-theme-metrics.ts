/**
 * aggregate-theme-metrics.ts — テーマ別 56 日 baseline の決定的集計 (PR-3)
 *
 * GSC / GA4 の週次 snapshot は **各週 last-28d 窓** (fetch-{gsc,ga4}-snapshot.mjs が
 * endDate-27 で取得) のため、単純合算は最大 4 倍の二重計上になる。
 * 56 日 = **非重複 2 窓 (最新週 + その 4 週前)** の合算で構成する。
 *
 * 集計規約 (schema 正典: .claude/state/themes/README.md):
 *   - GSC: clicks/impressions = 2 窓合算, ctr = 合算比, avgPosition = impressions 加重平均
 *   - GA4: pageViews = 2 窓合算 (加算可能)。activeUsers は週横断で加算不能のため
 *     最新窓の値のみ activeUsersLast28d として保存。engagementRate / avgSessionDuration は
 *     pageViews 加重平均 (近似であることをフィールド名で明示)
 *   - 最低標本数未満 (GSC impressions < 200 / GA4 pageViews < 100) は measured-low
 *     として加算可能なカウントのみ保存し、比率・効果判定には使用しない
 *   - データ品質: 7日以内の公開品質監査から latestDataYear / 欠測を参照する
 *
 * Usage:
 *   npx tsx .claude/scripts/themes/aggregate-theme-metrics.ts               # 最新窓で集計・upsert
 *   npx tsx .claude/scripts/themes/aggregate-theme-metrics.ts --weeks 2026-W28,2026-W24
 *
 * 実行後は必ず validate-theme-state.mjs を通すこと。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { THEME_CATALOGS } from "../../../packages/data-configs/src/theme-catalog/index";
import { parse } from "csv-parse/sync";
import { selectThemeWindows, isJapanPageReport, normalizeThemePath, summarizeThemeTraffic, summarizeThemeNavigation } from "./theme-metrics-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const PORTFOLIO = path.join(PROJECT_ROOT, ".claude/state/themes/portfolio.json");
const GSC_SNAP = path.join(PROJECT_ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
const GA4_SNAP = path.join(PROJECT_ROOT, ".claude/skills/analytics/ga4-improvement/reference/snapshots");

const AGE_REVIEW_YEARS = 5; // 公表周期を確認する候補。年齢だけでは未更新と断定しない

// Metadata is authoritative; missing or overlapping windows never become zero traffic.
function readCsv(file: string): Record<string, string>[] {
  return fs.existsSync(file) ? parse(fs.readFileSync(file, "utf8"), { columns: true, skip_empty_lines: true, bom: true }) : [];
}
function reportWindows(source: string, stem: string) {
  const dir = source === "gsc" ? GSC_SNAP : GA4_SNAP;
  const reports = fs.readdirSync(dir).filter((w) => /^\d{4}-W\d{2}$/.test(w)).flatMap((week) => {
    const file = path.join(dir, week, source === "gsc" ? "summary.json" : `${stem}.meta.json`);
    if (!fs.existsSync(file) || !fs.existsSync(path.join(dir, week, `${stem}.csv`))) return [];
    const meta = JSON.parse(fs.readFileSync(file, "utf8"));
    const period = source === "gsc" ? meta.rolling28d : isJapanPageReport(meta) ? meta : null;
    return period ? [{ week, periodStart: period.periodStart, periodEnd: period.periodEnd, windowDays: period.windowDays }] : [];
  });
  const idx = process.argv.indexOf("--weeks");
  return selectThemeWindows(reports, idx >= 0 ? process.argv[idx + 1]?.split(",") : undefined);
}

// ---------- R2 データ品質 ----------
interface KeyQuality { key: string; ok: boolean; latestYear: string | null; latestYearPrefCoverage: number | null }

const qualityFile = path.join(PROJECT_ROOT, ".claude/state/themes/quality.json");
const audit = fs.existsSync(qualityFile) ? JSON.parse(fs.readFileSync(qualityFile, "utf8")) : null;
const recentQuality = audit?.summary?.mode === "structure-and-public-data" && Date.now() - Date.parse(audit.observedAt) < 7 * 86_400_000;
async function fetchKeyQuality(key: string): Promise<KeyQuality> {
  const o = recentQuality ? audit.observations.find((x: { namespace: string; key: string }) => x.namespace === "ranking" && x.key === key) : null;
  const hasError = audit?.findings.some((f: { metricKey?: string; severity: string }) => f.metricKey === key && f.severity === "error");
  return { key, ok: o?.status === "ok" && !hasError, latestYear: o?.latestYear ?? null, latestYearPrefCoverage: o?.latestCoverage ?? null };
}

async function mapPool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
    }),
  );
  return out;
}

function themeKeys(themeKey: string): string[] {
  const catalog = (THEME_CATALOGS as Record<string, { metrics?: { rankingKey?: string }[] }>)[themeKey];
  if (!catalog) throw new Error(`Inactive theme in portfolio: ${themeKey}`);
  const metrics = catalog.metrics ?? [];
  return [...new Set(metrics.map((m) => m.rankingKey).filter((k): k is string => Boolean(k)))];
}

// ---------- main ----------
async function main() {
  const gscWindows = reportWindows("gsc", "pages");
  const ga4Windows = reportWindows("ga4", "pages-clean");
  const navWindows = reportWindows("ga4", "theme-navigation");
  const load = (dir: string, stem: string, windows: { week: string }[] | null) => windows?.map((w) => readCsv(path.join(dir, w.week, `${stem}.csv`))) ?? [[], []];
  const gsc = load(GSC_SNAP, "pages", gscWindows);
  const ga4 = load(GA4_SNAP, "pages-clean", ga4Windows);
  const nav = load(GA4_SNAP, "theme-navigation", navWindows);
  const pf = JSON.parse(fs.readFileSync(PORTFOLIO, "utf8"));
  const rows: string[] = [];
  for (const t of pf.themes) {
    const url = `/themes/${t.themeKey}`;
    const select = (data: Record<string, string>[][], key: string) => data.map((rows) => rows.filter((r) => normalizeThemePath(r[key] ?? "") === url));
    t.metrics.gsc = summarizeThemeTraffic(select(gsc, "page"), "gsc", gscWindows);
    t.metrics.ga4 = summarizeThemeTraffic(select(ga4, "pagePath"), "ga4", ga4Windows);
    const navRows = select(nav, "pagePath");
    t.metrics.internalNav = summarizeThemeNavigation(navRows, navWindows);
    t.gscSnapshotRef = gscWindows ? `.claude/skills/analytics/gsc-improvement/reference/snapshots/${gscWindows[0].week}/pages.csv` : null;
    t.ga4SnapshotRef = ga4Windows ? `.claude/skills/analytics/ga4-improvement/reference/snapshots/${ga4Windows[0].week}/pages-clean.csv` : null;

    // ── R2 データ品質 ──
    const keys = themeKeys(t.themeKey);
    const quality = await mapPool(keys, 12, fetchKeyQuality);
    const missing = quality.filter((q) => !q.ok);
    const years = quality.map((q) => q.latestYear).filter(Boolean).sort() as string[];
    const latest = years[years.length - 1] ?? null;
    const coverages = quality.map((q) => q.latestYearPrefCoverage).filter((c): c is number => c !== null);
    t.latestDataYear = latest;
    t.dataQuality = {
      observedAt: audit?.observedAt ?? null,
      keysChecked: recentQuality ? keys.length : 0,
      oldestLatestDataYear: years[0] ?? null,
      ageReviewKeys: quality.filter((q) => q.latestYear && Number(q.latestYear) <= new Date().getFullYear() - AGE_REVIEW_YEARS).map((q) => q.key),
      freshnessStatus: "requires-official-release-check",
      missingKeys: missing.length,
      missingKeyList: missing.slice(0, 10).map((q) => q.key),
      latestYearPrefCoverageMin: coverages.length ? Math.min(...coverages) : null,
    };
    const themeHasError = audit?.findings.some((f: { themeKey?: string; severity: string }) => f.themeKey === t.themeKey && f.severity === "error");
    t.dataQualityStatus = !recentQuality ? "unknown" : missing.length > 0 || themeHasError ? "gaps"
      : latest ? "ok" : "unknown";

    rows.push([
      t.themeKey.padEnd(22),
      `imp ${t.metrics.gsc.impressions ?? "—"}${t.metrics.gsc.status === "measured-low" ? " (low)" : ""}`,
      `pv ${t.metrics.ga4.pageViews ?? "—"}${t.metrics.ga4.status === "measured-low" ? " (low)" : ""}`,
      `年 ${latest ?? "—"}`, t.dataQualityStatus,
      missing.length ? `欠 ${missing.length}/${keys.length}` : "",
    ].join(" | "));
  }

  pf.generatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(PORTFOLIO, JSON.stringify(pf, null, 2) + "\n");
  console.log("非重複窓・Japan-only GA4を使用。窓や行が無い場合はinsufficient-data。");
  rows.forEach((r) => console.log(r));
  const gscOk = pf.themes.filter((t: { metrics: { gsc: { status: string } } }) => t.metrics.gsc.status === "measured").length;
  const ga4Ok = pf.themes.filter((t: { metrics: { ga4: { status: string } } }) => t.metrics.ga4.status === "measured").length;
  console.log(`\nGSC measured ${gscOk}/${pf.themes.length} / GA4 measured ${ga4Ok}/${pf.themes.length} → ${PORTFOLIO}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
