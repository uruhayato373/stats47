#!/usr/bin/env node
/**
 * claude-code-base-action の execution log から「なぜ落ちたか」だけを取り出す。
 *
 * ★なぜ要るか (2026-08-02)
 * ai-content / blog の日次生成は `show_full_output: false` で走らせている (assistant 本文や
 * tool 出力に secret が混ざる事故を避けるため)。この判断自体は正しいが、**失敗理由まで
 * 捨てている**ため run が赤いのに原因が一切分からない状態だった。実際 2026-08-02 の初回実行は
 * 両方とも `is_error: true / num_turns: 1 / total_cost_usd: 0` としか分からず、
 * 認証なのか利用上限なのかモデルなのかを切り分けられなかった。
 *
 * そこで「全部出す」でも「何も出さない」でもなく、**切り分けに要る最小限だけ**を出す:
 *   - result entry の構造フィールド (subtype / is_error / num_turns / duration / cost)
 *   - エラー文字列 (truncate + 秘匿値の伏字)
 *   - tool を 1 度でも呼べたか (呼べていなければ生成以前の問題)
 *
 * 早期失敗 (num_turns <= EARLY_TURN_LIMIT) のときだけ assistant 本文も見る。この段階の本文は
 * ほぼ API のエラー文であり、記事本文や観測値ではないため。逆に生成が進んだ後の本文は出さない。
 */

import { pathToFileURL } from "node:url";
const MAX_TEXT = 600;
const EARLY_TURN_LIMIT = 2;

/** 秘匿値らしき文字列を伏せる。誤検知で伏せ過ぎる方に倒す (読めない方が漏らすより安全)。 */
export function redact(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\b(sk-[A-Za-z0-9_-]{8,})/g, '[REDACTED]')
    .replace(/\b(ghp_|gho_|ghs_|github_pat_)[A-Za-z0-9_]{8,}/g, '[REDACTED]')
    .replace(/\b[A-Za-z0-9_-]{40,}\b/g, '[REDACTED]')
    .replace(/("?(?:token|secret|key|authorization|password)"?\s*[:=]\s*)("?)[^"\s,}]+/gi, '$1$2[REDACTED]');
}

function truncate(text, max = MAX_TEXT) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}… (${text.length - max} 文字省略)`;
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((part) => part && part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n');
}

/**
 * @param {unknown} entries execution log (message オブジェクトの配列)
 * @returns 切り分けに要る最小限のサマリ
 */
const TOKEN_FIELDS = {
  input: 'input_tokens',
  output: 'output_tokens',
  cacheWrite: 'cache_creation_input_tokens',
  cacheRead: 'cache_read_input_tokens',
};

const int = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);

/**
 * usage を 1 つ取り出す。result entry のものを最優先し、無ければ assistant メッセージの合計を使う。
 *
 * ★合計してはいけない: cacheRead は大幅に割引されるので input/output と足すと桁が壊れる
 *   (実測でセッション全体の 98% が cacheRead だった)。4 つを別々に持つ。
 */
function collectTokens(list) {
  const result = list.find((e) => e.type === 'result');
  const direct = result?.usage;
  if (direct && typeof direct === 'object') {
    const out = {};
    for (const [key, field] of Object.entries(TOKEN_FIELDS)) out[key] = int(direct[field]);
    if (Object.values(out).some((v) => v > 0)) return { ...out, source: 'result' };
  }
  // fallback: assistant メッセージ単位の usage を合算する
  const sum = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };
  let seen = 0;
  for (const entry of list) {
    const u = entry.message?.usage ?? entry.usage;
    if (!u || typeof u !== 'object') continue;
    seen += 1;
    for (const [key, field] of Object.entries(TOKEN_FIELDS)) sum[key] += int(u[field]);
  }
  if (seen === 0) return { ...sum, source: null }; // 記録が無い。0 と区別できるよう source で示す
  return { ...sum, source: 'messages' };
}

export function summarizeClaudeExecution(entries) {
  const list = Array.isArray(entries) ? entries.filter((e) => e && typeof e === 'object') : [];
  const byType = {};
  let toolUseCount = 0;
  const agentTypes = new Set();

  for (const entry of list) {
    const type = typeof entry.type === 'string' ? entry.type : 'unknown';
    byType[type] = (byType[type] ?? 0) + 1;
    const content = entry.message?.content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part && part.type === 'tool_use') {
          toolUseCount += 1;
          if (part.name === 'Agent' && typeof part.input?.subagent_type === 'string') {
            agentTypes.add(part.input.subagent_type);
          }
        }
      }
    }
  }

  // 起動したが結果が返っていない Agent を数える。
  //
  // ★これが CI 特有の最頻の失敗形 (2026-08-09 の ai-content run 31342281865)。
  // Agent tool の既定は background なので、`run_in_background: false` を付けずに複数起動して
  // 「完了通知を待ちます」とターンを終えると、CI には次のターンが無いのでそこで run が終わる。
  // Claude 自身は is_error=false で正常終了するため、成果 0 件の理由が log から読み取りにくい。
  // tool_use に対応する tool_result が無い = 未完了、という決定可能な形で名指しする。
  const agentUses = new Map(); // tool_use_id → subagent_type
  const resolvedIds = new Set();
  for (const entry of list) {
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      if (part.type === 'tool_use' && part.name === 'Agent' && typeof part.id === 'string') {
        agentUses.set(part.id, part.input?.subagent_type ?? 'unknown');
      } else if (part.type === 'tool_result' && typeof part.tool_use_id === 'string') {
        resolvedIds.add(part.tool_use_id);
      }
    }
  }
  const unfinishedAgents = [...agentUses]
    .filter(([id]) => !resolvedIds.has(id))
    .map(([, subagentType]) => subagentType)
    .sort();

  const result = list.find((entry) => entry.type === 'result') ?? null;
  const numTurns = typeof result?.num_turns === 'number' ? result.num_turns : null;

  const rawError =
    (typeof result?.error === 'string' && result.error) ||
    (typeof result?.result === 'string' && result.result) ||
    (typeof result?.message === 'string' && result.message) ||
    '';

  // 早期失敗のときだけ assistant 本文を覗く (この段階の本文は実質 API エラー文)
  let earlyAssistantText = '';
  if (result?.is_error === true && (numTurns === null || numTurns <= EARLY_TURN_LIMIT)) {
    const assistants = list.filter((entry) => entry.type === 'assistant');
    const last = assistants[assistants.length - 1];
    earlyAssistantText = textOf(last?.message?.content);
  }

  return {
    found: result !== null,
    isError: result?.is_error === true,
    subtype: typeof result?.subtype === 'string' ? result.subtype : null,
    numTurns,
    durationMs: typeof result?.duration_ms === 'number' ? result.duration_ms : null,
    totalCostUsd: typeof result?.total_cost_usd === 'number' ? result.total_cost_usd : null,
    permissionDenials:
      typeof result?.permission_denials_count === 'number' ? result.permission_denials_count : null,
    toolUseCount,
    agentTypes: [...agentTypes].sort(),
    unfinishedAgents,
    tokens: collectTokens(list),
    entryCounts: byType,
    errorText: truncate(redact(rawError)),
    earlyAssistantText: truncate(redact(earlyAssistantText)),
  };
}

/** 人が読む 1 画面のレポート。GITHUB_STEP_SUMMARY にもそのまま貼れる。 */
export function formatSummary(summary) {
  const lines = [];
  if (!summary.found) {
    lines.push('result entry が無い。Claude Code が起動前に落ちた可能性がある。');
    lines.push(`entry 種別: ${JSON.stringify(summary.entryCounts)}`);
    return lines.join('\n');
  }
  lines.push(
    `is_error=${summary.isError} subtype=${summary.subtype} turns=${summary.numTurns} ` +
      `duration=${summary.durationMs}ms cost=$${summary.totalCostUsd} denials=${summary.permissionDenials}`,
  );
  lines.push(`tool_use=${summary.toolUseCount} 回 / agent=${summary.agentTypes.join(',') || 'なし'}`);
  const t = summary.tokens;
  if (t.source === null) {
    lines.push('token: 記録なし (0 ではなく未取得)');
  } else {
    const n = (v) => v.toLocaleString('en-US');
    lines.push(
      `token: in=${n(t.input)} out=${n(t.output)} cache_write=${n(t.cacheWrite)} ` +
        `cache_read=${n(t.cacheRead)} (${t.source})`,
    );
  }
  lines.push(`entry 種別: ${JSON.stringify(summary.entryCounts)}`);
  if (summary.errorText) lines.push(`\n[error]\n${summary.errorText}`);
  if (summary.earlyAssistantText) lines.push(`\n[早期 assistant 本文]\n${summary.earlyAssistantText}`);
  // 成功 run で「エラー文が無い」と言わない (正常な状態を異常のように見せない)
  if (summary.isError && !summary.errorText && !summary.earlyAssistantText) {
    lines.push('\nエラー文が log に無い。切り分けには show_full_output: "true" での再実行が要る。');
  }
  // 未完了 agent は is_error に関係なく報告する。この形の失敗は Claude 自身が
  // 正常終了 (is_error=false) するので、is_error で条件を絞ると一番見たいときに出ない。
  if (summary.unfinishedAgents.length > 0) {
    const counts = {};
    for (const t of summary.unfinishedAgents) counts[t] = (counts[t] ?? 0) + 1;
    lines.push(
      `\n[未完了 agent] ${summary.unfinishedAgents.length} 件が結果を返さないまま終了: ` +
        `${JSON.stringify(counts)}`,
    );
    lines.push(
      'Agent tool の既定は background。CI には次のターンが無いので、' +
        '`run_in_background: false` を付けずに起動して完了を待つとそこで run が終わる。',
    );
  }
  // ここは推測を出さず観測事実だけを述べる (原因の断定は人が実測してから)
  if (summary.isError && summary.toolUseCount === 0) {
    lines.push('\ntool を 1 度も呼べていない = 生成内容ではなく起動・認証・上限の側の問題。');
  }
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { readFileSync } = await import('node:fs');
  const path = process.argv[2];
  if (!path) {
    console.error('usage: summarize-claude-execution.mjs <execution-log.json>');
    process.exit(2);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.log(`execution log を読めない (${path}): ${error instanceof Error ? error.message : error}`);
    process.exit(0); // 診断は本体の失敗理由を上書きしない
  }
  console.log(formatSummary(summarizeClaudeExecution(parsed)));
}
