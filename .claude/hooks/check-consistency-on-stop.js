#!/usr/bin/env node
/**
 * Stop hook: 会話 (ターン) 完了時に agent/skill/script の整合性ドリフトを自発チェックさせる。
 *
 * 動作:
 *   - 標準入力で Claude Code が渡す JSON を読む (stop_hook_active を含む)。
 *   - stop_hook_active が true (既に本フックの block で再開された後) なら何もしない → 無限ループ防止。
 *   - check-agent-skill-consistency.cjs --gate を実行:
 *       exit 0 → 関連変更なし or 監査済み → 黙って通す。
 *       exit 2 → この会話で agent/skill/script/hook を変更し、かつ未監査 → block して reminder を返す。
 *   - block は {"decision":"block","reason": <gate 出力>} を stdout に出すことで実現 (Claude は reason を見て継続)。
 *
 * 監査を実施したら `--mark-audited` でマーカーが書かれ、次回の Stop では exit 0 になり黙る。
 * 配置: .claude/hooks/check-consistency-on-stop.js / 登録: .claude/settings.json hooks.Stop
 * 関連: .claude/scripts/lib/check-agent-skill-consistency.cjs / .claude/skills/dev/audit-consistency/SKILL.md
 */
"use strict";
const { execFileSync } = require("child_process");
const path = require("path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function readStdin() {
  try {
    return require("fs").readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  // 1) ループ防止: 本フックの block で再開された stop なら即終了
  let input = {};
  try {
    input = JSON.parse(readStdin() || "{}");
  } catch {
    input = {};
  }
  if (input.stop_hook_active) process.exit(0);

  // 2) ゲート実行
  const checker = path.join(projectDir, ".claude/scripts/lib/check-agent-skill-consistency.cjs");
  let gateOut = "";
  let exitCode = 0;
  try {
    gateOut = execFileSync("node", [checker, "--gate"], {
      cwd: projectDir,
      encoding: "utf8",
      timeout: 20000,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    });
  } catch (e) {
    // execFileSync は非0 exit で throw する。status===2 が「未監査ドリフトあり」
    exitCode = typeof e.status === "number" ? e.status : 0;
    gateOut = (e.stdout || "").toString();
    if (exitCode !== 2) process.exit(0); // 想定外エラーは通す (チェックで作業を止めない)
  }

  if (exitCode === 2 && gateOut.trim()) {
    // block して reason を Claude に渡す → エージェントが継続して監査を実施する
    process.stdout.write(
      JSON.stringify({
        decision: "block",
        reason: gateOut.trim(),
      })
    );
    process.exit(0);
  }

  process.exit(0);
}

main();
