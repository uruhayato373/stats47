import assert from "node:assert/strict";
import test from "node:test";
import { audit, countByDomain, testDomain } from "../check-claude-scripts-tests.mjs";

const REASON = "対象のロジックを packages へ移して減らす";
const HARNESS_TEST = ".claude/scripts/lib/__tests__/session-guard.test.cjs";
const paths = [
  ".claude/scripts/note/__tests__/a.test.mjs",
  ".claude/scripts/note/__tests__/b.test.mjs",
  ".claude/scripts/lib/__tests__/kakei.test.mjs",
  HARNESS_TEST,
];
const baseline = () => ({
  harnessDomains: ["lib"],
  harness: { [HARNESS_TEST]: "hook のテスト" },
  domains: { note: { count: 2, reason: REASON }, lib: { count: 1, reason: REASON } },
});

test("数えるのは .claude/scripts の領域の下のテストだけ", () => {
  assert.equal(testDomain(".claude/scripts/note/__tests__/a.test.mjs"), "note");
  assert.equal(testDomain(".claude/scripts/lib/a.test.cjs"), "lib");
  assert.equal(testDomain(".claude/scripts/themes/__tests__/deep/a.test.ts"), "themes");
  // テストの補助 (fixture) と本体は数えない
  assert.equal(testDomain(".claude/scripts/note/__tests__/fixture.mjs"), null);
  assert.equal(testDomain(".claude/scripts/note/build.mjs"), null);
  // packages のテストは対象外 (そこが置き場)
  assert.equal(testDomain("packages/ops/src/note/__tests__/a.test.mjs"), null);
});

test("基盤の許可リストに載せたテストは領域の本数に数えない", () => {
  assert.deepEqual(countByDomain(paths, { [HARNESS_TEST]: "hook のテスト" }), { note: 2, lib: 1 });
  assert.deepEqual(countByDomain(paths), { note: 2, lib: 2 });
});

test("基準どおりなら通る", () => {
  assert.deepEqual(audit(paths, baseline(), baseline()), []);
});

test("テストを 1 本足すと落ち、packages へ移すよう伝える", () => {
  const errors = audit([...paths, ".claude/scripts/note/__tests__/c.test.mjs"], baseline());
  assert.equal(errors.length, 1);
  assert.match(errors[0], /note: テストが増えた \(2 → 3\).*packages/);
});

test("基準に無い領域にテストを置くと落ちる", () => {
  const errors = audit([...paths, ".claude/scripts/gsc/__tests__/a.test.mjs"], baseline());
  assert.match(errors.join("\n"), /gsc: テストが 1 本ある \(基準に無い\)/);
});

test("テストを移して減ったら、基準も縮めるまで落ちる", () => {
  const moved = paths.filter((path) => !path.endsWith("b.test.mjs"));
  assert.match(audit(moved, baseline()).join("\n"), /note: 減った分だけ基準を縮める \(2 → 1\)/);
  const gone = paths.filter((path) => !path.includes("/note/"));
  assert.match(audit(gone, baseline()).join("\n"), /note: もうテストが無いので基準から外す/);
});

test("基準は縮小専用: 本数を増やす・領域の行を足す書き換えは前の基準と比べて落ちる", () => {
  const raised = baseline();
  raised.domains.note.count = 3;
  const more = [...paths, ".claude/scripts/note/__tests__/c.test.mjs"];
  assert.deepEqual(audit(more, raised), []);
  assert.match(audit(more, raised, baseline()).join("\n"), /note: 基準は縮小専用/);

  const added = baseline();
  added.domains.gsc = { count: 1, reason: REASON };
  const withGsc = [...paths, ".claude/scripts/gsc/__tests__/a.test.mjs"];
  assert.match(audit(withGsc, added, baseline()).join("\n"), /gsc: 基準は縮小専用/);
});

test("基盤の許可リストは、決まった領域のテストにだけ足せる", () => {
  const added = baseline();
  const noteTest = ".claude/scripts/note/__tests__/c.test.mjs";
  added.harness[noteTest] = "業務のテストを基盤と言い張る";
  assert.match(audit([...paths, noteTest], added, baseline()).join("\n"), /基盤のテストを置ける領域は lib だけ/);

  // 領域の一覧を広げて通す抜け道も塞ぐ
  added.harnessDomains.push("note");
  assert.match(audit([...paths, noteTest], added, baseline()).join("\n"), /harnessDomains: note を足せない/);
});

test("基盤の許可リストの行は、理由と実在するファイルが要る", () => {
  const empty = baseline();
  empty.harness[HARNESS_TEST] = " ";
  assert.match(audit(paths, empty).join("\n"), /理由が要る/);

  const stale = baseline();
  stale.harness[".claude/scripts/lib/__tests__/removed.test.cjs"] = "消えた hook のテスト";
  assert.match(audit(paths, stale).join("\n"), /removed\.test\.cjs: もう無いので基盤の許可リストから外す/);
});

test("基盤の領域に新しい基盤のテストを足すのは通る", () => {
  const added = baseline();
  const hookTest = ".claude/scripts/lib/__tests__/new-hook.test.cjs";
  added.harness[hookTest] = "新しい Stop hook のテスト";
  assert.deepEqual(audit([...paths, hookTest], added, baseline()), []);
});
