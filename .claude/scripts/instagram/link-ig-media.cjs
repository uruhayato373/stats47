#!/usr/bin/env node
"use strict";

/**
 * Graph API の media 一覧 (fetch-metrics-ci.cjs --media-out が出す JSON) を投稿台帳と結び付ける。
 *   - 台帳の Instagram 行に external_id (media_id)、post_url の無い行には permalink を入れる
 *   - 指標の時系列 (metric-snapshots) で sns_post_id が空の Instagram 行を、media_id から台帳 id へ結び付ける
 * 判定は lib/ig-ledger-core.cjs の matchIgMediaToLedger (テスト付き)。
 *
 * sns-metrics-weekly.yml が main で media 一覧を取得したあと、develop へ切り替えてから develop の台帳に対して
 * 実行する (main の古い台帳を書き換えて develop へ持ち込むと台帳を巻き戻すため)。
 *
 * usage: node .claude/scripts/instagram/link-ig-media.cjs --media /tmp/ig-media.json [--dry-run]
 */

const fs = require("node:fs");
const path = require("node:path");
const store = require(path.join(__dirname, "../lib/sns-posts-store.cjs"));
const metricsStore = require(path.join(__dirname, "../lib/sns-metrics-store.cjs"));
const { matchIgMediaToLedger } = require(path.join(__dirname, "../lib/ig-ledger-core.cjs"));

const args = process.argv.slice(2);
const mediaFile = args[args.indexOf("--media") + 1];
const dryRun = args.includes("--dry-run");
if (!args.includes("--media") || !mediaFile) {
  console.error("usage: link-ig-media.cjs --media <media.json> [--dry-run]");
  process.exit(1);
}

const media = JSON.parse(fs.readFileSync(mediaFile, "utf8"));
const { patches, mediaToId, conflicts, unmatchedRows } = matchIgMediaToLedger(store.loadAll(), media);

console.log(`media ${media.length} 件 / 台帳と結び付いた media ${mediaToId.size} 件 / 台帳の更新 ${patches.length} 行`);
if (conflicts.length) console.log(`⚠ external_id が食い違う行 (上書きしない): ${conflicts.map((c) => c.id).join(", ")}`);
if (unmatchedRows.length) console.log(`⚠ URL も本文の一意一致も無く結び付けられない posted 行: ${unmatchedRows.length} 件`);
if (dryRun) process.exit(0);

if (patches.length) store.updateMany(patches);
const { relinked, skippedDuplicate } = metricsStore.relinkPostIds((row) =>
  row.platform === "instagram" && !row.sns_post_id ? mediaToId.get(row.content_key) ?? null : null,
);
console.log(`指標行の結び付け: ${relinked} 行 (重複のため見送り ${skippedDuplicate} 行)`);
