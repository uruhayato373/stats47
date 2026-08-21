/**
 * affiliate-apply の引数規則 (doc 42 §6.3) — `--commit` は plan 経由でしか通さない。
 *
 * ★ここを緩めると「見た画面」と「押す画面」が別 run になり、間の差し替えを検知できない。
 *   実申請は不可逆なので、規則そのものをテストで固定する。
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { validateArgs } from "../affiliate-apply.mjs";

test("dry-run: --asp と --id が要る", () => {
  assert.equal(validateArgs({ asp: "moshimo", ids: ["6154"], commit: false, plan: null }), null);
  assert.match(validateArgs({ asp: null, ids: ["6154"], commit: false, plan: null }), /--asp/);
  assert.match(validateArgs({ asp: "moshimo", ids: [], commit: false, plan: null }), /--id/);
});

test("commit: --plan が必須", () => {
  assert.equal(validateArgs({ asp: "moshimo", ids: [], commit: true, plan: "op-1" }), null);
  assert.match(validateArgs({ asp: "moshimo", ids: [], commit: true, plan: null }), /--plan/);
});

test("commit: --id との併用を禁止する (押す対象は plan だけが決める)", () => {
  assert.match(validateArgs({ asp: "moshimo", ids: ["6154"], commit: true, plan: "op-1" }), /--commit --id は禁止/);
});

test("dry-run に --plan は付けられない (計画を作る側と使う側を混ぜない)", () => {
  assert.match(validateArgs({ asp: "moshimo", ids: ["6154"], commit: false, plan: "op-1" }), /--commit と一緒/);
});
