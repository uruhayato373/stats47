#!/usr/bin/env node
/**
 * auto memory を repo 内 .claude/memory に集約し、Claude Code のグローバル memory パス
 * (~/.claude/projects/<hash>/memory) をそこへリンクする。
 *
 * 別 PC で clone した直後に 1 回実行すると、git で共有された memory をそのマシンの
 * Claude Code が読み書きできるようになる。純 Node なので Windows / macOS / Linux で同じ挙動
 * (旧 .sh 版は MSYS の `ln -s` がコピーになり、`/c/...` 形式で hash を誤算していた)。
 *
 * 仕組み: Claude Code は cwd の絶対パスの `:` `\` `/` `.` を `-` に置換した名前で
 *   ~/.claude/projects/<hash>/memory にプロジェクト別 memory を置く
 *   (例: C:\Users\me\stats47 → C--Users-me-stats47、/Users/me/stats47 → -Users-me-stats47)。
 *
 * 冪等。既存の実ディレクトリは repo に無いファイルだけ取り込んでから <path>.bak.<epoch> に退避し、
 * Windows は junction (管理者権限不要)、それ以外は symlink を張る。
 *
 *   node .claude/scripts/setup-memory-symlink.mjs
 *   node .claude/scripts/setup-memory-symlink.mjs --check   # 張られているかだけ確認 (exit 1 で未設定)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_MEM = path.join(REPO_ROOT, ".claude", "memory");

export function projectHash(absolutePath) {
  return absolutePath.replace(/[:\\/.]/g, "-");
}

export function globalMemoryPath(repoRoot = REPO_ROOT, home = os.homedir()) {
  return path.join(home, ".claude", "projects", projectHash(repoRoot), "memory");
}

function linkTarget(p) {
  try {
    if (!fs.lstatSync(p).isSymbolicLink()) return null;
    return fs.realpathSync(p);
  } catch {
    return null;
  }
}

function main(argv = process.argv.slice(2)) {
  const globalMem = globalMemoryPath();
  const linked = linkTarget(globalMem) === fs.realpathSync(REPO_MEM);
  if (argv.includes("--check")) {
    console.log(`${linked ? "✓" : "✗"} ${globalMem} → ${REPO_MEM}`);
    return linked ? 0 : 1;
  }
  fs.mkdirSync(REPO_MEM, { recursive: true });
  fs.mkdirSync(path.dirname(globalMem), { recursive: true });
  if (linked) {
    console.log(`✓ already linked: ${globalMem} -> ${REPO_MEM}`);
    return 0;
  }
  const stat = fs.existsSync(globalMem) ? fs.lstatSync(globalMem) : null;
  if (stat && !stat.isSymbolicLink()) {
    // repo に無いファイルだけ取り込む (repo の方が正典)。取り込んだ分は git で共有できるよう commit する。
    let imported = 0;
    for (const name of fs.readdirSync(globalMem)) {
      const src = path.join(globalMem, name);
      const dst = path.join(REPO_MEM, name);
      if (!fs.statSync(src).isFile() || fs.existsSync(dst)) continue;
      fs.copyFileSync(src, dst);
      imported++;
      console.log(`→ imported into repo memory: ${name}`);
    }
    const backup = `${globalMem}.bak.${Date.now()}`;
    fs.renameSync(globalMem, backup);
    console.log(`→ moved existing directory to ${backup} (imported ${imported})`);
  } else if (stat) {
    fs.unlinkSync(globalMem);
  }
  fs.symlinkSync(REPO_MEM, globalMem, process.platform === "win32" ? "junction" : "dir");
  const files = fs.readdirSync(REPO_MEM).filter((f) => f.endsWith(".md")).length;
  console.log(`✓ linked: ${globalMem} -> ${REPO_MEM}`);
  console.log(`  memory files: ${files}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
