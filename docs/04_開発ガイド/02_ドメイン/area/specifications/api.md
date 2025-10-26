---
title: API仕様
created: 2025-01-16
updated: 2025-01-16
status: published
tags:
  - stats47
  - domain/area
  - type/specification
author: 開発チーム
version: 1.0.0
related:
  - "[[地域ドメイン概要]]"
  - "[[データ構造仕様]]"
---

# API 仕様

## 概要

地域ドメインの各サービスクラスが提供する API の詳細仕様を定義します。

## AreaService API

### 階層管理メソッド

#### getAreaByCode(areaCode: string): AreaHierarchy | null

地域コードから地域情報を取得します。

**パラメータ**:

- `areaCode`: 地域コード（2 桁、5 桁、または 00000）

**戻り値**:

- 成功時: AreaHierarchy オブジェクト
- 失敗時: null

**例**:

```typescript
const area = AreaService.getAreaByCode("13101");
// {
//   areaCode: "13101",
//   areaName: "千代田区",
//   areaType: "municipality",
//   areaLevel: "municipal",
//   parentCode: "13000"
// }
```

#### getAreaType(areaCode: string): AreaType | null

地域コードから地域タイプを判定します。

**パラメータ**:

- `areaCode`: 地域コード

**戻り値**:

- 成功時: AreaType
- 失敗時: null

**例**:

```typescript
const type = AreaService.getAreaType("13101");
// "municipality"
```

#### getParentArea(areaCode: string): AreaHierarchy | null

親地域を取得します。

**パラメータ**:

- `areaCode`: 地域コード

**戻り値**:

- 成功時: 親地域の AreaHierarchy
- 失敗時: null

**例**:

```typescript
const parent = AreaService.getParentArea("13101");
// { areaCode: "13000", areaName: "東京都", ... }
```

#### getChildAreas(areaCode: string): AreaHierarchy[]

子地域リストを取得します。

**パラメータ**:

- `areaCode`: 地域コード

**戻り値**:

- AreaHierarchy 配列

**例**:

```typescript
const children = AreaService.getChildAreas("13000");
// [{ areaCode: "13101", areaName: "千代田区" }, ...]
```

#### getHierarchyPath(areaCode: string): AreaHierarchy[]

階層パスを取得します（国 → 都道府県 → 市区町村）。

**パラメータ**:

- `areaCode`: 地域コード

**戻り値**:

- AreaHierarchy 配列（祖先から順番）

**例**:

```typescript
const path = AreaService.getHierarchyPath("13101");
// [
//   { areaCode: "00000", areaName: "日本" },
//   { areaCode: "13000", areaName: "東京都" },
//   { areaCode: "13101", areaName: "千代田区" }
// ]
```

#### getFullAreaName(areaCode: string): string | null

地域の完全名称を取得します。

**パラメータ**:

- `areaCode`: 地域コード

**戻り値**:

- 成功時: 完全名称文字列
- 失敗時: null

**例**:

```typescript
const fullName = AreaService.getFullAreaName("13101");
// "日本 東京都 千代田区"
```

#### searchAreas(options: AreaSearchOptions): AreaSearchResult[]

地域を検索します。

**パラメータ**:

- `options`: 検索オプション

**戻り値**:

- AreaSearchResult 配列

**例**:

```typescript
const results = AreaService.searchAreas({
  query: "中央",
  areaType: "municipality",
  limit: 10,
});
// [{ code: "01101", name: "中央区", type: "municipality" }, ...]
```

### ユーティリティメソッド

#### getHierarchyLevel(areaCode: string): number

地域の階層レベルを取得します。

**戻り値**:

- 0: 国レベル
- 1: 都道府県レベル
- 2: 市区町村レベル
- -1: 無効

#### getCommonAncestor(areaCode1: string, areaCode2: string): AreaHierarchy | null

2 つの地域の共通祖先を取得します。

#### isDescendantOf(descendantCode: string, ancestorCode: string): boolean

地域が別の地域の子孫かチェックします。

#### getStatistics(): object

地域統計を取得します。

## PrefectureService API

### 基本取得メソッド

#### getAllPrefectures(): Prefecture[]

全都道府県を取得します。

**戻り値**:

- Prefecture 配列（47 件）

#### getPrefectureByCode(prefCode: string): Prefecture | null

都道府県コードから都道府県を取得します。

**パラメータ**:

- `prefCode`: 都道府県コード（2 桁または 5 桁）

**例**:

```typescript
const pref = PrefectureService.getPrefectureByCode("13");
// { prefCode: "13000", prefName: "東京都" }
```

#### getPrefectureByName(prefName: string): Prefecture | null

都道府県名から都道府県を取得します。

**パラメータ**:

- `prefName`: 都道府県名

**例**:

```typescript
const pref = PrefectureService.getPrefectureByName("東京都");
// { prefCode: "13000", prefName: "東京都" }
```

### 変換メソッド

#### getPrefectureNameFromCode(prefCode: string): string | null

都道府県コードから都道府県名を取得します。

**例**:

```typescript
const name = PrefectureService.getPrefectureNameFromCode("13");
// "東京都"
```

#### getPrefectureCodeFromName(prefName: string): string | null

都道府県名から都道府県コード（2 桁）を取得します。

**例**:

```typescript
const code = PrefectureService.getPrefectureCodeFromName("東京都");
// "13"
```

### 地域ブロックメソッド

#### getAllRegions(): Region[]

全地域ブロックを取得します。

#### getRegionByKey(regionKey: string): Region | null

地域ブロックキーから地域ブロックを取得します。

**例**:

```typescript
const region = PrefectureService.getRegionByKey("hokkaido-tohoku");
// { key: "hokkaido-tohoku", name: "北海道・東北地方", prefectures: [...] }
```

#### getRegionByPrefecture(prefCode: string): Region | null

都道府県が属する地域ブロックを取得します。

#### getPrefecturesByRegion(regionKey: string): Prefecture[]

地域ブロック内の都道府県リストを取得します。

### 検索メソッド

#### searchPrefectures(options: PrefectureSearchOptions): Prefecture[]

都道府県を検索します。

**例**:

```typescript
const results = PrefectureService.searchPrefectures({
  query: "北",
  regionKey: "hokkaido-tohoku",
});
// [{ prefCode: "01000", prefName: "北海道" }]
```

### ユーティリティメソッド

#### existsPrefecture(prefCode: string): boolean

都道府県が存在するかチェックします。

#### getPrefectureMap(): Record<string, string>

都道府県マップ（コード → 名前）を取得します。

#### getPrefectureNameToCodeMap(): Record<string, string>

都道府県名 → コードマップを取得します。

## MunicipalityService API

### 基本取得メソッド

#### getAllMunicipalities(): Municipality[]

全市区町村を取得します。

**戻り値**:

- Municipality 配列（約 1,913 件）

#### getMunicipalityByCode(municCode: string): Municipality | null

市区町村コードから市区町村を取得します。

**パラメータ**:

- `municCode`: 市区町村コード（5 桁）

**例**:

```typescript
const munic = MunicipalityService.getMunicipalityByCode("13101");
// { code: "13101", name: "千代田区", prefCode: "13", type: "ward" }
```

#### getMunicipalityByName(name: string, prefCode?: string): Municipality | null

市区町村名から市区町村を取得します。

**パラメータ**:

- `name`: 市区町村名
- `prefCode`: 都道府県コード（オプション、検索範囲を絞る）

**例**:

```typescript
const munic = MunicipalityService.getMunicipalityByName("千代田区", "13");
// { code: "13101", name: "千代田区", ... }
```

### フィルタリングメソッド

#### getMunicipalitiesByPrefecture(prefCode: string): Municipality[]

都道府県内の全市区町村を取得します。

**例**:

```typescript
const munics = MunicipalityService.getMunicipalitiesByPrefecture("13");
// [{ code: "13101", name: "千代田区" }, ...]
```

#### getMunicipalitiesByType(type: MunicipalityType): Municipality[]

市区町村タイプで絞り込みます。

**例**:

```typescript
const cities = MunicipalityService.getMunicipalitiesByType("city");
// 全市のリスト
```

#### getMunicipalitiesByPrefectureAndType(prefCode: string, type: MunicipalityType): Municipality[]

都道府県 × タイプで市区町村を取得します。

### 検索メソッド

#### searchMunicipalities(options: MunicipalitySearchOptions): Municipality[]

市区町村を検索します。

**例**:

```typescript
const results = MunicipalityService.searchMunicipalities({
  query: "中央",
  prefCode: "13",
  type: "ward",
  limit: 5,
});
// [{ code: "13101", name: "中央区" }]
```

### 政令指定都市メソッド

#### getDesignatedCityWards(cityCode: string): Municipality[]

政令指定都市の区を取得します。

**例**:

```typescript
const wards = MunicipalityService.getDesignatedCityWards("01100");
// 札幌市の区のリスト
```

#### getParentCity(municCode: string): Municipality | null

市区町村の親（政令指定都市）を取得します。

### 統計メソッド

#### getCount(): number

市区町村数を取得します。

#### getCountByPrefecture(): Record<string, number>

都道府県ごとの市区町村数を取得します。

#### getCountByType(): Record<MunicipalityType, number>

タイプ別の市区町村数を取得します。

## バリデーション API

### validateArea(areaCode: string): AreaValidationResult

地域コードの包括的な検証を行います。

**例**:

```typescript
const result = validateArea("13101");
// { isValid: true, areaType: "municipality", message: "Valid municipality code" }
```

### validatePrefectureCode(prefCode: string): AreaValidationResult

都道府県コードの検証を行います。

### validateMunicipalityCode(municCode: string): AreaValidationResult

市区町村コードの検証を行います。

### validatePrefectureName(prefName: string): boolean

都道府県名の検証を行います。

## エラーハンドリング

### 一般的なエラーパターン

1. **無効なコード**: 存在しない地域コード
2. **形式エラー**: 不正なコード形式
3. **範囲外エラー**: コードが有効範囲外
4. **型エラー**: 期待される型と異なる

### エラーレスポンス例

```typescript
// 無効なコード
{
  isValid: false,
  message: "Prefecture code must be between 01 and 47",
  details: {
    code: "99",
    expectedFormat: "01-47",
    actualFormat: "99"
  }
}

// 存在しない地域
const area = AreaService.getAreaByCode("99999");
// null
```

## パフォーマンス仕様

### レスポンス時間

| メソッド       | 平均レスポンス時間 | 最大レスポンス時間 |
| -------------- | ------------------ | ------------------ |
| 基本取得       | < 1ms              | < 5ms              |
| 検索           | < 10ms             | < 50ms             |
| 階層パス取得   | < 5ms              | < 20ms             |
| バリデーション | < 1ms              | < 5ms              |

### メモリ使用量

- 初期化時: 約 300KB
- 実行時: 約 50KB（キャッシュ後）

## 使用例

### 基本的な使い方

```typescript
import {
  AreaService,
  PrefectureService,
  MunicipalityService,
} from "@/infrastructure/area";

// 都道府県を取得
const tokyo = PrefectureService.getPrefectureByCode("13");
console.log(tokyo?.prefName); // "東京都"

// 市区町村を取得
const chiyoda = MunicipalityService.getMunicipalityByCode("13101");
console.log(chiyoda?.name); // "千代田区"

// 階層パスを取得
const path = AreaService.getHierarchyPath("13101");
console.log(path.map((a) => a.areaName).join(" → "));
// "日本 → 東京都 → 千代田区"
```

### 検索の使い方

```typescript
// 都道府県を検索
const prefs = PrefectureService.searchPrefectures({
  query: "北",
  regionKey: "hokkaido-tohoku",
});

// 市区町村を検索
const munics = MunicipalityService.searchMunicipalities({
  query: "中央",
  prefCode: "13",
  type: "ward",
});
```

### バリデーションの使い方

```typescript
import { validateArea, validatePrefectureCode } from "@/infrastructure/area";

// 地域コードを検証
const result = validateArea("13101");
if (result.isValid) {
  console.log(`Valid ${result.areaType} code`);
} else {
  console.error(result.message);
}
```

## 参考資料

- [地域ドメイン概要](../overview.md)
- [データ構造仕様](./data-structure.md)
- [地域階層システム仕様](./hierarchy.md)
