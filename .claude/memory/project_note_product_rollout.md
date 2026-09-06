---
name: project_note_product_rollout
description: 現行パックからnote販売先variantを導出し固定SHAで非公開revisionを準備する
type: project
---

**問題**: noteチャネルは現行パックへ移行していたが、メモとruleに旧174商品・55記事・型検査除外という過去状態が残っていた。古いgenerate/promoteはv1を参照した。

**原因**: 原稿生成と実公開が別工程なのに、旧生成数と進捗を複数文書へコピーしていた。

**対策**: `src/channels/note/article-plan.ts` は `ALL_PRODUCTS` から1パック1記事を導出する。販売準備は `note/cli.ts revision --revision <NEW_REVISION> --all`。出品台帳の `_delivery` を共通inspectPackで全ファイルSHA・47地域・指標数・PPT抜粋数まで照合し、`.local/note-products-revisions/<revision>/report.json` とslug別原稿・出典・添付・readinessを新規生成する。

**境界**: revisionは非公開準備原稿で完成稿ではない。未接続サンプルはmissing、価格は提案、添付確認・独立意味レビュー・Office・公開承認を残工程にする。旧原稿を上書きせず、generateの旧入口とpromote applyはfail-closed。外部公開には既存の専用公開フローを使う。

**証拠**: `packages/product-factory/README.md`、`src/channels/note/build/build-revision.ts`、`tests/note-revision.test.ts`（2026-09-06）。横断状態は `products:report` の派生カタログ、未完了は `.claude/todo/backlog.md`。
