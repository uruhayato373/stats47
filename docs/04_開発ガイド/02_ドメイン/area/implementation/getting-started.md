---
title: 基本的な使い方
created: 2025-01-16
updated: 2025-01-16
status: published
tags:
  - stats47
  - domain/area
  - type/implementation
author: 開発チーム
version: 1.0.0
related:
  - "[[地域ドメイン概要]]"
  - "[[都道府県機能の使い方]]"
  - "[[市区町村機能の使い方]]"
---

# 基本的な使い方

## 概要

地域ドメインの基本的な使い方を説明します。都道府県、市区町村、地域階層の基本的な操作を学習できます。

## インストール・インポート

### 基本的なインポート

```typescript
import {
  AreaService,
  PrefectureService,
  MunicipalityService,
} from "@/infrastructure/area";
```

### 型定義のインポート

```typescript
import type {
  Prefecture,
  Municipality,
  AreaHierarchy,
  AreaType,
} from "@/infrastructure/area";
```

### バリデーション関数のインポート

```typescript
import {
  validateArea,
  validatePrefectureCode,
  validateMunicipalityCode,
} from "@/infrastructure/area";
```

## 都道府県の基本操作

### 全都道府県を取得

```typescript
// 全47都道府県を取得
const prefectures = PrefectureService.getAllPrefectures();
console.log(prefectures.length); // 47

// 最初の都道府県を表示
const firstPref = prefectures[0];
console.log(firstPref.prefName); // "北海道"
console.log(firstPref.prefCode); // "01000"
```

### コードから都道府県を取得

```typescript
// 2桁コードで取得
const tokyo = PrefectureService.getPrefectureByCode("13");
console.log(tokyo?.prefName); // "東京都"

// 5桁コードで取得
const hokkaido = PrefectureService.getPrefectureByCode("01000");
console.log(hokkaido?.prefName); // "北海道"
```

### 名前から都道府県を取得

```typescript
const osaka = PrefectureService.getPrefectureByName("大阪府");
console.log(osaka?.prefCode); // "27000"
```

### コードと名前の相互変換

```typescript
// コード → 名前
const name = PrefectureService.getPrefectureNameFromCode("13");
console.log(name); // "東京都"

// 名前 → コード
const code = PrefectureService.getPrefectureCodeFromName("東京都");
console.log(code); // "13"
```

## 市区町村の基本操作

### 全市区町村を取得

```typescript
// 全市区町村を取得（約1,913件）
const municipalities = MunicipalityService.getAllMunicipalities();
console.log(municipalities.length); // 1913
```

### コードから市区町村を取得

```typescript
const chiyoda = MunicipalityService.getMunicipalityByCode("13101");
console.log(chiyoda?.name); // "千代田区"
console.log(chiyoda?.type); // "ward"
console.log(chiyoda?.prefCode); // "13"
```

### 名前から市区町村を取得

```typescript
// 全国から検索
const chiyoda = MunicipalityService.getMunicipalityByName("千代田区");
console.log(chiyoda?.code); // "13101"

// 都道府県を指定して検索（より高速）
const chiyoda = MunicipalityService.getMunicipalityByName("千代田区", "13");
console.log(chiyoda?.code); // "13101"
```

### 都道府県別の市区町村を取得

```typescript
// 東京都の全市区町村を取得
const tokyoMunics = MunicipalityService.getMunicipalitiesByPrefecture("13");
console.log(tokyoMunics.length); // 62

// 最初の市区町村を表示
const firstMunic = tokyoMunics[0];
console.log(firstMunic.name); // "千代田区"
```

## 地域階層の基本操作

### 地域情報を取得

```typescript
// 地域コードから地域情報を取得
const area = AreaService.getAreaByCode("13101");
console.log(area?.areaName); // "千代田区"
console.log(area?.areaType); // "municipality"
console.log(area?.areaLevel); // "municipal"
```

### 地域タイプを判定

```typescript
const type = AreaService.getAreaType("13101");
console.log(type); // "municipality"

const type2 = AreaService.getAreaType("13000");
console.log(type2); // "prefecture"

const type3 = AreaService.getAreaType("00000");
console.log(type3); // "country"
```

### 親地域を取得

```typescript
// 市区町村の親（都道府県）を取得
const parent = AreaService.getParentArea("13101");
console.log(parent?.areaName); // "東京都"

// 都道府県の親（国）を取得
const country = AreaService.getParentArea("13000");
console.log(country?.areaName); // "日本"
```

### 子地域を取得

```typescript
// 都道府県の子（市区町村）を取得
const children = AreaService.getChildAreas("13000");
console.log(children.length); // 62（東京都の場合）

// 最初の子地域を表示
const firstChild = children[0];
console.log(firstChild.areaName); // "千代田区"
```

### 階層パスを取得

```typescript
// 国→都道府県→市区町村の階層パスを取得
const path = AreaService.getHierarchyPath("13101");
console.log(path.map((a) => a.areaName).join(" → "));
// "日本 → 東京都 → 千代田区"
```

### 完全名称を取得

```typescript
// 地域の完全名称を取得
const fullName = AreaService.getFullAreaName("13101");
console.log(fullName); // "日本 東京都 千代田区"
```

## 検索の基本操作

### 都道府県を検索

```typescript
// 名前で部分一致検索
const results = PrefectureService.searchPrefectures({
  query: "北",
});
console.log(results.length); // 2（北海道、青森県）

// 地域ブロックでフィルタリング
const tohokuResults = PrefectureService.searchPrefectures({
  query: "",
  regionKey: "hokkaido-tohoku",
});
console.log(tohokuResults.length); // 7
```

### 市区町村を検索

```typescript
// 名前で部分一致検索
const results = MunicipalityService.searchMunicipalities({
  query: "中央",
  limit: 5,
});
console.log(results.length); // 5

// 都道府県とタイプでフィルタリング
const tokyoWards = MunicipalityService.searchMunicipalities({
  query: "",
  prefCode: "13",
  type: "ward",
});
console.log(tokyoWards.length); // 23（東京23区）
```

### 地域を統合検索

```typescript
// 都道府県と市区町村を統合検索
const results = AreaService.searchAreas({
  query: "中央",
  limit: 10,
});
console.log(results.length); // 10

// 結果の詳細を表示
results.forEach((result) => {
  console.log(`${result.name} (${result.type})`);
});
// "中央区 (municipality)"
// "中央区 (municipality)"
// ...
```

## バリデーションの基本操作

### 地域コードを検証

```typescript
// 有効なコードを検証
const result = validateArea("13101");
if (result.isValid) {
  console.log(`Valid ${result.areaType} code`);
} else {
  console.error(result.message);
}

// 無効なコードを検証
const invalidResult = validateArea("99999");
console.log(invalidResult.isValid); // false
console.log(invalidResult.message); // "Prefecture code must be between 01 and 47"
```

### 都道府県コードを検証

```typescript
const result = validatePrefectureCode("13");
console.log(result.isValid); // true
console.log(result.areaType); // "prefecture"
```

### 市区町村コードを検証

```typescript
const result = validateMunicipalityCode("13101");
console.log(result.isValid); // true
console.log(result.areaType); // "municipality"
```

## 地域ブロックの基本操作

### 全地域ブロックを取得

```typescript
const regions = PrefectureService.getAllRegions();
console.log(regions.length); // 5

regions.forEach((region) => {
  console.log(`${region.name}: ${region.prefectures.length}都道府県`);
});
// "北海道・東北地方: 7都道府県"
// "関東・中部地方: 16都道府県"
// ...
```

### 都道府県の地域ブロックを取得

```typescript
const region = PrefectureService.getRegionByPrefecture("13");
console.log(region?.name); // "関東・中部地方"
```

### 地域ブロック内の都道府県を取得

```typescript
const prefectures = PrefectureService.getPrefecturesByRegion("hokkaido-tohoku");
console.log(prefectures.length); // 7

prefectures.forEach((pref) => {
  console.log(pref.prefName);
});
// "北海道"
// "青森県"
// ...
```

## 統計情報の取得

### 基本統計

```typescript
const stats = AreaService.getStatistics();
console.log(stats.prefectures); // 47
console.log(stats.municipalities); // 1913
```

### 都道府県別の市区町村数

```typescript
const counts = MunicipalityService.getCountByPrefecture();
console.log(counts["13"]); // 62（東京都）
console.log(counts["01"]); // 189（北海道）
```

### タイプ別の市区町村数

```typescript
const typeCounts = MunicipalityService.getCountByType();
console.log(typeCounts.city); // 市の数
console.log(typeCounts.ward); // 区の数
console.log(typeCounts.town); // 町の数
console.log(typeCounts.village); // 村の数
```

## よくあるパターン

### 地域選択コンポーネント用のデータ準備

```typescript
// 都道府県選択用のオプション
const prefectureOptions = PrefectureService.getAllPrefectures().map((pref) => ({
  value: pref.prefCode,
  label: pref.prefName,
}));

// 市区町村選択用のオプション（都道府県指定）
const municipalityOptions = MunicipalityService.getMunicipalitiesByPrefecture(
  "13"
).map((munic) => ({
  value: munic.code,
  label: munic.name,
}));
```

### 地域コードの正規化

```typescript
// 2桁コードを5桁に正規化
const normalized = PrefectureService.normalize("13");
console.log(normalized); // "13000"

// 地域コードの正規化
import { normalizeAreaCode } from "@/infrastructure/area";
const normalized = normalizeAreaCode("13");
console.log(normalized); // "13000"
```

### 階層関係の確認

```typescript
// 子孫関係の確認
const isDescendant = AreaService.isDescendantOf("13101", "13000");
console.log(isDescendant); // true（千代田区は東京都の子孫）

// 共通祖先の取得
const ancestor = AreaService.getCommonAncestor("13101", "13102");
console.log(ancestor?.areaName); // "東京都"
```

## エラーハンドリング

### 基本的なエラーハンドリング

```typescript
function getAreaSafely(areaCode: string) {
  try {
    const area = AreaService.getAreaByCode(areaCode);
    if (!area) {
      throw new Error(`Area not found: ${areaCode}`);
    }
    return area;
  } catch (error) {
    console.error("Error getting area:", error);
    return null;
  }
}
```

### バリデーション結果の活用

```typescript
function processAreaCode(areaCode: string) {
  const validation = validateArea(areaCode);

  if (!validation.isValid) {
    console.error(`Invalid area code: ${validation.message}`);
    return null;
  }

  // 有効なコードの場合の処理
  const area = AreaService.getAreaByCode(areaCode);
  return area;
}
```

## パフォーマンスの考慮

### 遅延ロード

```typescript
// 必要時のみデータを読み込み
async function loadAreaData() {
  const { AreaService } = await import("@/infrastructure/area");
  return AreaService.getAllPrefectures();
}
```

### キャッシュの活用

```typescript
// 一度取得したデータはキャッシュ
let cachedPrefectures: Prefecture[] | null = null;

function getCachedPrefectures() {
  if (!cachedPrefectures) {
    cachedPrefectures = PrefectureService.getAllPrefectures();
  }
  return cachedPrefectures;
}
```

## 次のステップ

- [都道府県機能の使い方](./prefecture-usage.md) - 都道府県機能の詳細
- [市区町村機能の使い方](./municipality-usage.md) - 市区町村機能の詳細
- [ベストプラクティス](./best-practices.md) - 実装のベストプラクティス

## 参考資料

- [API 仕様](../specifications/api.md) - 全 API の詳細仕様
- [データ構造仕様](../specifications/data-structure.md) - データ構造の詳細
- [地域階層システム仕様](../specifications/hierarchy.md) - 階層システムの詳細
