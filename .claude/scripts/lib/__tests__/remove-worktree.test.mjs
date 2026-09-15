import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { listWorktreePaths, removeWorktree } from "../remove-worktree.mjs";

// 実 git repo + 実 worktree を使う: シェルのパス変換で無関係なディレクトリを巻き込んだ
// 2026-09-14 の事故 (bash rm -rf) の再発防止が目的なので、モックではなく本物の
// `git worktree add/remove` と `fs.rmSync` の組み合わせを検証する。
function initRepo(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "stats47-worktree-test-")));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.email", "test@example.com"]);
  git(["config", "user.name", "test"]);
  fs.writeFileSync(path.join(root, "README.md"), "root\n");
  git(["add", "."]);
  git(["commit", "-q", "-m", "init"]);
  return { root, git };
}

test("登録済み worktree を丸ごと削除する (正常系)", (t) => {
  const { root, git } = initRepo(t);
  const wtPath = path.join(os.tmpdir(), `stats47-worktree-test-wt-${process.pid}-${Date.now()}`);
  t.after(() => fs.rmSync(wtPath, { recursive: true, force: true }));
  git(["worktree", "add", "-b", "feature/x", wtPath]);
  assert.ok(fs.existsSync(wtPath));
  assert.ok(listWorktreePaths(root).includes(fs.realpathSync(wtPath)));

  const expected = path.resolve(wtPath);
  const result = removeWorktree(wtPath, { root });
  assert.equal(result.stillExists, false);
  assert.ok(!fs.existsSync(wtPath), "ディレクトリが消えている");
  assert.ok(!listWorktreePaths(root).includes(expected));
});

test("登録されていないパスは拒否する (無関係なディレクトリを誤爆させない)", (t) => {
  const { root } = initRepo(t);
  const outsider = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-worktree-test-outsider-"));
  t.after(() => fs.rmSync(outsider, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outsider, "keep.txt"), "do not touch");

  assert.throws(() => removeWorktree(outsider, { root }), /登録済み worktree ではない/);
  assert.ok(fs.existsSync(path.join(outsider, "keep.txt")), "無関係なファイルは残る");
});

test("メインの working tree 自体は削除できない", (t) => {
  const { root } = initRepo(t);
  assert.throws(() => removeWorktree(root, { root }), /メインの working tree/);
  assert.ok(fs.existsSync(path.join(root, "README.md")));
});

test("Gitが未保存変更を理由に拒否したworktreeは、登録もファイルも残す", (t) => {
  const { root, git } = initRepo(t);
  const wtPath = path.join(root, "dirty-worktree");
  git(["worktree", "add", "-b", "feature/dirty", wtPath]);
  fs.writeFileSync(path.join(wtPath, "README.md"), "unsaved work\n");
  assert.throws(() => removeWorktree(wtPath, { root }));
  assert.equal(fs.readFileSync(path.join(wtPath, "README.md"), "utf8"), "unsaved work\n");
  assert.ok(listWorktreePaths(root).includes(fs.realpathSync(wtPath)));
});

test("別worktreeから呼んでもメインの作業場所を削除できない", (t) => {
  const { root, git } = initRepo(t);
  const wtPath = path.join(root, "secondary");
  git(["worktree", "add", "-b", "feature/secondary", wtPath]);
  assert.throws(() => removeWorktree(root, { root: wtPath, force: true }), /メインの working tree/);
  assert.equal(fs.readFileSync(path.join(root, "README.md"), "utf8"), "root\n");
});
