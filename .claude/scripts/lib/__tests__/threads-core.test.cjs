const assert = require("node:assert/strict");
const test = require("node:test");

const core = require("../threads-core.cjs");
const { assertRecordIntegrity } = require("../sns-posts-store.cjs");

const UTM =
  "https://stats47.jp/ranking/vacant-housing-rate?utm_source=threads&utm_medium=social&utm_campaign=vacant-housing-rate&utm_content=shock";
const PERMALINK = "https://www.threads.com/@stats47jp/post/DAbCdEf123";

const entry = (over = {}) => ({
  date: "2026-09-25",
  time: "12:00",
  type: "text",
  domain: "ranking",
  content_key: "vacant-housing-rate",
  text: `空き家率 1 位は和歌山県。 ${UTM}`,
  ...over,
});
/** JST の "YYYY-MM-DD HH:MM" を UTC ミリ秒へ */
const jst = (s) => Date.parse(`${s.replace(" ", "T")}:00+09:00`);

// ---- 文字数 (公式: 500 文字・絵文字は UTF-8 バイト数) ----

test("絵文字は UTF-8 のバイト数、それ以外は 1 文字として数える", () => {
  assert.equal(core.countThreadsText("abc"), 3);
  assert.equal(core.countThreadsText("和歌山県"), 4);
  assert.equal(core.countThreadsText("😀"), 4);
  assert.equal(core.countThreadsText("👨‍👩‍👧"), 18, "ZWJ 連結は 1 まとまりのバイト数");
  assert.equal(core.countThreadsText("🇯🇵"), 8);
  assert.equal(core.countThreadsText("1️⃣"), 7, "keycap は数字を含めて絵文字扱い");
});

test("本文 500 文字ちょうどは通し、501 文字は投稿前に止める", () => {
  const url = ` ${UTM}`;
  const pad = (n) => "あ".repeat(n - url.length);
  assert.deepEqual(core.validateEntry(entry({ text: pad(500) + url })).errors, []);
  const over = core.validateEntry(entry({ text: pad(501) + url }));
  assert.equal(over.textLength, 501);
  assert.match(over.errors.join("\n"), /上限 500 を超える/);
});

test("文字数だけなら収まる本文も、絵文字のバイト数で 500 を超えれば止める", () => {
  const url = ` ${UTM}`;
  const text = "あ".repeat(497 - url.length) + url + "😀"; // 497 + 4 = 501
  assert.equal(Array.from(text).length, 498, "コードポイント数では上限内");
  assert.match(core.validateEntry(entry({ text })).errors.join("\n"), /501 文字で上限 500/);
});

test("本文は空にできない (画像投稿でも本文で重複照合するため)", () => {
  assert.match(core.validateEntry(entry({ text: "  " })).errors.join("\n"), /text が空/);
  assert.match(
    core.validateEntry(entry({ type: "image", text: "", image_url: "https://storage.stats47.jp/a.png" })).errors.join("\n"),
    /text が空/,
  );
});

// ---- リンクと UTM ----

test("リンクは 5 個まで", () => {
  const links = (n) => Array.from({ length: n }, (_, i) => `https://example.com/${i}`).join(" ");
  assert.deepEqual(core.validateEntry(entry({ text: `本文 ${links(5)}` })).errors, []);
  assert.match(core.validateEntry(entry({ text: `本文 ${links(6)}` })).errors.join("\n"), /リンクが 6 個/);
});

test("stats47.jp へのリンクは utm_source=threads の UTM を必須にする", () => {
  assert.equal(core.findUtmViolations(`見る → ${UTM}`).length, 0);
  assert.equal(core.findUtmViolations("https://stats47.jp/ranking/vacant-housing-rate").length, 1);
  assert.equal(core.findUtmViolations(UTM.replace("utm_source=threads", "utm_source=x")).length, 1);
  assert.deepEqual(core.findUtmViolations("https://www.e-stat.go.jp/"), [], "外部リンクは対象外");
});

test("URL の直後に続く日本語や句読点を URL に含めない", () => {
  assert.deepEqual(core.extractUrls(`詳細は${UTM}で確認。`), [UTM]);
  assert.deepEqual(core.extractUrls("(https://example.com/a)."), ["https://example.com/a"]);
});

// ---- 画像 ----

test("画像は R2 公開 URL の png / jpg だけを許す", () => {
  const img = (image_url) => core.validateEntry(entry({ type: "image", image_url })).errors;
  assert.deepEqual(img("https://storage.stats47.jp/sns/ranking/x/threads/card.png"), []);
  assert.deepEqual(img("https://storage.stats47.jp/sns/ranking/x/threads/card.JPG"), []);
  assert.match(img("https://example.com/card.png").join("\n"), /storage\.stats47\.jp/);
  assert.match(img("https://storage.stats47.jp/sns/card.gif").join("\n"), /png/);
  assert.match(img(undefined).join("\n"), /storage\.stats47\.jp/);
});

test("type=text に画像 URL が残っていれば止める (種別の書き間違い)", () => {
  const errors = core.validateEntry(entry({ image_url: "https://storage.stats47.jp/a.png" })).errors;
  assert.match(errors.join("\n"), /type=text に image_url/);
  assert.match(core.validateEntry(entry({ type: "video" })).errors.join("\n"), /text \/ image のみ/);
});

test("存在しない日付・時刻は予定として受け付けない", () => {
  assert.ok(Number.isNaN(core.scheduledAtMs(entry({ date: "2026-02-30" }))));
  assert.ok(Number.isNaN(core.scheduledAtMs(entry({ time: "24:00" }))));
  assert.ok(Number.isNaN(core.scheduledAtMs(entry({ time: "9:00" }))));
  assert.equal(core.scheduledAtMs(entry()), Date.parse("2026-09-25T03:00:00Z"), "JST 12:00 = UTC 03:00");
});

// ---- due 判定 ----

test("予定時刻を過ぎ 6 時間以内の未投稿だけを due にし、最早の 1 件を選ぶ", () => {
  const entries = [
    entry({ content_key: "later", time: "11:30" }),
    entry({ content_key: "earlier", time: "10:00" }),
    entry({ content_key: "future", time: "12:30" }),
    entry({ content_key: "stale", time: "05:59" }),
  ];
  const plan = core.planRun(entries, { nowMs: jst("2026-09-25 12:00"), ledger: [] });
  const state = Object.fromEntries(plan.rows.map((r) => [r.entry.content_key, r.state]));
  assert.deepEqual(state, { later: "due", earlier: "due", future: "upcoming", stale: "missed" });
  assert.equal(plan.next.entry.content_key, "earlier");
});

test("遅れの境界: 予定時刻ちょうど・360 分遅れは due、361 分遅れは missed", () => {
  const at = (now) => core.planRun([entry()], { nowMs: jst(now), ledger: [] }).rows[0].state;
  assert.equal(at("2026-09-25 11:59"), "upcoming");
  assert.equal(at("2026-09-25 12:00"), "due");
  assert.equal(at("2026-09-25 18:00"), "due");
  assert.equal(at("2026-09-25 18:01"), "missed");
});

test("前日の予約も遅れ 6 時間以内なら日付をまたいで出す", () => {
  const plan = core.planRun([entry({ date: "2026-09-25", time: "23:30" })], {
    nowMs: jst("2026-09-26 01:17"),
    ledger: [],
  });
  assert.equal(plan.next?.entry.content_key, "vacant-housing-rate");
});

// ---- 二重投稿の防止 ----

test("台帳で domain+content_key+platform=threads が posted なら再投稿しない", () => {
  const ledger = [{ id: 1, platform: "threads", domain: "ranking", content_key: "vacant-housing-rate", status: "posted", post_url: PERMALINK }];
  const plan = core.planRun([entry()], { nowMs: jst("2026-09-25 12:10"), ledger });
  assert.equal(plan.rows[0].state, "posted");
  assert.equal(plan.next, null);
});

test("他チャネル・予約中・削除済みの行は投稿済みと見なさない", () => {
  const base = { domain: "ranking", content_key: "vacant-housing-rate" };
  const cases = [
    [{ ...base, platform: "instagram", status: "posted" }, "IG の同じ content_key"],
    [{ ...base, platform: "x", status: "posted" }, "X の同じ content_key"],
    [{ ...base, platform: "threads", status: "scheduled" }, "Threads の予約行"],
    [{ ...base, platform: "threads", status: "posted", deleted_at: "2026-09-24" }, "削除済み"],
    [{ ...base, content_key: "other", platform: "threads", status: "posted" }, "別 content_key"],
    [{ ...base, domain: "correlation", platform: "threads", status: "posted" }, "別 domain"],
  ];
  for (const [row, label] of cases) {
    assert.equal(core.isAlreadyPosted([row], entry()), false, label);
  }
});

test("schedule 内の domain+content_key 重複は schedule エラーにする", () => {
  const { errors } = core.validateSchedule({ entries: [entry(), entry({ time: "19:00" })] });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /重複/);
  assert.match(core.validateSchedule([entry()]).errors[0], /entries/);
});

test("台帳が戻っていても、自アカウントに同じ本文が 48 時間以内にあれば重複と判定する", () => {
  const nowMs = jst("2026-09-25 13:00");
  const remote = [
    { id: "9", text: "別の投稿", timestamp: "2026-09-25T03:05:00+0000", permalink: "https://www.threads.com/@stats47jp/post/X" },
    { id: "8", text: `${entry().text}\r\n`, timestamp: "2026-09-25T03:05:00+0000", permalink: PERMALINK },
  ];
  assert.equal(core.findRemoteDuplicate(entry(), remote, { nowMs })?.id, "8");
  const old = [{ ...remote[1], timestamp: "2026-09-22T03:05:00+0000" }];
  assert.equal(core.findRemoteDuplicate(entry(), old, { nowMs }), null, "48 時間より前は別投稿扱い");
  assert.equal(core.findRemoteDuplicate(entry(), [remote[0]], { nowMs }), null);
});

// ---- 台帳記録 ----

test("公開後の台帳: 新規は platform=threads で insert、予約行は昇格、posted は skip", () => {
  const args = { entry: entry(), permalink: PERMALINK, postedAt: "2026-09-25T03:02:00.000Z" };

  const insert = core.decideLedgerAction({ ...args, existing: [] });
  assert.equal(insert.action, "insert");
  assert.equal(insert.record.platform, "threads");
  assert.equal(insert.record.post_type, "text");
  assert.equal(insert.record.utm_url, UTM);
  assert.equal(insert.record.has_link, 1);
  assert.doesNotThrow(() => assertRecordIntegrity(insert.record), "store の整合検査を通る");

  const scheduled = { id: 7, platform: "threads", domain: "ranking", content_key: "vacant-housing-rate", status: "scheduled" };
  const promote = core.decideLedgerAction({ ...args, existing: [scheduled] });
  assert.deepEqual([promote.action, promote.id, promote.patch.status], ["update", 7, "posted"]);

  const posted = { ...scheduled, status: "posted", post_url: PERMALINK };
  assert.equal(core.decideLedgerAction({ ...args, existing: [posted] }).action, "skip");

  const image = core.decideLedgerAction({
    ...args,
    entry: entry({ type: "image", image_url: "https://storage.stats47.jp/a.png" }),
    existing: [],
  });
  assert.equal(image.record.media_path, "https://storage.stats47.jp/a.png");
});

test("1 日上限は JST の日付で数える", () => {
  const row = (posted_at) => ({ platform: "threads", status: "posted", posted_at, post_url: PERMALINK });
  const ledger = [
    row("2026-09-24T15:30:00Z"), // JST 09-25 00:30 → 当日
    row("2026-09-25T03:00:00Z"), // JST 09-25 12:00 → 当日
    row("2026-09-24T14:59:00Z"), // JST 09-24 23:59 → 前日
    { ...row("2026-09-25T04:00:00Z"), platform: "x" },
  ];
  assert.equal(core.countPostedOnJstDay(ledger, jst("2026-09-25 18:00")), 2);
});
