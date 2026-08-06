/**
 * partial-publish の再発防止テスト (node 標準のみ・node_modules 不要)。
 *   node --test .claude/scripts/ai-content/__tests__/generation-outcome.test.mjs
 *
 * ここが緑 = 「失敗キーは quarantine へ積み上がり、成功でリセットされ、threshold で
 * --next から外れる」ことが固定される。verify の partial-publish が意味を持つのはこの
 * 隔離とセットのため。
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  updateFailureState,
  quarantinedKeys,
  emptyFailureState,
  QUARANTINE_THRESHOLD,
} from "../record-generation-outcome.mjs";

test("失敗キーは failCount +1・成功キーは削除される", () => {
  let s = emptyFailureState();
  s = updateFailureState(s, { failed: ["a", "b"], passed: [], reason: "critic-not-pass", date: "2026-08-05" });
  assert.equal(s.keys.a.failCount, 1);
  assert.equal(s.keys.b.failCount, 1);
  assert.equal(s.keys.a.firstFailedAt, "2026-08-05");

  // 翌日 a は再び失敗、b は成功 → a は 2、b は消える
  s = updateFailureState(s, { failed: ["a"], passed: ["b"], reason: "critic-not-pass", date: "2026-08-06" });
  assert.equal(s.keys.a.failCount, 2);
  assert.equal(s.keys.a.firstFailedAt, "2026-08-05", "firstFailedAt は保持される");
  assert.equal(s.keys.a.lastFailedAt, "2026-08-06");
  assert.equal(s.keys.b, undefined, "成功したキーは履歴から消える");
});

test("threshold 回連続失敗で quarantine 対象になる", () => {
  let s = emptyFailureState();
  for (let i = 0; i < QUARANTINE_THRESHOLD - 1; i++) {
    s = updateFailureState(s, { failed: ["doomed"], passed: [], reason: "r", date: "2026-08-0" + (i + 1) });
    assert.equal(quarantinedKeys(s).has("doomed"), false, `${i + 1} 回目はまだ隔離しない`);
  }
  s = updateFailureState(s, { failed: ["doomed"], passed: [], reason: "r", date: "2026-08-09" });
  assert.equal(quarantinedKeys(s).has("doomed"), true, "threshold 到達で隔離");
});

test("quarantine されたキーも PASS すれば解除される", () => {
  let s = emptyFailureState();
  for (let i = 0; i < QUARANTINE_THRESHOLD; i++) {
    s = updateFailureState(s, { failed: ["k"], passed: [], reason: "r", date: "2026-08-0" + (i + 1) });
  }
  assert.equal(quarantinedKeys(s).has("k"), true);
  s = updateFailureState(s, { failed: [], passed: ["k"], reason: "", date: "2026-08-10" });
  assert.equal(quarantinedKeys(s).has("k"), false, "PASS で隔離解除");
  assert.equal(s.keys.k, undefined);
});

test("元の state を破壊しない (純関数)", () => {
  const s0 = emptyFailureState();
  const s1 = updateFailureState(s0, { failed: ["a"], passed: [], reason: "r", date: "2026-08-05" });
  assert.equal(Object.keys(s0.keys).length, 0, "入力は不変");
  assert.notEqual(s0, s1);
});

test("date 無しは throw (機械日付更新の握り潰し防止)", () => {
  assert.throws(() => updateFailureState(emptyFailureState(), { failed: ["a"] }), /date/);
});
