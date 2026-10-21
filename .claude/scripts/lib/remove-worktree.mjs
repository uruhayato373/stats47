#!/usr/bin/env node
/**
 * git worktree を安全に取り除く (2026-09-14)。
 *
 *   node .claude/scripts/lib/remove-worktree.mjs <worktree-path> [--force]
 *
 * 背景: `git worktree remove` は worktree の登録を外すだけで、対象ディレクトリの削除に
 * 失敗することがある (Windows のファイルロック等)。従来はその後始末を bash の `rm -rf` に
 * 頼っていたが、Git Bash (MSYS) はパスを書き換えることがあり、2026-09-14 に
 * `rm -rf "C:/tmp/stats47-*"` の実行中にメインの working tree (`apps/admin/` 配下 5,268
 * ファイル) を巻き込んで削除する事故が起きた (commit は無傷だったため `git checkout -- .`
 * で復旧)。この script は bash を経由せず Node の `fs.rmSync` だけでパスを解決するため、
 * シェルのパス変換が原理的に起こらない。
 *
 * 手順: (1) 対象が登録済み worktree であることを確認 (無関係なパスを渡す事故を防ぐ)、
 *       (2) `git worktree remove [--force]`、(3) ディレクトリが残っていれば `fs.rmSync`。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export function listWorktreePaths(root = ROOT) {
  const output = execFileSync("git", ["worktree", "list", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
    timeout: 15000,
    windowsHide: true,
  });
  return [...output.matchAll(/^worktree (.+)$/gm)].map((m) => path.resolve(m[1]));
}

// 比較専用の正規化。macOS の一時ディレクトリは /var → /private/var の symlink で、git は実パスを返す
// (2026-10-20 REMOVE-WORKTREE-TEST-MAC-PATH-01)。削除対象とリンク検査には正規化前のパスを使う。
function canonical(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

function isRegistered(root, resolved) {
  return listWorktreePaths(root).map(canonical).includes(canonical(resolved));
}

export function removeWorktree(target, { force = false, root = ROOT } = {}) {
  const resolved = path.resolve(target);
  const known = listWorktreePaths(root).map(canonical);
  const key = canonical(resolved);
  if (!known.includes(key)) {
    throw new Error(`${resolved} は登録済み worktree ではない (known: ${known.join(", ")})`);
  }
  if (known[0] === key || canonical(root) === key) {
    throw new Error("メインの working tree は削除できない");
  }
  if (known.some((entry) => entry !== key && entry.startsWith(key + path.sep))) {
    throw new Error("他の登録済み worktree を内包するディレクトリは削除できない");
  }
  if (fs.lstatSync(resolved).isSymbolicLink()) {
    throw new Error("worktree の削除対象がリンクに置き換わっています");
  }
  const args = ["worktree", "remove", resolved];
  if (force) args.push("--force");
  try {
    execFileSync("git", args, { cwd: root, encoding: "utf8", timeout: 30000, windowsHide: true });
  } catch (error) {
    // git 自身がディレクトリを消せなかっただけなら続行し、下の fs.rmSync に任せる。
    // (worktree の登録解除自体が失敗した場合はここで投げ直す)
    // dirty / locked / 権限エラーで登録が残るなら、Gitの拒否を尊重する。
    // 存在確認だけではdirty worktreeの未保存変更まで強制削除してしまう。
    if (isRegistered(root, resolved) || !fs.existsSync(resolved)) throw error;
  }
  let residual = false;
  if (fs.existsSync(resolved)) {
    if (isRegistered(root, resolved) || fs.lstatSync(resolved).isSymbolicLink()) {
      throw new Error("登録またはリンクが残るため後処理を停止しました");
    }
    residual = true;
    // bash の rm -rf は使わない (MSYS のパス変換で無関係なディレクトリを巻き込みうる)。
    fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3 });
  }
  return { path: resolved, residual, stillExists: fs.existsSync(resolved) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  const force = process.argv.includes("--force");
  if (!target) {
    console.error("usage: node .claude/scripts/lib/remove-worktree.mjs <worktree-path> [--force]");
    process.exit(2);
  }
  try {
    const result = removeWorktree(target, { force });
    console.log(
      `✓ removed ${result.path}` +
        (result.residual ? ` (git worktree remove がディレクトリを残したため fs.rmSync で回収)` : "") +
        (result.stillExists ? " ⚠ 一部ファイルが削除できず残存 (手動確認が必要)" : ""),
    );
    process.exit(result.stillExists ? 1 : 0);
  } catch (error) {
    console.error(`✗ ${error.message}`);
    process.exit(1);
  }
}
