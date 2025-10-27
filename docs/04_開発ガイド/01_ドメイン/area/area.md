---
title: Area（地域）ドメイン完全ガイド
created: 2025-10-26
updated: 2025-10-26
status: published
tags:
  - stats47
  - domain/area
  - complete-guide
author: 開発チーム
version: 2.0.0
---

# Area（地域）ドメイン完全ガイド

## 目次

1. [概要](#概要)
2. [ドメイン設計](#ドメイン設計)
3. [データ構造仕様](#データ構造仕様)
4. [地域階層システム](#地域階層システム)
5. [API 仕様](#api仕様)
6. [実装ガイド](#実装ガイド)
7. [基本的な使い方](#基本的な使い方)
8. [行政区域データ管理](#行政区域データ管理)
9. [GeoShape 自動キャッシング](#geoshape自動キャッシング)
10. [既存コード移行計画](#既存コード移行計画)
11. [テスト戦略](#テスト戦略)
12. [参考資料](#参考資料)

---

# 概要

## ドメインの責任

地域（Area）ドメインは、日本の行政区画（国・都道府県・市区町村）の階層構造を統合管理します。

### 主な責任

1. **都道府県データの管理**: 47 都道府県の基本情報の提供
2. **市区町村データの管理**: 全国約 1,900 の市区町村情報の提供
3. **地域階層の管理**: 国 → 都道府県 → 市区町村の親子関係の管理
4. **地域コードの検証**: 地域コードの妥当性検証と正規化
5. **地域検索機能**: 名前・コードによる地域検索
6. **地域ブロック管理**: 北海道・東北、関東・中部などの地域区分管理

## アーキテクチャ

### サービスレイヤー構成

```
src/infrastructure/area/
├── services/
│   ├── area-service.ts           # 階層管理サービス
│   ├── prefecture-service.ts     # 都道府県サービス
│   └── city-service.ts            # 市区町村サービス
├── utils/
│   └── code-converter.ts         # コード変換ユーティリティ
├── validators/
│   └── code-validator.ts         # コード検証
├── types/
│   └── index.ts                  # 型定義
└── index.ts                      # 統一エクスポート
```

### データソース

```
data/mock/
├── prefectures.json      # 都道府県マスターデータ (4KB)
└── cities.json           # 市区町村マスターデータ (220KB)
```

**特徴**:

- 静的 JSON ファイルとして管理
- ビルド時に最適化・圧縮
- オフライン対応可能
- 高速アクセス

## ドメインの価値

### ビジネス価値

1. **統計データの地域軸**: 全ての統計データは地域コードで分類される
2. **ユーザビリティ向上**: 地域名での検索・フィルタリングが可能
3. **データ整合性**: 単一データソースにより地域データの一貫性を保証

### 技術的価値

1. **データ統合**: 分散していた地域データを一元管理
2. **型安全性**: TypeScript による厳密な型定義
3. **再利用性**: 全ドメインから利用可能な共通基盤
4. **拡張性**: 新しい地域区分の追加が容易

## 関連ドメイン

### 依存するドメイン

なし（最も基盤的なドメイン）

### 依存されるドメイン

- **ranking**: 都道府県・市区町村別ランキングで使用
- **estat-api**: e-Stat API から取得したデータの地域コード解決
- **dashboard**: ダッシュボードの地域フィルタリング
- **visualization**: コロプレス地図での地域表示

### データフロー

```
┌─────────────────┐
│  prefectures.json │
│    cities.json    │
└────────┬──────────┘
         │
         ↓
    ┌─────────┐
    │AreaService│
    └────┬────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
Prefecture  Municipality
 Service     Service
    │         │
    └────┬────┘
         │
         ↓
  ┌──────────────┐
  │ 他のドメイン  │
  │ (ranking,    │
  │  estat-api,  │
  │  dashboard)  │
  └──────────────┘
```

## 主要機能

### 1. 都道府県管理

- 全 47 都道府県の取得
- コード ⇔ 名前の相互変換
- 地域ブロック別の取得
- 都道府県検索

### 2. 市区町村管理

- 全市区町村の取得（約 1,900 件）
- 都道府県別の市区町村リスト取得
- 市区町村タイプ別の取得（市・区・町・村）
- 政令指定都市の区管理
- 市区町村検索

### 3. 階層管理

- 親地域・子地域の取得
- 階層パスの取得（国 → 都道府県 → 市区町村）
- 地域タイプの判定
- 地域の完全名称生成

### 4. コード検証

- 地域コードの妥当性検証
- コード形式の正規化
- 2 桁 ⇔ 5 桁コード変換

## パフォーマンス

### メモリ使用量

- prefectures.json: 4KB
- cities.json: 220KB → 圧縮後 約 30KB
- **合計**: 約 34KB（圧縮後）

### 初回ロード時間

- Dynamic Import 使用: 必要時のみロード
- 初期化処理: < 10ms
- 検索処理: < 1ms

---

# ドメイン設計

## 設計方針

### 値オブジェクト設計

- **目的**: 地域データを不変オブジェクトとして管理
- **R2 ストレージ採用**: 静的データの効率的な配信
- **環境別データソース**: mock 環境ではローカルファイル、本番環境では R2

### 設計原則

- **環境判断**: `NEXT_PUBLIC_ENV=mock`で判断（追加の環境変数不要）
- **フォルダ構成**: `data/mock/r2/areas/`に mock データを配置
- **リポジトリパターン**: インターフェースで抽象化、環境別実装

## フォルダ構成

### ソースコード構成

```
src/infrastructure/area/
├── model/
│   ├── Prefecture.ts          # 都道府県値オブジェクト
│   ├── Municipality.ts        # 市区町村値オブジェクト
│   ├── AreaCode.ts            # 地域コード値オブジェクト
│   └── AreaLevel.ts           # 地域レベル値オブジェクト
├── repository/
│   ├── AreaRepository.ts      # リポジトリインターフェース
│   ├── MockAreaRepository.ts  # Mock実装
│   └── R2AreaRepository.ts    # R2実装
├── service/
│   └── AreaService.ts         # ドメインサービス
└── factory/
    └── createAreaRepository.ts # ファクトリー関数
```

### データファイル構成

```
# ソースデータ
data/mock/
├── prefectures.json
└── cities.json

# Mock環境用データ
data/mock/r2/areas/
├── prefectures.json
└── cities.json
```

---

# データ構造仕様

## 都道府県データ構造

### prefectures.json

```json
{
  "prefectures": [
    {
      "prefCode": "01000",
      "prefName": "北海道"
    },
    {
      "prefCode": "02000",
      "prefName": "青森県"
    }
  ],
  "regions": {
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
    }
  }
}
```

### Prefecture インターフェース

```typescript
interface Prefecture {
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 都道府県名 */
  prefName: string;
  /** 地域ブロックキー（動的に設定） */
  regionKey?: string;
}
```

### フィールド制約

| フィールド | 型     | 必須 | 制約                   | 例                |
| ---------- | ------ | ---- | ---------------------- | ----------------- |
| prefCode   | string | ✅   | 5 桁の数字、末尾 000   | "01000"           |
| prefName   | string | ✅   | 2-4 文字 + 都/道/府/県 | "北海道"          |
| regionKey  | string | ❌   | 地域ブロックのキー     | "hokkaido-tohoku" |

### 都道府県コード制約

- **形式**: `XX000`（X は 01-47 の数字）
- **範囲**: 01000-47000
- **末尾**: 必ず 000

### 都道府県名制約

- **長さ**: 3-5 文字
- **末尾**: 都、道、府、県のいずれか
- **一意性**: 全国で一意

## 市区町村データ構造

### cities.json

e-Stat API metainfo の area 構造をそのまま保持する配列形式：

```json
[
  {
    "@code": "01101",
    "@name": "北海道 札幌市 中央区",
    "@level": "3",
    "@parentCode": "01100"
  },
  {
    "@code": "01202",
    "@name": "北海道 函館市",
    "@level": "2",
    "@parentCode": "01000"
  }
]
```

### Municipality インターフェース

```typescript
interface Municipality {
  /** 市区町村コード（5桁） */
  code: string;
  /** 市区町村名 */
  name: string;
  /** 完全名称（都道府県名を含む） */
  fullName: string;
  /** 都道府県コード（2桁） */
  prefCode: string;
  /** 親コード（政令指定都市の区の場合は市コード） */
  parentCode?: string;
  /** 市区町村タイプ */
  type: MunicipalityType;
  /** 階層レベル（1:都道府県, 2:市, 3:区） */
  level: number;
}
```

### MunicipalityType

```typescript
type MunicipalityType = "city" | "ward" | "town" | "village";
```

| タイプ  | 説明 | 例             |
| ------- | ---- | -------------- |
| city    | 市   | 札幌市、函館市 |
| ward    | 区   | 中央区、北区   |
| town    | 町   | 旭川町         |
| village | 村   | 美瑛村         |

### 市区町村コード制約

- **形式**: `XXXXX`（5 桁の数字）
- **上位 2 桁**: 都道府県コード（01-47）
- **下位 3 桁**: 市区町村コード（000-999）

#### 下位 3 桁の規則

| 範囲    | 説明             | 例              |
| ------- | ---------------- | --------------- |
| 000     | 都道府県         | 01000（北海道） |
| 100     | 政令指定都市     | 01100（札幌市） |
| 101-199 | 政令指定都市の区 | 01101（中央区） |
| 201-999 | 一般市・町・村   | 01202（函館市） |

## 地域ブロックデータ構造

### Region インターフェース

```typescript
interface Region {
  /** 地域キー */
  key: string;
  /** 地域名 */
  name: string;
  /** 含まれる都道府県名リスト */
  prefectures: string[];
}
```

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

## 地域階層データ構造

### AreaHierarchy インターフェース

```typescript
interface AreaHierarchy {
  /** 地域コード */
  areaCode: string;
  /** 地域名 */
  areaName: string;
  /** 地域タイプ */
  areaType: AreaType;
  /** 地域階層レベル */
  areaLevel: AreaLevel;
  /** 親地域コード */
  parentCode?: string;
  /** 子地域コードリスト */
  children?: string[];
}
```

### 階層関係の例

```typescript
// 国レベル
{
  areaCode: "00000",
  areaName: "日本",
  areaType: "country",
  areaLevel: "national",
  children: ["01000", "02000", "03000", ...]
}

// 都道府県レベル
{
  areaCode: "13000",
  areaName: "東京都",
  areaType: "prefecture",
  areaLevel: "prefectural",
  parentCode: "00000",
  children: ["13101", "13102", "13103", ...]
}

// 市区町村レベル
{
  areaCode: "13101",
  areaName: "千代田区",
  areaType: "municipality",
  areaLevel: "municipal",
  parentCode: "13000"
}
```

## データ整合性制約

### 都道府県データ

1. **prefCode の一意性**: 47 都道府県で一意
2. **prefName の一意性**: 全国で一意
3. **コード範囲**: 01000-47000
4. **地域ブロック**: 全ての都道府県が地域ブロックに属する

### 市区町村データ

1. **code の一意性**: 全国で一意
2. **prefCode の整合性**: 存在する都道府県コード
3. **parentCode の整合性**: 存在する市区町村コード
4. **タイプの整合性**: コードとタイプが一致

### e-Stat 互換性

cities.json は e-Stat API metainfo の area 構造を配列として保持しており、以下の利点があります：

1. **データ整合性**: e-Stat API との完全互換
2. **メンテナンス性**: 再抽出時の変換ロジック不要
3. **拡張性**: 将来的な API 直接取得への布石
4. **階層情報**: level, parentCode が完全保持

---

# 地域階層システム

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
| 東京都   | 13     | 関東・中部地方   |
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

---

# API 仕様

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

**例**:

```typescript
const type = AreaService.getAreaType("13101");
// "municipality"
```

#### getParentArea(areaCode: string): AreaHierarchy | null

親地域を取得します。

**例**:

```typescript
const parent = AreaService.getParentArea("13101");
// { areaCode: "13000", areaName: "東京都", ... }
```

#### getChildAreas(areaCode: string): AreaHierarchy[]

子地域リストを取得します。

**例**:

```typescript
const children = AreaService.getChildAreas("13000");
// [{ areaCode: "13101", areaName: "千代田区" }, ...]
```

#### getHierarchyPath(areaCode: string): AreaHierarchy[]

階層パスを取得します（国 → 都道府県 → 市区町村）。

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

**例**:

```typescript
const fullName = AreaService.getFullAreaName("13101");
// "日本 東京都 千代田区"
```

#### searchAreas(options: AreaSearchOptions): AreaSearchResult[]

地域を検索します。

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

**戻り値**: Prefecture 配列（47 件）

#### getPrefectureByCode(prefCode: string): Prefecture | null

都道府県コードから都道府県を取得します。

**パラメータ**: `prefCode`: 都道府県コード（2 桁または 5 桁）

**例**:

```typescript
const pref = PrefectureService.getPrefectureByCode("13");
// { prefCode: "13000", prefName: "東京都" }
```

#### getPrefectureByName(prefName: string): Prefecture | null

都道府県名から都道府県を取得します。

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

## MunicipalityService API

### 基本取得メソッド

#### getAllMunicipalities(): Municipality[]

全市区町村を取得します（約 1,913 件）。

#### getMunicipalityByCode(municCode: string): Municipality | null

市区町村コードから市区町村を取得します（5 桁）。

**例**:

```typescript
const munic = MunicipalityService.getMunicipalityByCode("13101");
// { code: "13101", name: "千代田区", prefCode: "13", type: "ward" }
```

#### getMunicipalityByName(name: string, prefCode?: string): Municipality | null

市区町村名から市区町村を取得します。

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

---

# 実装ガイド

## 値オブジェクトの実装

### Prefecture

```typescript
// src/infrastructure/area/model/Prefecture.ts
export class Prefecture {
  constructor(public readonly code: AreaCode, public readonly name: string) {}

  static fromJson(json: any): Prefecture {
    return new Prefecture(new AreaCode(json.prefCode), json.prefName);
  }

  equals(other: Prefecture): boolean {
    return this.code.equals(other.code);
  }

  toString(): string {
    return `${this.code}: ${this.name}`;
  }
}
```

### Municipality

```typescript
// src/infrastructure/area/model/Municipality.ts
export class Municipality {
  constructor(
    public readonly code: AreaCode,
    public readonly name: string,
    public readonly level: number,
    public readonly parentCode: AreaCode
  ) {}

  static fromJson(json: any): Municipality {
    return new Municipality(
      new AreaCode(json["@code"]),
      json["@name"],
      parseInt(json["@level"], 10),
      new AreaCode(json["@parentCode"])
    );
  }
}
```

## リポジトリの実装

### インターフェース

```typescript
// src/infrastructure/area/repository/AreaRepository.ts
export interface AreaRepository {
  getPrefectures(): Promise<Prefecture[]>;
  getMunicipalities(): Promise<Municipality[]>;
  getPrefectureByCode(code: string): Promise<Prefecture | null>;
  getMunicipalitiesByPrefecture(prefCode: string): Promise<Municipality[]>;
  searchByName(query: string): Promise<Area[]>;
}
```

### Mock 実装

```typescript
// src/infrastructure/area/repository/MockAreaRepository.ts
export class MockAreaRepository implements AreaRepository {
  private prefecturesCache: Prefecture[] | null = null;
  private municipalitiesCache: Municipality[] | null = null;

  async getPrefectures(): Promise<Prefecture[]> {
    if (!this.prefecturesCache) {
      // data/mock/r2/areas/prefectures.json から読み込み
      const data = await import("@/data/mock/r2/areas/prefectures.json");
      this.prefecturesCache = data.prefectures.map(Prefecture.fromJson);
    }
    return this.prefecturesCache;
  }

  async getMunicipalities(): Promise<Municipality[]> {
    if (!this.municipalitiesCache) {
      // data/mock/r2/areas/cities.json から読み込み
      const data = await import("@/data/mock/r2/areas/cities.json");
      this.municipalitiesCache = data.map(Municipality.fromJson);
    }
    return this.municipalitiesCache;
  }

  async getPrefectureByCode(code: string): Promise<Prefecture | null> {
    const prefs = await this.getPrefectures();
    return prefs.find((p) => p.code.toString() === code) || null;
  }

  async getMunicipalitiesByPrefecture(
    prefCode: string
  ): Promise<Municipality[]> {
    const municipalities = await this.getMunicipalities();
    return municipalities.filter((m) => m.parentCode.toString() === prefCode);
  }

  async searchByName(query: string): Promise<Area[]> {
    const [prefs, municipalities] = await Promise.all([
      this.getPrefectures(),
      this.getMunicipalities(),
    ]);

    const all = [...prefs, ...municipalities];
    return all.filter((area) => area.name.includes(query));
  }
}
```

### R2 実装

```typescript
// src/infrastructure/area/repository/R2AreaRepository.ts
export class R2AreaRepository implements AreaRepository {
  private prefecturesCache: Prefecture[] | null = null;
  private municipalitiesCache: Municipality[] | null = null;

  constructor(private r2Bucket: R2Bucket) {}

  async getPrefectures(): Promise<Prefecture[]> {
    if (!this.prefecturesCache) {
      // Cloudflare R2 から読み込み
      const object = await this.r2Bucket.get("areas/prefectures.json");
      if (!object) {
        throw new Error("Prefectures data not found in R2");
      }
      const data = await object.json();
      this.prefecturesCache = data.prefectures.map(Prefecture.fromJson);
    }
    return this.prefecturesCache;
  }

  async getMunicipalities(): Promise<Municipality[]> {
    if (!this.municipalitiesCache) {
      // Cloudflare R2 から読み込み
      const object = await this.r2Bucket.get("areas/cities.json");
      if (!object) {
        throw new Error("Municipalities data not found in R2");
      }
      const data = await object.json();
      this.municipalitiesCache = data.map(Municipality.fromJson);
    }
    return this.municipalitiesCache;
  }

  // getPrefectureByCode, getMunicipalitiesByPrefecture, searchByName は同様の実装
}
```

### ファクトリー

```typescript
// src/infrastructure/area/factory/createAreaRepository.ts
export function createAreaRepository(): AreaRepository {
  const env = process.env.NEXT_PUBLIC_ENV;

  if (env === "mock") {
    return new MockAreaRepository();
  }

  // development, staging, production では R2 を使用
  const r2Bucket = getR2Bucket();
  return new R2AreaRepository(r2Bucket);
}

// Cloudflare Workers 環境で R2 バケットを取得
function getR2Bucket(): R2Bucket {
  // Cloudflare Workers の context から R2 バケットを取得
  // 実装は環境により異なる
  return globalThis.STATS47_R2_BUCKET;
}
```

## サービス層の実装

```typescript
// src/infrastructure/area/service/AreaService.ts
export class AreaService {
  constructor(private repository: AreaRepository) {}

  async getPrefectures(): Promise<Prefecture[]> {
    return await this.repository.getPrefectures();
  }

  async getMunicipalities(): Promise<Municipality[]> {
    return await this.repository.getMunicipalities();
  }

  async getPrefectureByCode(code: string): Promise<Prefecture | null> {
    return await this.repository.getPrefectureByCode(code);
  }

  async getMunicipalitiesByPrefecture(
    prefCode: string
  ): Promise<Municipality[]> {
    return await this.repository.getMunicipalitiesByPrefecture(prefCode);
  }

  async searchAreas(query: string): Promise<Area[]> {
    return await this.repository.searchByName(query);
  }
}
```

---

# 基本的な使い方

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

## 使用例

### Server Component

```typescript
// app/areas/page.tsx
import { createAreaRepository } from "@/infrastructure/area/factory/createAreaRepository";
import { AreaService } from "@/infrastructure/area/service/AreaService";

export default async function AreasPage() {
  const repository = createAreaRepository();
  const service = new AreaService(repository);

  const prefectures = await service.getPrefectures();

  return (
    <div>
      <h1>都道府県一覧</h1>
      <ul>
        {prefectures.map((pref) => (
          <li key={pref.code.toString()}>{pref.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### API Route

```typescript
// app/api/areas/prefectures/route.ts
import { NextResponse } from "next/server";
import { createAreaRepository } from "@/infrastructure/area/factory/createAreaRepository";
import { AreaService } from "@/infrastructure/area/service/AreaService";

export async function GET() {
  const repository = createAreaRepository();
  const service = new AreaService(repository);

  const prefectures = await service.getPrefectures();

  return NextResponse.json({
    prefectures: prefectures.map((p) => ({
      code: p.code.toString(),
      name: p.name,
    })),
  });
}
```

### Client Component（SWR）

```typescript
// components/AreaSelector.tsx
"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AreaSelector() {
  const { data, error, isLoading } = useSWR(
    "/api/areas/prefectures",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600000 } // 1時間
  );

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラーが発生しました</div>;

  return (
    <select>
      {data.prefectures.map((pref: any) => (
        <option key={pref.code} value={pref.code}>
          {pref.name}
        </option>
      ))}
    </select>
  );
}
```

---

# 行政区域データ管理

## ディレクトリ構造

### ファイル命名規則

```
src/data/geoshape/
├── prefectures/
│   ├── jp_pref.topojson          # 日本全国都道府県（TopoJSON）
│   └── jp_pref.geojson           # 日本全国都道府県（GeoJSON）
├── municipalities/
│   ├── 01_city.topojson          # 北海道市区町村
│   ├── 01_city.geojson           # 北海道市区町村（GeoJSON）
│   ├── 13_city.topojson          # 東京都市区町村
│   └── ...
├── municipalities-merged/         # 政令指定都市統合版
│   ├── 01_city_dc.topojson       # 北海道（政令指定都市統合版）
│   └── ...
└── metadata/
    ├── version.json              # データバージョン情報
    ├── license.json              # ライセンス情報
    ├── area-code-mapping.json    # 地域コードマッピング
    ├── data-catalog.json         # データカタログ
    └── quality-report.json       # データ品質レポート
```

## データバージョン管理

### バージョン情報構造

```typescript
interface DataVersionInfo {
  version: string; // データバージョン（例: "2024.03.31"）
  releaseDate: string; // リリース日
  sourceVersion: string; // Geoshape ソースバージョン
  lastUpdated: string; // 最終更新日時
  dataTypes: {
    prefectures: DataTypeInfo;
    municipalities: DataTypeInfo;
    municipalitiesMerged: DataTypeInfo;
  };
  statistics: {
    totalPrefectures: number; // 都道府県数
    totalMunicipalities: number; // 市区町村数
    totalFeatures: number; // 総フィーチャー数
    totalFileSize: number; // 総ファイルサイズ（bytes）
  };
  checksums: {
    [fileName: string]: string; // ファイルチェックサム
  };
}
```

### バージョン管理戦略

1. **メジャーバージョン**: 年単位（例: 2024）
2. **マイナーバージョン**: 月単位（例: 03）
3. **パッチバージョン**: 日単位（例: 31）
4. **ビルド番号**: 同一日の複数更新（例: 01, 02）

## e-Stat 地域コードとの統合

### 地域コードマッピング

```typescript
export class AreaCodeIntegration {
  private static readonly AREA_CODE_MAPPING = new Map<string, AreaCodeInfo>();

  /**
   * e-Stat 地域コードから Geoshape ID への変換
   */
  static convertEstatToGeoshape(estatCode: string): string {
    const info = this.AREA_CODE_MAPPING.get(estatCode);
    return info?.geoshapeId || estatCode;
  }

  /**
   * Geoshape ID から e-Stat 地域コードへの変換
   */
  static convertGeoshapeToEstat(geoshapeId: string): string {
    for (const [code, info] of this.AREA_CODE_MAPPING) {
      if (info.geoshapeId === geoshapeId) {
        return code;
      }
    }
    return geoshapeId;
  }

  /**
   * 地域レベルに応じたコードの正規化
   */
  static normalizeAreaCode(code: string, level: AreaLevel): string {
    switch (level) {
      case AreaLevel.PREFECTURE:
        return code.padStart(2, "0") + "000";
      case AreaLevel.MUNICIPALITY:
        return code.padStart(5, "0");
      default:
        return code;
    }
  }
}
```

---

# GeoShape 自動キャッシング

## 概要

GeoShape の行政区域データ（市区町村境界データ）を外部 URL から取得した際に、自動的に Cloudflare R2 ストレージに保存し、次回以降のアクセスを高速化する自動キャッシング機能です。

## 背景と課題

### 現状の問題

1. **デプロイサイズの肥大化**

   - 都道府県 47 個 + 市区町村データ（47×2 ファイル）= 約 95 ファイル
   - TopoJSON 合計サイズ: 40-50MB
   - Next.js ビルドに含めるとビルド時間・デプロイサイズが増大

2. **外部 URL 依存のリスク**

   - GeoShape 公式サーバーのレスポンス速度: 500-800ms
   - 可用性への依存
   - 帯域幅の制約

3. **パフォーマンスの課題**
   - 初回ロード時の遅延
   - ユーザー体験の低下

### 解決策

**ハイブリッドアプローチ + 自動キャッシング**

```
┌─────────────────────────────────────────────────┐
│ レベル1: 静的データ（ビルドに含める）          │
│ → src/data/geoshape/prefectures/               │
│   - jp_pref.topojson（都道府県境界）            │
│   - metadata.json（バージョン情報）             │
│   サイズ: ~2-3MB                                │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│ レベル2: 動的データ（R2自動キャッシュ）        │
│ → Cloudflare R2 + CDN                           │
│   - 市区町村データ（オンデマンド）              │
│   - 初回: 外部URL → 自動でR2に保存             │
│   - 2回目以降: R2から高速配信                   │
│   サイズ: ~40-50MB                              │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│ レベル3: フォールバック                         │
│ → 外部URL（GeoShape公式）                       │
│   - R2障害時の自動フォールバック                │
│   - 新しいデータの取得元                        │
└─────────────────────────────────────────────────┘
```

## システムアーキテクチャ

### データフロー

```
ユーザー → Next.js App → R2 Storage → 外部URL

1. ユーザーが市区町村データ要求
2. R2チェック
   - R2にデータ存在 → データ返却（50ms）→ 高速表示
   - R2にデータ不在 → 外部URLから取得 → データ表示 → バックグラウンド保存（非同期）
```

### パフォーマンス指標

| 指標                   | 目標     | 測定方法        |
| ---------------------- | -------- | --------------- |
| 初回ロード（外部 URL） | < 1000ms | Performance API |
| 2 回目以降（R2）       | < 100ms  | Performance API |
| キャッシュヒット率     | > 95%    | ログ分析        |
| R2 レスポンス時間      | < 50ms   | CDN Analytics   |

### コスト試算

#### Cloudflare R2 料金

| 項目                     | 料金       | 想定使用量 | 月額コスト     |
| ------------------------ | ---------- | ---------- | -------------- |
| ストレージ               | $0.015/GB  | 0.05 GB    | $0.00075       |
| Class A 操作（書き込み） | $4.50/百万 | 100 回     | $0.00045       |
| Class B 操作（読み取り） | $0.36/百万 | 10,000 回  | $0.0036        |
| データ転送（外向き）     | 無料       | -          | $0             |
| **合計**                 |            |            | **< $0.01/月** |

**結論**: 想定使用量では無料枠内で収まる

## まとめ

この自動キャッシング機能により:

1. **デプロイサイズ削減**: 50MB → 3MB（94%削減）
2. **初回ロード**: 外部 URL（800ms）
3. **2 回目以降**: R2 キャッシュ（50ms、16 倍高速化）
4. **運用負荷**: 自動化により手動アップロード不要
5. **コスト**: 無料枠内で運用可能

---

# 既存コード移行計画

## 移行対象ファイル

### 削除対象

| ファイル                                              | 理由     | 移行先                                                   |
| ----------------------------------------------------- | -------- | -------------------------------------------------------- |
| `src/infrastructure/prefecture.ts`                    | 機能重複 | `src/infrastructure/area/services/prefecture-service.ts` |
| `src/infrastructure/ranking/utils/area-code-utils.ts` | 機能重複 | `src/infrastructure/area/utils/code-converter.ts`        |

### 更新対象

| ファイル                                              | 更新内容       | 影響度 |
| ----------------------------------------------------- | -------------- | ------ |
| `src/types/models/prefecture.ts`                      | 型定義の統合   | 低     |
| `src/components/d3/ChoroplethMap.tsx`                 | インポート変更 | 中     |
| `src/types/visualization/topojson.ts`                 | インポート変更 | 低     |
| `src/components/subcategories/PrefectureSelector.tsx` | インポート変更 | 中     |

## 移行フェーズ

### フェーズ 1: 準備（完了済み）

- [x] Area ドメインの実装
- [x] 型定義の作成
- [x] サービスクラスの実装
- [x] テストの作成
- [x] ドキュメントの作成

### フェーズ 2: 段階的移行

#### 2.1 インポートの更新

**変更前**:

```typescript
import {
  prefList,
  PREFECTURE_MAP,
  getPrefectureNameFromCode,
} from "@/infrastructure/prefecture";
import {
  getAreaType,
  validateAreaCode,
} from "@/infrastructure/ranking/utils/area-code-utils";
```

**変更後**:

```typescript
import {
  PrefectureService,
  AreaService,
  getAreaType,
  validateAreaCode,
} from "@/infrastructure/area";
```

#### 2.2 関数呼び出しの更新

**都道府県関連**:

```typescript
// 変更前
const prefectures = prefList;
const prefName = PREFECTURE_MAP[code];
const pref = getPrefectureByName("東京都");

// 変更後
const prefectures = PrefectureService.getAllPrefectures();
const prefName = PrefectureService.getPrefectureNameFromCode(code);
const pref = PrefectureService.getPrefectureByName("東京都");
```

**地域コード関連**:

```typescript
// 変更前
const areaType = getAreaType(code);
const isValid = validateAreaCode(code);

// 変更後
const areaType = AreaService.getAreaType(code);
const isValid = validateAreaCode(code); // 同じ関数名でインポート先のみ変更
```

### フェーズ 3: 旧ファイルの削除 ✅ 完了

#### 3.1 段階的削除 ✅ 完了

1. **Step 1**: 旧ファイルを非推奨としてマーク ✅
2. **Step 2**: 全ての参照を新しいドメインに移行 ✅
3. **Step 3**: 旧ファイルを削除 ✅

#### 3.2 削除前の確認 ✅ 完了

- [x] 全インポートが新しいドメインに移行済み
- [x] テストが全て成功
- [x] ビルドエラーがない
- [x] 機能テストが完了

**削除完了ファイル**:

- `src/infrastructure/area/services/area-service.ts` ✅
- `src/infrastructure/area/services/prefecture-service.ts` ✅
- `src/infrastructure/area/services/city-service.ts` ✅
- `src/infrastructure/area/services/` ディレクトリ ✅

**移行先**: `src/features/area/services/` に完全統合

---

# テスト戦略

## テストピラミッド

```
        E2E Tests
       ┌─────────┐
      │   少数   │
     └───────────┘
    Integration Tests
   ┌─────────────────┐
  │      中程度      │
 └───────────────────┘
  Unit Tests
 ┌─────────────────────┐
│        多数          │
└─────────────────────┘
```

### テスト分布

- **単体テスト**: 80% - 各サービスクラスの全メソッド
- **統合テスト**: 15% - サービス間の連携
- **E2E テスト**: 5% - ユーザーシナリオ

## 単体テスト

### テスト対象

#### PrefectureService

- [x] `getAllPrefectures()` - 全 47 都道府県の取得
- [x] `getPrefectureByCode()` - コードによる取得（2 桁・5 桁）
- [x] `getPrefectureByName()` - 名前による取得
- [x] `getPrefectureNameFromCode()` - コード → 名前変換
- [x] `getPrefectureCodeFromName()` - 名前 → コード変換
- [x] `getAllRegions()` - 全地域ブロック取得
- [x] `getRegionByKey()` - キーによる地域ブロック取得
- [x] `getRegionByPrefecture()` - 都道府県の地域ブロック取得
- [x] `getPrefecturesByRegion()` - 地域ブロック内の都道府県取得
- [x] `searchPrefectures()` - 都道府県検索

#### MunicipalityService

- [ ] `getAllMunicipalities()` - 全市区町村取得
- [ ] `getMunicipalityByCode()` - コードによる取得
- [ ] `getMunicipalityByName()` - 名前による取得
- [ ] `getMunicipalitiesByPrefecture()` - 都道府県別取得
- [ ] `getMunicipalitiesByType()` - タイプ別取得
- [ ] `searchMunicipalities()` - 市区町村検索

#### AreaService

- [ ] `getAreaByCode()` - 地域情報取得
- [ ] `getAreaType()` - 地域タイプ判定
- [ ] `getParentArea()` - 親地域取得
- [ ] `getChildAreas()` - 子地域取得
- [ ] `getHierarchyPath()` - 階層パス取得
- [ ] `getFullAreaName()` - 完全名称取得
- [ ] `searchAreas()` - 地域検索

### テストケース設計

#### 正常系テスト

```typescript
describe("正常系", () => {
  it("有効な都道府県コードで都道府県を取得できる", () => {
    const pref = PrefectureService.getPrefectureByCode("13");
    expect(pref).not.toBeNull();
    expect(pref?.prefName).toBe("東京都");
  });
});
```

#### 異常系テスト

```typescript
describe("異常系", () => {
  it("無効な都道府県コードでnullを返す", () => {
    const pref = PrefectureService.getPrefectureByCode("99");
    expect(pref).toBeNull();
  });
});
```

#### 境界値テスト

```typescript
describe("境界値", () => {
  it("最小の都道府県コード（01）で北海道を取得できる", () => {
    const pref = PrefectureService.getPrefectureByCode("01");
    expect(pref?.prefName).toBe("北海道");
  });

  it("最大の都道府県コード（47）で沖縄県を取得できる", () => {
    const pref = PrefectureService.getPrefectureByCode("47");
    expect(pref?.prefName).toBe("沖縄県");
  });
});
```

## 統合テスト

### サービス間連携テスト

```typescript
describe("都道府県→市区町村連携", () => {
  it("都道府県の市区町村を正しく取得できる", () => {
    const prefecture = PrefectureService.getPrefectureByCode("13");
    const municipalities =
      MunicipalityService.getMunicipalitiesByPrefecture("13");

    expect(prefecture).not.toBeNull();
    expect(municipalities.length).toBeGreaterThan(0);
    expect(municipalities.every((m) => m.prefCode === "13")).toBe(true);
  });
});
```

### データ整合性テスト

```typescript
describe("都道府県データ整合性", () => {
  it("全47都道府県が存在する", () => {
    const prefectures = PrefectureService.getAllPrefectures();
    expect(prefectures).toHaveLength(47);
  });

  it("都道府県コードが一意である", () => {
    const prefectures = PrefectureService.getAllPrefectures();
    const codes = prefectures.map((p) => p.prefCode);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });
});
```

## パフォーマンステスト

### レスポンス時間テスト

```typescript
describe("パフォーマンス", () => {
  it("都道府県取得が1ms以内で完了する", () => {
    const start = performance.now();
    PrefectureService.getAllPrefectures();
    const end = performance.now();

    expect(end - start).toBeLessThan(1);
  });

  it("市区町村検索が10ms以内で完了する", () => {
    const start = performance.now();
    MunicipalityService.searchMunicipalities({ query: "中央", limit: 10 });
    const end = performance.now();

    expect(end - start).toBeLessThan(10);
  });
});
```

### カバレッジ目標

- **行カバレッジ**: 95%以上
- **分岐カバレッジ**: 90%以上
- **関数カバレッジ**: 100%

### パフォーマンス目標

- **都道府県取得**: < 1ms
- **市区町村検索**: < 10ms
- **階層パス取得**: < 5ms
- **メモリ使用量**: < 300KB

## テスト環境

### テストツール

- **テストフレームワーク**: Vitest
- **アサーション**: Vitest built-in
- **モック**: Vitest built-in
- **カバレッジ**: @vitest/coverage-v8

### テスト設定

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/config/test.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*"],
    },
  },
});
```

## テスト実行

### 開発時

```bash
# 全テスト実行
npm test

# ウォッチモード
npm test -- --watch

# カバレッジ付き実行
npm run test:coverage
```

### CI/CD

```bash
# 本番ビルド前のテスト
npm run test:run

# カバレッジレポート生成
npm run test:coverage
```

---

# 参考資料

## 公式ドキュメント

- [総務省統計局 市区町村コード一覧](https://www.soumu.go.jp/main_content/000000000.html)
- [e-Stat API ドキュメント](https://www.e-stat.go.jp/api/)
- [Cloudflare R2 ドキュメント](https://developers.cloudflare.com/r2/)
- [GeoShape データセット](https://geoshape.ex.nii.ac.jp/)

## 内部ドキュメント

- [プロジェクト概要](../../../00_プロジェクト管理/)
- [技術設計](../../../01_技術設計/)
- [開発ガイド](../../../04_開発ガイド/)

## バージョン履歴

- **v2.0.0** (2025-10-26): 全ドキュメントを統合、完全ガイドとして再構成
- **v1.0.0** (2025-01-16): 初版作成

## ライセンス

このドキュメントはプロジェクト内部資料です。

---

**最終更新日**: 2025-10-26
**バージョン**: 2.0.0
**ステータス**: 公開
