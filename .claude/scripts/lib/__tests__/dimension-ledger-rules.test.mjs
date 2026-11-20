// 規則の文書 (.claude/rules/analytics-event-standards.md) の実物を、GA4 の custom dimension の台帳として
// 読めることを確かめる。確かめる対象が .claude の文書なので、部品 (packages/ops/src/google/dimension-ledger.mjs)
// のテストから分けて基盤のテストに置く (SCRIPTS-TO-PACKAGES-02)。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LEDGER_STATUS_KINDS, parseDimensionLedger, requiredDimensionParams } from "../../../../packages/ops/src/google/dimension-ledger.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const LEDGER_PATH = path.join(PROJECT_ROOT, ".claude/rules/analytics-event-standards.md");

test("実台帳をパースでき、状態を分類できない行が無い", () => {
  const md = fs.readFileSync(LEDGER_PATH, "utf-8");
  const entries = parseDimensionLedger(md);
  assert.ok(entries.length >= 10, `台帳の行数が少なすぎる: ${entries.length}`);

  const registered = entries.filter((e) => e.statusKind === LEDGER_STATUS_KINDS.REGISTERED);
  assert.ok(registered.length > 0, "登録済みの行を1つも検出できていない");
  // 実台帳に要登録の行が残っているかは運用状態であって不変条件ではない (2026-09-26 に全件登録済みになった)。
  // 要登録の判定そのものは classifyLedgerStatus のテストで合成値により固定する。
  assert.equal(
    entries.filter((e) => e.statusKind === LEDGER_STATUS_KINDS.UNKNOWN).length,
    0,
    "状態を分類できない台帳行がある",
  );

  // 実台帳の代表イベントが含まれること
  const events = entries.flatMap((e) => e.events);
  for (const expected of ["nav_click", "cta_click", "ranking_view"]) {
    assert.ok(events.includes(expected), `${expected} を台帳から読めていない`);
  }

  // 登録が要るパラメータが妥当な数だけ抽出できる
  const required = requiredDimensionParams(entries);
  assert.ok(required.length >= 10, `required params が少なすぎる: ${required.length}`);
  assert.ok(required.includes("ad_id"), "ad_id が required に入っていない");
  // 任意・GA4 標準は含まれない
  assert.ok(!required.includes("nav_href"), "括弧内の任意パラメータを required に混ぜている");
  assert.ok(!required.includes("search_term"), "要否× の行のパラメータを required に混ぜている");
});
