---
name: feedback-debt-baseline-shrink-only
description: maintenance-debt baseline は縮小専用の不変条項 (2026-07-14 オーナー方針)。--write-baseline に増加パスは無く、CI --ratchet-check が origin/main 比の増加を拒否。新規 debt は実修正かルール修正のみで解消 (吸収不可)
metadata:
  type: feedback
---

# maintenance-debt baseline は縮小専用 (不変条項)

**オーナー方針 (2026-07-14)**: 「baseline は変えない。品質を上げる方向で進める」。

**機構** (`.claude/scripts/lib/check-maintenance-debt.cjs`):
- `--write-baseline` は既存比で findings が**増える場合は常に拒否** (増加フラグは存在しない。
  旧 `--allow-growth` は廃止)。縮小 (実修正・ファイル削除) だけが書ける。
- CI (`pr-quality-check.yml` Static Gates) の `--ratchet-check` が **origin/main との比較**で
  baseline の増加 (手編集・すり替え含む) を拒否する。
- baseline キーは v2 内容キー (file:行内容)。行ズレでは落ちない。`*-baseline.json` と checker
  自身は走査除外 (debt の引用・ルール定義はメタ言及であり負債ではない)。

**How to apply**: ガードが新規 debt で落ちたら、選択肢は 2 つだけ —
(a) **実修正**: 期限・削除条件を書く / TODO を `.claude/todo/` バックログ化 / コードを直す、
(b) **ルール修正**: 誤検知ならパターンを精緻化して baseline を**減らす** (実例: theme の
catalogStatus enum 値「legacy」除外で −32、2026-07-14)。baseline への吸収は選択肢に無い。
関連: [[feedback-workflow-arg-vector-quoted]] (同日の ratchet 系教訓)。
