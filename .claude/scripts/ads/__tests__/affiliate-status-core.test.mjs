/**
 * affiliate-status-core のテスト。
 * フィクスチャは 2026-08-04 の**実機診断で観測した実データ**を使う
 * (作り話の値でテストすると、実際に起きた事故を再現できない)。
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildIdScopes,
  pickIds,
  detectPhantomIds,
  checkIdRowParity,
  zipNamesWithIds,
  namesLikelySame,
  parseAfbBlocks,
  parseMoshimoDetailStatus,
  shouldReviewAbsentStatus,
  isPlaceholderName,
  validateCatalog,
} from "../lib/affiliate-status-core.mjs";

// ─── buildIdScopes ──────────────────────────────────────────────
test("listScopeSelector があれば最優先で使う", () => {
  const scopes = buildIdScopes({ listScopeSelector: "table a[href]", rowSelector: "td.promotion-name" });
  assert.equal(scopes[0], "table a[href]");
  assert.equal(scopes.at(-1), "a[href]", "ページ全体は最後の手段として残す");
});

test("listScopeSelector が無ければ rowSelector 由来 → ページ全体の順", () => {
  assert.deepEqual(buildIdScopes({ rowSelector: "td.x" }), ["tr:has(td.x) a[href]", "a[href]"]);
});

test("どちらも無ければページ全体だけ", () => {
  assert.deepEqual(buildIdScopes({}), ["a[href]"]);
});

// ─── pickIds ────────────────────────────────────────────────────
test("href から ID を出現順・重複排除で抽出する", () => {
  const hrefs = [
    "/af/shop/promotion/detail?promotion_id=7590",
    "/af/shop/promotion/detail?promotion_id=7590", // 同一行の 2 本目リンク
    "/af/shop/promotion/detail?promotion_id=7593",
  ];
  assert.deepEqual(pickIds(hrefs, "promotion_id=(\\d+)"), ["7590", "7593"]);
});

test("null / 空配列を渡しても落ちない", () => {
  assert.deepEqual(pickIds(null, "promotion_id=(\\d+)"), []);
  assert.deepEqual(pickIds([null, undefined, ""], "promotion_id=(\\d+)"), []);
});

// ─── detectPhantomIds (超集合の実体) ────────────────────────────
test("提携中と申請中の両方に出る ID を幻として検出する (2026-08-04 実測)", () => {
  // 実測: ページ全体スコープだと提携中 35 件 / 申請中 57 件になり、
  //       7630 / 7556 / 170 の 3 件が両方に出ていた (= ページ共通リンク)。
  const partnered = ["7630", "7556", "7590", "7593", "7517", "170"];
  const applying = ["7630", "7556", "7628", "7627", "170"];
  assert.deepEqual(detectPhantomIds(partnered, applying).sort(), ["170", "7556", "7630"]);
});

test("正常時 (行スコープ限定後) は幻ゼロ", () => {
  assert.deepEqual(detectPhantomIds(["7590", "7593"], ["7628", "7627"]), []);
});

// ─── checkIdRowParity ───────────────────────────────────────────
test("行数と ID 数の不一致を検出する (超集合の早期検知)", () => {
  // 修正前の実測: 提携中は一覧 32 行に対し ID 35 件
  assert.deepEqual(checkIdRowParity(32, 35), { ok: false, rowCount: 32, idCount: 35, diff: 3 });
  // 修正後: 一致
  assert.equal(checkIdRowParity(32, 32).ok, true);
});

test("行数を取得できない ASP は判定不能 (null)", () => {
  assert.equal(checkIdRowParity(null, 37), null, "afb は rowSelector 未特定で件数が取れない");
});

// ─── zipNamesWithIds ────────────────────────────────────────────
test("件数が一致し既知名と照合できれば index 対応表を返す", () => {
  const names = ["みんなの生命保険アドバイザーの無料保険相談", "【スタディング STUDYing】累計合格者多数！スマホで学べる人気のオンライン資格講座"];
  const ids = ["7059", "1223"];
  // 台帳側の名前は実機より短い (宣伝文が無い) — 実測 1223 のケース
  const known = { 1223: "【スタディング STUDYing】オンライン資格講座" };
  const map = zipNamesWithIds(names, ids, known);
  assert.equal(map["7059"], names[0]);
  assert.equal(map["1223"], names[1]);
});

test("件数が食い違えば対応付けない (捏造防止)", () => {
  assert.equal(zipNamesWithIds(["A", "B"], ["1"], {}), null);
});

test("既知名と一致しなければ対応付けない (順序ズレの検出)", () => {
  const map = zipNamesWithIds(["全く別の案件", "別の何か"], ["7059", "1223"], {
    1223: "【スタディング STUDYing】オンライン資格講座",
  });
  assert.equal(map, null);
});

test("既知名が無ければ検証をスキップして対応表を返す", () => {
  const map = zipNamesWithIds(["A", "B"], ["1", "2"], {});
  assert.deepEqual(map, { 1: "A", 2: "B" });
});

// ─── namesLikelySame ────────────────────────────────────────────
test("宣伝文が挿入された実機名と台帳名を同一と判定する (実測 2626)", () => {
  assert.equal(
    namesLikelySame(
      "LEAN BODY（リーンボディ）2週間無料会員登録",
      "日本最大級のオンラインフィットネスサービス『LEAN BODY（リーンボディ）』の2週間無料会員登録",
    ),
    true,
  );
});

test("無関係な名前は別物と判定する", () => {
  assert.equal(namesLikelySame("転職エージェントナビ", "楽天市場の商品購入"), false);
});

// ─── parseAfbBlocks (名前欠落の実体) ────────────────────────────
test("afb の 4 行ブロックからプロモーション名を取る", () => {
  // 実機の一覧は 【PID:N】カテゴリ / 企業名 / プロモーション名 / 報酬 の 4 行ブロック。
  // 行 grep だと 1 行目しか取れず name が「【PID:14065】 専門転職（その他）」になっていた。
  const body = [
    "【PID:10585】 一般転職",
    "株式会社UZUZ",
    "20代の第二新卒・既卒・フリーター・ニート向け就職・転職エージェント【UZUZ】新規無料会員登録完了",
    "3,000円（税込）",
  ].join("\n");
  const blocks = parseAfbBlocks(body, "^【PID:(\\d+)】\\s*(.*)$");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].pid, "10585");
  assert.equal(blocks[0].category, "一般転職");
  assert.equal(blocks[0].advertiser, "株式会社UZUZ");
  assert.match(blocks[0].name, /UZUZ】新規無料会員登録完了$/);
  assert.equal(blocks[0].reward, "3,000円（税込）");
});

test("複数ブロックを順に取る", () => {
  const body = [
    "【PID:1】 カテゴリA",
    "企業A",
    "プロモA",
    "100円（税込）",
    "【PID:2】 カテゴリB",
    "企業B",
    "プロモB",
    "200円（税込）",
  ].join("\n");
  const blocks = parseAfbBlocks(body, "^【PID:(\\d+)】\\s*(.*)$");
  assert.deepEqual(
    blocks.map((b) => [b.pid, b.name]),
    [
      ["1", "プロモA"],
      ["2", "プロモB"],
    ],
  );
});

// ─── parseMoshimoDetailStatus ───────────────────────────────────
test("もしも詳細は見出しより前のナビ状態を無視し、本文の状態だけを読む", () => {
  const body = [
    "申請中",
    "提携中",
    "プロモーション詳細",
    "否認中",
  ].join("\n");
  assert.deepEqual(parseMoshimoDetailStatus(body), {
    ok: true,
    status: "none",
    rawStatus: "否認中",
    reason: null,
  });
});

test("もしも詳細の5種類の実機状態をカタログ語彙へ変換する", () => {
  const cases = [
    ["提携中", "approved"],
    ["申請中", "applying"],
    ["未申請", "none"],
    ["否認中", "none"],
    ["このプロモーションは終了しました。", "unavailable"],
  ];
  for (const [raw, expected] of cases) {
    const result = parseMoshimoDetailStatus(`プロモーション詳細\n${raw}`);
    assert.equal(result.ok, true, raw);
    assert.equal(result.status, expected, raw);
    assert.equal(result.rawStatus, raw, raw);
  }
});

test("もしも詳細の見出し・状態が不明または曖昧なら fail-closed", () => {
  assert.equal(parseMoshimoDetailStatus("提携中").ok, false);
  assert.equal(parseMoshimoDetailStatus("プロモーション詳細\n広告主情報").ok, false);
  assert.equal(parseMoshimoDetailStatus("プロモーション詳細\n提携中\n申請中").ok, false);
});

test("詳細で確定した none / unavailable は一覧不在レビューへ戻さない", () => {
  assert.equal(shouldReviewAbsentStatus("none"), false);
  assert.equal(shouldReviewAbsentStatus("unavailable"), false);
  assert.equal(shouldReviewAbsentStatus("applying"), true);
  assert.equal(shouldReviewAbsentStatus("approved"), true);
});

// ─── isPlaceholderName ──────────────────────────────────────────
test("未補完の name を判定する", () => {
  assert.equal(isPlaceholderName(null), true);
  assert.equal(isPlaceholderName(""), true);
  assert.equal(isPlaceholderName("【PID:14065】 専門転職（その他）"), true);
  assert.equal(isPlaceholderName("転職エージェントナビ｜転職マッチングサービスの新規会員登録"), false);
});

// ─── validateCatalog ────────────────────────────────────────────
const VOCAB = { approved: "", applying: "", none: "", unavailable: "", unknown: "" };

test("10 軸外の vertical を error にする", () => {
  const r = validateCatalog({
    _statusVocab: VOCAB,
    programs: { "moshimo-1": { name: "X", vertical: "tourism", asps: { moshimo: { promotionId: "1", status: "approved" } } } },
  });
  assert.ok(r.errors.some((e) => e.includes("10 軸外")));
});

test("語彙外の status を error にする", () => {
  const r = validateCatalog({
    _statusVocab: VOCAB,
    programs: { "afb-1": { name: "X", vertical: "labor", asps: { afb: { pid: "1", status: "harvested" } } } },
  });
  assert.ok(r.errors.some((e) => e.includes("語彙外")));
});

test("識別子が無ければ error", () => {
  const r = validateCatalog({
    _statusVocab: VOCAB,
    programs: { "afb-1": { name: "X", vertical: "labor", asps: { afb: { status: "approved" } } } },
  });
  assert.ok(r.errors.some((e) => e.includes("識別子")));
});

test("eligibility が存在する場合は policy 外の語彙を構造違反にする", () => {
  const r = validateCatalog({
    _statusVocab: VOCAB,
    programs: {
      "moshimo-1": {
        name: "X",
        vertical: "labor",
        eligibility: {
          status: "approved",
          riskFlags: ["unknown-risk"],
          allowedPageTypes: ["home"],
          allowedRankingKeys: [],
          allowedTagKeys: [],
          minimumEligibleImpressions: null,
          reviewedAt: null,
          reviewedBy: "code",
          evidence: [],
        },
        asps: { moshimo: { promotionId: "1", status: "approved" } },
      },
    },
  });
  assert.ok(r.errors.some((e) => e.includes("risk-flags-invalid")));
  assert.ok(r.errors.some((e) => e.includes("page-types-invalid")));
});

test("approved で name 未補完 / vertical 未設定は warn (error にしない)", () => {
  const r = validateCatalog({
    _statusVocab: VOCAB,
    programs: { "afb-14065": { name: "【PID:14065】 専門転職（その他）", vertical: null, asps: { afb: { pid: "14065", status: "approved" } } } },
  });
  assert.deepEqual(r.errors, [], "実機を見ないと直せないので error にしない");
  assert.equal(r.warnings.filter((w) => w.includes("name 未補完")).length, 1);
  assert.equal(r.warnings.filter((w) => w.includes("vertical 未設定")).length, 1);
});

test("正常なエントリは error も warn も出さない", () => {
  const r = validateCatalog({
    _statusVocab: VOCAB,
    programs: { "moshimo-5537": { name: "転職エージェントナビ", vertical: "labor", asps: { moshimo: { promotionId: "5537", status: "approved" } } } },
  });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});
