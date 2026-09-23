"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { fingerprint, matchPosted } = require("../threads-posted-core.cjs");

const NOW = new Date("2026-09-25T00:00:00Z");
const row = (id, caption, scheduledAt, status = "draft") => ({
  id,
  platform: "threads",
  status,
  caption,
  scheduled_at: scheduledAt,
});

test("fingerprint は最初の空でない行を空白抜きで返し、短すぎる行は使わない", () => {
  assert.equal(fingerprint("\n梨にいちばんお金を使う県は 鳥取。\n\n続き"), "梨にいちばんお金を使う県は鳥取。");
  assert.equal(fingerprint("短い\n本文"), null);
});

test("本文の 1 行目が一致した予約済み・下書きだけを posted にし、permalink と公開時刻を使う", () => {
  const rows = [
    row(1, "梨にいちばんお金を使う県は鳥取。\n\n1世帯あたり8,846円", "2026-09-24T01:30:00Z", "scheduled"),
    row(2, "北海道を1位・47位だけで語らない。\n県木はエゾマツ", "2026-09-24T08:10:00Z", "draft"),
  ];
  const scraped = [
    { permalink: "https://www.threads.com/@stats47jp/post/AAA", text: "stats47jp\n7時間\n北海道を1位・47位だけで語らない。\n県木はエゾマツ…", publishedAt: "2026-09-24T08:10:05Z" },
    { permalink: "https://www.threads.com/@stats47jp/post/BBB", text: "梨にいちばんお金を使う県は鳥取。 1世帯あたり", publishedAt: null },
  ];
  const { updates, overdue } = matchPosted(rows, scraped, NOW);
  assert.deepEqual(updates, [
    { id: 1, post_url: "https://www.threads.com/@stats47jp/post/BBB", posted_at: "2026-09-24T01:30:00Z" },
    { id: 2, post_url: "https://www.threads.com/@stats47jp/post/AAA", posted_at: "2026-09-24T08:10:05Z" },
  ]);
  assert.deepEqual(overdue, []);
});

test("時刻を過ぎただけでは posted にせず、24 時間以上見つからない行は overdue に出す", () => {
  const rows = [
    row(3, "さんまといえば北海道…ですが、1位は秋田。", "2026-09-23T10:00:00Z", "scheduled"),
    row(4, "ぶどうを最も多く買う上位3県は山梨・長野・山形。", "2026-09-24T12:00:00Z", "scheduled"),
    row(5, "未来の予約はまだ対象外にする本文です。", "2026-09-26T00:00:00Z", "scheduled"),
  ];
  const { updates, overdue } = matchPosted(rows, [], NOW);
  assert.deepEqual(updates, []);
  assert.deepEqual(overdue, [3]);
});

test("同じ公開投稿を 2 行に割り当てない / posted・deleted・他 platform は対象外", () => {
  const cap = "テレワーク、東京と秋田でこんなに違う。";
  const rows = [
    row(6, cap, "2026-09-24T11:10:00Z", "scheduled"),
    row(7, cap, "2026-09-24T11:20:00Z", "scheduled"),
    { ...row(8, cap, "2026-09-24T11:30:00Z", "posted") },
    { ...row(9, cap, "2026-09-24T11:40:00Z", "scheduled"), platform: "x" },
    { ...row(10, cap, "2026-09-24T11:50:00Z", "scheduled"), deleted_at: "2026-09-24T00:00:00Z" },
  ];
  const scraped = [{ permalink: "https://www.threads.com/@stats47jp/post/CCC", text: cap }];
  const { updates } = matchPosted(rows, scraped, NOW);
  assert.deepEqual(updates.map((u) => u.id), [6]);
});
