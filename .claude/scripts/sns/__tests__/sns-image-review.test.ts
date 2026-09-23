import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSnsReport,
  itemsFromIgSchedule,
  itemsFromPosts,
  mechanicalFindings,
  type ReviewItem,
  validateAgentReview,
} from "../lib/sns-image-review";

const from = new Date("2026-09-24T00:00:00+09:00");
const to = new Date("2026-10-02T00:00:00+09:00");

test("X と Threads の予約・下書きだけを期間内で拾い、Instagram と投稿済みは台帳側から拾わない", () => {
  const posts = [
    { id: 1, platform: "x", status: "scheduled", scheduled_at: "2026-09-25T08:00:00+09:00", caption: "a", media_path: ".local/r2/sns/a.png" },
    { id: 2, platform: "threads", status: "draft", scheduled_at: "2026-09-30T10:00:00+09:00", caption: "b", media_path: null },
    { id: 3, platform: "x", status: "posted", scheduled_at: "2026-09-25T08:00:00+09:00" },
    { id: 4, platform: "instagram", status: "scheduled", scheduled_at: "2026-09-25T08:00:00+09:00" },
    { id: 5, platform: "x", status: "scheduled", scheduled_at: "2026-10-05T08:00:00+09:00" },
  ];
  const items = itemsFromPosts(posts, from, to);
  assert.deepEqual(items.map((i) => i.id), ["post-1", "post-2"]);
  assert.deepEqual(items[1].imageSources, []);
});

test("Instagram はカルーセルの各スライドを R2 のキーで並べ、リールは対象外として残す", () => {
  const items = itemsFromIgSchedule(
    [
      { date: "2026-09-28", time: "19:00", type: "carousel", domain: "ranking-quiz", content_key: "k", slides: ["s1.png", "s2.png"] },
      { date: "2026-09-30", time: "12:00", type: "reels", domain: "ranking-quiz-reel", content_key: "r" },
      { date: "2026-10-10", time: "19:00", type: "carousel", domain: "d", content_key: "late", slides: ["x.png"] },
    ],
    from,
    to
  );
  assert.deepEqual(items.map((i) => i.id), ["ig-2026-09-28-k", "ig-2026-09-30-r"]);
  assert.deepEqual(items[0].imageSources, ["sns/ranking-quiz/k/instagram/stills/s1.png", "sns/ranking-quiz/k/instagram/stills/s2.png"]);
  assert.match(items[1].skipped ?? "", /リール/);
});

const item = (over: Partial<ReviewItem>): ReviewItem => ({
  id: "i",
  platform: "x",
  scheduledAt: "2026-09-25T08:00:00+09:00",
  domain: "ranking",
  contentKey: "k",
  caption: "短い本文",
  imageSources: ["a.png"],
  ...over,
});
const weight = (text: string) => [...text].length * 2;

test("機械検査は画像の欠落・Instagram の寸法・媒体ごとの本文の長さを見る", () => {
  assert.deepEqual(mechanicalFindings(item({}), [{ source: "a.png", ok: true, width: 960, height: 404 }], weight, 280), []);
  assert.match(mechanicalFindings(item({}), [{ source: "a.png", ok: false }], weight, 280)[0].issue, /画像が見つからない/);
  assert.match(mechanicalFindings(item({ imageSources: [] }), [], weight, 280)[0].issue, /画像が登録されていない/);
  assert.match(mechanicalFindings(item({ caption: "あ".repeat(141) }), [{ source: "a.png", ok: true }], weight, 280)[0].issue, /重み付き 282/);
  const ig = item({ platform: "instagram" });
  assert.match(mechanicalFindings(ig, [{ source: "a.png", ok: true, width: 1080, height: 1080 }], weight, 280)[0].issue, /1080x1080/);
  assert.deepEqual(mechanicalFindings(ig, [{ source: "a.png", ok: true, width: 1080, height: 1350 }], weight, 280), []);
  assert.match(mechanicalFindings(item({ platform: "threads", caption: "あ".repeat(501) }), [{ source: "a.png", ok: true }], weight, 280)[0].issue, /501 字/);
  assert.deepEqual(mechanicalFindings(item({ skipped: "リール" }), [], weight, 280), [], "対象外は検査しない");
});

test("agent の指摘は見せた投稿だけを採用し、無い id と形の崩れた指摘は捨てる", () => {
  const { findings, rejected } = validateAgentReview(
    {
      status: "reviewed",
      summary: "確認した",
      findings: [
        { itemId: "post-1", severity: "high", issue: "本文の県名が画像と違う", suggestion: "直す" },
        { itemId: "post-9", severity: "high", issue: "見せていない投稿の指摘", suggestion: "x" },
        { itemId: "post-1", severity: "critical", issue: "重大度が語彙外", suggestion: "x" },
      ],
    },
    new Set(["post-1"])
  );
  assert.equal(findings.length, 1);
  assert.equal(rejected.length, 2);
  assert.throws(() => validateAgentReview({ status: "ok" }, new Set()), /no valid status/);
});

test("報告は指摘が無く agent も動いていれば null、あれば媒体・予約時刻つきで並べる", () => {
  const items = [item({ id: "post-1", contentKey: "wooden-housing-ratio" })];
  const base = { date: "2026-09-27", from: "2026-09-27", to: "2026-10-05", items, mechanical: [] };
  assert.equal(buildSnsReport({ ...base, agent: { findings: [], summary: "なし" }, agentError: null }), null);
  const body = buildSnsReport({
    ...base,
    agent: { findings: [{ itemId: "post-1", severity: "high", issue: "本文の県名が画像と違う", suggestion: "直す" }], summary: "" },
    agentError: null,
  });
  assert.match(body ?? "", /🔴 高 x 2026-09-25 08:00 `wooden-housing-ratio`: 本文の県名が画像と違う/);
  assert.match(buildSnsReport({ ...base, agent: null, agentError: "claude exited 1" }) ?? "", /実行できなかった/);
});
