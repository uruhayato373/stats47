# SEO / OGP 検証ツール

本番環境の SEO 画像・メタ情報が正しく設定されているか確認するためのツール一覧。

## OGP / メタ情報の確認

| ツール | 用途 | URL |
|---|---|---|
| metatags.io | OGP・Twitter Card のプレビューを一画面で確認 | https://metatags.io |
| opengraph.xyz | OG 画像・タイトル・説明のプレビュー | https://opengraph.xyz |

## SNS プラットフォーム別

| ツール | 用途 | URL |
|---|---|---|
| Facebook Sharing Debugger | OGP タグの確認・キャッシュクリア | https://developers.facebook.com/tools/debug/ |
| Twitter Card Validator | Twitter Card の表示確認 | https://cards-dev.twitter.com/validator |

## Google 公式ツール

| ツール | 用途 | URL |
|---|---|---|
| Rich Results Test | 構造化データ（JSON-LD 等）の検証 | https://search.google.com/test/rich-results |
| PageSpeed Insights | Core Web Vitals + SEO 監査 | https://pagespeed.web.dev |
| Search Console | インデックス状況・検索パフォーマンス | https://search.google.com/search-console |

## コマンドラインでの簡易確認

```bash
# metaタグを一括取得
curl -s https://stats47.com/ | grep -i '<meta'
```
