#!/usr/bin/env node
/**
 * 「表示は伸びたのにクリックが伸びない」を面別に切り分ける (read-only)。
 *
 * ★なぜ専用スクリプトが要るか (2026-08-21)
 * この問いは 4 週連続で週次計画に載りながら着手されなかった。素朴に pages.csv を集計すると
 * 誤った結論になるので、正しい集計の仕方をコードに固定する。落とし穴が 2 つある:
 *
 *  1. アンカー行 (`#見出し` 付き URL) が page 次元にだけ現れる。W33 実測で 312 行・
 *     39,934 imp・CTR 0.01% (実質クリックゼロ)。page 次元 imp の 26% を占め、4 週で倍増した。
 *     日付次元には含まれない (非アンカー合計 ÷ 日付合計が 5 週とも 104.4-105.0% で安定)。
 *     除外せずに CTR を出すと系統的に過小評価する。
 *  2. rolling28d の snapshot は隣接週どうしが 21 日重複する。WoW 比較は禁止されている。
 *     ただし 28 日離れた 2 つは実質非重複で比較でき、隣接する 2 つの差は
 *     「入った週 − 出た週」の 7 日ブロック差として読める。
 *
 * 使い方:
 *   node .claude/scripts/gsc/analyze-ctr-seesaw.mjs 2026-W29 2026-W33
 *   node .claude/scripts/gsc/analyze-ctr-seesaw.mjs 2026-W32 2026-W33
 *   node .claude/scripts/gsc/analyze-ctr-seesaw.mjs --weekly
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SNAP = '.claude/skills/analytics/gsc-improvement/reference/snapshots';

function readCsv(path) {
  const [head, ...rest] = readFileSync(path, 'utf8').trim().split(/\r?\n/);
  const cols = head.split(',');
  return rest.map((line) => {
    const parts = line.split(',');
    const extra = parts.length - cols.length;
    const key = extra > 0 ? parts.slice(0, extra + 1).join(',') : parts[0];
    const tail = parts.slice(extra > 0 ? extra + 1 : 1);
    return Object.fromEntries([[cols[0], key], ...cols.slice(1).map((c, i) => [c, tail[i]])]);
  });
}

/** アンカー行はクリックが付かず page 次元にしか出ない → CTR を見るときは必ず分ける。 */
export function isAnchorRow(url) {
  return url.includes('#');
}

export function surfaceOf(url) {
  const path = url.split('stats47.jp')[1] ?? '/';
  const clean = path.split('?')[0].split('#')[0];
  if (clean === '/' || clean === '') return 'home';
  for (const seg of ['blog', 'ranking', 'themes', 'category', 'survey', 'tag', 'compare']) {
    if (clean === `/${seg}` || clean.startsWith(`/${seg}/`)) return seg;
  }
  if (clean.startsWith('/areas')) {
    const parts = clean.split('/').filter(Boolean);
    if (parts.length === 1) return 'areas(一覧)';
    if (parts.length === 2) return 'areas(県)';
    if (parts[2] === 'cities') return 'areas(市区町村)';
    return 'areas(県×テーマ)';
  }
  return 'その他';
}

function loadPages(week) {
  const rows = readCsv(`${SNAP}/${week}/pages.csv`);
  return new Map(rows.map((r) => [r.page, { clicks: +r.clicks, impressions: +r.impressions }]));
}

const pct = (c, i) => (i > 0 ? (100 * c) / i : 0);
const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);

/** 面ごとに畳む。anchor を含めるかは呼び出し側が決める (既定は除外)。 */
export function aggregate(pages, options = {}) {
  const includeAnchors = options.includeAnchors === true;
  const out = new Map();
  for (const [url, v] of pages) {
    if (!includeAnchors && isAnchorRow(url)) continue;
    const key = surfaceOf(url);
    const cur = out.get(key) ?? { clicks: 0, impressions: 0 };
    cur.clicks += v.clicks;
    cur.impressions += v.impressions;
    out.set(key, cur);
  }
  return out;
}

/** 全体 CTR の変化を「構成比の移動」と「面ごとの CTR 変化」に分ける (shift-share)。 */
export function shiftShare(before, after) {
  const i0 = [...before.values()].reduce((s, v) => s + v.impressions, 0);
  const i1 = [...after.values()].reduce((s, v) => s + v.impressions, 0);
  let mix = 0;
  let within = 0;
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const b = before.get(key) ?? { clicks: 0, impressions: 0 };
    const a = after.get(key) ?? { clicks: 0, impressions: 0 };
    const w0 = i0 ? b.impressions / i0 : 0;
    const w1 = i1 ? a.impressions / i1 : 0;
    const c0 = b.impressions ? b.clicks / b.impressions : 0;
    const c1 = a.impressions ? a.clicks / a.impressions : 0;
    mix += (w1 - w0) * c0;
    within += w1 * (c1 - c0);
  }
  return { mix: mix * 100, within: within * 100 };
}

function splitAnchors(pages) {
  const anchor = { clicks: 0, impressions: 0 };
  const plain = { clicks: 0, impressions: 0 };
  for (const [url, v] of pages) {
    const bucket = isAnchorRow(url) ? anchor : plain;
    bucket.clicks += v.clicks;
    bucket.impressions += v.impressions;
  }
  return { anchor, plain };
}

function reportPair(w0, w1) {
  const a = loadPages(w0);
  const b = loadPages(w1);
  for (const [label, week, pages] of [['前', w0, a], ['後', w1, b]]) {
    const { anchor, plain } = splitAnchors(pages);
    console.log(
      `${label} ${week}: 非アンカー imp ${plain.impressions} / clicks ${plain.clicks} / CTR ${pct(plain.clicks, plain.impressions).toFixed(2)}%` +
        `  || アンカー行 imp ${anchor.impressions} / clicks ${anchor.clicks} / CTR ${pct(anchor.clicks, anchor.impressions).toFixed(2)}%`,
    );
  }

  const A = aggregate(a);
  const B = aggregate(b);
  const keys = [...new Set([...A.keys(), ...B.keys()])];
  const dimp = (k) => (B.get(k)?.impressions ?? 0) - (A.get(k)?.impressions ?? 0);
  keys.sort((x, y) => dimp(y) - dimp(x));
  console.log('\n面別 (アンカー行を除く)');
  console.log('面'.padEnd(16) + 'imp前'.padStart(10) + 'imp後'.padStart(10) + 'd-imp'.padStart(9) + 'CTR前'.padStart(9) + 'CTR後'.padStart(9) + 'd-CTR'.padStart(10) + 'd-click'.padStart(9));
  for (const k of keys) {
    const x = A.get(k) ?? { clicks: 0, impressions: 0 };
    const y = B.get(k) ?? { clicks: 0, impressions: 0 };
    const c0 = pct(x.clicks, x.impressions);
    const c1 = pct(y.clicks, y.impressions);
    console.log(
      k.padEnd(16) +
        String(x.impressions).padStart(10) +
        String(y.impressions).padStart(10) +
        sign(y.impressions - x.impressions).padStart(9) +
        `${c0.toFixed(2)}%`.padStart(9) +
        `${c1.toFixed(2)}%`.padStart(9) +
        `${c1 - c0 >= 0 ? '+' : ''}${(c1 - c0).toFixed(2)}pp`.padStart(10) +
        sign(y.clicks - x.clicks).padStart(9),
    );
  }

  const { mix, within } = shiftShare(A, B);
  const i0 = [...A.values()].reduce((s, v) => s + v.impressions, 0);
  const c0 = [...A.values()].reduce((s, v) => s + v.clicks, 0);
  const i1 = [...B.values()].reduce((s, v) => s + v.impressions, 0);
  const c1 = [...B.values()].reduce((s, v) => s + v.clicks, 0);
  console.log(`\n全体 CTR ${(pct(c1, i1) - pct(c0, i0)).toFixed(3)}pp = 構成比の移動 ${mix.toFixed(3)}pp + 面ごとの CTR 変化 ${within.toFixed(3)}pp`);
  console.log(`増分だけの CTR: d-imp ${sign(i1 - i0)} / d-click ${sign(c1 - c0)} = ${pct(c1 - c0, i1 - i0).toFixed(2)}% (後の平均 ${pct(c1, i1).toFixed(2)}%)`);
}

/** 全 snapshot の daily.csv を日付で重複排除して連結し、直近から 7 日ずつ畳む。 */
function reportWeekly() {
  const daily = new Map();
  for (const week of readdirSync(SNAP).sort()) {
    const path = `${SNAP}/${week}/daily.csv`;
    if (!existsSync(path)) continue;
    for (const r of readCsv(path)) {
      daily.set(r.date, { clicks: +r.clicks, impressions: +r.impressions, position: +r.position });
    }
  }
  const dates = [...daily.keys()].sort();
  console.log(`連続日次 ${dates[0]} .. ${dates[dates.length - 1]} (${dates.length} 日) — 日付次元なのでアンカー行を含まない`);
  const blocks = [];
  for (let i = dates.length; i - 7 >= 0; i -= 7) blocks.unshift(dates.slice(i - 7, i));
  console.log('\n' + '週 (7日)'.padEnd(24) + 'clicks'.padStart(8) + 'imp'.padStart(9) + 'CTR'.padStart(8) + 'pos'.padStart(7));
  for (const blk of blocks) {
    const c = blk.reduce((s, d) => s + daily.get(d).clicks, 0);
    const i = blk.reduce((s, d) => s + daily.get(d).impressions, 0);
    const p = blk.reduce((s, d) => s + daily.get(d).position * daily.get(d).impressions, 0) / i;
    console.log(`${blk[0]}..${blk[blk.length - 1]}`.padEnd(24) + String(c).padStart(8) + String(i).padStart(9) + `${pct(c, i).toFixed(2)}%`.padStart(8) + p.toFixed(2).padStart(7));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args[0] === '--weekly') reportWeekly();
  else if (args.length === 2) reportPair(args[0], args[1]);
  else {
    console.error('usage: analyze-ctr-seesaw.mjs <週A> <週B> | --weekly');
    process.exit(2);
  }
}
