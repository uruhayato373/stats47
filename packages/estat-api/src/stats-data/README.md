# stats-data ドメイン 設計概要

## 設計方針

- **純粋関数のみ**: クラス・ファクトリーを使わない
- **シンプルな構成**: formatters は utils に統合
- **interface不要**: TypeScript の type で十分
- **services**: ユースケースは services ディレクトリで管理
- **依存性は引数で渡す**: 必要な場合のみ関数の引数として受け取る

---

## ディレクトリ構成

```
packages/estat-api/src/stats-data/
│
├── index.ts                              # 公開API
│
├── types/
│   ├── index.ts                          # re-export
│   ├── fetch-options.ts                  # FetchOptions
│   ├── fetch-result.ts                   # FetchStatsDataResult
│   ├── stats-data-response.ts            # EstatStatsDataResponse
│   ├── formatted-value.ts                # FormattedValue, FormattedEstatData
│   └── cache-data.ts                     # StatsDataCacheDataR2
│
├── services/
│   ├── index.ts                          # re-export
│   ├── fetch-stats-data.ts               # 基本取得（キャッシュ→API）
│   ├── fetch-formatted-stats.ts          # 整形済み取得
│   ├── fetch-latest-year-stats.ts        # 最新年取得
│   └── fetch-prefecture-stats.ts         # 都道府県データ取得
│
├── repositories/
│   ├── index.ts                          # re-export
│   ├── api/
│   │   ├── fetch-from-api.ts             # e-Stat API呼び出し
│   │   ├── build-request-params.ts       # リクエストパラメータ構築
│   │   └── validate-response.ts          # レスポンスバリデーション
│   └── cache/
│       ├── find-cache.ts                 # キャッシュ検索
│       ├── save-cache.ts                 # キャッシュ保存
│       ├── delete-cache.ts               # キャッシュ削除
│       ├── list-cache-keys.ts            # キャッシュキー一覧
│       ├── generate-cache-key.ts         # キャッシュキー生成
│       └── sanitize-metadata.ts          # メタデータサニタイズ
│
├── utils/
│   ├── index.ts                          # re-export
│   │
│   │  # データ変換（旧formatters）
│   ├── format-stats-data.ts              # メイン変換
│   ├── format-table-info.ts              # TABLE_INF変換
│   ├── format-values.ts                  # DATA_INF変換
│   ├── convert-to-stats-schema.ts        # StatsSchema変換
│   ├── build-dimension-maps.ts           # ディメンションマップ構築
│   │
│   │  # 年コード処理
│   ├── extract-year-code.ts              # 年コード抽出
│   ├── validate-year-code.ts             # 年コードバリデーション
│   ├── generate-year-name.ts             # 年名生成
│   │
│   │  # 単位・ディメンション
│   ├── extract-unit.ts                   # 単位抽出
│   ├── find-class-object.ts              # CLASS_OBJ検索
│   │
│   │  # フィルタ・ソート
│   ├── filter-prefecture-data.ts         # 都道府県フィルタ
│   ├── sort-by-year-code.ts              # 年ソート
│   ├── get-latest-year-data.ts           # 最新年取得
│   └── get-previous-year-data.ts         # 前年取得
│
├── schemas/
│   └── stats-data-form.schema.ts         # Zodスキーマ
│
├── constants/
│   └── categories.ts                     # カテゴリ定数（※要修正: cdTab, cdCat01欠落）
│
└── __tests__/
    ├── services/
    │   ├── fetch-stats-data.test.ts
    │   └── fetch-formatted-stats.test.ts
    ├── repositories/
    │   ├── api/
    │   │   └── fetch-from-api.test.ts
    │   └── cache/
    │       ├── find-cache.test.ts
    │       └── save-cache.test.ts
    ├── utils/
    │   ├── format-stats-data.test.ts
    │   ├── extract-year-code.test.ts
    │   └── filter-prefecture-data.test.ts
    └── fixtures/
        └── mock-responses.ts
```

---

## e-Stat API 仕様リファレンス

### 1. 主要なパラメータ

| パラメータ名 | 説明 | 例 |
| :--- | :--- | :--- |
| `statsDataId` | 統計表 ID | `0003412313` |
| `cdArea` | 地域コードによる絞り込み | `13000` (東京都) |
| `cdTime` | 時間軸コードによる絞り込み | `2020000000` (2020年) |
| `cdCat01-15` | 分類事項（男女別、年齢別等） | `001` (総数) |

### 2. 精査・整形後のデータ構造 (FormattedValue)

生の API レスポンスに含まれる `VALUE` は、以下の `FormattedValue` 形式に変換されます。

- `value`: 数値（特殊文字 `***`, `-` 等は `null` に変換）
- `unit`: 単位（人、円、％等）
- `dimensions`: データの軸情報
  - `area`: 地域情報（コード、名称）
  - `time`: 時間情報（コード、名称）
  - `tab`: 表章項目
  - `cat01`〜`cat15`: 各種分類項目

## 7. データ保存アーキテクチャ (R2 Storage)

本パッケージは、e-Stat APIから取得したデータを自動的にR2ストレージにキャッシュ保存します。
APIのリクエスト制限回避と、レスポンス高速化のために機能します。

### ディレクトリ構造

```text
estat-api/
├── meta-info/
│   └── {statsDataId}.json              # 統計表メタ情報
└── stats-data/
    └── {statsDataId}/
        ├── default.json                # 全件データ
        └── {params}.json               # 条件付きデータ
```

### メタ情報 (Meta Info)
統計表の定義情報（タイトル、提供元、更新日など）を保存します。
- **キー形式**: `estat-api/meta-info/{statsDataId}.json`
- **保存タイミング**: `fetchMetaInfo` 成功時

### 統計データ (Stats Data)
実際の統計値を、クエリパラメータごとのファイル名で保存します。
- **キー形式**: `estat-api/stats-data/{statsDataId}/{params}.json`
- **パラメータ生成規則**:
    - パラメータがない場合: `default.json`
    - ある場合: `cdCat01=value_cdArea=value.json` （パラメータ名をアルファベット順などで結合）

## 既存コードの不整合

### categories.ts に cdTab と cdCat01 が欠落

`constants/categories.ts` の `AVAILABLE_CATEGORIES` に以下のフィールドが欠落しています：

| フィールド | categories.ts | formatted-value.ts | fetch-options.ts |
|-----------|---------------|-------------------|------------------|
| **cdTab** | **欠落** | `tab?: DimensionInfo` | `tabFilter?: string` |
| **cdCat01** | **欠落** | `cat01?: DimensionInfo` | `cdCat01?: string` |
| cdArea | あり | `area: DimensionInfo` | `cdArea?: string` |
| cdTime | あり | `time: DimensionInfo` | `cdTime?: string` |
| cdCat02-15 | あり | `cat02-15?: DimensionInfo` | - |

### fetch-options.ts の問題点

| 問題 | 詳細 |
|------|------|
| **命名規則の不統一** | `cdCat01` vs `cat02Filter` vs `tabFilter` |
| **cdCat02～cdCat15がない** | categories.tsには定義されている |
| **cdTabがない** | tabFilterはあるがcdTabがない |

### formatted-value.ts の問題点

| 問題 | 詳細 |
|------|------|
| **cat01～cat15を個別に列挙** | 冗長で保守性が低い |
| **旧形式フィールドが残存** | `areas: any[]`, `categories: any[]`, `years: any[]` |
| **関数が型定義ファイルにある** | `parseEstatValue`はutilsに移動すべき |

---

## 型定義の簡素化案

### constants/categories.ts（修正後）

```typescript
/**
 * e-Stat APIパラメータID
 */
export const CATEGORY_PARAM_IDS = [
  'cdArea', 'cdTime', 'cdTab',
  'cdCat01', 'cdCat02', 'cdCat03', 'cdCat04', 'cdCat05',
  'cdCat06', 'cdCat07', 'cdCat08', 'cdCat09', 'cdCat10',
  'cdCat11', 'cdCat12', 'cdCat13', 'cdCat14', 'cdCat15',
] as const;

export type CategoryParamId = typeof CATEGORY_PARAM_IDS[number];

/**
 * ディメンションID（formatted-value用）
 */
export const DIMENSION_IDS = [
  'area', 'time', 'tab',
  'cat01', 'cat02', 'cat03', 'cat04', 'cat05',
  'cat06', 'cat07', 'cat08', 'cat09', 'cat10',
  'cat11', 'cat12', 'cat13', 'cat14', 'cat15',
] as const;

export type DimensionId = typeof DIMENSION_IDS[number];

/**
 * UIラベル定義
 */
export const CATEGORY_LABELS: Record<CategoryParamId, string> = {
  cdArea: '地域',
  cdTime: '時間軸',
  cdTab: '表章項目',
  cdCat01: '分類01',
  cdCat02: '分類02',
  // ...
};
```

### types/fetch-options.ts（簡素化後）

```typescript
import type { CategoryParamId } from '../constants/categories';

export type FetchOptions = {
  readonly limit?: number;
  /** e-Stat APIパラメータ（cdArea, cdTime, cdTab, cdCat01-15） */
  readonly params?: Partial<Record<CategoryParamId, string>>;
};
```

### types/formatted-value.ts（簡素化後）

```typescript
import type { DimensionId } from '../constants/categories';

export type DimensionInfo = {
  readonly code: string;
  readonly name: string;
  readonly level?: string;
  readonly parentCode?: string;
  readonly unit?: string;
};

export type FormattedValue = {
  readonly value: number | null;
  /** 全ディメンション（area, time, tab, cat01-15） */
  readonly dimensions: Partial<Record<DimensionId, DimensionInfo>>;
  readonly unit?: string;
};

export type FormattedEstatData = {
  readonly tableInfo: FormattedTableInfo;
  readonly values: FormattedValue[];
  readonly notes: EstatNote[];
};
```

### 移行時の注意点

**Before:**
```typescript
const area = value.area;
const cat01 = value.cat01;
```

**After:**
```typescript
const area = value.dimensions.area;
const cat01 = value.dimensions.cat01;
```

### parseEstatValue の移動

`formatted-value.ts` から `utils/parse-estat-value.ts` へ移動：

```typescript
// utils/parse-estat-value.ts
export function parseEstatValue(value: string): number | null {
  if (value === '-' || value === '***' || value === 'X') {
    return null;
  }
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}
```
