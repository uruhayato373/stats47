#!/usr/bin/env node
/**
 * Stop hook: subagent が報告した「起票候補」を、記録しないまま turn を終えるのを 1 回差し戻す。
 *
 * 規約: `.claude/rules/agent-output-contract.md`「起票候補」。subagent の最終報告は末尾に
 * `| 起票候補 | … |` (表) か `起票候補: …` (行) を置く。呼び元は「なし」以外を
 * `.claude/todo/` (未完了の行動) か `.claude/memory/` (恒久の教訓) に書くか、返答に
 * `起票しない: <理由>` と書いてから終える。
 *
 * なぜ要るか (2026-10-07): 記事 22 本の書き直しで subagent が「未解決」「範囲外」として
 * 報告した不具合・改善点が、親の返答で終わって backlog にも memory にも残らなかった
 * (オーナーに「Backlog には起票した？」と聞かれるまで 1 件だけだった)。CLAUDE.md の
 * 「作業の節目で記録する」表は守るかどうかが agent の記憶に頼っていた。
 *
 * 判定 (決定的・LLM を呼ばない):
 *   - transcript の subagent 報告 (handback と Agent の tool_result) から起票候補を拾う
 *   - その報告より後に、assistant が `.claude/todo/` か `.claude/memory/` を書いたか
 *     (Edit / Write / 書き込みを伴う Bash)、または返答に「起票しない」と書いたかを見る
 *   - どちらも無い候補があれば block。stop_hook_active なら即終了 (1 回だけ差し戻す)
 *
 * 出力: { decision: "block", reason } を stdout。Stop hook は exit 0 必須。
 */

const fs = require("fs");

const NONE = /^(なし|無し|ない|特になし|該当なし|-|—|ー|none|n\/a)[。.]?$/i;
const TABLE_ROW = /^\s*\|\s*起票候補[^|]*\|\s*(.+?)\s*\|\s*$/;
const LINE_FORM = /^\s*起票候補\s*[:：]\s*(.+?)\s*$/;
const RECORD_PATHS = [".claude/todo/", ".claude/memory/"];
const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
const BASH_WRITES = /(>>?|sed -i|tee |writeFileSync|appendFileSync|insertCards|git add)/;
const MAX_LISTED = 5;
const MAX_CHARS = 140;

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

function textOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((block) => (typeof block === "string" ? block : block?.text ?? textOf(block?.content))).join("\n");
}

/** 報告本文から起票候補を取り出す (「なし」とテンプレートの <…> は除く)。 */
function candidatesIn(text) {
  const found = [];
  for (const line of text.split("\n")) {
    const match = line.match(TABLE_ROW) ?? line.match(LINE_FORM);
    if (!match) continue;
    const value = match[1].trim();
    if (!value || NONE.test(value) || value.startsWith("<")) continue;
    found.push(value.length > MAX_CHARS ? `${value.slice(0, MAX_CHARS - 1)}…` : value);
  }
  return found;
}

function recordsFinding(toolUse) {
  const input = toolUse.input ?? {};
  if (WRITE_TOOLS.has(toolUse.name)) {
    const target = String(input.file_path ?? input.notebook_path ?? "");
    return RECORD_PATHS.some((p) => target.includes(p));
  }
  if (toolUse.name === "Bash") {
    const command = String(input.command ?? "");
    return BASH_WRITES.test(command) && RECORD_PATHS.some((p) => command.includes(p));
  }
  return false;
}

/**
 * transcript (JSONL) を前から読み、記録されていない起票候補を返す。
 * 50MB 級の transcript でも速いよう、関係しそうな行だけを JSON として解く。
 */
function unrecordedCandidates(transcriptText) {
  if (!transcriptText.includes("起票候補")) return [];
  const agentToolIds = new Set();
  const pending = [];
  for (const line of transcriptText.split("\n")) {
    const mayReport = line.includes("起票候補") && (line.includes("handback") || line.includes("tool_result"));
    const mayAct = line.includes('"assistant"') &&
      (line.includes('"Agent"') || line.includes('"Task"') || RECORD_PATHS.some((p) => line.includes(p)) || line.includes("起票しない"));
    if (!mayReport && !mayAct) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const content = entry.message?.content;
    if (entry.type === "assistant" && Array.isArray(content)) {
      for (const block of content) {
        if (block.type === "tool_use" && (block.name === "Agent" || block.name === "Task")) agentToolIds.add(block.id);
        const recorded = block.type === "tool_use" && recordsFinding(block);
        const declined = block.type === "text" && /起票しない\s*[:：]/.test(block.text ?? "");
        if (recorded || declined) pending.length = 0; // それまでの候補は扱い済み
      }
      continue;
    }
    if (entry.type !== "user") continue;
    if (entry.origin?.handback) {
      pending.push(...candidatesIn(entry.origin.body ?? textOf(content)));
      continue;
    }
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === "tool_result" && agentToolIds.has(block.tool_use_id)) pending.push(...candidatesIn(textOf(block.content)));
      }
    }
  }
  return [...new Set(pending)];
}

function main() {
  const input = readStdin();
  if (input.stop_hook_active || !input.transcript_path) process.exit(0);
  let transcript;
  try {
    transcript = fs.readFileSync(input.transcript_path, "utf8");
  } catch {
    process.exit(0); // 読めなければ作業は止めない
  }
  const candidates = unrecordedCandidates(transcript);
  if (candidates.length === 0) process.exit(0);

  const listed = candidates.slice(0, MAX_LISTED).map((c) => `  - ${c}`).join("\n");
  const more = candidates.length > MAX_LISTED ? `\n  - …ほか ${candidates.length - MAX_LISTED} 件` : "";
  const reason = [
    `subagent が報告した起票候補 ${candidates.length} 件が、まだどこにも記録されていません。`,
    listed + more,
    "",
    "未完了の行動は .claude/todo/backlog.md へカードで、恒久の教訓は .claude/memory/ へ記録してください",
    "(書き方: .claude/rules/todo-standards.md / .claude/skills/management/knowledge/SKILL.md)。",
    "記録しないと決めたものは、返答に「起票しない: <理由>」と書けば次から差し戻しません。",
  ].join("\n");
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}

if (require.main === module) main();

module.exports = { candidatesIn, unrecordedCandidates };
