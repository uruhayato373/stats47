---
title: eStat-API ランキング変換サブドメイン
created: 2025-10-30
updated: 2025-01-31
tags:
  - eStat-API
  - ドメイン設計
  - サブドメイン
  - R2
---

# eStat-API ランキング変換サブドメイン設計

## 概要

本サブドメインは、e-Stat API（StatsData）から取得した応答を、Ranking 機能が直接利用可能なランキング形式（値のみ＋最小限 metadata）へ正規化し、R2 ストレージへ保存する役割を担います。順位やパーセンタイルの計算は行いません（Ranking 機能の責務）。

— 境界の要点 —

- 本サブドメイン: 取得 → 正規化（値のみ）→ 統計量付与（min/max/mean/median）→ R2 保存
- Ranking 機能: D1 の視覚化設定に基づく順位/パーセンタイル計算と表示

## 目次

1. [責務と主要概念](#責務と主要概念)
2. [アーキテクチャ設計](#アーキテクチャ設計)
3. [I/O 仕様](#io-仕様)
4. [データ構造](#データ構造)
5. [R2 保存仕様](#r2-保存仕様)
6. [エラー/リトライ/レート制御](#エラーリトライレート制御)
7. [パフォーマンス/バルク処理](#パフォーマンスバルク処理)
8. [セキュリティ/運用](#セキュリティ運用)
9. [変更影響](#変更影響)

## 責務と主要概念

### 責務

- e-Stat API 応答（StatsData）を内部共通形式に変換
- ランキング形式（値のみ: `areaCode`, `areaName`, `value`）へ正規化
- 最小限の統計量（`min`, `max`, `mean`, `median`）の計算と付与
- R2 への保存（冪等・上書き方針の遵守）

### 非責務

- 順位計算、パーセンタイル算出、可視化設定管理（Ranking 機能の責務）

### 主要概念

- `estat_api_metadata`: ランキングキーと e-Stat パラメータの対応（構造は estat-api ドメインが定義、書き込みは Ranking 機能）
- `estat_ranking_mappings`: e-Stat パラメータ（`stats_data_id`, `cat01`, `item_code`等）とランキング項目のマッピングテーブル（CSV ベース、`isRanking`フラグでランキング変換対象を指定）
- `RankingDataPoint`: 値のみの最小単位（`areaCode`, `areaName`, `value`）
- `isRanking`: ランキング変換対象フラグ（`true`の場合、R2 にランキング形式で保存）

## アーキテクチャ設計

```
src/features/estat-api/
├── ranking-mappings/        # ランキングマッピング管理（本サブドメインの中核）
│   ├── repositories/        # estat_ranking_mappings テーブル操作
│   ├── services/           # CSV インポート、ランキング変換
│   ├── actions/            # Server Actions（管理画面用）
│   └── types/              # 型定義
├── fetcher/                 # e-Stat API 呼び出し
├── formatter/               # 値のみランキング形式へ正規化
└── metadata/                # estat_api_metadata 取り扱い
```

— コンポーネント —

- ranking-mappings: CSV ベースのマッピングデータ管理、ランキング変換実行
  - repositories: `estat_ranking_mappings`テーブルの CRUD 操作、`isRanking`フィルタ、バルクアップサート
  - services: CSV パース・インポート、e-Stat データ → ランキング形式変換、統計量計算
  - actions: `isRanking`更新、ランキング変換実行（単一項目・全項目）
  - components: 管理画面テーブル表示（`EstatRankingMappingsTable`）
- fetcher: StatsData の取得、基本検証、ページング
- formatter: 値抽出/単位整形/NULL・欠損処理/地域コード・名前解決
- metadata: `rankingKey → {stats_data_id, cd_cat01...}` マッピング取得

## I/O 仕様

入力

- `estat_ranking_mappings` テーブル（`isRanking=true`の項目）
- CSV ファイル（`mapping.csv`形式）: マッピングデータのインポート元（スクリプト経由でインポート）
- e-Stat StatsData 応答（JSON）: ランキング変換対象データ

出力

- R2 に保存するランキング JSON（値のみ）
- 付随する `statistics` と `metadata`

### CSV ファイル形式

```csv
stats_data_id,cat01,item_name,item_code,unit
0000010204,#D0110101,財政力指数（都道府県財政）,financial-power-index,‐
```

**必須カラム:**

- `stats_data_id`: e-Stat 統計表 ID
- `cat01`: e-Stat 分類コード（`#`で始まる形式も対応）
- `item_name`: 項目名（日本語）
- `item_code`: 項目コード（`ranking_items.ranking_key`とは別管理、重複許可）
- `unit`: 単位

**オプションカラム:**

- `area_type`: 地域タイプ（`'prefecture'` | `'city'` | `'national'`、未指定時は`'prefecture'`がデフォルト）

**注意:**

- CSVファイルに古いカラム（`dividing_value`, `new_unit`, `ascending`）が含まれていても無視されます（互換性のため）

**CSV インポート方法**:

- スクリプト経由: `npx tsx scripts/import-ranking-mappings.ts <CSVファイルパス>`
  - 例: `npx tsx scripts/import-ranking-mappings.ts /path/to/mapping.csv`
  - デフォルトパス: `/Users/minamidaisuke/stats47-blog/_backend/e_stat/mapping/mapping.csv`
- `is_ranking`フラグは全て`false`でインポートされる

## データ構造

### JSON（R2 へ保存）

```json
{
  "values": [
    { "areaCode": "13000", "areaName": "東京都", "value": 6439.3 },
    { "areaCode": "27000", "areaName": "大阪府", "value": 4646.5 }
  ],
  "statistics": { "min": 64.5, "max": 6439.3, "mean": 338.7, "median": 124.5 },
  "metadata": {
    "rankingKey": "population_density",
    "timeCode": "2023",
    "unit": "人/km²",
    "dataSourceId": "estat"
  }
}
```

### データベーススキーマ

```sql
CREATE TABLE IF NOT EXISTS estat_ranking_mappings (
  stats_data_id TEXT NOT NULL,
  cat01 TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  unit TEXT,
  area_type TEXT NOT NULL DEFAULT 'prefecture',  -- 'prefecture' | 'city' | 'national'
  is_ranking BOOLEAN DEFAULT 0,  -- ランキング変換対象フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stats_data_id, cat01),
  CHECK (area_type IN ('prefecture', 'city', 'national'))
);
```

— カラム説明 —

- `stats_data_id`: e-Stat 統計表 ID（主キーの一部）
- `cat01`: e-Stat 分類コード（`cdCat01`パラメータに対応、主キーの一部）
- `item_name`: 項目名（日本語）
- `item_code`: 項目コード（`ranking_items.ranking_key`とは別管理、重複許可）
- `unit`: 単位
- `area_type`: 地域タイプ（`'prefecture'` | `'city'` | `'national'`、デフォルトは`'prefecture'`）
- `is_ranking`: ランキング変換対象フラグ（`true`の場合、ランキング変換を実行）

— 主キー制約 —

- `PRIMARY KEY (stats_data_id, cat01)`: `stats_data_id`と`cat01`の組み合わせがユニーク
- `item_code`は重複を許可（同じ統計表・分類コードでも異なる項目コードが存在可能）

### 型（抜粋 / TypeScript）

```ts
export interface EstatRankingMapping {
  stats_data_id: string;  // 主キーの一部
  cat01: string;  // 主キーの一部
  item_name: string;
  item_code: string;  // 重複許可
  unit: string | null;
  area_type: "prefecture" | "city" | "national";
  is_ranking: boolean;
  created_at: string;
  updated_at: string;
}

export interface RankingDataPointValueOnly {
  areaCode: string;
  areaName: string;
  value: number;
}

export interface RankingExportPayload {
  values: RankingDataPointValueOnly[];
  statistics: { min: number; max: number; mean: number; median: number };
  metadata: {
    rankingKey: string; // item_code を使用
    timeCode: string;
    unit: string;
    dataSourceId: "estat";
  };
}
```

## R2 保存仕様

- キー設計: `ranking/{areaType}/{rankingKey}/{timeCode}.json`
  - 例: `ranking/prefecture/population_density/2023.json`
- 保存方針:
  - 同一キーは上書き（冪等）
  - 値は「値のみ」（順位・パーセンタイルは含めない）
  - `metadata.unit` は e-Stat に準拠し正規化

— 互換（旧構造）—

- 旧: `ranking/{rankingKey}/{areaType}/{timeCode}.json`
- 併存期間中は新構造を優先

## エラー/リトライ/レート制御

- レート制限: e-Stat API の制限に準拠、指数バックオフ
- リトライ: ネットワーク/一時エラーのみ再試行
- データ品質: 必須フィールド欠落時はスキップ＋警告ログ

## パフォーマンス/バルク処理

- ページング取得とストリーム処理でメモリ使用を抑制
- まとめ書き込み（バッチ）で R2 PUT の回数を削減

## セキュリティ/運用

- 管理者実行に限定（鍵/権限）
- dry-run サポート（R2 書き込み無効化）
- 監査ログ（保存件数、スキップ件数、警告）

### 管理画面からの手動実行

- ランキングマッピング一覧表示: 管理画面（`/admin/dev-tools/estat-api/ranking-mappings`）で`estat_ranking_mappings`テーブルのデータをテーブル形式で表示
- `isRanking`フラグ編集: 管理画面のテーブル内で各項目の`isRanking`フラグをスイッチで切り替え（`updateIsRankingAction`を使用）
- ランキング変換実行:
  - **単一項目**: テーブルの「変換実行」ボタンから個別に実行（`convertToRankingAction`を使用）
  - **全項目一括**: 「一括ランキング変換」カードから`isRanking=true`の全項目を一括処理（`convertAllRankingsAction`を使用）
  - 進捗表示: `toast`通知で処理件数、成功/失敗件数を表示

### CSV インポート（スクリプト経由）

- CSV ファイルをインポート: `scripts/import-ranking-mappings.ts`スクリプトを使用して CSV ファイルをデータベースに投入
  - 実行方法: `npx tsx scripts/import-ranking-mappings.ts <CSVファイルパス>`
  - バルクアップサート: 既存データは更新、新規データは追加（`ON CONFLICT(stats_data_id, cat01)`を使用）
  - `is_ranking`フラグ: 全て`false`で初期化（インポート後、管理画面で個別に設定）
  - `area_type`: 未指定時は`'prefecture'`がデフォルト値として設定される

## 変更影響

- Ranking 機能/DB スキーマに影響なし（読み取り先とキー規約は共有）
- 新規テーブル: `estat_ranking_mappings`を追加（CSV ベースのマッピングデータ管理）
- テーブル構造変更（マイグレーション 038, 039）:
  - `id`カラムを削除し、`PRIMARY KEY (stats_data_id, cat01)`に変更
  - `item_code`の UNIQUE 制約を削除（重複を許可）
  - `dividing_value`, `new_unit`, `ascending`カラムを削除
  - `area_type`カラムを追加
- 新規機能: ランキング変換実行機能を追加（単一項目・全項目一括）
- CSV インポート: スクリプト経由で実行（管理画面 UI には非表示）
- API 変更: Server Actions のパラメータが`id`から`(stats_data_id, cat01)`に変更

## 実装済み機能

### データベース

- ✅ `estat_ranking_mappings`テーブル作成（マイグレーション 037）
- ✅ テーブル構造変更（マイグレーション 038, 039）: `id`カラム削除、`PRIMARY KEY (stats_data_id, cat01)`に変更、`area_type`カラム追加
- ✅ インデックス追加（`stats_data_id`, `is_ranking`, `item_code`, `area_type`）

### リポジトリ

- ✅ `EstatRankingMappingsRepository`: CRUD 操作、`isRanking`フィルタ、バルクアップサート
  - `findRankingMappingByKey(stats_data_id, cat01)`: 複合キーで検索（旧`findRankingMappingById`を置き換え）
  - `updateIsRanking(stats_data_id, cat01, isRanking)`: 複合キーで更新
  - `bulkUpsertRankingMappings`: `ON CONFLICT(stats_data_id, cat01)`を使用してバルクアップサート
- ✅ `EstatRankingR2Repository`: R2 へのランキングデータ保存・取得

### サービス

- ✅ `csv-importer`: CSV パース・インポート機能（`parseCsvFile`, `importCsvToDatabase`）
- ✅ `ranking-converter`: e-Stat データ → ランキング形式変換、統計量計算

### Server Actions

- ✅ `updateIsRankingAction(stats_data_id, cat01, isRanking)`: `isRanking`フラグ更新（複合キーで指定）
- ✅ `convertToRankingAction(stats_data_id, cat01, timeCode?)`: 単一項目のランキング変換実行（複合キーで指定）
- ✅ `convertAllRankingsAction(timeCode?)`: 全項目の一括ランキング変換実行
- ✅ `listRankingMappingsAction`: ランキングマッピング一覧取得

### 管理画面 UI

- ✅ ランキングマッピング一覧テーブル（`EstatRankingMappingsTable`）
- ✅ `isRanking`フラグ編集（スイッチ）
- ✅ 単一項目のランキング変換実行ボタン
- ✅ 全項目の一括ランキング変換実行機能

### スクリプト

- ✅ `scripts/import-ranking-mappings.ts`: CSV インポートスクリプト

## 実装フロー

### 1. CSV インポート（スクリプト経由）

1. CSV ファイル（`mapping.csv`形式）を準備
2. `scripts/import-ranking-mappings.ts`スクリプトを実行
   ```bash
   npx tsx scripts/import-ranking-mappings.ts <CSVファイルパス>
   ```
3. CSV をパースして`estat_ranking_mappings`テーブルにバルクアップサート
4. `is_ranking=false`で初期化（デフォルト）
5. インポート完了後、管理画面でデータを確認

### 2. ランキング変換対象の指定

1. 管理画面（`/admin/dev-tools/estat-api/ranking-mappings`）でランキングマッピング一覧を表示
2. 各項目の「ランキング変換対象」スイッチで`isRanking=true`に設定
3. `updateIsRankingAction`でフラグを更新（リアルタイム反映）

### 3. ランキング変換実行

#### 3.1. 単一項目の変換

1. テーブルの「変換実行」ボタンをクリック
2. `convertToRankingAction`で該当項目を変換
   - e-Stat API からデータ取得（`fetchStatsData`）
   - `formatStatsData`でデータ整形
   - `convertStatsDataToRankingFormat`でランキング形式に変換
     - `areaCode`, `areaName`, `value`のみ抽出
     - 統計量（min/max/mean/median）計算
   - `EstatRankingR2Repository.saveRankingData`で R2 に保存
     - キー: `ranking/{areaType}/{item_code}/{timeCode}.json`
     - 形式: `RankingExportPayload`

#### 3.2. 全項目の一括変換

1. 「一括ランキング変換」カードの「全項目を変換実行」ボタンをクリック
2. `convertAllRankingsAction`で`isRanking=true`の全項目を取得
3. 各項目について上記の変換処理を実行（バッチ処理）
4. 進捗と結果を`toast`通知で表示（成功/失敗件数）
