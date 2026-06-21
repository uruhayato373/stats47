#!/usr/bin/env node
/**
 * sync-rewrite-progress.mjs — ブログ一括リライトの進捗を SSOT(remediation-queue.json) に記録する。
 *
 * 目的: 「リライトが済んだ記事をもう一度リライトしない」を担保する。
 *   blog-mass-rewrite workflow は docs/21_ブログ記事原稿/<slug>/ に成果物を出すだけで
 *   queue の status を更新しない (workflow script は FS 書き込み不可)。本スクリプトが
 *   batch 後に docs/21 を走査し、各記事の状態を queue に upsert する (=毎バッチ後の post-step)。
 *
 * 判定 (docs/21 のファイル状態が真実源):
 *   - article.md なし                          → 触らない (未リライト=pending のまま)
 *   - article.md あり + review.md verdict:PASS  → done       (公開可。remediated_at=today, wave_id)
 *   - article.md あり + review.md verdict:REVISE→ in-progress (要修正。rewrite済=再リライトしない)
 *   - article.md あり + review.md なし           → in-progress (critic 未実施。rewrite済=再リライトしない)
 *
 * status=done/in-progress は build-remediation-queue.mjs の upsert で保持される
 * (rebuild しても消えない)。--next は pending しか返さないので done/in-progress は再処理されない。
 *
 * 使い方:
 *   node .claude/scripts/blog/sync-rewrite-progress.mjs [--wave-id <id>] [--dry-run]
 *
 * 順次リライトの定型ループ (1 セッション 1 バッチ):
 *   1. node .claude/scripts/blog/build-remediation-queue.mjs --next 15   # pending 上位15 (slug)
 *   2. Workflow(blog-mass-rewrite, args=[その15 slug])                    # rewrite→gate→critic
 *   3. node .claude/scripts/blog/sync-rewrite-progress.mjs --wave-id <date>-N  # ← 本スクリプトで進捗記録
 *   4. 次セッションで 1 に戻る (done/in-progress は --next が返さない=再リライトされない)
 */
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const DOCS = path.join(PROJECT_ROOT, "docs/21_ブログ記事原稿");
const QUEUE = path.join(PROJECT_ROOT, ".claude/state/blog/remediation-queue.json");

const args = process.argv.slice(2);
const getArg = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const dryRun = args.includes("--dry-run");
const today = new Date().toISOString().slice(0, 10); // 注: 実行時刻。cron/手動どちらでも今日の日付
const waveId = getArg("--wave-id", `${today}-rewrite`);

function reviewVerdict(slug) {
  const rv = path.join(DOCS, slug, "review.md");
  if (!fs.existsSync(rv)) return null;
  const m = fs.readFileSync(rv, "utf8").match(/verdict[":\s]*\**\s*(PASS|REVISE)/i);
  return m ? m[1].toUpperCase() : "UNKNOWN";
}

// docs/21 の article.md ありを走査
const slugs = fs.existsSync(DOCS)
  ? fs.readdirSync(DOCS).filter((d) => {
      try {
        return (
          fs.statSync(path.join(DOCS, d)).isDirectory() &&
          fs.existsSync(path.join(DOCS, d, "article.md"))
        );
      } catch {
        return false;
      }
    })
  : [];

const queue = JSON.parse(fs.readFileSync(QUEUE, "utf8"));
const items = queue.queue || queue.items || queue;
const bySlug = new Map(items.map((e) => [e.slug, e]));

let done = 0;
let inprog = 0;
let skipped = 0;
for (const slug of slugs) {
  const entry = bySlug.get(slug);
  if (!entry) {
    skipped++;
    continue;
  } // queue に無い slug は対象外
  const verdict = reviewVerdict(slug);
  if (verdict === "PASS") {
    entry.status = "done";
    entry.remediated_at = today;
    entry.wave_id = waveId;
    done++;
  } else {
    // rewrite 済だが critic 未PASS (REVISE / 未実施) → in-progress = 再リライトしない
    if (entry.status !== "done") {
      entry.status = "in-progress";
      entry.in_progress_at = today;
      inprog++;
    }
  }
}

console.error(
  `[sync] docs/21 article.md=${slugs.length} → done(PASS)=${done} / in-progress(rewrite済)=${inprog} / queue外=${skipped}`,
);

if (dryRun) {
  console.error("[dry-run] 書き込みしない");
} else {
  fs.writeFileSync(QUEUE, JSON.stringify(queue, null, 2));
  const by = {};
  for (const e of items) by[e.status || "?"] = (by[e.status || "?"] || 0) + 1;
  console.error(`[ok] queue 更新: ${JSON.stringify(by)}`);
}
