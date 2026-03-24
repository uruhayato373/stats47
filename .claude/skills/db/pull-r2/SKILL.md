リモート R2 から `.local/r2/` へファイルをダウンロードする。

## 概要

Cloudflare R2 バケット `stats47` から `.local/r2/` 配下にファイルをダウンロードする。
差分同期（ファイルサイズで判定、同一サイズはスキップ）。

## 手順

1. ユーザーにダウンロード対象を確認（全体 or 特定プレフィックス: blog, ranking, area, categories, csv）
2. まず dry-run で対象を確認:
   - 全体: `npx tsx packages/r2-storage/src/scripts/sync-download.ts --dry-run`
   - プレフィックス指定: `npx tsx packages/r2-storage/src/scripts/sync-download.ts --prefix <prefix> --dry-run`
3. ユーザーに確認後、実行:
   - 全体: `npm run r2:download`
   - プレフィックス指定: `npx tsx packages/r2-storage/src/scripts/sync-download.ts --prefix <prefix>`
4. 結果を報告

## デフォルトプレフィックス

`npm run r2:download` をオプションなしで実行すると、以下のプレフィックスのみダウンロードされる:

- `ranking` — ランキングデータ・OGP 画像
- `area` — 地域プロフィール
- `categories` — カテゴリメタデータ

`blog` や `csv` はデフォルトに含まれないため、必要なら `--prefix` で明示指定すること。

## 注意事項

- `--all` は R2 全体（キャッシュ含む）をダウンロードするため非推奨。通常は `--prefix` を使う
- プロキシ環境で S3 API がブロックされる場合は `NO_PROXY=*.r2.cloudflarestorage.com` を設定してから実行

## 参照

- `packages/r2-storage/src/scripts/README.md` — スクリプトの詳細
- `packages/r2-storage/src/scripts/sync-download.ts` — ダウンロードスクリプト本体
