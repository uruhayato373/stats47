---
name: feedback-workflow-worktree-base-and-deps
description: Workflow の isolation:'worktree' は今のブランチではなく古いコミットから切られ、node_modules も無い。prompt で起点の付け替えと依存の張り方を指定する (2026-10-28 に 5 体全員が手探りで直した)
metadata:
  type: feedback
---

**事象 (2026-10-28)**: 見本合わせの残りを Workflow で 5 体並行 (`isolation: 'worktree'`) に出したところ、5 体とも
worktree が `feature/template-base-ui` の HEAD ではなく別系統の古いマージ (`4874b969b`) から切られていた。仕様の表も
対象カードも無く、各自が `git checkout -B` で付け替えてから作業した。さらに worktree に `node_modules` が無く、
tsc が本体の checkout の node_modules (別の版) を読んで型エラーを出したので、各自が symlink を張った。
`@types` だけを張ると `@types/eslint` が先に解決されて `eslint-dependency-compatibility.test.ts` が落ちる。

**Why:** 起点と依存の用意を各 agent に任せると、5 体分の手探りでトークンと時間が乗り、張った symlink の後片付けも残る
(本体の node_modules を消す事故の型 → [[feedback-worktree-junction-deletes-target]])。

**How to apply:**
- Workflow で worktree を使うときは、prompt の冒頭に「最初に `git checkout -B <branch名> <起点 SHA>` を実行する」と起点 SHA を書く
- 依存は `node_modules` を丸ごと本体へ張らず、`@stats47/*` だけを worktree の packages へ張り直す ([[feedback-worktree-symlinked-node-modules-resolve-main]])。張る手順を prompt に書く
- 取り込みは agent のコミットを cherry-pick する。終わったら symlink を外してから worktree を消す (rm -rf で本体を消さない)
