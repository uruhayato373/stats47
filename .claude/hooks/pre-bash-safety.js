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
 * 注意喚起 (deny しない)。
 *
 * 2026-09-08 に `.claude/rules/` を paths: 条件付き読み込みへ切り替えた。paths 付き rule は
 * Claude が一致ファイルを Read したときだけ context に載るため、チャットから git push / deploy /
 * R2 push / SNS 投稿を Bash で直打ちした経路では branch-workflow 等の規律が読まれていない。
 * その経路だけ、正典の要約と参照先を additionalContext で返して補償する。
 * permission 判定は変えない (deny も allow もしない)。
 */
const ADVISORY_PATTERNS = [
  {
    pattern: /\bgit\s+push\b|\bgh\s+pr\s+(create|merge)\b|\bgh\s+workflow\s+run\b.*deploy/,
    context: [
      "[branch-workflow] develop→main は PR 経由のみ。main 直 push 禁止。",
      "commit 件名に skip-ci 系トークンを引用しない (run が 0 件になる)。merge 後に rebase しない。",
      "本番反映 (deploy / main マージ) は outward-facing。明示指示が無ければ実行前に確認する。",
      "正典: .claude/rules/branch-workflow.md (Read すると全文が載る)",
    ].join("\n"),
  },
  {
    pattern: /\b(diff-push-r2|push-r2-wrangler|push-generated-image-set|push-exact-r2-assets|delete-r2-prefix|r2-retention)\b/,
    context: [
      "[r2-storage-design] R2 は remote が唯一の真実源。app/ 配下は URL 対応 snapshot 専用、手編集 JSON を SSOT にしない。",
      "削除は r2-maintenance.yml の allowlist 経由のみ (dry-run 既定)。本番反映は確認してから。",
      "正典: .claude/rules/r2-storage-design.md",
    ].join("\n"),
  },
  {
    pattern: /\b(publish-x|post-instagram|post-from-schedule|publish-note)\b/,
    context: [
      "[sns-content-standards] 頻度上限 (X 1日3本・IG 25/24h)、TikTok 投稿禁止、posts.json は store 経由のみ。",
      "投稿は outward-facing。ユーザーの明示指示が無ければ draft / 予約止まりにする。",
      "正典: .claude/rules/sns-content-standards.md",
    ].join("\n"),
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

    const advisories = ADVISORY_PATTERNS.filter(({ pattern }) => pattern.test(command));
    if (advisories.length > 0) {
      console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            additionalContext: advisories.map((a) => a.context).join("\n\n"),
          },
        }),
      );
      return;
    }
    // pass: 何も出力しない (通常の permission フローに委ねる。auto-approve しない)
  } catch {
    // パースエラー時は素通し（フックがブロッカーにならないように）
  }
}

main();
