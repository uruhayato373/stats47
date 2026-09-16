---
name: feedback_worktree_junction_deletes_target
description: Windows で worktree に node_modules の junction を張ると git worktree remove --force が junction を辿って本体の node_modules を消す (2026-09-16 実害)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 25c64819-e748-4f3b-b5b5-bfadbbdb02f7
  modified: 2026-09-16T08:09:27.381Z
---

**事象 (2026-09-16)**: 共有作業ツリーの pre-commit が別セッションの未コミット編集で落ちたため、
`origin/develop` ベースの一時 worktree でコミットしようとし、pre-commit に必要な `node_modules` を
`New-Item -ItemType Junction` で本体から worktree へ張った。コミット・push は成功したが、後片付けの
`git worktree remove --force` が **junction を辿って本体の `apps/{web,admin,ges,remotion}/node_modules` の
中身を削除**した (root `node_modules` の junction で EINVAL になり中断したため root と packages 配下は無事)。
失われたのは lockfile 上の nested 4 件 (`apps/web`・`apps/admin` の `@types/node@20`、`apps/ges` の
`better-sqlite3@11`、`apps/remotion` の `zod@4`) と各 `.bin`。復旧は `npm install` (lockfile と一致していれば
差分だけ入る) だが、`local-environment.md` の排他ルールで別セッション稼働中は開始できない。

**Why**: Git for Windows の再帰削除は junction を通常ディレクトリとして再帰する (symlink 扱いにならない)。
PowerShell の `Remove-Item -Recurse` も同じ。junction の安全な削除は `cmd /c rmdir <junction>` だけ。

**How to apply**:
- worktree に `node_modules` を junction で共有しない。pre-commit が要るなら (a) 別セッションの
  完了を待って本体でコミットする、(b) worktree で `npm ci` する、(c) オーナーに `--no-verify` の可否を聞く、
  の順で選ぶ。
- やむを得ず junction を張ったら、`git worktree remove` / `rm -rf` / `Remove-Item -Recurse` の**前に**
  必ず `cmd /c rmdir` で全 junction を外し、`Get-ChildItem -Recurse -Force | ? Attributes -band ReparsePoint`
  が 0 件であることを確認する。
- 共有作業ツリーの pre-commit が「自分の staged 分ではなく別セッションの working tree」で落ちるケース
  (card census 等は working tree 全体を走査する) は、まず `git diff --cached` と gate の対象を切り分けて
  報告し、回避策の副作用を先に考える。関連: [[feedback_shared_working_copy_git_race]]
