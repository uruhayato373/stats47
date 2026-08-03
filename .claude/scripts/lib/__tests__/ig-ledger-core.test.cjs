const assert = require("node:assert/strict");
const test = require("node:test");

const { decideLedgerAction, parsePostedLog } = require("../ig-ledger-core.cjs");

const base = {
  domain: "ranking",
  contentKey: "vacant-housing-rate",
  permalink: "https://www.instagram.com/stats47jp/reel/ABC/",
  postedAt: "2026-08-03T06:23:09Z",
};

test("台帳に無ければ posted として insert する", () => {
  const r = decideLedgerAction({ ...base, existing: [] });
  assert.equal(r.action, "insert");
  assert.equal(r.record.platform, "instagram");
  assert.equal(r.record.status, "posted");
  assert.equal(r.record.post_url, base.permalink);
  assert.equal(r.record.posted_at, base.postedAt);
});

test("scheduled があれば新規行を足さず posted へ昇格させる", () => {
  const existing = [
    { id: 9, platform: "instagram", domain: "ranking", content_key: "vacant-housing-rate", status: "scheduled" },
  ];
  const r = decideLedgerAction({ ...base, existing });
  assert.equal(r.action, "update", "insert すると予約行が宙に浮く");
  assert.equal(r.id, 9);
  assert.equal(r.patch.status, "posted");
  assert.equal(r.patch.post_url, base.permalink);
});

test("draft も昇格対象にする", () => {
  const existing = [
    { id: 4, platform: "instagram", domain: "ranking", content_key: "vacant-housing-rate", status: "draft" },
  ];
  assert.equal(decideLedgerAction({ ...base, existing }).action, "update");
});

test("既に posted なら何もしない (backfill の再走で二重行を作らない)", () => {
  const existing = [
    {
      id: 9,
      platform: "instagram",
      domain: "ranking",
      content_key: "vacant-housing-rate",
      status: "posted",
      post_url: base.permalink,
    },
  ];
  assert.equal(decideLedgerAction({ ...base, existing }).action, "skip");
});

test("posted だが post_url が欠けていれば URL だけ補完する", () => {
  const existing = [
    { id: 9, platform: "instagram", domain: "ranking", content_key: "vacant-housing-rate", status: "posted", post_url: null },
  ];
  const r = decideLedgerAction({ ...base, existing });
  assert.equal(r.action, "update");
  assert.deepEqual(r.patch, { post_url: base.permalink });
});

test("platform / domain / content_key のどれかが違えば別物として扱う", () => {
  const existing = [
    { id: 1, platform: "x", domain: "ranking", content_key: "vacant-housing-rate", status: "posted" },
    { id: 2, platform: "instagram", domain: "compare", content_key: "vacant-housing-rate", status: "posted" },
    { id: 3, platform: "instagram", domain: "ranking", content_key: "other-key", status: "posted" },
  ];
  assert.equal(decideLedgerAction({ ...base, existing }).action, "insert");
});

test("削除済み行は突合対象にしない", () => {
  const existing = [
    {
      id: 9,
      platform: "instagram",
      domain: "ranking",
      content_key: "vacant-housing-rate",
      status: "posted",
      deleted_at: "2026-07-01",
    },
  ];
  assert.equal(decideLedgerAction({ ...base, existing }).action, "insert");
});

test("キーが欠けていれば台帳を触らない", () => {
  assert.equal(decideLedgerAction({ ...base, contentKey: "", existing: [] }).action, "skip");
  assert.equal(decideLedgerAction({ ...base, domain: undefined, existing: [] }).action, "skip");
});

test("壊れた行があってもログの残りを読める", () => {
  const text = [
    '{"domain":"ranking","content_key":"a","posted_at":"2026-08-01"}',
    "{壊れた行",
    "",
    '{"domain":"ranking","content_key":"b","posted_at":"2026-08-02"}',
    '{"domain":"ranking"}',
  ].join("\n");
  const rows = parsePostedLog(text);
  assert.equal(rows.length, 2, "content_key の無い行と壊れた行だけを落とす");
  assert.deepEqual(rows.map((r) => r.content_key), ["a", "b"]);
});
