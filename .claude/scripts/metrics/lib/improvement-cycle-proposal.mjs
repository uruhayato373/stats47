/**
 * 無人 improvement-triage run の「変更提案 JSON」を改善台帳へ決定的に適用する (pure)。
 *
 * ★なぜ提案と適用を分けるか (2026-09-24)
 * Claude Code は `.claude/` を保護パスとして扱い、`--permission-mode dontAsk` では書き込みを必ず拒否する
 * (allow ルールでも解除できない: https://code.claude.com/docs/en/permission-modes#protected-paths、2026-09-24 参照)。
 * 初回の無人 run (35996605022) は improvements.md への Edit を 3 回拒否され、変更 0 件のままゲートを通過した。
 * そこで Claude は保護外の `.local/ci/improvement-cycle/proposal.json` に判断だけを書き、
 * このモジュールが行の置換・削除・ログ追記・カード挿入を行う。適用後の差分は improvement-cycle-gate が検査する。
 *
 * 提案の形:
 * {
 *   "week": "2026-W39",
 *   "improvements": [
 *     { "id": "AAA-01", "action": "update", "row": "| AAA-01 | … | pending | 2026-10-08 | claude | ga4 |" },
 *     { "id": "BBB-01", "action": "delete" }
 *   ],
 *   "logEntries": [{ "skill": "ga4-improvement", "markdown": "### [BBB-01] … (2026-09-28)\n…" }],
 *   "backlogCards": [{ "tier": "🟡", "markdown": "### [NEW-01] …\nタグ: …\n\n…" }]
 * }
 */
import { MAX_NEW_BACKLOG_CARDS, parseCardIds, parseImprovementRows } from "./improvement-cycle-gate.mjs";

export const MAX_PROPOSAL_ITEMS = 8;
const ID = /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/;
const TIERS = ["🔴", "🟡", "🟢", "🟣"];
const ACTIONS = new Set(["update", "delete"]);

const splitLines = (text) => String(text ?? "").split("\n");

/** 削除した施策の `### \`ID\`` 節 (実行手順) を次の見出しまで取り除く。節が無ければそのまま返す。 */
function removeProcedureSection(lines, id) {
  const start = lines.findIndex((l) => l.trim() === `### \`${id}\``);
  if (start < 0) return lines;
  let end = start + 1;
  while (end < lines.length && !/^#{2,3} /.test(lines[end])) end += 1;
  return [...lines.slice(0, start), ...lines.slice(end)];
}

function validateCard(card, existingIds, problems, index) {
  const where = `backlogCards[${index}]`;
  if (!TIERS.includes(card?.tier)) problems.push(`${where}: tier は ${TIERS.join(" / ")} のどれか`);
  const md = typeof card?.markdown === "string" ? card.markdown.trim() : "";
  const [heading = "", ...rest] = md.split("\n");
  const m = heading.match(/^### \[([A-Z0-9-]+)\] \S/);
  if (!m || !ID.test(m[1])) {
    problems.push(`${where}: 先頭行は "### [ID] タイトル"`);
    return null;
  }
  if (existingIds.has(m[1])) problems.push(`${where}: ${m[1]} は backlog に既にある`);
  const firstBody = rest.find((l) => l.trim() !== "");
  if (!firstBody?.startsWith("タグ:")) problems.push(`${where}: 見出し直後の行は "タグ:" 行 (todo-standards §2)`);
  if (rest.some((l) => /^#{1,3} /.test(l))) problems.push(`${where}: 本文に見出しを含めない`);
  return { id: m[1], tier: card.tier, markdown: md };
}

/**
 * @param {{ improvements: string, backlog: string, logs: Record<string, string> }} files 現在の本文 (logs は skill 名 → improvement-log.md)
 * @param {unknown} proposal 提案 JSON を parse したもの
 * @param {{ week: string }} ctx
 * @returns {{ problems: string[], improvements: string, backlog: string, logs: Record<string, string>, summary: { updated: string[], deleted: string[], logs: string[], cards: string[] } }}
 *   problems が 1 件でもあれば本文は変更前のまま返す (部分適用しない)
 */
export function applyProposal(files, proposal, { week }) {
  const problems = [];
  const summary = { updated: [], deleted: [], logs: [], cards: [] };
  const unchanged = () => ({ problems, improvements: files.improvements, backlog: files.backlog, logs: {}, summary });
  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) {
    problems.push("提案が JSON オブジェクトではない");
    return unchanged();
  }
  if (proposal.week !== week) problems.push(`提案の week (${proposal.week}) が対象週 (${week}) と違う`);
  const items = proposal.improvements ?? [];
  const logEntries = proposal.logEntries ?? [];
  const cards = proposal.backlogCards ?? [];
  for (const [name, value] of [["improvements", items], ["logEntries", logEntries], ["backlogCards", cards]]) {
    if (!Array.isArray(value)) problems.push(`${name} は配列`);
  }
  if (problems.length) return unchanged();
  if (items.length > MAX_PROPOSAL_ITEMS) problems.push(`improvements が ${items.length} 件 (上限 ${MAX_PROPOSAL_ITEMS})`);
  if (cards.length > MAX_NEW_BACKLOG_CARDS) problems.push(`backlogCards が ${cards.length} 件 (上限 ${MAX_NEW_BACKLOG_CARDS})`);

  const rows = parseImprovementRows(files.improvements);
  const seen = new Set();
  for (const [i, item] of items.entries()) {
    const where = `improvements[${i}] (${item?.id ?? "?"})`;
    if (!ACTIONS.has(item?.action)) { problems.push(`${where}: action は update / delete`); continue; }
    if (!rows.has(item.id)) { problems.push(`${where}: improvements.md に無い ID`); continue; }
    if (seen.has(item.id)) { problems.push(`${where}: 同じ ID を 2 回扱っている`); continue; }
    seen.add(item.id);
    if (item.action === "update") {
      const row = typeof item.row === "string" ? item.row.trim() : "";
      const parsed = row.includes("\n") ? new Map() : parseImprovementRows(row);
      if (!parsed.has(item.id)) problems.push(`${where}: row は同じ ID の 6 列 1 行 (| ID | タイトル | Status | Due | Owner | Metric |)`);
    } else if (!logEntries.some((e) => typeof e?.markdown === "string" && e.markdown.includes(item.id))) {
      problems.push(`${where}: 削除する施策は logEntries に判定と根拠を残す`);
    }
  }
  for (const [i, entry] of logEntries.entries()) {
    if (!(entry?.skill in files.logs)) problems.push(`logEntries[${i}]: skill "${entry?.skill}" の improvement-log.md が無い`);
    if (typeof entry?.markdown !== "string" || !entry.markdown.trim()) problems.push(`logEntries[${i}]: markdown が空`);
  }
  const existingCards = parseCardIds(files.backlog);
  const validCards = cards.map((card, i) => validateCard(card, existingCards, problems, i));
  if (problems.length) return unchanged();

  // --- 適用 (ここから先は検証済み) ---
  let impLines = splitLines(files.improvements);
  for (const item of items) {
    const at = impLines.indexOf(rows.get(item.id).line);
    if (item.action === "update") {
      impLines[at] = item.row.trim();
      summary.updated.push(item.id);
    } else {
      impLines.splice(at, 1);
      impLines = removeProcedureSection(impLines, item.id);
      summary.deleted.push(item.id);
    }
  }
  const logs = {};
  for (const entry of logEntries) {
    const current = logs[entry.skill] ?? files.logs[entry.skill];
    logs[entry.skill] = `${current.replace(/\n*$/, "")}\n\n${entry.markdown.trim()}\n`;
    summary.logs.push(entry.skill);
  }
  let backlogLines = splitLines(files.backlog);
  for (const card of validCards) {
    const at = backlogLines.findIndex((l) => l.startsWith(`## ${card.tier}`));
    if (at < 0) {
      problems.push(`backlog に "## ${card.tier}" の節が無い`);
      return unchanged();
    }
    backlogLines = [...backlogLines.slice(0, at + 1), "", ...card.markdown.split("\n"), ...backlogLines.slice(at + 1)];
    summary.cards.push(card.id);
  }
  return { problems, improvements: impLines.join("\n"), backlog: backlogLines.join("\n"), logs, summary };
}
