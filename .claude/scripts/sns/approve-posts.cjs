#!/usr/bin/env node
"use strict";

/**
 * 投稿の承認を台帳 (posts.json の approval) に記録する (2026-10-09 オーナー決定: 新規投稿は承認必須)。
 * 予約・投稿の道具 (publish-x --from-queue / publish-threads / post-instagram / IG cron) は承認済みの行だけを外へ出す。
 * 承認できるのは下書き (status=draft) だけ。投稿済みの旧行は承認の記録が無いまま (unrecorded) 残す。
 *
 * usage:
 *   node .claude/scripts/sns/approve-posts.cjs --list [--platform x]            # 承認待ちの下書きを一覧
 *   node .claude/scripts/sns/approve-posts.cjs --ids 1001,1002 [--note "..."]  # id を承認
 *   node .claude/scripts/sns/approve-posts.cjs --schedule instagram-w45         # IG 予約表の post_id をまとめて承認
 *   node .claude/scripts/sns/approve-posts.cjs --content-key <key> [--platform threads]
 *   ... [--reject] [--by owner] [--dry-run]
 *
 * Claude が実行するのは、オーナーがチャットで承認を指示したときだけ (by は既定で owner)。
 */

const fs = require("node:fs");
const path = require("node:path");
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const store = require(path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-posts-store.cjs"));

const argv = process.argv.slice(2);
const value = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const has = (name) => argv.includes(name);

const platform = value("--platform");
const posts = store.loadAll();
const isPendingDraft = (p) => p.status === "draft" && !p.deleted_at && !store.isApproved(p) && (!platform || p.platform === platform);
const line = (p) =>
  `  id=${p.id} ${p.platform}/${p.post_type} ${p.domain}/${p.content_key ?? "-"} 予定=${p.scheduled_at ?? "-"} 承認=${p.approval?.state ?? "pending"} ` +
  `「${String(p.caption ?? "").replace(/\s+/g, " ").slice(0, 40)}」`;

if (has("--list")) {
  const pending = posts.filter(isPendingDraft);
  console.log(`承認待ちの下書き: ${pending.length} 件`);
  for (const p of pending) console.log(line(p));
  process.exit(0);
}

let ids = [];
if (value("--ids")) ids = value("--ids").split(",").map((s) => Number(s.trim())).filter(Number.isInteger);
if (value("--schedule")) {
  const { datasetDir } = require(path.join(PROJECT_ROOT, "config/datasets.mjs"));
  const name = value("--schedule").replace(/\.json$/, "").replace(/-schedule$/, "");
  const file = path.join(PROJECT_ROOT, datasetDir("sns.instagram-schedules"), `${name}-schedule.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries = Array.isArray(json) ? json : json.entries ?? [];
  const missing = entries.filter((e) => !Number.isInteger(e.post_id));
  if (missing.length) console.log(`⚠ post_id の無いエントリ ${missing.length} 件は承認できません (generate-schedule.cjs で台帳に登録してください)`);
  ids.push(...entries.map((e) => e.post_id).filter(Number.isInteger));
}
if (value("--content-key")) {
  ids.push(...posts.filter((p) => p.content_key === value("--content-key") && isPendingDraft(p)).map((p) => p.id));
}
ids = [...new Set(ids)];
if (!ids.length) {
  console.error("usage: approve-posts.cjs --list | --ids 1,2 | --schedule instagram-wNN | --content-key <key> [--platform x] [--reject] [--note ...] [--dry-run]");
  process.exit(1);
}

const state = has("--reject") ? "rejected" : "approved";
const approval = { state, by: value("--by") || "owner", at: new Date().toISOString(), via: "approve-posts", note: value("--note") };
const byId = new Map(posts.map((p) => [p.id, p]));
const targets = [];
for (const id of ids) {
  const p = byId.get(id);
  if (!p) console.log(`⚠ id=${id} は台帳にありません`);
  else if (p.status !== "draft") console.log(`⚠ id=${id} は ${p.status} なので承認できません (承認は下書きにだけ記録する)`);
  else targets.push(p);
}

console.log(`${has("--dry-run") ? "dry-run: " : ""}${state === "approved" ? "承認" : "却下"} ${targets.length} 件`);
for (const p of targets) console.log(line(p));
if (!has("--dry-run") && targets.length) store.updateMany(targets.map((p) => ({ id: p.id, patch: { approval } })));
