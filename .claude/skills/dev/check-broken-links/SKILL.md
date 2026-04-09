---
name: check-broken-links
description: サイトマップの全URLをチェックし404・リンク切れを検出する。Use when user says "リンクチェック", "404チェック", "check-broken-links", or after deploy.
---

本番サイト（または `--local` でローカル環境）のサイトマップに含まれる全 URL のステータスコードを検証し、404 やサーバーエラーを検出する。

## 前提

- 本番サイト: `https://stats47.jp`
- サイトマップ: `https://stats47.jp/sitemap.xml`（Next.js が動的生成）
- Cloudflare のレート制限があるため 1 秒あたり 10 リクエスト以下に抑える

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--sample N` | カテゴリごとに N 件をランダムサンプリング | 全件チェック |
| `--category <name>` | 特定カテゴリのみチェック（`ranking`, `areas`, `blog`, `category`, `survey`, `themes`） | 全カテゴリ |
| `--local` | `http://localhost:3000` に対してチェック | 本番 |

## 手順

### Step 1: サイトマップ取得

```bash
curl -s https://stats47.jp/sitemap.xml
```

`--local` 指定時は `http://localhost:3000/sitemap.xml` を使用する。

XML から `<loc>` タグの URL を全て抽出する:

```bash
curl -s https://stats47.jp/sitemap.xml | grep -oP '(?<=<loc>)[^<]+'
```

抽出した URL の総数を確認し、ユーザーに報告する。

### Step 2: URL 分類

抽出した URL をパスのプレフィックスでカテゴリに分類する:

| カテゴリ | パスパターン | 例 |
|---|---|---|
| `ranking` | `/ranking/*` | `/ranking/income-per-capita` |
| `areas` | `/areas/*` | `/areas/tokyo` |
| `blog` | `/blog/*` | `/blog/income-ranking-2024` |
| `category` | `/category/*` | `/category/economy` |
| `survey` | `/survey/*` | `/survey/national-census` |
| `themes` | `/themes/*` | `/themes/economy-dashboard` |
| `static` | 上記以外 | `/`, `/about`, `/privacy` |

各カテゴリの件数を報告する。

`--category` 指定時は該当カテゴリの URL のみ残す。

### Step 3: サンプリング（`--sample N` 指定時のみ）

`--sample N` が指定された場合、各カテゴリから最大 N 件をランダムに選択する。
未指定の場合は全件を対象とする。

チェック対象の総数を報告する。全件チェックで 500 件を超える場合は「数分かかる可能性があります」と通知する。

### Step 4: URL 検証

全対象 URL のステータスコードを取得する。

```bash
# URL リストをファイルに保存
cat /tmp/check-urls.txt | xargs -P 10 -I {} sh -c \
  'code=$(curl -s -o /dev/null -w "%{http_code}" "{}"); echo "$code {}"'
```

**レート制限対策**: 10 並列で実行する。Cloudflare の制限に引っかかる場合（429 レスポンス）は並列数を 5 に下げてリトライする。

各 URL のレスポンスを以下に分類する:

- **OK**: 200
- **リダイレクト**: 301, 302, 307, 308
- **クライアントエラー**: 400, 403, 404, 410
- **サーバーエラー**: 500, 502, 503

### Step 5: レポート出力

以下の形式でレポートを出力する:

```
## リンクチェック結果

チェック日時: YYYY-MM-DD HH:MM
対象: https://stats47.jp（全件 / サンプル N件）
総URL数: XXX

### カテゴリ別サマリ

| カテゴリ | 総数 | OK (200) | リダイレクト | エラー | エラー率 |
|---|---|---|---|---|---|
| ranking | 500 | 498 | 0 | 2 | 0.4% |
| areas | 47 | 47 | 0 | 0 | 0% |
| blog | 30 | 30 | 0 | 0 | 0% |
| category | 10 | 10 | 0 | 0 | 0% |
| survey | 20 | 20 | 0 | 0 | 0% |
| themes | 15 | 15 | 0 | 0 | 0% |
| static | 5 | 5 | 0 | 0 | 0% |
| **合計** | **627** | **625** | **0** | **2** | **0.3%** |

### エラー一覧

| URL | ステータス | カテゴリ |
|---|---|---|
| /ranking/xxx | 404 | ranking |
| /blog/yyy | 500 | blog |
```

エラーが 0 件の場合は「全 URL 正常（200 OK）」と報告する。

### Step 6: エラー原因の推定（エラーがある場合）

エラーが検出された場合、パターンを分析する:

- **特定カテゴリに集中**: データ欠損やルーティング問題の可能性
- **ranking に 404 が多い**: `ranking_items` テーブルのスラッグとページルーティングの不一致を確認
- **blog に 404**: R2 上の記事ファイル欠損の可能性
- **500 エラー**: サーバーサイドのデータ取得エラー、DB 接続問題

推定原因と対処方針をユーザーに報告する。

## 一時ファイル

作業中に `/tmp/` に以下のファイルを作成する。作業完了後に削除する。

- `/tmp/check-urls.txt` — チェック対象 URL リスト
- `/tmp/check-results.txt` — ステータスコード結果

## 注意事項

- サイトマップに含まれる URL のみチェックする（`noindex` ページはサイトマップ外のためチェック対象外）
- 全件チェックはランキングページが 2,000 件超あるため数分かかる場合がある
- `--sample 5` で各カテゴリ 5 件ずつサンプルすれば 1 分以内に完了する
- デプロイ直後は Cloudflare のキャッシュが反映されていない場合があるため、デプロイ後 2-3 分待ってから実行することを推奨する

## 関連スキル

- `/deploy` — デプロイ後に実行推奨
- `/verification-loop` — ビルド前チェック（コード品質）
