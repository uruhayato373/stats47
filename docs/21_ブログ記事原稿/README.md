# docs/21_ブログ記事原稿 — ブログ記事ドラフトの ephemeral staging

このディレクトリは**公開前ドラフトの作業場**です。記事の**正典 (SSOT) は R2 `app/blog/<slug>`**。

- 新規記事: `/draft-from-trend` `/plan-blog-articles` 等がここに `<slug>/article.md` を作成
- 公開: `blog-auto-publish.yml` / `publish-blog.yml` がここを読んで R2 へ push
- **公開後は削除する** (`git rm -r docs/21_ブログ記事原稿/<slug>`)。残すと R2 とドリフトし退行源になる
  (ガード: `.claude/scripts/lib/check-published-drafts.cjs`)
- brushup/是正は R2 のコピー (`.local/r2/app/blog/`) に対して行う (`/brushup-blog`)

2026-06-15: 公開済みドラフト 184 件を規約どおり一括削除し staging を空に戻した。
