# note 記事の作業場

このディレクトリは note 記事を編集するための**作業場**で、git には何も置かない (この README だけを追跡する)。
記事の本文・画像の正本は R2 (無料は公開 R2、有料は private R2)、所在と SHA は `data/note/articles.json`。

```bash
npm run note:article -- checkout <key>   # R2 からここへ取り出す
npm run note:article -- save <key>       # R2 へ保存し、台帳を更新して、ここから消す
npm run note:article -- status           # 取り出し中の記事と、保存済みとの差の有無
```

置き場は `<key>/` (stats47-note) か `<vertical>/<key>/` (その他の系統)。手順の正典は
[`.claude/scripts/note/catalog/README.md`](../../.claude/scripts/note/catalog/README.md)。
