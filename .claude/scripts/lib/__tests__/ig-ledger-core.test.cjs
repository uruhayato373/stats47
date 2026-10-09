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

test("カルーセルは post_type=carousel で記録し、単枚画像と成績を分けて測れるようにする", () => {
  const r = decideLedgerAction({ ...base, domain: "ranking-quiz", postType: "carousel", existing: [] });
  assert.equal(r.action, "insert");
  assert.equal(r.record.post_type, "carousel");
});

test("予約行の昇格でも実際に投稿した形式で post_type を上書きする", () => {
  const existing = [
    { id: 3, platform: "instagram", domain: "ranking", content_key: "vacant-housing-rate", status: "scheduled", post_type: "original" },
  ];
  const r = decideLedgerAction({ ...base, postType: "carousel", existing });
  assert.equal(r.action, "update");
  assert.equal(r.patch.post_type, "carousel");
});

test("post_type が無い・空の旧ログ行は従来どおり original で記録し、昇格では既存値を残す", () => {
  assert.equal(decideLedgerAction({ ...base, existing: [] }).record.post_type, "original");
  assert.equal(decideLedgerAction({ ...base, postType: "", existing: [] }).record.post_type, "original");
  const existing = [
    { id: 4, platform: "instagram", domain: "ranking", content_key: "vacant-housing-rate", status: "draft", post_type: "reel" },
  ];
  assert.equal("post_type" in decideLedgerAction({ ...base, postType: "", existing }).patch, false);
});

// ---- Graph API の media 一覧と台帳行の結び付け (投稿 id から外部 ID・指標をたどるため) ----
const { matchIgMediaToLedger } = require("../ig-ledger-core.cjs");

const ig = (id, extra) => ({ id, platform: "instagram", status: "posted", ...extra });

test("permalink の shortcode が一致する media の id を external_id にする (/p/ と /reel/ と ユーザー名入りを同一視)", () => {
  const posts = [
    ig(1, { post_url: "https://www.instagram.com/p/AAA111/" }),
    ig(2, { post_url: "https://www.instagram.com/stats47jp/reel/BBB222/" }),
  ];
  const media = [
    { id: "1801", permalink: "https://www.instagram.com/p/AAA111/" },
    { id: "1802", permalink: "https://www.instagram.com/reel/BBB222/" },
  ];
  const r = matchIgMediaToLedger(posts, media);
  assert.deepEqual(r.patches, [{ id: 1, patch: { external_id: "1801" } }, { id: 2, patch: { external_id: "1802" } }]);
  assert.equal(r.mediaToId.get("1802"), 2);
});

test("post_url の無い posted 行は本文が双方で 1 件だけ一致するときに限り URL も入れる", () => {
  const posts = [ig(5, { caption: "焼酎の支出\n#都道府県" }), ig(6, { caption: "同じ本文" }), ig(7, { caption: "同じ本文" })];
  const media = [
    { id: "1905", permalink: "https://www.instagram.com/p/C5/", caption: "焼酎の支出\r\n#都道府県 " },
    { id: "1906", permalink: "https://www.instagram.com/p/C6/", caption: "同じ本文" },
  ];
  const r = matchIgMediaToLedger(posts, media);
  assert.deepEqual(r.patches, [{ id: 5, patch: { external_id: "1905", post_url: "https://www.instagram.com/p/C5/" } }]);
  assert.deepEqual(r.unmatchedRows, [6, 7], "同じ本文が台帳に 2 行あると取り違えるので推定しない");
});

test("既に別の external_id を持つ行は上書きせず conflicts に出す", () => {
  const posts = [ig(9, { post_url: "https://www.instagram.com/p/ZZZ/", external_id: "1700" })];
  const r = matchIgMediaToLedger(posts, [{ id: "1999", permalink: "https://www.instagram.com/p/ZZZ/" }]);
  assert.deepEqual(r.patches, []);
  assert.deepEqual(r.conflicts, [{ id: 9, external_id: "1700", media_id: "1999" }]);
  assert.equal(r.mediaToId.has("1999"), false);
});

test("同じ external_id を既に持つ行は書き換えないが、指標の結び付けには使う", () => {
  const posts = [ig(3, { post_url: "https://www.instagram.com/p/Q/", external_id: "1500" })];
  const r = matchIgMediaToLedger(posts, [{ id: "1500", permalink: "https://www.instagram.com/p/Q/" }]);
  assert.deepEqual(r.patches, []);
  assert.equal(r.mediaToId.get("1500"), 3);
});
