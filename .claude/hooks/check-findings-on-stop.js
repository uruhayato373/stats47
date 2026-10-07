#!/usr/bin/env node
/**
 * Stop hook: 作業中に見つけた課題を、記録しないまま turn を終えるのを 1 回差し戻す。
 *
 * 対象は 3 つ (2026-10-07 にオーナーの指示で 2・3 を足した):
 *   1. subagent の報告の「起票候補」
 *   2. 呼び元 (メインの agent) の返答で「残作業」「後で対応」などと書いた段落 (同じ段落に
 *      カード ID か PR が書いてあれば記録済みとみなす)
 *   3. TaskCreate で作ったまま完了にしていないタスク (件名にカード ID か PR があれば記録済み)
 *
 * 規約: `.claude/rules/agent-output-contract.md`「起票候補」。subagent の最終報告は末尾に
 * `| 起票候補 | … |` (表) か `起票候補: …` (行) を置く。呼び元は「なし」以外を
 * `.claude/todo/` (未完了の行動) か `.claude/memory/` (恒久の教訓) に書くか、返答に
 * `起票しない: <理由>` と書いてから終える。
 *
 * なぜ要るか (2026-10-07): 記事 22 本の書き直しで subagent が「未解決」「範囲外」として
 * 報告した不具合・改善点が、親の返答で終わって backlog にも memory にも残らなかった
 * (オーナーに「Backlog には起票した？」と聞かれるまで 1 件だけだった)。1 を入れた後も、
 * メインの agent 自身の残作業 (outbox の移行・ブランチ削除・公開後の流入確認) が
 * セッションのタスク一覧にだけあって起票されていなかった。CLAUDE.md の
 * 「作業の節目で記録する」表は守るかどうかが agent の記憶に頼っていた。
 *
 * 判定 (決定的・LLM を呼ばない):
 *   - transcript の subagent 報告 (handback と Agent の tool_result) から起票候補を拾う
 *   - 返答の段落と、TaskCreate / TaskUpdate から 2・3 を拾う
 *   - それより後に、assistant が `.claude/todo/` か `.claude/memory/` を書いたか
 *     (Edit / Write / 書き込みを伴う Bash)、または返答に「起票しない」と書いたかを見る。
 *     記録が 1 回あれば、それより前の候補はまとめて扱い済みにする (どれを記録したかの対応は
 *     機械では決められないので、取りこぼしの気付きを促すところまでを受け持つ)
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
/**
 * 呼び元の返答で、後に回した作業を表す書き方。「残り N 本」「未着手」のような進捗の数え方は含めない。
 * 残作業・残タスクは、見出し (行頭) か「残作業:」の形のときだけ拾う。「残作業と判定した」のように語そのものを
 * 説明する文を拾わないため (2026-10-07、hook の説明文で誤検知した)。
 */
const DEFERRED = /((残タスク|残作業)\s*(\*\*)?\s*[:：]|^\s*(?:[-*]\s+)?(?:\*\*)?(?:ほかの)?(?:残タスク|残作業)|(後|あと)で(対応|直す|起票|確認|やる)|別タスク|\bTODO\b)/m;
/** transcript の行を JSON として解く前の粗い絞り込み (JSON の中では改行が \n なので行頭の判定はできない)。 */
const DEFERRED_HINT = /(残タスク|残作業|(後|あと)で|別タスク|TODO)/;
/** 記録済みとみなす参照: backlog のカード ID (`BLOG-OUTBOX-CONTENTS-01`) か PR (`#1098`・`/pull/1098`)。 */
const RECORDED_REF = /([A-Z][A-Z0-9]+(?:-[A-Z0-9]+)+|#\d{3,}|\/pull\/\d+)/;
const TASK_CREATED = /Task #(\d+) created/;
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
/** 「」『』とバッククォートの中は引用 (語の説明) なので、残作業の判定から外す。 */
function withoutQuotes(text) {
  return text.replace(/「[^」]*」|『[^』]*』|`[^`]*`/g, "");
}

/** 返答の段落のうち、後に回した作業を書いていて、カード ID も PR も無いもの。 */
function deferredIn(text) {
  return text
    .split(/\n\s*\n/)
    .filter((paragraph) => DEFERRED.test(withoutQuotes(paragraph)) && !RECORDED_REF.test(paragraph))
    .map((paragraph) => {
      const flat = paragraph.replace(/\s+/g, " ").trim();
      return `返答: ${flat.length > MAX_CHARS ? `${flat.slice(0, MAX_CHARS - 1)}…` : flat}`;
    });
}

function unrecordedCandidates(transcriptText) {
  const agentToolIds = new Set();
  const taskCreateIds = new Map(); // tool_use id → 件名
  const openTasks = new Map(); // タスク番号 → 件名 (記録済み・完了で消す)
  const pending = [];
  for (const line of transcriptText.split("\n")) {
    const mayReport = line.includes("起票候補") && (line.includes("handback") || line.includes("tool_result"));
    const mayTask = line.includes("TaskCreate") || line.includes("TaskUpdate") || (line.includes("tool_result") && line.includes("Task #"));
    const mayAct = line.includes('"assistant"') &&
      (line.includes('"Agent"') || line.includes('"Task"') || RECORD_PATHS.some((p) => line.includes(p)) ||
        line.includes("起票しない") || DEFERRED_HINT.test(line));
    if (!mayReport && !mayAct && !mayTask) continue;
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
        if (block.type === "tool_use" && block.name === "TaskCreate") taskCreateIds.set(block.id, String(block.input?.subject ?? ""));
        if (block.type === "tool_use" && block.name === "TaskUpdate" && ["completed", "deleted"].includes(block.input?.status)) {
          openTasks.delete(String(block.input?.taskId));
        }
        const recorded = block.type === "tool_use" && recordsFinding(block);
        const declined = block.type === "text" && /起票しない\s*[:：]/.test(block.text ?? "");
        if (recorded || declined) {
          pending.length = 0; // それまでの候補は扱い済み
          openTasks.clear();
          continue;
        }
        if (block.type === "text") pending.push(...deferredIn(block.text ?? ""));
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
        if (block.type !== "tool_result") continue;
        if (agentToolIds.has(block.tool_use_id)) pending.push(...candidatesIn(textOf(block.content)));
        const subject = taskCreateIds.get(block.tool_use_id);
        const created = subject !== undefined ? textOf(block.content).match(TASK_CREATED) : null;
        if (created && !RECORDED_REF.test(subject)) openTasks.set(created[1], subject);
      }
    }
  }
  const tasks = [...openTasks.values()].map((subject) => `タスク: ${subject}`);
  return [...new Set([...pending, ...tasks])];
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
    `作業中に見つけた課題 ${candidates.length} 件 (subagent の起票候補・返答に書いた残作業・未完了のタスク) が、まだどこにも記録されていません。`,
    listed + more,
    "",
    "未完了の行動は .claude/todo/backlog.md へカードで、恒久の教訓は .claude/memory/ へ記録してください",
    "(書き方: .claude/rules/todo-standards.md / .claude/skills/management/knowledge/SKILL.md)。",
    "返答で残作業に触れるときは、同じ段落にカード ID か PR を書くと記録済みとみなします。",
    "記録しないと決めたものは、返答に「起票しない: <理由>」と書けば次から差し戻しません。",
  ].join("\n");
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}

if (require.main === module) main();

module.exports = { candidatesIn, unrecordedCandidates };
