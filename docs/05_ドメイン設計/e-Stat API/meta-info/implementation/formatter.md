---
title: meta-info Formatter 実装ガイド
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - subdomain/meta-info
  - implementation
---

# meta-info Formatter 実装ガイド

## 概要

`EstatMetaInfoFormatter`は、e-Stat API から取得した生のメタ情報を、アプリケーションで使用しやすい構造化された形式に変換する責務を持ちます。

## 主要なメソッド

### parseCompleteMetaInfo()

```typescript
static parseCompleteMetaInfo(metaInfo: EstatMetaInfoResponse): ParsedMetaInfo
```

**目的**: 生の API レスポンスを完全に解析し、構造化されたデータに変換

**戻り値**: `ParsedMetaInfo` - 解析済みのメタ情報

### generateSelectOptions()

```typescript
static generateSelectOptions(metaInfo: EstatMetaInfoResponse): DimensionSelectOptions
```

**目的**: UI 用の選択肢データを生成（stats-data との互換性を保つ）

**戻り値**: `DimensionSelectOptions` - 各次元の選択肢配列

### extractTableInfo()

```typescript
static extractTableInfo(metaInfo: EstatMetaInfoResponse): TableInfo
```

**目的**: 統計表の基本情報を抽出

### extractCategories()

```typescript
static extractCategories(metaInfo: EstatMetaInfoResponse): CategoryInfo[]
```

**目的**: 分類情報を抽出

### extractAreas()

```typescript
static extractAreas(metaInfo: EstatMetaInfoResponse): PrefectureInfo[]
```

**目的**: 地域情報を抽出

### extractTimeAxis()

```typescript
static extractTimeAxis(metaInfo: EstatMetaInfoResponse): TimeAxisInfo
```

**目的**: 時間軸情報を抽出

## 実装詳細

### データ変換フロー

```
EstatMetaInfoResponse (生APIレスポンス)
    │
    ▼
parseCompleteMetaInfo()
    │
    ├─► extractTableInfo() → TableInfo
    ├─► extractCategories() → CategoryInfo[]
    ├─► extractAreas() → PrefectureInfo[]
    └─► extractTimeAxis() → TimeAxisInfo
            │
            ▼
    ParsedMetaInfo (構造化データ)
```

### 型安全性の確保

```typescript
// 型ガードを使用した安全な配列処理
const classItems = Array.isArray(timeClass.CLASS)
  ? timeClass.CLASS.filter((item): item is ClassItem => item !== undefined)
  : [timeClass.CLASS];
```

### エラーハンドリング

```typescript
try {
  return EstatMetaInfoFormatter.parseCompleteMetaInfo(metaInfo);
} catch (error) {
  console.error("メタ情報の解析に失敗しました:", error);
  return null;
}
```

## 使用例

### 基本的な使用

```typescript
import { EstatMetaInfoFormatter } from "@/lib/estat-api/meta-info";

// 完全なメタ情報を解析
const parsedData = EstatMetaInfoFormatter.parseCompleteMetaInfo(metaInfo);

console.log("統計表名:", parsedData.tableInfo.title);
console.log("分類数:", parsedData.dimensions.categories.length);
console.log("地域数:", parsedData.dimensions.areas.length);
```

### UI 用選択肢の生成

```typescript
// フォーム用の選択肢を生成
const selectOptions = EstatMetaInfoFormatter.generateSelectOptions(metaInfo);

// 地域選択肢
const areaOptions = selectOptions.area;
console.log("地域選択肢:", areaOptions);

// 時間軸選択肢
const timeOptions = selectOptions.time;
console.log("時間軸選択肢:", timeOptions);

// 分類選択肢
const categoryOptions = selectOptions.cat01;
console.log("分類選択肢:", categoryOptions);
```

### 個別データの抽出

```typescript
// 統計表基本情報のみ
const tableInfo = EstatMetaInfoFormatter.extractTableInfo(metaInfo);

// 分類情報のみ
const categories = EstatMetaInfoFormatter.extractCategories(metaInfo);

// 地域情報のみ
const areas = EstatMetaInfoFormatter.extractAreas(metaInfo);

// 時間軸情報のみ
const timeAxis = EstatMetaInfoFormatter.extractTimeAxis(metaInfo);
```

## 設定

### プロパティ優先順位

```typescript
const ESTAT_PROPERTY_PRIORITY = ["$", "@name", "@no", "@code"] as const;
```

### 都道府県フィルタ設定

```typescript
// 都道府県コードの条件
PREFECTURE_CODE_LENGTH: 5,
PREFECTURE_CODE_SUFFIX: "000",
EXCLUDE_NATIONAL_CODE: "00000",
```

## テスト

### 単体テスト例

```typescript
describe("EstatMetaInfoFormatter", () => {
  it("完全なメタ情報を正しく解析する", () => {
    const result = EstatMetaInfoFormatter.parseCompleteMetaInfo(mockMetaInfo);
    expect(result.tableInfo.id).toBe("0000010101");
    expect(result.dimensions.categories).toHaveLength(1);
  });

  it("UI用選択肢を正しく生成する", () => {
    const options = EstatMetaInfoFormatter.generateSelectOptions(mockMetaInfo);
    expect(options.area).toBeDefined();
    expect(options.time).toBeDefined();
    expect(options.cat01).toBeDefined();
  });

  it("年次が降順でソートされている", () => {
    const options = EstatMetaInfoFormatter.generateSelectOptions(mockMetaInfo);
    if (options.time.length > 1) {
      for (let i = 0; i < options.time.length - 1; i++) {
        expect(
          options.time[i].value.localeCompare(options.time[i + 1].value)
        ).toBeGreaterThan(0);
      }
    }
  });
});
```

## パフォーマンス考慮事項

### 1. メモ化

- 同じメタ情報の重複解析を避ける
- useMemo()の活用

### 2. 遅延評価

- 必要な部分のみを解析
- オンデマンドでのデータ抽出

### 3. メモリ使用量

- 大きなデータセットの効率的な処理
- 不要なデータの早期解放

## カスタマイズ

### プロパティ優先順位の変更

```typescript
// カスタム優先順位でレンダリング
const result = safeRender(obj, {
  propertyPriority: ["@name", "$", "@code"],
});
```

### フォールバック動作の制御

```typescript
// JSONフォールバックを無効化
const result = safeRender(obj, {
  fallbackToJson: false,
});
```

## トラブルシューティング

### よくある問題

1. **型エラー**

   - 型定義の確認
   - 型ガードの追加

2. **データが空**

   - API レスポンスの検証
   - フィルタ条件の確認

3. **ソート順序の問題**
   - 比較関数の確認
   - データ型の統一

### デバッグ方法

```typescript
// デバッグログの有効化
NEXT_PUBLIC_ESTAT_DEBUG = true;

// 中間結果の確認
console.log(
  "Raw CLASS_OBJ:",
  metaInfo.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ
);
console.log("Parsed categories:", parsedData.dimensions.categories);
```

## 関連ドキュメント

- [API 仕様](../specifications/api.md)
- [フェッチャー実装ガイド](fetcher.md)
- [バッチ処理実装ガイド](batch-processor.md)
- [型定義](../specifications/types.md)
