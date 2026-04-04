---
name: populate-city-rankings
description: 市区町村ランキングのデータを e-Stat API から取得し ranking_data に投入する（area_type=city）。Use when user says "市区町村ランキング投入", "populate-city-rankings". コロプレスマップ切替用.
disable-model-invocation: true
---

市区町村ランキングのデータを DB に投入する。

## 用途

- ranking_data テーブルに市区町村（area_type='city'）のデータを投入したいとき
- 都道府県内市区町村ランキングページ (`/areas/[areaCode]/ranking/[rankingKey]`) のデータ準備
- コロプレスマップの都道府県 ↔ 市区町村切替のデータ準備

## 前提

- ローカル D1 が利用可能であること（`.local/d1/` 配下）
- `.env.local` に `NEXT_PUBLIC_ESTAT_APP_ID` が設定されていること
- `ranking_items` テーブルに `area_type='city'` のレコードが登録済みであること

## 手順

### 1. ドライラン（対象確認）

```bash
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-city-rankings.ts --dry-run
```

### 2. 実行

```bash
# 全件実行
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-city-rankings.ts

# 特定キーのみ（カンマ区切りで複数指定可）
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-city-rankings.ts --key total-population,households
```

### 3. 検証

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "SELECT ranking_key, COUNT(*) as rows, COUNT(DISTINCT year_code) as years FROM ranking_data WHERE area_type='city' GROUP BY ranking_key ORDER BY rows DESC;"
```

### 4. リモート反映

`/sync-remote-d1` でリモート D1 に同期する。

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--dry-run` | DB に書き込まず対象一覧を表示 | - |
| `--key` | 特定の rankingKey のみ処理（カンマ区切り可） | 全て |
| `--delay` | e-Stat API コール間のディレイ (ms) | 1200 |

## 市区町村 ranking_items の一括登録（シードスクリプト）

都道府県 SSDS ランキングから市区町村版を一括生成するシードスクリプト。新規に都道府県ランキングを追加した後、市区町村版を一括で作成したい場合に使用する。

```bash
# ドライラン（対象確認）
npx tsx packages/ranking/src/scripts/seed-city-ranking-items.ts --dry-run

# 実行
npx tsx packages/ranking/src/scripts/seed-city-ranking-items.ts
```

### SSDS statsDataId マッピングルール

都道府県と市区町村の SSDS テーブルは、statsDataId の上位6桁が異なるだけで対応関係がある：

```
都道府県 000001xxxx → 市区町村 000002xxxx
```

| 都道府県 | 市区町村 | カテゴリ |
|---|---|---|
| `0000010101`-`0000010111` | `0000020101`-`0000020111` | 基礎データ（01系） |
| `0000010201`-`0000010211` | `0000020201`-`0000020211` | 基礎データ（02系） |
| `0000010301`-`0000010313` | `0000020301`-`0000020311` | 指標テーブル（03系） |

- `cdCat01` は都道府県版と同一コードをそのまま使用
- `0000010112` / `0000010212`（L カテゴリ）は市区町村版が存在しない
- 市区町村指標テーブルは11本（都道府県は13本）のため、一部指標が市区町村にない

### シードスクリプトのロジック

1. アクティブな都道府県 SSDS ランキング（非計算型）を全件取得
2. 各ランキングの `source_config.statsDataId` を `000001` → `000002` に変換
3. 同一 `ranking_key` + `area_type='city'` で ranking_items に INSERT
4. 既に city 版が存在するキーはスキップ（重複防止）
5. 実行後、`/populate-city-rankings` でデータ投入（市区町村データが存在しないものは自動スキップ）

### データ投入後のクリーンアップ

データが取得できなかった ranking_items（`latest_year IS NULL`）は無効化する：

```sql
UPDATE ranking_items SET is_active = 0
WHERE area_type = 'city' AND is_active = 1 AND latest_year IS NULL;
```

## 技術メモ

- `setup-cli.js` は `-r` (preload) で実行し、`.env.local` ロード・`NODE_ENV=development` 設定・`server-only` 無効化を行う
- e-Stat API のレートリミット対策として、デフォルトで 1.2 秒の間隔を設けている
- upsert なので安全に再実行可能
- 市区町村は最大 1,913 件/年なので、1 ランキングあたりの投入レコード数が都道府県の約37倍
- `fetchEstatRankingData` は `areaType` に応じてフィルタを切り替える:
  - `prefecture` → `filterOutNationalArea`（都道府県コードのみ残す）
  - `city` → `filterToCityArea`（市区町村コードのみ残す）
- `-city` 接尾辞付きのキーは使わない。複合 PK `(ranking_key, area_type)` で都道府県と市区町村を区別する

## データ状況（2026-03-25 時点）

| 項目 | 値 |
|---|---|
| アクティブ市区町村ランキング | 86 件 |
| コロプレスマップ切替対象 | 74 件 |
| 市区町村データなし（無効化済み） | 782 件 |
