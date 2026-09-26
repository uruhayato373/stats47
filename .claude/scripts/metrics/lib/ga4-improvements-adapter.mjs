/**
 * 閾値エンジン (effect-verdict) 用の adapter: `.claude/todo/improvements.md` の GA4 施策。
 *
 * GSC 施策と同じく、行に次の 3 つが揃った施策だけを subject にする (散文から推測しない):
 *   - `[ga4-page: /path]`      対象ページのパス前方一致 (複数可)
 *   - `デプロイ済 YYYY-MM-DD`    before 窓の基準 (engine.extractDeployDate の既存書式)
 *   - `[target: +N pageviews]`  想定効果 (engine.extractTarget の既存書式)。無ければ insufficient-target で pending
 * 計測値は週次 GA4 snapshot の pages-clean.csv (Japan-only・rolling28d) の screenPageViews 合計。
 * 標本ガード (impressions 下限) には同じ PV を渡す — GA4 に「表示回数」は無く、PV が判定の母数になるため。
 *
 * 2026-09-26 に page_view の二重計測 (サイト内遷移 1 回 = 2 件) を是正したため、
 * この日をまたぐ before/after は PV が構造的に減る。窓がまたぐ subject は confounded として pending に留める。
 */
import fs from "node:fs";
import path from "node:path";
import { extractDeployDate, extractTarget } from "../../lib/effect-verdict/engine.mjs";
import { isoWeekEnd, isoWeekOf, weekDiff, weekLt } from "../../lib/effect-verdict/iso-week.mjs";
import { parseBacklog } from "../../lib/scan-pending-improvements.mjs";
import { DEFAULT_THRESHOLDS } from "../../lib/effect-verdict/thresholds.mjs";
import { parseCsv } from "./measurement-cycle.mjs";
import { PROJECT_ROOT } from "./auth.mjs";

const ACTIVE_STATUSES = new Set(["pending", "in-progress", "effect/pending"]);
const PAGE_MARKER = /\[ga4-page:\s*([^\]\s]+)\s*\]/g;

/** 計測の不連続点 (`.claude/state/metrics/releases/2026-09-26-ga4-measurement-v2.json`)。 */
export const GA4_MEASUREMENT_DISCONTINUITY_WEEK = isoWeekOf("2026-09-26");

export function extractGa4Pages(text) {
  return [...new Set(Array.from(String(text ?? "").matchAll(PAGE_MARKER), (m) => m[1]))];
}

/** pages-clean.csv の行群から、prefix のどれかに前方一致するページの PV を合計する。 */
export function sumPageViews(rows, prefixes) {
  let pageViews = 0;
  for (const row of rows) {
    const p = String(row.pagePath ?? "").split(/[?#]/)[0];
    if (!prefixes.some((prefix) => p.startsWith(prefix))) continue;
    pageViews += Number(row.screenPageViews) || 0;
  }
  return pageViews;
}

/** before 週と after 週の間に計測の不連続点があるか。 */
export function spansDiscontinuity(beforeWeek, afterWeek, discontinuityWeek = GA4_MEASUREMENT_DISCONTINUITY_WEEK) {
  if (!beforeWeek || !afterWeek) return false;
  return weekLt(beforeWeek, discontinuityWeek) && !weekLt(afterWeek, discontinuityWeek);
}

export function createGa4ImprovementsAdapter({ entries, availableWeeks, loadPages, minWeeks, logPath }) {
  const latestWeek = availableWeeks[availableWeeks.length - 1] ?? null;
  return {
    domainId: "ga4-improvement",
    logPath,
    headerPrefix: "",
    availableWeeks,
    latestWeek,

    listSubjects() {
      return entries
        .filter((e) => /ga4/i.test(e.target_metric ?? ""))
        .map((e) => ({ e, pages: extractGa4Pages(e.title) }))
        .filter(({ pages }) => pages.length > 0)
        .map(({ e, pages }) => {
          const deployDate = extractDeployDate(e.title);
          return {
            id: e.section_id,
            subjectId: e.section_id,
            pages,
            deployDate,
            deployWeek: deployDate ? isoWeekOf(deployDate) : null,
            note: e.title,
          };
        });
    },

    resolveWindow(subject) {
      if (!subject.deployWeek) return { beforeWeek: null, afterWeek: latestWeek, elapsedWeeks: null, notDue: true };
      const before = availableWeeks.filter((w) => weekLt(w, subject.deployWeek));
      const beforeWeek = before.length ? before[before.length - 1] : null;
      const elapsedWeeks = latestWeek ? weekDiff(subject.deployWeek, latestWeek) : null;
      return { beforeWeek, afterWeek: latestWeek, elapsedWeeks, notDue: elapsedWeeks == null || elapsedWeeks < minWeeks };
    },

    measure(subject, week) {
      const pageViews = sumPageViews(loadPages(week), subject.pages);
      return { value: pageViews, impressions: pageViews };
    },

    targetOf(subject) {
      return extractTarget(subject.note)?.value ?? null;
    },

    sourcesOf(subject, window) {
      return window.afterWeek
        ? [{ name: `ga4:snapshots/${window.afterWeek}/pages-clean.csv`, observedAt: isoWeekEnd(window.afterWeek) }]
        : [{ name: "ga4:snapshots", observedAt: null }];
    },

    confoundersOf(subject, window) {
      return spansDiscontinuity(window.beforeWeek, window.afterWeek)
        ? { laterContaminators: ["GA4 計測の不連続 (2026-09-26 page_view 二重計測の是正)"] }
        : {};
    },

    pastEffectKeys(subject) {
      return subject.pages;
    },

    reproduceCommand(subject) {
      return `node .claude/scripts/metrics/ga4-query.mjs --japan --dims pagePath --metrics screenPageViews --filter 'pagePath*=${subject.pages[0]}'`;
    },
  };
}

/** repo の improvements.md と GA4 週次 snapshot から adapter を組み立てる (effect-verdict/cli.mjs が使う)。 */
export function loadGa4ImprovementsAdapter({ root = PROJECT_ROOT, minWeeks = DEFAULT_THRESHOLDS.window.minWeeks } = {}) {
  const snapshotDir = path.join(root, ".claude/skills/analytics/ga4-improvement/reference/snapshots");
  const availableWeeks = fs.existsSync(snapshotDir)
    ? fs.readdirSync(snapshotDir).filter((d) => /^\d{4}-W\d{2}$/.test(d) && fs.existsSync(path.join(snapshotDir, d, "pages-clean.csv"))).sort()
    : [];
  const cache = new Map();
  const loadPages = (week) => {
    if (!cache.has(week)) {
      const p = path.join(snapshotDir, week, "pages-clean.csv");
      cache.set(week, fs.existsSync(p) ? parseCsv(fs.readFileSync(p, "utf8")) : []);
    }
    return cache.get(week);
  };
  const entries = parseBacklog(path.join(root, ".claude/todo/improvements.md")).filter((e) => ACTIVE_STATUSES.has(e.status));
  return createGa4ImprovementsAdapter({
    entries,
    availableWeeks,
    loadPages,
    minWeeks,
    logPath: path.join(root, ".claude/skills/analytics/ga4-improvement/reference/improvement-log.md"),
  });
}
