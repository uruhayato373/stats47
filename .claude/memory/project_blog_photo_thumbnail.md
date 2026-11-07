---
name: project-blog-photo-thumbnail
description: ブログの新規サムネイルは全面の写真風 (2026-11-07 オーナー決定)。旧経路の版を上げると全記事の指紋が変わるので触らない
metadata:
  type: project
---

ブログの新しい絵は `blog-fullbleed-background.ts` の全面の写真風 (`blog-photo-v1`)。一般的な物だけを写し、人物・建物・場所を出さない。置き場は `assets/blog/fullbleed-backgrounds/`。既存の絵は旧経路のまま残す。

**Why:** 旧プロンプトは絵を幅 30% に絞っていたが、OGP が共通背景へ移った後は余白が無駄になっていた。写真風はオーナーが「AI っぽくない」方向として選んだ。統計サイトなので、生成画像を実在の写真と誤解させない線引きを条件にした。

**How to apply:** `resolveArticleBackgroundSource` は既存の JPEG にも現在のプロンプトでハッシュを計算する。`blog-article-background.ts` と `blogRendererSources('ai')` の対象を変えると全記事が古い扱いになり週次修復が全件作り直すので、変更は新しいファイルに分ける。公開前の目視は必須。関連: [[feedback-codex-image-registered-route-only]]

週次の ogp-images job は main のコードで動くので、全面の絵の記事を main へ入れる前に R2 へ出すと、その週の修復で旧構図へ戻る。残りの段取りは BLOG-PHOTO-ROLLOUT-01。
