#!/usr/bin/env node
"use strict";

/**
 * X の予約から Threads の下書きを作る (1 日 2 件)。
 *
 * 各日 (JST) の X 予約のうち、朝枠 (11 時前) の 1 件を Threads の午前枠へ、
 * 昼枠 (11〜16 時) の 1 件を Threads の夕方枠へ転用する。X と同じ題材を
 * 2 時間以上ずらして出す (sns-content-standards §0 / §1)。
 *
 * 本文の変換:
 *   - stats47.jp リンクの utm_source=x を threads に置き換える (§4)
 *   - ハッシュタグ行を落とす (Threads は 1 投稿 1 トピックで、X 用の複数タグは使わない)
 *   - 500 文字を超えたら止める
 *
 * 冪等: 同じ domain + content_key の threads 行が既にあれば作らない。
 *
 * usage:
 *   node .claude/skills/sns/publish-threads/plan-from-x.cjs --from 2026-09-24 --to 2026-10-31 [--dry-run]
 */

const path = require("node:path");
const store = require(path.join(__dirname, "../../../scripts/lib/sns-posts-store.cjs"));

const MAX_CHARS = 500;
// 同じ時刻に固定しないよう日ごとにずらす
const MORNING = ["10:30", "10:45", "11:00", "10:40", "10:50"];
const EVENING = ["17:10", "17:30", "17:45", "17:20", "17:40"];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const jst = (iso) => new Date(new Date(iso).getTime() + 9 * 3600e3);
const jstDay = (iso) => jst(iso).toISOString().slice(0, 10);
const jstHour = (iso) => jst(iso).getUTCHours();

function toThreadsText(caption) {
  const lines = String(caption)
    .split("\n")
    .filter((l) => !/^\s*#\S/.test(l)); // ハッシュタグだけの行を落とす
  const text = lines
    .join("\n")
    .replace(/(https:\/\/stats47\.jp\/\S*?[?&]utm_source=)x(?=&|\s|$)/g, "$1threads")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}

function main() {
  const from = arg("--from");
  const to = arg("--to");
  const dryRun = process.argv.includes("--dry-run");
  if (!from || !to) {
    console.error("usage: --from YYYY-MM-DD --to YYYY-MM-DD [--dry-run]");
    process.exit(1);
  }
  const all = store.loadAll();
  const xRows = all.filter(
    (p) => p.platform === "x" && !p.deleted_at && (p.status === "scheduled" || p.status === "draft") && p.scheduled_at,
  );
  const existing = new Set(
    all.filter((p) => p.platform === "threads" && !p.deleted_at).map((p) => `${p.domain}|${p.content_key}`),
  );

  const days = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86400e3) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }

  let made = 0;
  let skipped = 0;
  const errors = [];
  days.forEach((day, i) => {
    const today = xRows.filter((p) => jstDay(p.scheduled_at) === day);
    const picks = [
      [today.find((p) => jstHour(p.scheduled_at) < 11), MORNING[i % MORNING.length]],
      [today.find((p) => jstHour(p.scheduled_at) >= 11 && jstHour(p.scheduled_at) < 16), EVENING[i % EVENING.length]],
    ];
    for (const [src, time] of picks) {
      if (!src) continue;
      const key = `${src.domain}|${src.content_key}`;
      if (existing.has(key)) {
        skipped++;
        continue;
      }
      const text = toThreadsText(src.caption || "");
      if ([...text].length > MAX_CHARS) {
        errors.push(`${src.content_key}: ${[...text].length} 文字 (> ${MAX_CHARS})`);
        continue;
      }
      if (!/utm_source=threads/.test(text)) {
        errors.push(`${src.content_key}: utm_source=threads のリンクが無い`);
        continue;
      }
      const scheduledAt = new Date(`${day}T${time}:00+09:00`).toISOString();
      const record = {
        platform: "threads",
        post_type: "original",
        domain: src.domain,
        content_key: src.content_key,
        caption: text,
        media_path: src.media_path || null,
        utm_url: (text.match(/https:\/\/stats47\.jp\/\S+/) || [null])[0],
        template: src.template || null,
        metric_keys: src.metric_keys || null,
        scheduled_at: scheduledAt,
        status: "draft",
      };
      existing.add(key);
      made++;
      if (dryRun) {
        console.log(`(dry-run) ${day} ${time} ${src.domain}/${src.content_key} (${[...text].length}字)`);
      } else {
        store.insert(record);
      }
    }
  });
  console.log(`[plan-from-x]${dryRun ? " (dry-run)" : ""} 作成 ${made} 件 / 既存スキップ ${skipped} 件 / エラー ${errors.length} 件`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  if (errors.length) process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { toThreadsText };
