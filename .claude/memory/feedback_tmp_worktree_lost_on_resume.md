---
name: feedback-tmp-worktree-lost-on-resume
description: scratchpad (/private/tmp) に置いた worktree と計算はセッションの再開で消える。未コミットを残さず、worktree はリポジトリ内に置く
metadata:
  type: feedback
---

worktree は `.claude/worktrees/` などリポジトリの中に作り、節目ごとにコミットする。scratchpad (`/private/tmp/claude-501/...`) に置いた worktree と作業ファイルは、セッションの再開で丸ごと消える。

**Why:** 2026-11-08 にセッションを再開したら、scratchpad の worktree `wt-runner` と手元の検証の計算 `m01x` が消えていた。コミット済みのブランチは `.git` に残ったが、未コミットの実行役の修正と、サブエージェントが作った M01 の拡張の分析スクリプトが失われた。修正は会話に残っていた差分から当て直せたが、分析スクリプトは作り直しになった。
**How to apply:** 長い作業の worktree はリポジトリ内に置き、検査が通るたびにコミットする (WIP でよい)。再現に必要な計算は scratchpad ではなくブランチに入れる。サブエージェントに作らせた成果は、報告を受けたらすぐコミットさせる。
