/**
 * 閾値エンジン (effect-verdict) 用の adapter: `.claude/todo/improvements.md` の GSC 施策。
 *
 * ブログ wave (measure-gsc-impact.mjs) 以外の GSC 施策は、これまで機械判定の対象外で、
 * 毎回人が GSC を見て判断していた。行に次の 3 つが揃った施策だけを subject にする (散文から推測しない):
 *   - `[gsc-page: /path]`       対象ページのパス前方一致 (複数可)。フラグメントは除いて照合する
 *   - `デプロイ済 YYYY-MM-DD`     engine.extractDeployDate の既存書式。before 窓の基準
 *   - `[target: +N clicks]`      engine.extractTarget の既存書式。無ければ insufficient-target で pending
 * 計測値は週次 GSC snapshot (rolling28d の pages.csv) の clicks 合計、impressions は標本ガードの入力。
 */
import fs from "node:fs";
import path from "node:path";
import { extractDeployDate, extractTarget } from "../../lib/effect-verdict/engine.mjs";
import { isoWeekEnd, isoWeekOf, weekDiff, weekLt } from "../../lib/effect-verdict/iso-week.mjs";
import { parseBacklog } from "../../lib/scan-pending-improvements.mjs";
import { DEFAULT_THRESHOLDS } from "../../lib/effect-verdict/thresholds.mjs";
import { parseCsv } from "./measurement-cycle.mjs";
import { PROJECT_ROOT } from "./auth.mjs";
import { resolvePeriods } from "./periods.mjs";

const ACTIVE_STATUSES = new Set(["pending", "in-progress", "effect/pending"]);

const PAGE_MARKER = /\[gsc-page:\s*([^\]\s]+)\s*\]/g;

export function extractGscPages(text) {
  return [...new Set(Array.from(String(text ?? "").matchAll(PAGE_MARKER), (m) => m[1]))];
}

function pathnameOf(url) {
  try { return new URL(url).pathname; } catch { return String(url).split(/[?#]/)[0]; }
}

/** pages.csv の行群から、prefix のどれかに前方一致するページの clicks / impressions を合計する。 */
export function sumPages(rows, prefixes) {
  let clicks = 0, impressions = 0;
  for (const row of rows) {
    const path = pathnameOf(row.page);
    if (!prefixes.some((p) => path.startsWith(p))) continue;
    clicks += Number(row.clicks) || 0;
    impressions += Number(row.impressions) || 0;
  }
  return { clicks, impressions };
}

/**
 * @param {{ entries: Array<object>, availableWeeks: string[], loadPages: (week:string)=>Array<object>,
 *           minWeeks: number, logPath: string }} deps
 *   entries は scan-pending-improvements.parseBacklog の戻り値 (section_id / title / target_metric / status)。
 */
export function createGscImprovementsAdapter({ entries, availableWeeks, loadPages, minWeeks, logPath }) {
  const latestWeek = availableWeeks[availableWeeks.length - 1] ?? null;
  return {
    domainId: "gsc-improvement",
    logPath,
    headerPrefix: "",
    availableWeeks,
    latestWeek,

    listSubjects() {
      return entries
        .filter((e) => /gsc/i.test(e.target_metric ?? ""))
        .map((e) => ({ e, pages: extractGscPages(e.title) }))
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
      const { clicks, impressions } = sumPages(loadPages(week), subject.pages);
      return { value: clicks, impressions, clicks };
    },

    targetOf(subject) {
      return extractTarget(subject.note)?.value ?? null;
    },

    sourcesOf(subject, window) {
      return window.afterWeek
        ? [{ name: `gsc:snapshots/${window.afterWeek}/pages.csv`, observedAt: isoWeekEnd(window.afterWeek) }]
        : [{ name: "gsc:snapshots", observedAt: null }];
    },

    pastEffectKeys(subject) {
      return subject.pages;
    },

    reproduceCommand(subject) {
      const week = latestWeek ?? "<YYYY-Www>";
      const period = latestWeek ? resolvePeriods({ source: "gsc", week }).rolling28d : null;
      const range = period ? `--start ${period.periodStart} --end ${period.periodEnd}` : "--start <YYYY-MM-DD> --end <YYYY-MM-DD>";
      return `node .claude/scripts/metrics/gsc-query.mjs ${range} --dims page --filter 'page*=${subject.pages[0]}'`;
    },
  };
}

/** repo の improvements.md と GSC 週次 snapshot から adapter を組み立てる (effect-verdict/cli.mjs が使う)。 */
export function loadGscImprovementsAdapter({ root = PROJECT_ROOT, minWeeks = DEFAULT_THRESHOLDS.window.minWeeks } = {}) {
  const snapshotDir = path.join(root, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
  const availableWeeks = fs.existsSync(snapshotDir)
    ? fs.readdirSync(snapshotDir).filter((d) => /^\d{4}-W\d{2}$/.test(d) && fs.existsSync(path.join(snapshotDir, d, "pages.csv"))).sort()
    : [];
  const cache = new Map();
  const loadPages = (week) => {
    if (!cache.has(week)) {
      const p = path.join(snapshotDir, week, "pages.csv");
      cache.set(week, fs.existsSync(p) ? parseCsv(fs.readFileSync(p, "utf8")) : []);
    }
    return cache.get(week);
  };
  const entries = parseBacklog(path.join(root, ".claude/todo/improvements.md")).filter((e) => ACTIVE_STATUSES.has(e.status));
  return createGscImprovementsAdapter({
    entries,
    availableWeeks,
    loadPages,
    minWeeks,
    logPath: path.join(root, ".claude/skills/analytics/gsc-improvement/reference/improvement-log.md"),
  });
}

/** 施策行が機械判定に必要な目印を持っているか (計測 state の「判定可能性」表示用)。 */
export function judgeability(entry) {
  const title = entry.title ?? "";
  return {
    id: entry.section_id,
    metric: entry.target_metric ?? "",
    hasPage: extractGscPages(title).length > 0,
    hasDeploy: extractDeployDate(title) != null,
    hasTarget: extractTarget(title) != null,
  };
}
