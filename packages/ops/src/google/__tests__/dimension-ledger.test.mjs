/**
 * dimension-ledger.mjs のテスト — 台帳パース・状態分類・GA4 実データとの突合。
 *
 * 規則の文書の実物を読む検査は、基盤のテスト .claude/scripts/lib/__tests__/dimension-ledger-rules.test.mjs に分けた。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LEDGER_STATUS_KINDS,
  classifyLedgerStatus,
  parseParamCell,
  parseDimensionLedger,
  requiredDimensionParams,
  reconcileDimensions,
  extractObservedParams,
} from "../dimension-ledger.mjs";


test("classifyLedgerStatus: 台帳の状態欄を種別へ落とす", () => {
  assert.equal(classifyLedgerStatus("✅登録済 (2026-07-20)"), LEDGER_STATUS_KINDS.REGISTERED);
  assert.equal(classifyLedgerStatus("**✅登録済 (2026-07-06)** — 補足"), LEDGER_STATUS_KINDS.REGISTERED);
  assert.equal(classifyLedgerStatus("❓要確認"), LEDGER_STATUS_KINDS.NEEDS_VERIFICATION);
  assert.equal(classifyLedgerStatus("⏳要登録"), LEDGER_STATUS_KINDS.NEEDS_REGISTRATION);
  assert.equal(classifyLedgerStatus("要否×"), LEDGER_STATUS_KINDS.NOT_REQUIRED);
  assert.equal(classifyLedgerStatus("任意"), LEDGER_STATUS_KINDS.OPTIONAL);
  assert.equal(classifyLedgerStatus(""), LEDGER_STATUS_KINDS.UNKNOWN);
});

test("parseParamCell: 括弧内は任意として分離する (全角・半角とも)", () => {
  const a = parseParamCell("`nav_label` / `nav_surface`（`nav_href` は任意）");
  assert.deepEqual(a.required, ["nav_label", "nav_surface"]);
  assert.deepEqual(a.optional, ["nav_href"]);

  const b = parseParamCell("`ranking_key` / `year_code`（`file_name`/`file_extension` は GA4 標準）");
  assert.deepEqual(b.required, ["ranking_key", "year_code"]);
  assert.deepEqual(b.optional.sort(), ["file_extension", "file_name"]);

  const c = parseParamCell("`cta_id` / `link_position` / `content_id` / `target_type` / `target_key`");
  assert.equal(c.required.length, 5);
  assert.deepEqual(c.optional, []);

  // 半角括弧でも効く
  const d = parseParamCell("`a_b` (`c_d` は任意)");
  assert.deepEqual(d.required, ["a_b"]);
  assert.deepEqual(d.optional, ["c_d"]);
});

test("parseDimensionLedger: 5 列表だけを読み、ヘッダ・区切りを除く", () => {
  const md = [
    "| 層 | 場所 | 役割 |",
    "|---|---|---|",
    "| 3 列表は対象外 | x | y |",
    "",
    "| イベント | 関数 (events.ts) | 登録が要るパラメータ | 状態 | ドメイン所有 |",
    "|---|---|---|---|---|",
    "| `nav_click` | `trackNavClick` | `nav_label` / `nav_surface`（`nav_href` は任意） | ✅登録済 (2026-07-20) | UI |",
    "| `cta_click` | `trackCtaClick` | `cta_id` / `link_position` | ❓要確認 | ファネル |",
    "| `search` | `trackSearch` | `search_term` は GA4 推奨（要否×） | 要否× | 検索 |",
  ].join("\n");
  const entries = parseDimensionLedger(md);
  assert.equal(entries.length, 3);
  assert.deepEqual(entries[0].events, ["nav_click"]);
  assert.equal(entries[0].statusKind, LEDGER_STATUS_KINDS.REGISTERED);
  assert.equal(entries[1].statusKind, LEDGER_STATUS_KINDS.NEEDS_VERIFICATION);
  assert.equal(entries[2].statusKind, LEDGER_STATUS_KINDS.NOT_REQUIRED);
});

test("parseDimensionLedger: 1 行に複数イベントがある場合も両方拾う", () => {
  const md = [
    "| イベント | 関数 | 登録が要るパラメータ | 状態 | 所有 |",
    "|---|---|---|---|---|",
    "| `home_featured_impression` / `home_featured_click` | `trackHomeFeatured*` | `card_variant` / `slot` | ❓要確認 | README |",
  ].join("\n");
  const [e] = parseDimensionLedger(md);
  assert.deepEqual(e.events, ["home_featured_impression", "home_featured_click"]);
});

test("requiredDimensionParams: 要否×・任意の行は除く", () => {
  const md = [
    "| イベント | 関数 | 登録が要るパラメータ | 状態 | 所有 |",
    "|---|---|---|---|---|",
    "| `a_evt` | `f` | `p_one` | ❓要確認 | x |",
    "| `b_evt` | `f` | `p_two` | 要否× | x |",
    "| `c_evt` | `f` | `p_three` | 任意 | x |",
    "| `d_evt` | `f` | `p_four` | ✅登録済 | x |",
  ].join("\n");
  const params = requiredDimensionParams(parseDimensionLedger(md));
  assert.deepEqual(params.sort(), ["p_four", "p_one"]);
});

test("reconcileDimensions: ❓要確認 を実データで確定し、台帳の誤りも検出する", () => {
  const md = [
    "| イベント | 関数 | 登録が要るパラメータ | 状態 | 所有 |",
    "|---|---|---|---|---|",
    "| `a_evt` | `f` | `p_present` / `p_absent` | ❓要確認 | x |",
    "| `b_evt` | `f` | `p_claimed` | ✅登録済 | x |",
    "| `c_evt` | `f` | `p_todo` | ⏳要登録 | x |",
  ].join("\n");
  const { rows, summary } = reconcileDimensions(parseDimensionLedger(md), ["p_present"]);
  const byParam = Object.fromEntries(rows.map((r) => [r.param, r.verdict]));
  assert.equal(byParam.p_present, "verified-registered");
  assert.equal(byParam.p_absent, "verified-absent");
  // 台帳が登録済みと言うのに GA4 に無い = 台帳の誤り (沈黙させない)
  assert.equal(byParam.p_claimed, "ledger-claims-registered-but-absent");
  assert.equal(byParam.p_todo, "confirmed-absent");
  assert.equal(summary["verified-registered"], 1);
});

test("extractObservedParams: 単語境界で照合し部分一致で誤検出しない", () => {
  const known = ["ad_id", "slot", "cta_id"];
  assert.deepEqual(extractObservedParams("dimension: ad_id | scope: Event", known), ["ad_id"]);
  // ad_idx / my_slot_x に誤マッチしない
  assert.deepEqual(extractObservedParams("ad_idx and my_slot_x", known), []);
  // 前後が記号なら拾う
  assert.deepEqual(extractObservedParams("(slot)", known), ["slot"]);
  assert.deepEqual(extractObservedParams("", known), []);
});
