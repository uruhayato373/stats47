---
name: push-r2
description: .local/r2/ のローカルファイルをリモート R2 バケットにアップロードする。Use when user says "R2 push", "R2アップロード", "push-r2". プレフィックス指定で部分同期可能.
disable-model-invocation: true
---

`.local/r2/` のローカルファイルをリモート R2 へ push する。

## 概要

`.local/r2/` 配下のファイルを Cloudflare R2 バケット `stats47` にアップロードする。
全体または特定プレフィックスを指定して同期できる。

## 手順

1. ユーザーにアップロード対象を確認（全体 or 特定プレフィックス: blog, ranking, area, categories, csv）
2. Cloudflare REST API 経由のアップロードを試行:
   - 全体: `npm run r2:upload`（リポジトリルートで実行）
   - プレフィックス指定: `npx tsx packages/r2-storage/src/scripts/sync-upload.ts --prefix <prefix>`
   - dry-run で事前確認も可: `npx tsx packages/r2-storage/src/scripts/sync-upload.ts --dry-run`
   - S3 credentials（R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY）は不要。`CLOUDFLARE_API_TOKEN` のみ使用
3. 成功したら結果を報告して終了（CDN キャッシュパージは不要）
4. 失敗した場合（プロキシ環境での HTTP 407/503 等）:
   - `diff-push-r2.ts` で wrangler CLI フォールバックを使用
   - コマンド形式: `npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix <prefix>`
   - マニフェストベースで差分のみ push するため大量ファイルにも対応

## R2 キーのマッピング

ローカルパスから `.local/r2/` を除いた部分がそのまま R2 キーになる。

| ローカルパス | R2 キー |
|---|---|
| `.local/r2/blog/<slug>/article.mdx` | `blog/<slug>/article.mdx` |
| `.local/r2/area/<file>` | `area/<file>` |
| `.local/r2/categories/<file>` | `categories/<file>` |
| `.local/r2/csv/<path>` | `csv/<path>` |
| `.local/r2/ranking/<path>` | `ranking/<path>` |
| `.local/r2/sns/<path>` | `sns/<path>` |
| `.local/r2/ges/<path>` | `ges/<path>` |

## 参照

- `packages/r2-storage/src/scripts/README.md` — アップロード/ダウンロードスクリプトの使い方
- `packages/r2-storage/src/scripts/sync-upload.ts` — アップロードスクリプト本体
