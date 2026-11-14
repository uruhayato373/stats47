/**
 * setup-memory-symlink の契約。
 * スクリプトは自分の置き場からリポジトリのルートを数えて memory のリンク先を決める。置き場を移して階層の数を
 * 直し忘れると、別のディレクトリの名前で ~/.claude/projects/<hash>/memory を探し、--check が常に未設定と答える。
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { globalMemoryPath, projectHash } from "../setup-memory-symlink.mjs";

const ROOT = resolve(fileURLToPath(new URL("../../../..", import.meta.url)));
const SCRIPT = join(ROOT, ".claude/scripts/lib/setup-memory-symlink.mjs");

test("リンクを張る先は、このリポジトリのルートの絶対パスから作った名前のディレクトリである", () => {
  assert.equal(globalMemoryPath(undefined, "/home/me"), join("/home/me", ".claude", "projects", projectHash(ROOT), "memory"));
});

test("絶対パスの : \\ / . を - に置き換えて Claude Code のプロジェクト名にする", () => {
  assert.equal(projectHash("/Users/me/stats47"), "-Users-me-stats47");
  assert.equal(projectHash("C:\\Users\\me\\stats47"), "C--Users-me-stats47");
  assert.equal(projectHash("/Users/me/stats47/.claude/worktrees/a"), "-Users-me-stats47--claude-worktrees-a");
});

test("--check は何も書かず、このリポジトリの .claude/memory を指して答える", () => {
  const home = join(ROOT, "node_modules", ".cache", "no-such-home-for-memory-symlink-test");
  const run = spawnSync(process.execPath, [SCRIPT, "--check"], { encoding: "utf8", env: { ...process.env, HOME: home, USERPROFILE: home } });
  assert.equal(run.status, 1, run.stderr);
  assert.ok(run.stdout.includes(join(ROOT, ".claude", "memory")), run.stdout);
  assert.ok(!existsSync(home), "--check が HOME にディレクトリを作った");
});

test(".claude/scripts/ の直下には残っていない (DG088 の許可リストから外した)", () => {
  assert.ok(!existsSync(join(ROOT, ".claude/scripts/setup-memory-symlink.mjs")));
});
