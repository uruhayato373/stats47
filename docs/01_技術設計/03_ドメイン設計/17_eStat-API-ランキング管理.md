---
title: eStat-API ランキング変換サブドメイン
created: 2025-10-30
updated: 2025-02-01
tags:
  - eStat-API
  - ドメイン設計
  - サブドメイン
  - R2
  - データ同期
---

# eStat-API ランキング変換サブドメイン設計

## 概要

本サブドメインは、e-Stat API（StatsData）から取得した応答を、`StatsSchema`形式へ正規化し、R2 ストレージへ保存する役割を担います。順位やパーセンタイルの計算は行いません（Ranking 機能の責務）。

— 境界の要点 —

- 本サブドメイン: 取得 → `convertToStatsSchema`で正規化 → `StatsSchema[]`形式で R2 保存
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
- `convertToStatsSchema`を使用して`StatsSchema`形式へ正規化
- `StatsSchema[]`配列として R2 への保存（冪等・上書き方針の遵守）

### 非責務

- 順位計算、パーセンタイル算出、可視化設定管理（Ranking 機能の責務）

### 主要概念

- `estat_api_metadata`: ランキングキーと e-Stat パラメータの対応（構造は estat-api ドメインが定義、書き込みは Ranking 機能）
- `estat_ranking_mappings`: e-Stat パラメータ（`stats_data_id`, `cat01`, `item_code`等）とランキング項目のマッピングテーブル（CSV ベース、`isRanking`フラグでランキング変換対象を指定）
- `StatsSchema`: 統計データの基本型（`areaCode`, `areaName`, `timeCode`, `timeName`, `categoryCode`, `categoryName`, `value`, `unit`）
- `isRanking`: ランキング変換対象フラグ（`true`の場合、R2 に`StatsSchema[]`形式で保存）

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

- R2 に保存する`StatsSchema[]`形式の JSON

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

- CSV ファイルに古いカラム（`dividing_value`, `new_unit`, `ascending`）が含まれていても無視されます（互換性のため）

**CSV インポート方法**:

- スクリプト経由: `npx tsx scripts/import-ranking-mappings.ts <CSVファイルパス>`
  - 例: `npx tsx scripts/import-ranking-mappings.ts /path/to/mapping.csv`
  - デフォルトパス: `/Users/minamidaisuke/stats47-blog/_backend/e_stat/mapping/mapping.csv`
- `is_ranking`フラグは全て`false`でインポートされる

## データ構造

### JSON（R2 へ保存）

`StatsSchema[]`形式の配列として保存されます：

```json
[
  {
    "areaCode": "13000",
    "areaName": "東京都",
    "timeCode": "2020000000",
    "timeName": "2020年",
    "categoryCode": "A1101",
    "categoryName": "総人口",
    "value": 14047594,
    "unit": "人"
  },
  {
    "areaCode": "27000",
    "areaName": "大阪府",
    "timeCode": "2020000000",
    "timeName": "2020年",
    "categoryCode": "A1101",
    "categoryName": "総人口",
    "value": 8839469,
    "unit": "人"
  }
]
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
  stats_data_id: string; // 主キーの一部
  cat01: string; // 主キーの一部
  item_name: string;
  item_code: string; // 重複許可
  unit: string | null;
  area_type: "prefecture" | "city" | "national";
  is_ranking: boolean;
  created_at: string;
  updated_at: string;
}

// StatsSchema: 統計データの基本型
export interface StatsSchema {
  areaCode: string;
  areaName: string;
  timeCode: string;
  timeName: string;
  categoryCode: string;
  categoryName: string;
  value: number;
  unit: string;
}
```

## R2 保存仕様

### ランキングデータファイル

- キー設計: `ranking/{areaType}/{rankingKey}/{timeCode}.json`
  - 例: `ranking/prefecture/total-population/2020000000.json`
- 保存方針:
  - 同一キーは上書き（冪等）
  - 保存形式: `StatsSchema[]`配列（順位・パーセンタイルは含めない）
  - `convertToStatsSchema`を使用して各値を`StatsSchema`形式に変換
  - 各要素には`areaCode`, `areaName`, `timeCode`, `timeName`, `categoryCode`, `categoryName`, `value`, `unit`が含まれる

### メタデータファイル

ランキングデータ保存時に、メタ情報を`metadata.json`ファイルとして同時に保存します。

- **キー設計**: `ranking/{areaType}/{rankingKey}/metadata.json`
  - 例: `ranking/prefecture/total-population/metadata.json`
- **保存方針**:
  - ランキングキーごとに1ファイル（年度ごとではない）
  - ランキングデータ保存時に自動更新
  - 既存のメタデータがある場合は、年度情報のみ追加・更新

#### メタデータJSON構造

```json
{
  "itemCode": "total-population",
  "itemName": "総人口",
  "unit": "人",
  "areaType": "prefecture",
  "times": [
    {
      "timeCode": "2020",
      "timeName": "2020年度"
    },
    {
      "timeCode": "2021",
      "timeName": "2021年度"
    }
  ],
  "source": {
    "name": "社会・人口統計体系 > Ａ　人口・世帯",
    "url": "https://www.e-stat.go.jp/dbview?sid=0000010201"
  }
}
```

**フィールド説明**:

- `itemCode`: 項目コード（`estat_ranking_mappings.item_code`）
- `itemName`: 項目名（`estat_ranking_mappings.item_name`）
- `unit`: 単位（`estat_ranking_mappings.unit`）
- `areaType`: 地域タイプ（`prefecture` | `city` | `national`）
- `times`: 年度情報配列
  - `timeCode`: 年度コード（4桁、例: `"2020"`）- 時間コード（10桁）から最初の4桁を抽出
  - `timeName`: 年度名（例: `"2020年度"`）
- `source`: ソース情報
  - `name`: ソース名（`statName > title`形式、例: `"社会・人口統計体系 > Ａ　人口・世帯"`）
  - `url`: e-StatへのURL（`https://www.e-stat.go.jp/dbview?sid={stats_data_id}`）

**年度情報の更新ロジック**:

- 既存のメタデータがある場合、新しい時間コードを追加して既存の年度情報と統合
- 重複する年度コードは除去され、ソート済みの状態で保存
- R2に保存されているすべての時間コード（`{timeCode}.json`）から年度情報を抽出

**既存データへの対応**:

- 管理画面の「メタデータ一括生成」ボタンから、既存のランキングデータに対してメタデータファイルを一括生成可能
- `generateMetadataForAllRankingsAction`を使用して、`estat_ranking_mappings`テーブルのすべてのレコードに対してメタデータを生成

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

### R2→D1 同期機能（ranking_items テーブル自動生成）

R2 ストレージの`ranking`ディレクトリを走査し、実際に保存されているランキングデータから`ranking_items`テーブルを自動生成・更新する機能を提供します。

#### 目的

- R2 ストレージ内の実データ構造を調査し、`ranking_items`テーブルを自動生成・更新
- R2 に保存されているランキングデータと D1 データベースの`ranking_items`テーブルを同期
- 手動でのデータ投入作業を削減し、R2 ストレージが唯一の情報源となる状況を支援

#### R2 ストレージ構造

- **パス形式**: `ranking/{areaType}/{rankingKey}/{timeCode}.json`
  - `areaType`: 地域タイプ（`prefecture` | `city` | `national`）
  - `rankingKey`: ランキングキー（`ranking_items.ranking_key`として使用）
  - `timeCode`: 時間コード（例: `2020000000`）
- **データ形式**: `StatsSchema[]`配列（JSON 形式）
- **例**: `ranking/prefecture/total-population/2020000000.json`
  - `areaType = "prefecture"`
  - `rankingKey = "total-population"`（`ranking_items.ranking_key`として抽出）
  - `timeCode = "2020000000"`

#### 走査対象パスとルール

- **対象ディレクトリ**: `ranking/{areaType}/` のパターンで走査開始
  - `ranking/prefecture/` - 都道府県データ
  - `ranking/city/` - 市区町村データ
  - `ranking/national/` - 全国データ
- **走査方法**:
  1. `ranking/{areaType}/` ディレクトリ内の各サブディレクトリ（`{rankingKey}/`）を検出
  2. パス例: `ranking/prefecture/total-population/` → `areaType="prefecture"`, `rankingKey="total-population"`
  3. 各`rankingKey`に対して、`{rankingKey}/{timeCode}.json` のファイルを 1 つ読み取り
  4. `StatsSchema[]`配列からメタデータを抽出（`unit`など）

#### 更新ポリシー（上書き: 指定フィールドのみ）

R2 から抽出可能な情報のみ更新し、既存の設定（視覚化設定など）は保持します。

- **新規作成時**: 以下のフィールドを設定

  - `ranking_key`: R2 から抽出した`rankingKey`
  - `unit`: `StatsSchema[]`配列の最初の要素から抽出
  - `data_source_id`: `"estat"`固定（e-Stat API 由来のデータのため）
  - `label`: `rankingKey`を基に自動生成（未設定の場合）
  - `name`: `rankingKey`を基に自動生成（未設定の場合）
  - その他のフィールド: デフォルト値を使用

- **既存データ更新時**: 以下のフィールドのみ更新（その他の表示系は非上書き）
  - `unit`: R2 から抽出した値で更新
  - `data_source_id`: `"estat"`に更新（異なる場合）
  - その他のフィールド（`label`, `name`, `map_color_scheme`, `ranking_direction`など）: 既存の値を保持

#### 同期フロー

1. R2 の`ranking`ディレクトリを走査
   - `ranking/{areaType}/` のパターンで走査開始
   - 各`areaType`ディレクトリ内の`{rankingKey}/` ディレクトリを検出
2. メタデータ抽出
   - 各`rankingKey`に対して、`{rankingKey}/{timeCode}.json` のファイルを 1 つ読み取り
   - `StatsSchema[]`配列から`unit`を抽出（最初の要素から）
3. `ranking_items`テーブルへの反映
   - `ranking_key`を基に検索
   - 存在しない場合は作成（`INSERT`）
   - 存在する場合は更新（`UPDATE`、指定フィールドのみ）
4. 統計ログ出力
   - 新規作成件数、更新件数、スキップ件数、警告を記録

#### 実装方法

- **サービス**: `src/features/estat-api/ranking-mappings/services/r2-sync-service.ts`
  - R2 ディレクトリ走査機能
  - メタデータ抽出機能
  - `ranking_items`テーブルへの反映機能
- **Server Action**: `src/features/estat-api/ranking-mappings/actions/sync-r2-to-db-action.ts`
  - 管理画面から同期実行を可能にする
  - 同期結果を返却
- **管理画面 UI**: 同期実行ボタンを追加
  - 実行ボタンをクリックすると、R2→D1 同期処理を実行
  - 進捗と結果を`toast`通知で表示

#### 運用と安全性

- **管理者専用**: Server Action として実装し、管理者権限でのみ実行可能
- **dry-run サポート**: 実際のデータベース更新を行わず、変更内容をプレビュー可能
- **冪等性**: 何度実行しても同じ結果になる（`INSERT OR REPLACE`を使用）

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
- データ形式変更: R2 保存形式が`RankingExportPayload`から`StatsSchema[]`に変更（2025-01-31）
  - `convertToStatsSchema`を使用して各値を`StatsSchema`形式に変換
  - 統計量（min/max/mean/median）の計算は削除
  - 各要素には`areaCode`, `areaName`, `timeCode`, `timeName`, `categoryCode`, `categoryName`, `value`, `unit`が含まれる

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
- ✅ `EstatRankingR2Repository`: R2 への`StatsSchema[]`形式データ保存・取得
  - `saveRankingData(areaType, rankingKey, timeCode, statsSchemas: StatsSchema[])`: `StatsSchema[]`配列を保存
  - `findRankingData(areaType, rankingKey, timeCode)`: `StatsSchema[]`配列を取得

### サービス

- ✅ `csv-importer`: CSV パース・インポート機能（`parseCsvFile`, `importCsvToDatabase`）
- ✅ `ranking-converter`: e-Stat データ → `StatsSchema[]`形式変換（`convertStatsDataToRankingFormat`は`StatsSchema[]`を返す）

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
   - `convertStatsDataToRankingFormat`で`StatsSchema[]`形式に変換
     - `convertToStatsSchema`を使用して各`FormattedValue`を`StatsSchema`に変換
     - 時間コードが一致するもののみ処理
   - `determineAreaType`で地域タイプを判定
   - `EstatRankingR2Repository.saveRankingData`で R2 に保存
     - キー: `ranking/{areaType}/{item_code}/{timeCode}.json`
     - 形式: `StatsSchema[]`配列

#### 3.2. 全項目の一括変換

1. 「一括ランキング変換」カードの「全項目を変換実行」ボタンをクリック
2. `convertAllRankingsAction`で`isRanking=true`の全項目を取得
3. 各項目について上記の変換処理を実行（バッチ処理）
4. 進捗と結果を`toast`通知で表示（成功/失敗件数）
