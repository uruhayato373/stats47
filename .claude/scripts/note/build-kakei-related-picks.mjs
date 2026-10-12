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
import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";
import { readArticleLedger, writeArticleLedger } from "./lib/article-ledger.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DOCS = path.join(ROOT, "docs/31_note記事原稿");
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;

const KAKEI_KEY = /^a-kakei-[a-z]+$/;

export function pickDominant(categoryBreakdown) {
  return categoryBreakdown.reduce((best, cur) => {
    const diff = Math.abs(cur.ratio - 1);
    const bestDiff = Math.abs(best.ratio - 1);
    return diff > bestDiff ? cur : best;
  }, categoryBreakdown[0]);
}

/** 記事台帳から published な a-kakei-* を抽出する。 */
export function parseCatalogEntries(articles) {
  return articles
    .filter((a) => KAKEI_KEY.test(a.key) && a.status === "published")
    .map((a) => ({ key: a.key, r2Path: a.r2Path ?? null, existingNextBest: a.nextBestArticle ?? null }));
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
  // 同じ費目・同じ向き (above/below) で倍率が最も近い県 = 読者にとって「似た家計の県」。
  // 最も極端な県へ集中させない (旧実装は 教育 11 本 → 埼玉 のようにハブ化した)。
  const nearest = (cands) =>
    cands.reduce((best, cur) => {
      const diff = Math.abs(cur.ratio - self.ratio);
      const bestDiff = Math.abs(best.ratio - self.ratio);
      if (diff !== bestDiff) return diff < bestDiff ? cur : best;
      return cur.key < best.key ? cur : best;
    }).key;
  const sameCat = others.filter((r) => r.catName === self.catName);
  const sameCatSide = sameCat.filter((r) => r.side === self.side);
  if (sameCatSide.length > 0) return nearest(sameCatSide);
  if (sameCat.length > 0) return nearest(sameCat);
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

/** picks を published な a-kakei-* の nextBestArticle に反映した新しい配列と、変わった件数を返す。 */
export function patchCatalog(articles, picks) {
  let changed = 0;
  const next = articles.map((a) => {
    if (!KAKEI_KEY.test(a.key) || a.status !== "published" || !picks.has(a.key)) return a;
    if (a.nextBestArticle === picks.get(a.key)) return a;
    changed++;
    return { ...a, nextBestArticle: picks.get(a.key) };
  });
  return { articles: next, changed };
}

async function main() {
  const write = process.argv.includes("--write");
  const ledger = readArticleLedger();
  const entries = parseCatalogEntries(ledger.articles);

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
    const { articles, changed } = patchCatalog(ledger.articles, picks);
    if (changed === 0) {
      console.log("[ok] no changes (already up to date)");
    } else {
      writeArticleLedger({ ...ledger, articles });
      console.log(`[ok] ledger updated (${changed} articles)`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
