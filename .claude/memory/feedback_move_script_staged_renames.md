---
name: feedback_move_script_staged_renames
description: 移動の道具 (claude:scripts:move --apply) は git mv で改名を index に載せる。移動の後に別の commit を先に作ると改名が混ざり、縮小専用の基準の検査が落ちる (2026-11-21)
metadata:
  type: feedback
---

**事象 (2026-11-21)**: open-data を移した後、先に台帳の 1 行の修正を `git add config/datasets.mjs && git commit` で commit した。
道具が `git mv` で index に載せていた改名 23 件がこの commit に混ざり、件名と中身が食い違った。さらに地域コードの検査
(`packages/area/scripts/check-area-year-entrypoint.mjs`) は「1 つ前の commit」と基準を比べ、改名を -M で追うので、
1 つ前の commit に新しいパスが既にあると基準のキーの付け替えが「新しいキーの追加」に見え、Develop Quality Gate が落ちた
(run 44836899936)。次の commit を 1 つ足すと通る。

**How to apply**:
- `--apply` の後は、移動の commit を最初に作る。別の修正を先に commit するなら、先に `git diff --cached --stat` で
  index に何が載っているかを確かめる (`git add <file>` しても、既に index にある改名は一緒に commit される)。
- 別の修正は `git commit <file> -m ...` (パスを指定した commit は index の他の変更を含めない) で作ってもよい。
- 関連: [[feedback_shared_working_copy_git_race]]
