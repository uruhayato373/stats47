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

  // 並行エージェント / branch-workflow (コマンド先頭のみ照合し、commit メッセージ中の言及では止めない)
  { pattern: /(?:^|[;&|(\n]\s*)git\s+add\s+(?:[^\s;&|()]+\s+)*(?:-A|--all|\.)(?=\s|$|[;&|)])/, reason: "git add -A / --all / . は禁止です (並行エージェントの WIP 混入防止)。対象ファイルを明示して add してください" },
  { pattern: /(?:^|[;&|(\n]\s*)git\s+push\b[^;&|\n]*\s(?:\S*:)?main(?=\s|$|[;&|)])/, reason: "main への直接 push は禁止です。develop→main は PR 経由のみ (.claude/rules/branch-workflow.md)" },
  { pattern: /(?:^|[;&|(\n]\s*)gh\s+pr\s+(?:merge\b|create\b[^;&|\n]*--base[=\s]+main(?=\s|$|[;&|)]))/, reason: "main へのマージは本番反映の判断で、オーナーの明示の指示が要ります。npm run release:status で状況を報告して確認してください。指示があるときは OWNER_APPROVED_RELEASE=1 を先頭に付けて実行します (.claude/rules/branch-workflow.md)" },

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
      "main マージは本番反映の判断。オーナーの指示なしに PR を開かない・merge しない。本番に効く変更は 1 日 1 回にまとめる。PR が開いている間は develop へ push しない。状況は npm run release:status。",
      "正典: .claude/rules/branch-workflow.md (Read すると全文が載る)",
    ].join("\n"),
  },
  {
    // スクリプト経由に加えて、区分表の止めを通らない直接コマンド (wrangler / aws s3) と、削除を伴う workflow の起動も拾う
    pattern:
      /\b(diff-push-r2|push-r2-wrangler|push-generated-image-set|push-exact-r2-assets|delete-r2-prefix|r2-retention|r2-cleanup-orphans|purge-cache-r2)\b|\bwrangler\s+r2\s+object\s+(put|delete)\b|\baws\s+s3\s+(cp|mv|rm|sync)\b|\bgh\s+workflow\s+run\b.*\b(r2-maintenance|cleanup-r2-sns-videos|r2-isr-gc)\b/,
    context: [
      "[r2-storage-design] R2 は remote が唯一の真実源。app/ 配下は URL 対応 snapshot 専用、手編集 JSON を SSOT にしない。",
      "承認なしでよい: 作り直せる生成物 (区分表で regenerable) の再生成と push、新しいキーの追加、dry-run、検査・再生成の workflow の起動。",
      "オーナーの承認が要る: 正本 (authoritative・未登録の prefix を含む) の上書きと削除、削除を伴う workflow、公開状態の変更。",
      "wrangler r2 object / aws s3 の直打ちは区分表の止めを通らないので使わず、diff-push-r2 などのスクリプトか workflow を使う。削除は r2-maintenance.yml の allowlist 経由のみ (dry-run 既定)。",
      "正典: .claude/rules/r2-storage-design.md「書き込みの承認」",
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

    // ログインの要る管理画面を読むスクリプト・browser-use を止め、代わりに読む記録を返す (2026-10-20)。
    // 判定と例外 (オーナーの依頼) は admin-read-guard.mjs。正典: .claude/rules/recorded-measurement-first.md
    const { pathToFileURL } = require("node:url");
    const guard = await import(pathToFileURL(require("node:path").join(__dirname, "../scripts/measurement/admin-read-guard.mjs")).href);
    const adminRead = guard.checkBashCommand(command);
    if (adminRead) {
      console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: adminRead,
          },
        }),
      );
      return;
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
