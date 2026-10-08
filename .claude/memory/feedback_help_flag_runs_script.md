---
name: feedback_help_flag_runs_script
description: リポジトリのスクリプトの多くは --help を解釈せず本処理を実行する。動作確認で付けて起動しない
metadata:
  node_type: memory
  type: feedback
  originSessionId: 4380d850-b42b-4a15-bef1-0d5108fef832
  modified: 2026-10-05T21:42:03.384Z
---

2026-10-06、import の解決確認のつもりで `npx tsx packages/ai-content/src/scripts/generate-blog-article.ts --help` を実行したところ、
--help は無視されて既定モードの本処理が走り、topic-queue の先頭トピックの outbox (`contents/blog/<slug>/` に prompt と図データ 14 ファイル) を作った。
既定モードは LLM も R2 書き込みもしない設計だったので、作成時刻で今回の生成と確かめてディレクトリを消すだけで済んだ。

**Why:** 自作スクリプトの多くは `getArg` 程度の手書きパーサで、未知の引数を黙って無視する。--help が無害だという前提は成り立たない。
R2 push・SNS 投稿・note 公開のスクリプトなら外部へ出てしまう。

**How to apply:** import や構文の確認は、`node --check`、`npx tsc --noEmit`、または import だけする 1 行 (`npx tsx -e 'import x from "./path"'`) で行う。
スクリプトを起動する前に、先頭コメントの「既定モード」と、引数パースに --help / --dry-run が実装されているかを grep で確かめる。
誤って走らせたら、作成時刻 (`stat -f %SB`) と git 状態で自分の生成物だけを特定して戻す。
関連: [[feedback_workflow_policy_comment_import]]
