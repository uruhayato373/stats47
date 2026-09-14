#!/usr/bin/env node
/**
 * note 家計シリーズ (a-kakei-<pref>) の記事間 "次に読む" 誘導 (nextBestArticle) を
 * chart-data.json の突出費目 (dominant category) から決定的に選ぶ。
 *
 * ★なぜ要るか (2026-09-15):
 *   update-published-navigation.mjs の chooseRelatedArticle は nextBestArticle が
 *   あればそれを最優先で使うが、家計シリーズには誰も埋めていなかった (magazine が同じ
 *   47件から targetFamily 一致で選ぶ既定ロジックしか働かず、費目の近さは見ていない)。
 *
 * 選定ルール:
 *   1. 自分と同じ突出費目 (dominant catName) を持つ他県のうち |ratio-1| が最大のものを選ぶ
 *      (tie は key 昇順)
 *   2. 同じ費目が無ければ、同じ方向 (above/below 全国平均) の他県のうち自分の ratio に
 *      最も近いものを選ぶ (tie は key 昇順)
 *   3. それも無ければ key 昇順で自分以外の先頭
 *   自分自身は絶対に選ばない。
 *
 * chart-data.json は docs/31_note記事原稿/<slug>/ にあればそれを読み、無ければ
 * (公開後に outbox が掃除された記事) catalog の r2Path から R2 公開 URL で取得する。
 *
 * 使い方:
 *   node .claude/scripts/note/build-kakei-related-picks.mjs --dry-run
 *   node .claude/scripts/note/build-kakei-related-picks.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DOCS = path.join(ROOT, "docs/31_note記事原稿");
const CATALOG_PATH = path.join(ROOT, ".claude/scripts/note/catalog/data/stats47-note.ts");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

const BLOCK_RE = /\{\n(?:[^{}]*\n)*?\s*key: "(a-kakei-[a-z]+)",[\s\S]*?\n  \},/g;

export function pickDominant(categoryBreakdown) {
  return categoryBreakdown.reduce((best, cur) => {
    const diff = Math.abs(cur.ratio - 1);
    const bestDiff = Math.abs(best.ratio - 1);
    return diff > bestDiff ? cur : best;
  }, categoryBreakdown[0]);
}

function extractField(block, field) {
  const m = block.match(new RegExp(`${field}: "(.+?)"`));
  return m ? m[1] : null;
}

/** catalog から published な a-kakei-* エントリを block ごと抽出する。 */
export function parseCatalogEntries(src) {
  const entries = [];
  let m;
  const re = new RegExp(BLOCK_RE);
  while ((m = re.exec(src))) {
    const block = m[0];
    if (!/status: "published"/.test(block)) continue;
    entries.push({
      key: m[1],
      block,
      r2Path: extractField(block, "r2Path"),
      existingNextBest: extractField(block, "nextBestArticle"),
    });
  }
  return entries;
}

async function loadChartData(entry) {
  const localPath = path.join(DOCS, entry.key, "chart-data.json");
  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, "utf8"));
  }
  if (!entry.r2Path) return null;
  const res = await fetch(`${R2}/${entry.r2Path}/chart-data.json`);
  if (!res.ok) return null;
  return res.json();
}

export function choosePick(self, records) {
  const others = records.filter((r) => r.key !== self.key);
  const sameCat = others.filter((r) => r.catName === self.catName);
  if (sameCat.length > 0) {
    return sameCat.reduce((best, cur) => {
      const diff = Math.abs(cur.ratio - 1);
      const bestDiff = Math.abs(best.ratio - 1);
      if (diff !== bestDiff) return diff > bestDiff ? cur : best;
      return cur.key < best.key ? cur : best;
    }).key;
  }
  const sameDirection = others.filter((r) => r.side === self.side);
  if (sameDirection.length > 0) {
    return sameDirection.reduce((best, cur) => {
      const diff = Math.abs(cur.ratio - self.ratio);
      const bestDiff = Math.abs(best.ratio - self.ratio);
      if (diff !== bestDiff) return diff < bestDiff ? cur : best;
      return cur.key < best.key ? cur : best;
    }).key;
  }
  if (others.length === 0) return null;
  return others.slice().sort((a, b) => (a.key < b.key ? -1 : 1))[0].key;
}

export function patchCatalog(src, picks) {
  return src.replace(new RegExp(BLOCK_RE), (block, key) => {
    if (!/status: "published"/.test(block) || !picks.has(key)) return block;
    const pick = picks.get(key);
    if (/nextBestArticle: "/.test(block)) {
      return block.replace(/nextBestArticle: "(.+?)",/, `nextBestArticle: "${pick}",`);
    }
    // stats47Targets が最後尾フィールドの想定。無い block にも対応するため、
    // 閉じ括弧 "\n  }," の直前に挿入する。
    return block.replace(/\n(\s*)\},$/, `\n    nextBestArticle: "${pick}",\n$1},`);
  });
}

async function main() {
  const write = process.argv.includes("--write");
  const src = fs.readFileSync(CATALOG_PATH, "utf8");
  const entries = parseCatalogEntries(src);

  const records = [];
  for (const entry of entries) {
    const chartData = await loadChartData(entry);
    if (!chartData) {
      console.error(`[skip] ${entry.key}: chart-data.json を解決できない (local/R2 いずれも無し)`);
      continue;
    }
    const dominant = pickDominant(chartData.categoryBreakdown);
    records.push({
      key: entry.key,
      catName: dominant.catName,
      ratio: dominant.ratio,
      side: dominant.ratio >= 1 ? "above" : "below",
    });
  }

  const picks = new Map();
  for (const record of records) {
    const pick = choosePick(record, records);
    if (pick) picks.set(record.key, pick);
  }

  for (const record of records) {
    const pick = picks.get(record.key) || "(none)";
    console.log(
      `${record.key}: ${record.catName}(${record.ratio.toFixed(3)}, ${record.side}) -> ${pick}`,
    );
  }
  console.log(`[done] ${picks.size}/${records.length} picks resolved`);

  if (write) {
    const next = patchCatalog(src, picks);
    if (next === src) {
      console.log("[ok] no changes (already up to date)");
    } else {
      fs.writeFileSync(CATALOG_PATH, next);
      console.log("[ok] catalog updated");
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
