#!/usr/bin/env node
/**
 * 配信 snapshot (R2) が更新され続けているかを見る。
 *
 * ★job の成否と別に要る理由 (2026-08-13)
 * 楽天カタログ同期は 9 日間「赤」で失敗し続けたが、**緑でも同じ被害は起きうる**。
 * 「例外は出ないが 0 件書いた」「push ステップに到達しなかった」は成否から見えず、
 * generatedAt を見て初めて分かる。ジョブの健全性 (audit-workflow-health.mjs) と
 * データの健全性は別の問いなので、別に測る。
 *
 * 使い方: node .claude/scripts/ci/audit-r2-freshness.mjs
 * 読み取りは公開 URL (認証不要・GET のみ)。終了コードは問題があれば 1。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { evaluateFreshness, formatFreshnessReport } from "../lib/r2-freshness-core.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const STATE_DIR = path.join(ROOT, ".claude/state/ci");
const BASE = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";

/**
 * 監視対象。**書き手が既知の cron で、更新頻度が分かっているものだけ**を入れる。
 * 予算は「想定間隔 × 3」を目安にする (1 回の失敗では鳴らさず、続いたら鳴る)。
 * 頻度が読めない key を入れると誤検知が出て、誤検知の出るゲートは無効化される。
 */
export const WATCHED = [
  {
    key: "app/rakuten/items/うどん.json",
    maxAgeDays: 3,
    why: "sync-rakuten-catalog.yml (日次)。古いと商品名・価格が古いまま配信される",
  },
  {
    key: "app/rakuten/furusato/01000.json",
    maxAgeDays: 3,
    why: "sync-rakuten-catalog.yml (日次)。ふるさと納税カードの返礼品が古くなる",
  },
  {
    key: "app/blog/all.json",
    maxAgeDays: 14,
    why: "blog-auto-publish.yml (公開のたび)。止まると新規記事が一覧に出ない",
  },
];

async function readGeneratedAt(key) {
  const url = `${BASE}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  // 全文を JSON.parse すると大きい snapshot で無駄なので先頭だけ見る
  const match = text.slice(0, 4096).match(/"generatedAt"\s*:\s*"([^"]+)"/);
  return match ? match[1] : null;
}

async function main() {
  const entries = [];
  for (const target of WATCHED) {
    try {
      entries.push({ ...target, generatedAt: await readGeneratedAt(target.key), error: null });
    } catch (error) {
      entries.push({ ...target, generatedAt: null, error: error.message });
    }
  }

  const summary = evaluateFreshness(entries, Date.now());
  const report = formatFreshnessReport(summary);
  console.log(report);

  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STATE_DIR, "r2-freshness.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), results: summary.results }, null, 2)}\n`,
  );

  process.exit(summary.problems.length > 0 ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
