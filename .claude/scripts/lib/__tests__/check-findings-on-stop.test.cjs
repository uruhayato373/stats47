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
