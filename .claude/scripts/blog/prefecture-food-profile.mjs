#!/usr/bin/env node
/**
 * prefecture-food-profile.mjs
 * 県民の食卓記事の品目選定を自動化する。
 * 指定した都道府県が「全家計調査品目（消費支出額）」で何位かを一括算出し、
 * 上位（1-5位＝カードに載る）と下位（43-47位）を出力する。
 *
 * データ源: R2 app/ranking/<key>/values.json（e-Stat 由来の既取込ランキング）。
 * これを使えば「その県が何で全国1位か」を手作業スキャンせず一発で分かる。
 *
 * Usage:
 *   node .claude/scripts/blog/prefecture-food-profile.mjs --pref 鳥取 [--keys-file /tmp/kakei-expenditure-keys.txt] [--top 12] [--bottom 8] [--concurrency 24]
 *
 * オプション:
 *   --pref        都道府県名の一部（「鳥取」「東京」等。areaName 部分一致）※必須
 *   --keys-file   品目keyの一覧ファイル（1行1key、既定 /tmp/kakei-expenditure-keys.txt）
 *   --year        対象年（既定 2024。無ければ最新partition）
 *   --top         上位を何位まで出すか（既定 12）
 *   --bottom      下位を何位から出すか（47-N+1、既定 8 = 40-47位）
 *   --concurrency 並列fetch数（既定 24）
 */

import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const getArg = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const pref = getArg("pref");
if (!pref) {
  console.error("ERROR: --pref <都道府県名> は必須です");
  process.exit(1);
}
const keysFile = getArg("keys-file", "/tmp/kakei-expenditure-keys.txt");
const year = getArg("year", "2024");
const topN = Number(getArg("top", "12"));
const bottomN = Number(getArg("bottom", "8"));
const concurrency = Number(getArg("concurrency", "24"));
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

const keys = readFileSync(keysFile, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);

async function fetchRank(key) {
  try {
    const r = await fetch(`${R2}/app/ranking/${key}/values.json`);
    if (!r.ok) return null;
    const j = await r.json();
    const parts = j.partitions || [];
    const p = parts.find((x) => x.yearCode === year) || parts[parts.length - 1];
    if (!p || !Array.isArray(p.values)) return null;
    const total = p.values.length; // 通常47
    const me = p.values.find((v) => (v.areaName || "").includes(pref));
    if (!me) return null;
    const top1 = p.values.find((v) => v.rank === 1);
    return {
      key,
      label: (me.label || key.replace(/-consumption-expenditure$/, "")),
      rank: me.rank,
      value: me.value,
      total,
      top1: top1 ? `${top1.areaName}${top1.value}` : "?",
      yearUsed: p.yearCode,
    };
  } catch {
    return null;
  }
}

// 並列プール
async function runPool(items, worker, limit) {
  const results = [];
  let idx = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const cur = items[idx++];
      results.push(await worker(cur));
    }
  });
  await Promise.all(runners);
  return results;
}

const rows = (await runPool(keys, fetchRank, concurrency)).filter(Boolean);
rows.sort((a, b) => a.rank - b.rank);

const fmt = (r) => `${String(r.rank).padStart(2)}位 ${r.label}（${r.value}円, key=${r.key}, 1位:${r.top1}）`;

console.log(`\n=== ${pref}：全家計調査品目（支出額 ${rows.length}品目 / ${year}年）での順位プロフィール ===\n`);
console.log(`■ 上位（1-${topN}位・カード上位に載る＝記事の主役候補）`);
for (const r of rows.filter((r) => r.rank <= topN)) console.log("  " + fmt(r));

console.log(`\n■ 下位（${47 - bottomN + 1}-47位・カード下位に載る＝対照・逆説候補）`);
for (const r of rows.filter((r) => r.rank >= 47 - bottomN + 1)) console.log("  " + fmt(r));

console.log(`\n（総品目 ${rows.length} / 全国1位の品目数: ${rows.filter((r) => r.rank === 1).length}）`);
