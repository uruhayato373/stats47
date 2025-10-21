---
title: 地域階層システム仕様
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

# 地域階層システム仕様

## 概要

地域階層システムは、日本の行政区画（国・都道府県・市区町村）の 3 階層構造を管理し、地域間の親子関係、ナビゲーション、データ取得を効率的に行うためのシステムです。

## 階層構造

### 基本階層

```
日本（00000）
├── 北海道（01000）
│   ├── 札幌市（01100）
│   │   ├── 中央区（01101）
│   │   ├── 北区（01102）
│   │   └── ...
│   ├── 函館市（01202）
│   └── ...
├── 青森県（02000）
│   ├── 青森市（02201）
│   └── ...
└── ...
```

### 階層レベル

| レベル | 名称     | コード形式 | 例    | 説明     |
| ------ | -------- | ---------- | ----- | -------- |
| 0      | 国       | 00000      | 00000 | 日本全国 |
| 1      | 都道府県 | XX000      | 13000 | 東京都   |
| 2      | 市区町村 | XXXXX      | 13101 | 千代田区 |

## 地域コード体系

### コード構造

```
地域コード（5桁）
├── 上位2桁: 都道府県コード（01-47）
├── 下位3桁: 市区町村コード（000-999）
└── 特殊コード: 00000（全国）
```

### 都道府県コード

| 都道府県 | コード | 地域ブロック     |
| -------- | ------ | ---------------- |
| 北海道   | 01     | 北海道・東北地方 |
| 青森県   | 02     | 北海道・東北地方 |
| 岩手県   | 03     | 北海道・東北地方 |
| ...      | ...    | ...              |
| 東京都   | 13     | 関東・中部地方   |
| ...      | ...    | ...              |
| 沖縄県   | 47     | 九州・沖縄地方   |

### 市区町村コード

#### 政令指定都市

- **市**: 100（例: 札幌市 01100）
- **区**: 101-199（例: 中央区 01101）

#### 一般市

- **市**: 201-999（例: 函館市 01202）

#### 町村

- **町・村**: 201-999（例: 旭川町 01203）

## 地域タイプ

### AreaType

```typescript
type AreaType = "country" | "region" | "prefecture" | "municipality";
```

| タイプ       | 説明         | 例               |
| ------------ | ------------ | ---------------- |
| country      | 国           | 日本             |
| region       | 地域ブロック | 北海道・東北地方 |
| prefecture   | 都道府県     | 東京都           |
| municipality | 市区町村     | 千代田区         |

### AreaLevel

```typescript
type AreaLevel = "national" | "regional" | "prefectural" | "municipal";
```

| レベル      | 説明               | 対応する AreaType |
| ----------- | ------------------ | ----------------- |
| national    | 国レベル           | country           |
| regional    | 地域ブロックレベル | region            |
| prefectural | 都道府県レベル     | prefecture        |
| municipal   | 市区町村レベル     | municipality      |

## 親子関係

### 親地域の取得

```typescript
// 市区町村 → 都道府県
const parent = AreaService.getParentArea("13101");
// { areaCode: "13000", areaName: "東京都", ... }

// 都道府県 → 国
const parent = AreaService.getParentArea("13000");
// { areaCode: "00000", areaName: "日本", ... }
```

### 子地域の取得

```typescript
// 国 → 都道府県
const children = AreaService.getChildAreas("00000");
// [{ areaCode: "01000", areaName: "北海道" }, ...]

// 都道府県 → 市区町村
const children = AreaService.getChildAreas("13000");
// [{ areaCode: "13101", areaName: "千代田区" }, ...]
```

## 階層パス

### 完全パスの取得

```typescript
const path = AreaService.getHierarchyPath("13101");
// [
//   { areaCode: "00000", areaName: "日本", areaLevel: "national" },
//   { areaCode: "13000", areaName: "東京都", areaLevel: "prefectural" },
//   { areaCode: "13101", areaName: "千代田区", areaLevel: "municipal" }
// ]
```

### 階層レベルの取得

```typescript
const level = AreaService.getHierarchyLevel("13101");
// 2 (市区町村レベル)

const level = AreaService.getHierarchyLevel("13000");
// 1 (都道府県レベル)

const level = AreaService.getHierarchyLevel("00000");
// 0 (国レベル)
```

## 地域ブロック

### 地域ブロック定義

```json
{
  "hokkaido-tohoku": {
    "name": "北海道・東北地方",
    "prefectures": [
      "北海道",
      "青森県",
      "岩手県",
      "宮城県",
      "秋田県",
      "山形県",
      "福島県"
    ]
  },
  "kanto-chubu": {
    "name": "関東・中部地方",
    "prefectures": [
      "茨城県",
      "栃木県",
      "群馬県",
      "埼玉県",
      "千葉県",
      "東京都",
      "神奈川県",
      "新潟県",
      "富山県",
      "石川県",
      "福井県",
      "山梨県",
      "長野県",
      "岐阜県",
      "静岡県",
      "愛知県"
    ]
  },
  "kinki": {
    "name": "近畿地方",
    "prefectures": [
      "三重県",
      "滋賀県",
      "京都府",
      "大阪府",
      "兵庫県",
      "奈良県",
      "和歌山県"
    ]
  },
  "chugoku-shikoku": {
    "name": "中国・四国地方",
    "prefectures": [
      "鳥取県",
      "島根県",
      "岡山県",
      "広島県",
      "山口県",
      "徳島県",
      "香川県",
      "愛媛県",
      "高知県"
    ]
  },
  "kyushu-okinawa": {
    "name": "九州・沖縄地方",
    "prefectures": [
      "福岡県",
      "佐賀県",
      "長崎県",
      "熊本県",
      "大分県",
      "宮崎県",
      "鹿児島県",
      "沖縄県"
    ]
  }
}
```

### 地域ブロックの使用

```typescript
// 地域ブロック内の都道府県を取得
const prefectures = PrefectureService.getPrefecturesByRegion("hokkaido-tohoku");

// 都道府県の地域ブロックを取得
const region = PrefectureService.getRegionByPrefecture("01");
// { key: "hokkaido-tohoku", name: "北海道・東北地方", ... }
```

## 特殊ケース

### 政令指定都市

政令指定都市は、市と区の 2 階層構造を持ちます。

```
札幌市（01100）
├── 中央区（01101）
├── 北区（01102）
└── ...

大阪市（27100）
├── 都島区（27101）
├── 福島区（27102）
└── ...
```

### 東京 23 区

東京都の特別区は、都と区の 2 階層構造を持ちます。

```
東京都（13000）
├── 千代田区（13101）
├── 中央区（13102）
└── ...
```

## バリデーション

### コード検証

```typescript
// 地域コードの検証
const result = validateArea("13101");
// { isValid: true, areaType: "municipality", ... }

// 都道府県コードの検証
const result = validatePrefectureCode("13");
// { isValid: true, areaType: "prefecture", ... }

// 市区町村コードの検証
const result = validateMunicipalityCode("13101");
// { isValid: true, areaType: "municipality", ... }
```

### 階層関係の検証

```typescript
// 子孫関係の確認
const isDescendant = AreaService.isDescendantOf("13101", "13000");
// true (千代田区は東京都の子孫)

// 共通祖先の取得
const ancestor = AreaService.getCommonAncestor("13101", "13102");
// { areaCode: "13000", areaName: "東京都", ... }
```

## パフォーマンス考慮事項

### メモリ使用量

- 都道府県データ: 47 件 × 約 100 バイト = 4.7KB
- 市区町村データ: 1,913 件 × 約 150 バイト = 287KB
- **合計**: 約 292KB（圧縮後約 60KB）

### 検索性能

- 都道府県検索: O(1) - Map による直接アクセス
- 市区町村検索: O(n) - 線形検索（必要に応じてインデックス化）
- 階層パス取得: O(h) - h は階層の深さ（最大 3）

### 最適化手法

1. **遅延ロード**: 必要時のみデータを読み込み
2. **キャッシュ**: 一度読み込んだデータはメモリに保持
3. **インデックス**: 頻繁に検索される項目にインデックスを構築

## エラーハンドリング

### 無効なコード

```typescript
const result = validateArea("99999");
// { isValid: false, message: "Prefecture code must be between 01 and 47", ... }
```

### 存在しない地域

```typescript
const area = AreaService.getAreaByCode("99999");
// null
```

### 階層関係エラー

```typescript
const path = AreaService.getHierarchyPath("invalid");
// [] (空配列)
```

## 拡張性

### 新しい地域区分の追加

1. AreaType に新しいタイプを追加
2. 対応する AreaLevel を定義
3. データソースに新しい区分を追加
4. サービスメソッドを拡張

### 地域ブロックのカスタマイズ

地域ブロックは JSON ファイルで管理されているため、要件に応じて自由にカスタマイズ可能です。

## 参考資料

- [総務省統計局 市区町村コード一覧](https://www.soumu.go.jp/main_content/000000000.html)
- [e-Stat API ドキュメント](https://www.e-stat.go.jp/api/)
- [地域ドメイン概要](../overview.md)
