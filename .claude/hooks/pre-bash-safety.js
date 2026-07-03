#!/usr/bin/env node

/**
 * PreToolUse hook: Bash コマンドの安全性チェック
 *
 * 危険なコマンド（データ損失・シークレット漏洩リスク）を検出してブロックする。
 * Claude Code の hooks.PreToolUse で実行される。
 *
 * 入力: stdin から JSON { tool_name, tool_input: { command } }
 * 出力: block 時のみ stdout に hookSpecificOutput.permissionDecision="deny" を返す
 *       (旧 { decision } 形式は deprecated のため 2026-07-03 に現行スキーマへ更新)
 */

const DANGEROUS_PATTERNS = [
  // データ損失
  { pattern: /rm\s+-rf\s+[\/~]/, reason: "rm -rf でルートまたはホームを削除しようとしています" },
  { pattern: /git\s+push\s+--force(?!-with-lease)/, reason: "git push --force はリモート履歴を破壊します (--force-with-lease は許可)" },
  { pattern: /git\s+reset\s+--hard/, reason: "git reset --hard は未コミット変更を破棄します" },
  { pattern: /DROP\s+TABLE/i, reason: "DROP TABLE はデータを完全に削除します" },
  { pattern: /DROP\s+DATABASE/i, reason: "DROP DATABASE はデータベースを完全に削除します" },
  { pattern: /TRUNCATE\s+TABLE/i, reason: "TRUNCATE TABLE は全行を削除します" },
  { pattern: /git\s+clean\s+-fd/, reason: "git clean -fd は追跡されていないファイルを削除します" },

  // シークレット漏洩
  { pattern: /cat\s+\.env/, reason: ".env ファイルの内容がコンソールに出力されます" },
  { pattern: /echo\s+.*\$(ESTAT_API_KEY|SECRET|PASSWORD|TOKEN)/i, reason: "シークレットがコンソールに出力される可能性があります" },
  { pattern: /curl.*(-d|--data).*\b(key|token|secret|password)\b/i, reason: "シークレットが HTTP リクエストに含まれる可能性があります" },
];

async function main() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  try {
    const { tool_input } = JSON.parse(input);
    const command = tool_input?.command || "";

    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        console.log(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason: reason,
            },
          }),
        );
        return;
      }
    }
    // pass: 何も出力しない (通常の permission フローに委ねる。auto-approve しない)
  } catch {
    // パースエラー時は素通し（フックがブロッカーにならないように）
  }
}

main();
