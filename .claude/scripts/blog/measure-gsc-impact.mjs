#!/usr/bin/env node
/**
 * measure-gsc-impact.mjs — ブログ是正 wave の GSC 効果計測 (wave_id 駆動)
 *
 * 是正ループ ④ の自動化 (.claude/rules/blog-remediation-loop.md)。
 * `.claude/state/blog/auto-brushup-history.json` の wave_id を真実源に、
 * due (是正から min-weeks 以上経過) に達した各 wave の before/after を週次 GSC snapshot で
 * 自動 diff し、`improvement-log.md` の `## [BLOG-WAVE-<wave_id>]` section を upsert する。
 *
 * 2026-07-30: 判定を `.claude/scripts/lib/effect-verdict/` の閾値エンジンに委譲する adapter に
 * 薄めた。ISO 週計算・section upsert・交絡検出も同 module に集約済 (重複実装の解消)。
 * 本ファイルが持つのは GSC 固有の集計 (slug 単位の pages.csv 集計) と CLI の入出力だけ。
 *
 * Usage:
 *   node .claude/scripts/blog/measure-gsc-impact.mjs                 # due な全 wave を計測
 *   node .claude/scripts/blog/measure-gsc-impact.mjs --wave 2026-05-25-auto   # 指定 wave のみ (due 無視)
 *   node .claude/scripts/blog/measure-gsc-impact.mjs --min-weeks 4   # 是正後 4 週以上経過した wave のみ
 *   node .claude/scripts/blog/measure-gsc-impact.mjs --after 2026-W23  # after 週を固定
 *   node .claude/scripts/blog/measure-gsc-impact.mjs --dry-run        # ログ書き込みせず stdout のみ
 *
 * 入力:
 *   - .claude/state/blog/auto-brushup-history.json   (wave_id → slug + date)
 *   - .claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/pages.csv
 * 出力:
 *   - .claude/skills/analytics/gsc-improvement/reference/improvement-log.md (section upsert)
 *
 * 判定は閾値エンジンが行う。想定効果値 (target) が機械可読な形で無い wave は
 * `insufficient-target` ガードで effect/pending に留まる (数値を推測しない)。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decideVerdict, formatVerdictSection, extractTarget } from "../lib/effect-verdict/engine.mjs";
import { DEFAULT_THRESHOLDS } from "../lib/effect-verdict/thresholds.mjs";
import { isoWeekOf, isoWeekEnd, weekDiff, weekLt } from "../lib/effect-verdict/iso-week.mjs";
import { upsertSection } from "../lib/effect-verdict/section-upsert.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const SNAPSHOT_DIR = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots",
);
const LOG_PATH = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/improvement-log.md",
);
const HISTORY_PATH = path.join(
  PROJECT_ROOT,
  ".claude/state/blog/auto-brushup-history.json",
);

// ====== 利用可能 snapshot 週 ======
function listAvailableWeeks() {
  return fs.existsSync(SNAPSHOT_DIR)
    ? fs
        .readdirSync(SNAPSHOT_DIR)
        .filter((d) => /^\d{4}-W\d{2}$/.test(d))
        .filter((d) => fs.existsSync(path.join(SNAPSHOT_DIR, d, "pages.csv")))
        .sort()
    : [];
}

// ====== pages.csv 読み込み (slug 集計) ======
const pagesCache = new Map();
function loadPages(week) {
  if (pagesCache.has(week)) return pagesCache.get(week);
  const p = path.join(SNAPSHOT_DIR, week, "pages.csv");
  if (!fs.existsSync(p)) {
    pagesCache.set(week, []);
    return [];
  }
  const lines = fs.readFileSync(p, "utf8").trim().split("\n").slice(1);
  const rows = lines.map((l) => {
    const parts = l.split(",");
    const position = parseFloat(parts[parts.length - 1]);
    const ctr = parseFloat(parts[parts.length - 2]);
    const impressions = parseInt(parts[parts.length - 3], 10);
    const clicks = parseInt(parts[parts.length - 4], 10);
    const page = parts
      .slice(0, parts.length - 4)
      .join(",")
      .replace(/^"|"$/g, "");
    return { page, clicks, impressions, ctr, position };
  });
  pagesCache.set(week, rows);
  return rows;
}

function aggregateBySlug(rows, slug) {
  const matched = rows.filter((r) => r.page.includes(`/blog/${slug}`));
  const impressions = matched.reduce((s, r) => s + r.impressions, 0);
  const clicks = matched.reduce((s, r) => s + r.clicks, 0);
  const weightedPos = matched.reduce((s, r) => s + r.position * r.impressions, 0);
  return {
    impressions,
    clicks,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? weightedPos / impressions : 0,
  };
}

// ====== wave → slugs + date を history から構築 ======
function loadWaves() {
  if (!fs.existsSync(HISTORY_PATH)) return new Map();
  const history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
  const waves = new Map(); // wave_id → { date, slugs:Set }
  for (const e of history.entries || []) {
    if (!e.wave_id || !e.slug) continue;
    if (!waves.has(e.wave_id)) waves.set(e.wave_id, { date: e.date, slugs: new Set() });
    const w = waves.get(e.wave_id);
    w.slugs.add(e.slug);
    // wave の代表日は最も早い是正日 (before 週決定に使う)
    if (e.date && (!w.date || e.date < w.date)) w.date = e.date;
  }
  return waves;
}

// ====== adapter (effect-verdict engine 契約) ======
/**
 * GSC ブログ是正 wave の adapter。
 * 契約: { domainId, listSubjects, resolveWindow, measure, targetOf, logPath, headerPrefix, pastEffectKeys }
 * @param {{minWeeks?:number, afterWeek?:string|null, onlyWave?:string|null}} [opts]
 */
export function createGscBlogWaveAdapter(opts = {}) {
  const minWeeks = opts.minWeeks ?? DEFAULT_THRESHOLDS.window.minWeeks;
  const availableWeeks = listAvailableWeeks();
  const latestWeek = opts.afterWeek || availableWeeks[availableWeeks.length - 1] || null;
  const waves = loadWaves();

  return {
    domainId: "gsc-blog-wave",
    logPath: LOG_PATH,
    headerPrefix: "BLOG-WAVE-",
    availableWeeks,
    latestWeek,

    listSubjects() {
      const all = [...waves.entries()].sort((a, b) => (a[1].date < b[1].date ? -1 : 1));
      const picked = opts.onlyWave ? all.filter(([id]) => id === opts.onlyWave) : all;
      return picked.map(([id, info]) => ({
        id,
        subjectId: `BLOG-WAVE-${id}`,
        waveId: id,
        deployDate: info.date,
        deployWeek: isoWeekOf(info.date),
        slugs: [...info.slugs].sort(),
      }));
    },

    resolveWindow(subject) {
      const beforeCandidates = availableWeeks.filter((w) => weekLt(w, subject.deployWeek));
      const beforeWeek = beforeCandidates.length
        ? beforeCandidates[beforeCandidates.length - 1]
        : availableWeeks[0] ?? null;
      const afterWeek = latestWeek;
      const elapsedWeeks =
        afterWeek && subject.deployWeek ? weekDiff(subject.deployWeek, afterWeek) : null;
      // --wave 指定時は due 判定を無視する (人が明示的に見たいケース)
      const notDue = opts.onlyWave ? false : elapsedWeeks == null || elapsedWeeks < minWeeks;
      return { beforeWeek, afterWeek, elapsedWeeks, notDue };
    },

    /** 判定対象指標 = wave 合計 clicks (imp は標本ガードの入力)。 */
    measure(subject, week) {
      const rows = loadPages(week);
      let clicks = 0;
      let impressions = 0;
      const perSlug = [];
      for (const slug of subject.slugs) {
        const agg = aggregateBySlug(rows, slug);
        clicks += agg.clicks;
        impressions += agg.impressions;
        perSlug.push({ slug, ...agg });
      }
      return {
        value: clicks,
        impressions,
        clicks,
        ctr: impressions > 0 ? clicks / impressions : 0,
        perSlug,
      };
    },

    /**
     * 想定効果値。history に `[target: +N clicks]` があればそれを使い、無ければ null。
     * **散文からの推測はしない** → null なら engine が insufficient-target で pending に留める。
     */
    targetOf(subject) {
      const t = extractTarget(subject.note ?? "");
      return t ? t.value : null;
    },

    /** 判定に使った source (鮮度ガードの入力)。GSC 週次 snapshot の期間末を observedAt とする。 */
    sourcesOf(subject, window) {
      return window.afterWeek
        ? [{ name: `gsc:snapshots/${window.afterWeek}/pages.csv`, observedAt: isoWeekEnd(window.afterWeek) }]
        : [{ name: "gsc:snapshots", observedAt: null }];
    },

    /** past-effects 台帳のキー (effect/none|adverse のとき candidate 抑制に使われる)。 */
    pastEffectKeys(subject) {
      return subject.slugs.map((s) => `/blog/${s}`);
    },

    reproduceCommand(subject) {
      return `node .claude/scripts/blog/measure-gsc-impact.mjs --wave ${subject.waveId}`;
    },
  };
}

/** subject 1 件を engine にかけて verdict を返す (CLI と verdict CLI の共通経路)。 */
export function evaluateSubject(adapter, subject, thresholds = DEFAULT_THRESHOLDS) {
  const window = adapter.resolveWindow(subject);
  if (!window.beforeWeek || !window.afterWeek || !weekLt(window.beforeWeek, window.afterWeek)) {
    return { window, skipped: true, reason: "before/after 週が解決できない" };
  }
  const before = adapter.measure(subject, window.beforeWeek);
  const after = adapter.measure(subject, window.afterWeek);
  const verdict = decideVerdict(
    {
      before: { value: before.value, impressions: before.impressions },
      after: { value: after.value, impressions: after.impressions },
      target: adapter.targetOf(subject),
      window,
      sources: adapter.sourcesOf(subject, window),
      confounders: { coDeployed: [], laterContaminators: [] },
    },
    thresholds,
  );
  return { window, before, after, verdict, skipped: false };
}

// ====== CLI ======
function runCli() {
  const args = process.argv.slice(2);
  const getArg = (flag, fallback = null) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  const hasFlag = (flag) => args.includes(flag);

  const onlyWave = getArg("--wave", null);
  const minWeeks = parseInt(getArg("--min-weeks", String(DEFAULT_THRESHOLDS.window.minWeeks)), 10);
  const afterOverride = getArg("--after", null);
  const dryRun = hasFlag("--dry-run");

  const adapter = createGscBlogWaveAdapter({ minWeeks, afterWeek: afterOverride, onlyWave });

  if (adapter.availableWeeks.length === 0) {
    console.error(`[error] GSC snapshot 週が無い: ${SNAPSHOT_DIR}`);
    process.exit(1);
  }
  const subjects = adapter.listSubjects();
  if (subjects.length === 0) {
    console.error(
      onlyWave ? `[error] wave が履歴に無い: ${onlyWave}` : "[error] wave_id を持つ brushup 履歴が無い",
    );
    process.exit(1);
  }

  const sections = [];
  const measured = [];
  const skipped = [];
  for (const subject of subjects) {
    const r = evaluateSubject(adapter, subject);
    if (r.skipped) {
      skipped.push({ waveId: subject.waveId, reason: r.reason });
      continue;
    }
    if (r.window.notDue) {
      skipped.push({
        waveId: subject.waveId,
        reason: `not due (${r.window.elapsedWeeks}w < ${minWeeks}w)`,
      });
      continue;
    }
    sections.push({
      headerId: `[BLOG-WAVE-${subject.waveId}]`,
      md: buildWaveSection(adapter, subject, r, minWeeks),
    });
    measured.push({
      waveId: subject.waveId,
      slugs: subject.slugs.length,
      beforeWeek: r.window.beforeWeek,
      afterWeek: r.window.afterWeek,
      totClicksDelta: r.after.clicks - r.before.clicks,
      totImpDelta: r.after.impressions - r.before.impressions,
      label: r.verdict.label,
    });
  }

  if (!dryRun && sections.length > 0) {
    let log = fs.existsSync(LOG_PATH) ? fs.readFileSync(LOG_PATH, "utf8") : "# GSC 改善ログ\n";
    for (const { headerId, md } of sections) log = upsertSection(log, headerId, md);
    fs.writeFileSync(LOG_PATH, log);
  }

  process.stderr.write(
    `\nブログ是正 wave 効果計測 (after=${adapter.latestWeek}, min-weeks=${minWeeks})\n`,
  );
  for (const m of measured) {
    process.stderr.write(
      `  ✓ ${m.waveId} | ${m.slugs} 記事 | ${m.beforeWeek}→${m.afterWeek} | clicks ${sign(m.totClicksDelta)} / imp ${sign(m.totImpDelta)} | ${m.label}\n`,
    );
  }
  for (const s of skipped) {
    process.stderr.write(`  – ${s.waveId} skip (${s.reason})\n`);
  }
  if (sections.length > 0 && !dryRun) {
    process.stderr.write(`\n✓ ${sections.length} wave section を upsert: ${LOG_PATH}\n`);
  } else if (dryRun) {
    process.stderr.write(`\n[dry-run] ${sections.length} section を生成 (書き込みなし)\n`);
    for (const { md } of sections) process.stdout.write(`\n${md}`);
  } else {
    process.stderr.write(`\ndue な wave なし (--min-weeks ${minWeeks})\n`);
  }
}

// ====== section 組み立て ======
const sign = (n, digits = 0) => `${n >= 0 ? "+" : ""}${digits ? n.toFixed(digits) : n}`;

function buildWaveSection(adapter, subject, r, minWeeks) {
  const { window: win, before, after, verdict } = r;
  let md = `## [BLOG-WAVE-${subject.waveId}]\n\n`;
  md += `- **status**: ${verdict.label} (閾値エンジン判定 / thresholds.mjs v${verdict.thresholdsVersion}` +
    `${verdict.guards.length ? ` / ガード: ${verdict.guards.map((g) => g.code).join(", ")}` : " / ガードなし"})\n`;
  md += `- **wave_id**: ${subject.waveId} / **記事数**: ${subject.slugs.length}\n`;
  md += `- **remediated_at**: ${subject.deployDate} (週 ${subject.deployWeek})\n`;
  md += `- **before**: ${win.beforeWeek} → **after**: ${win.afterWeek} (経過 ${win.elapsedWeeks} 週)\n`;
  md += `- **計測日**: ${new Date().toISOString().slice(0, 10)} (自動: measure-gsc-impact.mjs)\n\n`;
  md += `| slug | imp (before→after) | clicks | CTR | position |\n`;
  md += `|---|---|---|---|---|\n`;
  const afterBySlug = new Map(after.perSlug.map((s) => [s.slug, s]));
  for (const b of before.perSlug) {
    const a = afterBySlug.get(b.slug);
    md += `| \`${b.slug}\` | ${b.impressions}→${a.impressions} (${sign(a.impressions - b.impressions)}) | ${b.clicks}→${a.clicks} (${sign(a.clicks - b.clicks)}) | ${(b.ctr * 100).toFixed(1)}%→${(a.ctr * 100).toFixed(1)}% (${sign((a.ctr - b.ctr) * 100, 2)}pp) | ${b.position.toFixed(1)}→${a.position.toFixed(1)} (${sign(a.position - b.position, 1)}) |\n`;
  }
  md += `\n**wave 合計**: imp ${before.impressions}→${after.impressions} (${sign(after.impressions - before.impressions)}) / clicks ${before.clicks}→${after.clicks} (${sign(after.clicks - before.clicks)}) / CTR ${(before.ctr * 100).toFixed(2)}%→${(after.ctr * 100).toFixed(2)}% (${sign((after.ctr - before.ctr) * 100, 2)}pp)\n\n`;
  md += formatVerdictSection(verdict, {
    subjectId: subject.subjectId,
    metricLabel: `clicks (${subject.slugs.length} 記事合計)`,
    reproduceCommand: adapter.reproduceCommand(subject),
  });
  return md;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runCli();
}
