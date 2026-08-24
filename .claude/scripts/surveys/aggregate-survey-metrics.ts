/**
 * aggregate-survey-metrics.ts — survey 別 56 日 baseline の決定的集計 (PR-3)
 *
 * GSC / GA4 の週次 snapshot は **各週 last-28d 窓** (fetch-{gsc,ga4}-snapshot.mjs が
 * endDate-27 で取得) のため、単純合算は最大 4 倍の二重計上になる。
 * 56 日 = **非重複 2 窓 (最新週 + その 4 週前)** の合算で構成する
 * (2026-07-11 survey ポートフォリオ監査の訂正記録で実証済みの失敗パターンの再発防止)。
 *
 * 集計規約 (schema 正典: .claude/state/surveys/README.md):
 *   - GSC: impressions/clicks = 2 窓合算。ctr = 合算比、averagePosition = impressions 加重平均
 *     — いずれも measured (impressions >= 100/56d) のみ保存。measured-low はカウント値のみ
 *   - GA4: landingPageViews = screenPageViews の 2 窓合算 (加算可能)。engagedSessions は
 *     snapshot 非搭載のため保存しない (代替: engagementRatePvWeighted を measured 時のみ保存)。
 *     activeUsers は週横断で加算不能のため最新窓のみ activeUsersLast28d として保存
 *   - snapshot に行が無い = その窓で表示/流入 0 の実測 (GSC/GA4 はゼロ行を出力しない) →
 *     measured-low のカウント 0 として保存する (insufficient-data ではない)
 *   - internalNav: survey-navigation.csv が両窓にある場合だけ survey→ranking nav_click を合算。
 *     20 clicks/56d 以上を measured、未満を measured-low。snapshot 欠損は insufficient-data
 *   - latestDataYear は本スクリプトでは集計しない (survey→items→values の多段 fetch が重い。
 *     editorial 候補の個別事前監査で記入する)
 *
 * Usage:
 *   npx tsx .claude/scripts/surveys/aggregate-survey-metrics.ts               # 最新窓で集計・upsert
 *   npx tsx .claude/scripts/surveys/aggregate-survey-metrics.ts --weeks 2026-W28,2026-W24
 *
 * 実行後は必ず validate-survey-portfolio.ts を通すこと。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const PORTFOLIO = path.join(PROJECT_ROOT, ".claude/state/surveys/portfolio.json");
const GSC_SNAP = path.join(PROJECT_ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
const GA4_SNAP = path.join(PROJECT_ROOT, ".claude/skills/analytics/ga4-improvement/reference/snapshots");

const MIN_GSC_IMPRESSIONS = 100; // per 56d (README 判定規律 3: imp<100 は CTR を確定しない)
const MIN_GA4_PAGEVIEWS = 100;
const MIN_INTERNAL_NAV_CLICKS = 20;

// ---------- 窓の決定 (非重複 2 窓) ----------
function pickWeeks(): [string, string] {
  const arg = process.argv[process.argv.indexOf("--weeks") + 1];
  if (process.argv.includes("--weeks") && arg) {
    const [a, b] = arg.split(",");
    return [a, b];
  }
  const weeks = fs.readdirSync(GSC_SNAP).filter((d) => /^\d{4}-W\d{2}$/.test(d)).sort();
  const latest = weeks[weeks.length - 1];
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

function normalizeSurveyPath(raw: string): string | null {
  // GSC: https://stats47.jp/survey/<id>[/?#...] / GA4: /survey/<id>[?...]
  const m = raw.match(/^(?:https:\/\/stats47\.jp)?(\/survey\/[a-z0-9-]+)\/?(?:[?#].*)?$/);
  return m ? m[1] : null;
}

interface GscAgg { clicks: number; impressions: number; posWeighted: number }
interface Ga4Agg { pageViews: number; erWeighted: number; durWeighted: number; latestActiveUsers: number | null }

function aggregateGsc(weeks: [string, string]): Map<string, GscAgg> {
  const out = new Map<string, GscAgg>();
  for (const w of weeks) {
    for (const row of readCsv(path.join(GSC_SNAP, w, "pages.csv"))) {
      const p = normalizeSurveyPath(row.page ?? "");
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
      const p = normalizeSurveyPath(row.pagePath ?? "");
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

function aggregateInternalNav(weeks: [string, string]): Map<string, number> | null {
  const files = weeks.map((week) => path.join(GA4_SNAP, week, "survey-navigation.csv"));
  if (files.some((file) => !fs.existsSync(file))) return null;
  const out = new Map<string, number>();
  for (const file of files) {
    for (const row of readCsv(file)) {
      const p = normalizeSurveyPath(row.pagePath ?? "");
      if (!p || row.nav_surface !== "survey_ranking") continue;
      out.set(p, (out.get(p) ?? 0) + (Number(row.eventCount) || 0));
    }
  }
  return out;
}

// ---------- main ----------
function main() {
  const weeks = pickWeeks();
  const pf = JSON.parse(fs.readFileSync(PORTFOLIO, "utf8"));
  const gsc = aggregateGsc(weeks);
  const ga4 = aggregateGa4(weeks);
  const internalNav = aggregateInternalNav(weeks);

  const round = (n: number, d: number) => Number(n.toFixed(d));
  const withDemand: string[] = [];

  for (const s of pf.surveys) {
    const p = `/survey/${s.surveyId}`;
    // ── GSC ── (measured-low: 集計済みだが標本不足 → カウント値のみ保存・比率値は保存禁止)
    const g = gsc.get(p);
    if (g && g.impressions >= MIN_GSC_IMPRESSIONS) {
      s.metrics.gsc = {
        status: "measured", windowDays: 56, weeks: [...weeks].sort(),
        impressions: g.impressions, clicks: g.clicks,
        ctr: round(g.clicks / g.impressions, 4),
        averagePosition: round(g.posWeighted / g.impressions, 2),
      };
    } else {
      s.metrics.gsc = {
        status: "measured-low", windowDays: 56, weeks: [...weeks].sort(),
        impressions: g?.impressions ?? 0, clicks: g?.clicks ?? 0,
      };
    }
    // ── GA4 ──
    const a = ga4.get(p);
    if (a && a.pageViews >= MIN_GA4_PAGEVIEWS) {
      s.metrics.ga4 = {
        status: "measured", windowDays: 56, weeks: [...weeks].sort(),
        landingPageViews: a.pageViews,
        activeUsersLast28d: a.latestActiveUsers ?? 0,
        engagementRatePvWeighted: round(a.erWeighted / a.pageViews, 4),
        avgSessionDurationSecPvWeighted: round(a.durWeighted / a.pageViews, 1),
      };
    } else {
      s.metrics.ga4 = {
        status: "measured-low", windowDays: 56, weeks: [...weeks].sort(),
        landingPageViews: a?.pageViews ?? 0,
      };
    }
    // ── internal navigation ──
    if (internalNav === null) {
      s.metrics.internalNav = {
        status: "insufficient-data",
        windowDays: 56,
        weeks: [...weeks].sort(),
      };
    } else {
      const rankingOutboundClicks = internalNav.get(p) ?? 0;
      s.metrics.internalNav = {
        status: rankingOutboundClicks >= MIN_INTERNAL_NAV_CLICKS ? "measured" : "measured-low",
        windowDays: 56,
        weeks: [...weeks].sort(),
        rankingOutboundClicks,
      };
    }
    s.gscSnapshotRef = `.claude/skills/analytics/gsc-improvement/reference/snapshots/${weeks[0]}/pages.csv`;
    s.ga4SnapshotRef = `.claude/skills/analytics/ga4-improvement/reference/snapshots/${weeks[0]}/pages.csv`;

    if ((s.metrics.gsc.impressions ?? 0) > 0 || (s.metrics.ga4.landingPageViews ?? 0) > 0) {
      withDemand.push([
        s.surveyId.padEnd(32),
        `imp ${s.metrics.gsc.impressions}${s.metrics.gsc.status === "measured" ? "" : " (low)"}`,
        `clicks ${s.metrics.gsc.clicks}`,
        `pv ${s.metrics.ga4.landingPageViews}${s.metrics.ga4.status === "measured" ? "" : " (low)"}`,
      ].join(" | "));
    }
  }

  pf.generatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(PORTFOLIO, JSON.stringify(pf, null, 2) + "\n");
  console.log(`窓: ${weeks[1]} + ${weeks[0]} (各 last-28d 非重複 = 56d)`);
  console.log(`表示/流入あり ${withDemand.length}/${pf.surveys.length} 件:`);
  withDemand
    .sort((a, b) => Number(b.match(/imp (\d+)/)?.[1] ?? 0) - Number(a.match(/imp (\d+)/)?.[1] ?? 0))
    .forEach((r) => console.log("  " + r));
  const gscOk = pf.surveys.filter((s: { metrics: { gsc: { status: string } } }) => s.metrics.gsc.status === "measured").length;
  const ga4Ok = pf.surveys.filter((s: { metrics: { ga4: { status: string } } }) => s.metrics.ga4.status === "measured").length;
  const navOk = pf.surveys.filter((s: { metrics: { internalNav: { status: string } } }) => s.metrics.internalNav.status === "measured").length;
  const navState = internalNav === null ? "snapshot 欠損" : `measured ${navOk}/${pf.surveys.length}`;
  console.log(`GSC measured ${gscOk}/${pf.surveys.length} / GA4 measured ${ga4Ok}/${pf.surveys.length} / internalNav ${navState} → ${PORTFOLIO}`);
}

main();
