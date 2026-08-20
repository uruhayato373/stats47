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

/**
 * Windows (会社 PC) 限定でブロックするコマンド。
 *
 * 2026-07-28 実測: 兵庫県庁ネットワークは i-FILTER が透過 TLS 傍受しており、
 * Node の直接 fetch は CA を信頼させても HTTP 503 のブロックページが返る
 * (正規の出口は HTTPS_PROXY の明示 CONNECT のみ)。stats47 はほぼ全ページが R2 依存のため
 * dev サーバーを起動しても home featured 等が空になり、確認手段として役に立たない。
 * 検証は CI + 本番実測で行う。詳細: .claude/rules/local-environment.md
 */
// `CMD_START` = 実際にコマンドとして起動される位置のみに限定する。
// これが無いと commit メッセージや grep パターンに "npm run dev" の文字列が
// 含まれるだけでブロックされる (2026-07-28 に本 hook を追加した commit 自身が
// ブロックされた)。文中の言及は通し、実行だけを止める。
const CMD_START = String.raw`(?:^|[;&|(]\s*|\n\s*|&&\s*|\|\|\s*)`;
const WINDOWS_BLOCKED_PATTERNS = [
  {
    pattern: new RegExp(CMD_START + String.raw`(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?dev(?::[\w-]+)?(?:\s|$)`),
    reason:
      "会社 Windows PC では dev サーバーを起動しません。i-FILTER の透過 TLS 傍受により Node の R2 fetch が 503 でブロックされ、" +
      "stats47 はほぼ全ページが R2 依存のため確認手段になりません。検証は CI (workflow) と本番 URL の実測で行ってください " +
      "(正典: .claude/rules/local-environment.md)。",
  },
  {
    pattern: new RegExp(CMD_START + String.raw`(?:npx\s+)?(?:next\s+dev|turbo\s+run\s+dev)\b`),
    reason:
      "会社 Windows PC では dev サーバーを起動しません (i-FILTER の TLS 傍受で R2 が読めないため)。" +
      "検証は CI + 本番実測で行ってください (正典: .claude/rules/local-environment.md)。",
  },
];

async function main() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  try {
    const { tool_input } = JSON.parse(input);
    const command = tool_input?.command || "";

    if (process.platform === "win32") {
      for (const { pattern, reason } of WINDOWS_BLOCKED_PATTERNS) {
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
    }

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
