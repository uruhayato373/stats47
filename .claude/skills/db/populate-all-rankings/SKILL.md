全ランキングの全年度データを DB に一括投入する。

## 用途

- ranking_data テーブルに全年度分のデータを投入したいとき
- e-Stat API からのオンデマンド取得を廃止し、DB を正規データストアにする移行時
- データ欠損があった場合の再投入

## 前提

- ローカル D1 が利用可能であること（`.local/d1/` 配下）
- `.env.local` に `NEXT_PUBLIC_ESTAT_APP_ID` が設定されていること

## 手順

### 1. ドライラン（対象確認）

```bash
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-all-rankings.ts --dry-run
```

### 2. 実行

```bash
# 全件実行（estat → calculated の順）
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-all-rankings.ts

# 特定ソースのみ
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-all-rankings.ts --source estat

# 特定キーのみ
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-all-rankings.ts --key total-population
```

### 3. 検証

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "SELECT category_code, COUNT(DISTINCT year_code) as years FROM ranking_data GROUP BY category_code ORDER BY years DESC LIMIT 20;"
```

### 4. リモート反映

`/sync-remote-d1` でリモート D1 に同期する。

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--dry-run` | DB に書き込まず対象一覧を表示 | - |
| `--source` | データソースでフィルタ (`estat` / `calculated`) | 全て |
| `--key` | 特定の rankingKey のみ処理 | 全て |
| `--delay` | e-Stat API コール間のディレイ (ms) | 1200 |

## 技術メモ

- `setup-cli.js` は `-r` (preload) で実行し、`.env.local` ロード・`NODE_ENV=development` 設定・`server-only` 無効化を行う
- e-Stat API のレートリミット（公称 60req/min）対策として、デフォルトで 1.2 秒の間隔を設けている
- upsert（ON CONFLICT DO UPDATE）なので何度でも安全に再実行可能
- 全件実行時は約 17〜20 分かかる
