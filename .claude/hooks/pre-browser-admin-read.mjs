#!/usr/bin/env node
/**
 * PreToolUse hook: ブラウザ MCP (claude-in-chrome / Claude_Browser / chrome-devtools) で、
 * ログインの要る管理画面を読むために開く操作を止め、代わりに読む記録を返す (2026-10-20)。
 * 判定は .claude/scripts/measurement/admin-read-guard.mjs。正典: .claude/rules/recorded-measurement-first.md
 *
 * 入力: stdin から JSON { tool_name, tool_input }
 * 出力: 止めるときだけ hookSpecificOutput.permissionDecision="deny"。入力が読めなければ素通し。
 */
import { checkBrowserInput } from '../scripts/measurement/admin-read-guard.mjs';

let input = '';
for await (const chunk of process.stdin) input += chunk;
try {
  const reason = checkBrowserInput(JSON.parse(input).tool_input);
  if (reason) {
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
  }
} catch {
  // 入力が読めなければ素通し (フックがブロッカーにならないように)
}
