---
name: project_note_article_ledger
description: note記事は台帳data/note/articles.json+本文はR2だけ(無料=公開/有料=private)。docs/31はgitignoreの作業場でnote:article checkout/saveで行き来。2026-10-13移行
metadata:
  type: project
---

2026-10-13 にオーナー指示で note 記事の管理を作り直した。正典は `.claude/scripts/note/catalog/README.md`。

- **台帳**: `data/note/articles.json` + Schema (403 本)。旧 TS カタログ `catalog/data/*.ts` は削除。`body.store` は r2-public / r2-private / note-only、`body.manifest` は R2 に保存した版の SHA。有料を r2-public にする台帳は Schema が拒否する。書き込みは `lib/article-ledger.mjs` だけ。`note-published-urls.json`・`note-draft-index.json` は `generate-note-catalog.ts` が作る派生物で、`npm run note:catalog:check` が手編集を止める。
- **本文**: R2 だけ。`npm run note:article -- checkout|save|verify|adopt|status`。save は読み戻し SHA 照合・旧版を private `note-archive/` へ退避・R2 が台帳と違えば止まる。docs/31 は git に README だけ。
- **移行の実測**: docs/31 の 123 本 + 復元原稿 16 本を保存 (54 本で R2 と内容が違い、新しい方を採用。R2 の方が新しかったのは a-maximum-temperature の 2 ファイルだけ)、R2 にだけあった 180 本を取り込み、無料なのに private にあった 3 本を公開へ移した。深い検査で 319 本合格、note-only 73 本・本文未作成の下書き 11 本 (d-geo-*)。控えは `.local/note-migration-backup-20261013.tar.gz`。

**Why:** stats47 は PUBLIC リポジトリで、旧方式は有料記事の原稿を git (docs/31) に置くしかなく GitHub で読めた。台帳も TS・JSON・R2 frontmatter の 4 か所でずれていた (draft-index 52 本 vs 下書き 98 本など)。

**How to apply:** 記事を編集するときは checkout → 編集 → save。R2 の記事本文を diff-push-r2 や独自スクリプトで直接書かない。公開記録は台帳に書いて `generate-note-catalog.ts --apply`。git の履歴に残る有料原稿の扱いは backlog `NOTE-PAID-HISTORY-EXPOSURE-01`。関連 [[project_note_image_assets_contract]] [[project_note_publish_flow_2026_06]]。
