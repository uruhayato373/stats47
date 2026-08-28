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
 *   - 最低標本数未満 (GSC impressions < 200 / GA4 pageViews < 100) は insufficient-data
 *     とし数値を保存しない (validator P5 が enforce)
 *   - データ品質: R2 app/ranking/<key>/values.json から latestDataYear / 欠測を実測
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
import { CLIMATE_SET } from "../../../packages/types/src/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const PORTFOLIO = path.join(PROJECT_ROOT, ".claude/state/themes/portfolio.json");
const GSC_SNAP = path.join(PROJECT_ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
const GA4_SNAP = path.join(PROJECT_ROOT, ".claude/skills/analytics/ga4-improvement/reference/snapshots");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

const MIN_GSC_IMPRESSIONS = 200; // per 56d (README 判定規律 3)
const MIN_GA4_PAGEVIEWS = 100;
const STALE_YEARS = 5; // latestDataYear がこれより古ければ stale-data

const LEGACY_SETS: Record<string, { metrics?: { rankingKey?: string }[] }> = {
  climate: CLIMATE_SET as never,
};

// ---------- 窓の決定 (非重複 2 窓) ----------
function pickWeeks(): [string, string] {
  const arg = process.argv[process.argv.indexOf("--weeks") + 1];
  if (process.argv.includes("--weeks") && arg) {
    const [a, b] = arg.split(",");
    return [a, b];
  }
  const weeks = fs.readdirSync(GSC_SNAP).filter((d) => /^\d{4}-W\d{2}$/.test(d)).sort();
  const latest = weeks[weeks.length - 1];
  // 4 週前 = 28 日前の窓 (非重複)
  const [y, w] = latest.split("-W").map(Number);
  let py = y, pw = w - 4;
  if (pw < 1) { py -= 1; pw += 52; }
  const prev = `${py}-W${String(pw).padStart(2, "0")}`;
  if (!weeks.includes(prev)) throw new Error(`非重複窓 ${prev} の snapshot が無い (在庫: ${weeks.join(",")})`);
  return [latest, prev];
}

// ---------- CSV parse (このデータはカンマ/引用符を含まない単純行) ----------
function readCsv(file: string): Record<string, string>[] {
  if (!fs.existsSync(file)) return [];
  const [header, ...lines] = fs.readFileSync(file, "utf8").trim().split("\n");
  const cols = header.split(",");
  return lines.map((l) => {
    const vals = l.split(",");
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });
}

function normalizeThemePath(raw: string): string | null {
  // GSC: https://stats47.jp/themes/<key>[/?#...] / GA4: /themes/<key>[?...]
  const m = raw.match(/^(?:https:\/\/stats47\.jp)?(\/themes\/[a-z0-9-]+)\/?(?:[?#].*)?$/);
  return m ? m[1] : null;
}

interface GscAgg { clicks: number; impressions: number; posWeighted: number }
interface Ga4Agg { pageViews: number; erWeighted: number; durWeighted: number; latestActiveUsers: number | null }

function aggregateGsc(weeks: [string, string]): Map<string, GscAgg> {
  const out = new Map<string, GscAgg>();
  for (const w of weeks) {
    for (const row of readCsv(path.join(GSC_SNAP, w, "pages.csv"))) {
      const p = normalizeThemePath(row.page ?? "");
      if (!p) continue;
      const cur = out.get(p) ?? { clicks: 0, impressions: 0, posWeighted: 0 };
      const imp = Number(row.impressions) || 0;
      cur.clicks += Number(row.clicks) || 0;
      cur.impressions += imp;
      cur.posWeighted += (Number(row.position) || 0) * imp;
      out.set(p, cur);
    }
  }
  return out;
}

function aggregateGa4(weeks: [string, string]): Map<string, Ga4Agg> {
  const out = new Map<string, Ga4Agg>();
  const [latest] = weeks;
  for (const w of weeks) {
    for (const row of readCsv(path.join(GA4_SNAP, w, "pages.csv"))) {
      const p = normalizeThemePath(row.pagePath ?? "");
      if (!p) continue;
      const cur = out.get(p) ?? { pageViews: 0, erWeighted: 0, durWeighted: 0, latestActiveUsers: null };
      const pv = Number(row.screenPageViews) || 0;
      cur.pageViews += pv;
      cur.erWeighted += (Number(row.engagementRate) || 0) * pv;
      cur.durWeighted += (Number(row.averageSessionDuration) || 0) * pv;
      if (w === latest) cur.latestActiveUsers = (cur.latestActiveUsers ?? 0) + (Number(row.activeUsers) || 0);
      out.set(p, cur);
    }
  }
  return out;
}

// ---------- R2 データ品質 ----------
interface KeyQuality { key: string; ok: boolean; latestYear: string | null; latestYearPrefCoverage: number | null }

async function fetchKeyQuality(key: string): Promise<KeyQuality> {
  try {
    const res = await fetch(`${R2_BASE}/app/ranking/${key}/values.json`);
    if (!res.ok) return { key, ok: false, latestYear: null, latestYearPrefCoverage: null };
    const j = (await res.json()) as { partitions?: Record<string, unknown> };
    const rows: { areaType?: string; areaCode?: string; yearCode?: string }[] = [];
    for (const part of Object.values(j.partitions ?? {})) {
      // partitions の値は配列 or {values:[...]} ラッパーの両形がある
      const list = Array.isArray(part)
        ? part
        : ((part as { values?: unknown[]; rows?: unknown[] })?.values ??
           (part as { values?: unknown[]; rows?: unknown[] })?.rows ?? []);
      rows.push(...(list as never[]));
    }
    if (rows.length === 0) return { key, ok: false, latestYear: null, latestYearPrefCoverage: null };
    const years = [...new Set(rows.map((r) => r.yearCode).filter(Boolean))].sort() as string[];
    const latestYear = years[years.length - 1] ?? null;
    const prefRows = rows.filter((r) => r.areaType === "prefecture" && r.yearCode === latestYear);
    const coverage = prefRows.length > 0 ? new Set(prefRows.map((r) => r.areaCode)).size : null;
    return { key, ok: true, latestYear, latestYearPrefCoverage: coverage };
  } catch {
    return { key, ok: false, latestYear: null, latestYearPrefCoverage: null };
  }
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
  const metrics = catalog ? catalog.metrics ?? [] : LEGACY_SETS[themeKey]?.metrics ?? [];
  return [...new Set(metrics.map((m) => m.rankingKey).filter((k): k is string => Boolean(k)))];
}

// ---------- main ----------
async function main() {
  const weeks = pickWeeks();
  const pf = JSON.parse(fs.readFileSync(PORTFOLIO, "utf8"));
  const gsc = aggregateGsc(weeks);
  const ga4 = aggregateGa4(weeks);

  const round = (n: number, d: number) => Number(n.toFixed(d));
  const rows: string[] = [];

  for (const t of pf.themes) {
    const p = `/themes/${t.themeKey}`;
    // ── GSC ── (measured-low: 集計済みだが標本不足 → カウント値のみ保存・比率値は保存禁止)
    const g = gsc.get(p);
    if (g && g.impressions >= MIN_GSC_IMPRESSIONS) {
      t.metrics.gsc = {
        status: "measured", windowDays: 56, weeks: [...weeks].sort(),
        clicks: g.clicks, impressions: g.impressions,
        ctr: round(g.clicks / g.impressions, 4),
        avgPosition: round(g.posWeighted / g.impressions, 2),
      };
    } else {
      t.metrics.gsc = {
        status: "measured-low", windowDays: 56, weeks: [...weeks].sort(),
        clicks: g?.clicks ?? 0, impressions: g?.impressions ?? 0,
      };
    }
    // ── GA4 ──
    const a = ga4.get(p);
    if (a && a.pageViews >= MIN_GA4_PAGEVIEWS) {
      t.metrics.ga4 = {
        status: "measured", windowDays: 56, weeks: [...weeks].sort(),
        pageViews: a.pageViews,
        activeUsersLast28d: a.latestActiveUsers ?? 0,
        engagementRatePvWeighted: round(a.erWeighted / a.pageViews, 4),
        avgSessionDurationSecPvWeighted: round(a.durWeighted / a.pageViews, 1),
      };
    } else {
      t.metrics.ga4 = {
        status: "measured-low", windowDays: 56, weeks: [...weeks].sort(),
        pageViews: a?.pageViews ?? 0,
      };
    }
    t.gscSnapshotRef = `.claude/skills/analytics/gsc-improvement/reference/snapshots/${weeks[0]}/pages.csv`;
    t.ga4SnapshotRef = `.claude/skills/analytics/ga4-improvement/reference/snapshots/${weeks[0]}/pages.csv`;

    // ── R2 データ品質 ──
    const keys = themeKeys(t.themeKey);
    const quality = await mapPool(keys, 12, fetchKeyQuality);
    const missing = quality.filter((q) => !q.ok);
    const years = quality.map((q) => q.latestYear).filter(Boolean).sort() as string[];
    const latest = years[years.length - 1] ?? null;
    const coverages = quality.map((q) => q.latestYearPrefCoverage).filter((c): c is number => c !== null);
    t.latestDataYear = latest;
    t.dataQuality = {
      keysChecked: keys.length,
      missingKeys: missing.length,
      missingKeyList: missing.slice(0, 10).map((q) => q.key),
      latestYearPrefCoverageMin: coverages.length ? Math.min(...coverages) : null,
    };
    const staleThreshold = new Date().getFullYear() - STALE_YEARS;
    t.dataQualityStatus = missing.length > 0 ? "gaps"
      : latest && Number(latest) <= staleThreshold ? "stale-data"
      : latest ? "ok" : "unknown";

    rows.push([
      t.themeKey.padEnd(22),
      `imp ${t.metrics.gsc.impressions}${t.metrics.gsc.status === "measured-low" ? " (low)" : ""}`,
      `pv ${t.metrics.ga4.pageViews}${t.metrics.ga4.status === "measured-low" ? " (low)" : ""}`,
      `年 ${latest ?? "—"}`, t.dataQualityStatus,
      missing.length ? `欠 ${missing.length}/${keys.length}` : "",
    ].join(" | "));
  }

  pf.generatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(PORTFOLIO, JSON.stringify(pf, null, 2) + "\n");
  console.log(`窓: ${weeks[1]} + ${weeks[0]} (各 last-28d 非重複 = 56d)`);
  rows.forEach((r) => console.log(r));
  const gscOk = pf.themes.filter((t: { metrics: { gsc: { status: string } } }) => t.metrics.gsc.status === "measured").length;
  const ga4Ok = pf.themes.filter((t: { metrics: { ga4: { status: string } } }) => t.metrics.ga4.status === "measured").length;
  console.log(`\nGSC measured ${gscOk}/22 / GA4 measured ${ga4Ok}/22 → ${PORTFOLIO}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
