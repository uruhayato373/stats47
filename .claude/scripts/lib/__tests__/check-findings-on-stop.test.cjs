/**
 * check-findings-on-stop (Stop hook) の境界を固定する。
 * 実行: node --test .claude/scripts/lib/__tests__/check-findings-on-stop.test.cjs
 *
 * ★取りこぼしを差し戻す (感度) と、記録済み・「なし」・テンプレート文・Read の出力では差し戻さない (誤検知なし)
 *   の両方向を見る。片方だけだと、毎回止まるか何も止めない hook になる。
 */
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const HOOK = path.resolve(__dirname, "../../../hooks/check-findings-on-stop.js");
const { candidatesIn, unrecordedCandidates } = require(HOOK);

const handback = (body) => JSON.stringify({ type: "user", origin: { kind: "peer", handback: true, body }, message: { role: "user", content: body } });
const assistantTool = (name, input, id = "t1") =>
  JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "tool_use", id, name, input }] } });
const assistantText = (text) => JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text }] } });
const toolResult = (id, text) =>
  JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: id, content: text }] } });
const report = (value) => `[Subagent hand-back] The report follows:\n  | 項目 | 結果 |\n  |---|---|\n  | verdict | PASS |\n  | 起票候補 | ${value} |`;

test("表と行の両方の書き方から候補を拾い、「なし」とテンプレートは除く", () => {
  assert.deepEqual(candidatesIn("  | 起票候補 | svg-builder の丸めが toFixed |"), ["svg-builder の丸めが toFixed"]);
  assert.deepEqual(candidatesIn("起票候補: worktree の解決先が本体を向く"), ["worktree の解決先が本体を向く"]);
  assert.deepEqual(candidatesIn("  | 起票候補 | なし |\n起票候補: 無し。\n| 起票候補 | <1 件 1 文> |"), []);
});

test("記録しないまま終えた候補を返す", () => {
  const transcript = [handback(report("factual-check が手順記事の値を照合できない"))].join("\n");
  assert.deepEqual(unrecordedCandidates(transcript), ["factual-check が手順記事の値を照合できない"]);
});

test("報告の後に backlog か memory を書けば差し戻さない", () => {
  const filedByEdit = [handback(report("A")), assistantTool("Edit", { file_path: "/repo/.claude/todo/backlog.md" })].join("\n");
  const filedByBash = [handback(report("B")), assistantTool("Bash", { command: "cat > .claude/memory/x.md <<'EOF'" })].join("\n");
  assert.deepEqual(unrecordedCandidates(filedByEdit), []);
  assert.deepEqual(unrecordedCandidates(filedByBash), []);
});

test("報告より前の記録や、読むだけの Bash では記録扱いにしない", () => {
  const before = [assistantTool("Edit", { file_path: ".claude/todo/backlog.md" }), handback(report("C"))].join("\n");
  const readOnly = [handback(report("D")), assistantTool("Bash", { command: "grep -n x .claude/todo/backlog.md" })].join("\n");
  assert.deepEqual(unrecordedCandidates(before), ["C"]);
  assert.deepEqual(unrecordedCandidates(readOnly), ["D"]);
});

test("返答に「起票しない: 理由」と書けば差し戻さない", () => {
  const transcript = [handback(report("E")), assistantText("起票しない: 依頼の範囲で直したため")].join("\n");
  assert.deepEqual(unrecordedCandidates(transcript), []);
});

test("前景の Agent の tool_result も拾い、Agent 以外の tool_result (Read の出力など) は拾わない", () => {
  const foreground = [assistantTool("Agent", { prompt: "x" }, "a1"), toolResult("a1", report("F"))].join("\n");
  const readResult = [assistantTool("Read", { file_path: "x" }, "r1"), toolResult("r1", report("G"))].join("\n");
  assert.deepEqual(unrecordedCandidates(foreground), ["F"]);
  assert.deepEqual(unrecordedCandidates(readResult), []);
});

test("hook として動かすと block を返し、stop_hook_active では黙る", () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "findings-hook-")), "t.jsonl");
  fs.writeFileSync(file, handback(report("H")));
  const run = (payload) => spawnSync("node", [HOOK], { input: JSON.stringify(payload), encoding: "utf8" });
  const blocked = run({ transcript_path: file });
  assert.equal(blocked.status, 0);
  assert.equal(JSON.parse(blocked.stdout).decision, "block");
  assert.match(JSON.parse(blocked.stdout).reason, /H/);
  const quiet = run({ transcript_path: file, stop_hook_active: true });
  assert.equal(quiet.stdout, "");
});

// ── 2026-10-07 拡張: 呼び元自身の残作業と、未完了のタスク ──
const taskCreate = (id, subject) => assistantTool("TaskCreate", { subject, description: "d" }, id);
const taskUpdate = (taskId, status) => assistantTool("TaskUpdate", { taskId, status }, `u${taskId}`);

test("返答に残作業を書いてカード ID も PR も無ければ差し戻し、ID か PR があれば通す", () => {
  const bare = assistantText("進捗です。\n\nほかの残作業: outbox を contents/ へ移す (公開後)。");
  const withCard = assistantText("ほかの残作業: outbox を移す (BLOG-OUTBOX-CONTENTS-01)。");
  const withPr = assistantText("残作業: テーマ系の #1090 がレビュー待ち。");
  assert.equal(unrecordedCandidates(bare).length, 1);
  assert.match(unrecordedCandidates(bare)[0], /^返答: ほかの残作業/);
  assert.deepEqual(unrecordedCandidates(withCard), []);
  assert.deepEqual(unrecordedCandidates(withPr), []);
});

test("「残り 8 本」「未着手」のような進捗の数え方は残作業として拾わない", () => {
  assert.deepEqual(unrecordedCandidates(assistantText("22 本のうち 11 本が完了し、残り 8 本は未着手です。")), []);
});

test("作ったまま完了にしていないタスクを拾い、完了・削除・記録・件名の ID で外す", () => {
  const open = [taskCreate("c1", "不要ブランチの削除"), toolResult("c1", "Task #4 created successfully: 不要ブランチの削除")].join("\n");
  assert.deepEqual(unrecordedCandidates(open), ["タスク: 不要ブランチの削除"]);
  const done = [open, taskUpdate("4", "completed")].join("\n");
  assert.deepEqual(unrecordedCandidates(done), []);
  const recorded = [open, assistantTool("Edit", { file_path: ".claude/todo/backlog.md" }, "e1")].join("\n");
  assert.deepEqual(unrecordedCandidates(recorded), []);
  const withPr = [taskCreate("c2", "#1095→#1097 を develop へマージ"), toolResult("c2", "Task #1 created successfully: x")].join("\n");
  assert.deepEqual(unrecordedCandidates(withPr), []);
});

test("記録より前の残作業は扱い済みにし、記録の後に書いた残作業は拾う", () => {
  const transcript = [
    assistantText("残作業: A を後で直す。"),
    assistantTool("Edit", { file_path: ".claude/todo/backlog.md" }, "e2"),
    assistantText("残作業: B を後で確認する。"),
  ].join("\n");
  assert.deepEqual(unrecordedCandidates(transcript), ["返答: 残作業: B を後で確認する。"]);
});
