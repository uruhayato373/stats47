---
title: データ構造仕様
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
  - "[[地域階層システム仕様]]"
---

# データ構造仕様

## 概要

地域ドメインで使用するデータ構造の詳細仕様を定義します。都道府県、市区町村、地域ブロックの各データの構造と制約を説明します。

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

### municipalities.json

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

### フィールド制約

| フィールド | 型               | 必須 | 制約                               | 例                     |
| ---------- | ---------------- | ---- | ---------------------------------- | ---------------------- |
| code       | string           | ✅   | 5 桁の数字                         | "01101"                |
| name       | string           | ✅   | 1-10 文字                          | "中央区"               |
| fullName   | string           | ✅   | 都道府県名 + 市区町村名            | "北海道 札幌市 中央区" |
| prefCode   | string           | ✅   | 2 桁の数字（01-47）                | "01"                   |
| parentCode | string           | ❌   | 5 桁の数字（政令指定都市の区のみ） | "01100"                |
| type       | MunicipalityType | ✅   | 定義済みのタイプ                   | "ward"                 |
| level      | number           | ✅   | 1-3 の整数                         | 3                      |

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

### フィールド制約

| フィールド  | 型       | 必須 | 制約                   | 例                   |
| ----------- | -------- | ---- | ---------------------- | -------------------- |
| key         | string   | ✅   | 小文字、ハイフン区切り | "hokkaido-tohoku"    |
| name        | string   | ✅   | 地域名                 | "北海道・東北地方"   |
| prefectures | string[] | ✅   | 都道府県名の配列       | ["北海道", "青森県"] |

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

## 検索・フィルタリング用データ構造

### AreaSearchOptions

```typescript
interface AreaSearchOptions {
  /** 検索クエリ */
  query: string;
  /** 地域タイプフィルター */
  areaType?: AreaType;
  /** 都道府県コードフィルター */
  prefCode?: string;
  /** 大文字小文字を区別しない */
  caseInsensitive?: boolean;
  /** 部分一致検索 */
  partialMatch?: boolean;
  /** 最大結果数 */
  limit?: number;
}
```

### PrefectureSearchOptions

```typescript
interface PrefectureSearchOptions {
  /** 検索クエリ */
  query: string;
  /** 地域ブロックキーフィルター */
  regionKey?: string;
  /** 大文字小文字を区別しない */
  caseInsensitive?: boolean;
  /** 部分一致検索 */
  partialMatch?: boolean;
}
```

### MunicipalitySearchOptions

```typescript
interface MunicipalitySearchOptions {
  /** 検索クエリ */
  query: string;
  /** 都道府県コードフィルター */
  prefCode?: string;
  /** 市区町村タイプフィルター */
  type?: MunicipalityType;
  /** 大文字小文字を区別しない */
  caseInsensitive?: boolean;
  /** 部分一致検索 */
  partialMatch?: boolean;
  /** 最大結果数 */
  limit?: number;
}
```

## バリデーション結果データ構造

### AreaValidationResult

```typescript
interface AreaValidationResult {
  /** 検証成功フラグ */
  isValid: boolean;
  /** 地域タイプ */
  areaType?: AreaType;
  /** エラーメッセージ */
  message?: string;
  /** 検証詳細 */
  details?: {
    code?: string;
    expectedFormat?: string;
    actualFormat?: string;
  };
}
```

### 検証結果の例

```typescript
// 成功例
{
  isValid: true,
  areaType: "prefecture",
  message: "Valid prefecture code"
}

// エラー例
{
  isValid: false,
  message: "Prefecture code must be between 01 and 47",
  details: {
    code: "99",
    expectedFormat: "01-47",
    actualFormat: "99"
  }
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

### 地域ブロックデータ

1. **key の一意性**: 地域ブロックキーは一意
2. **prefectures の整合性**: 存在する都道府県名のみ
3. **完全性**: 全ての都道府県が地域ブロックに属する

## データ更新・メンテナンス

### 更新頻度

- **都道府県データ**: 変更なし（固定）
- **市区町村データ**: 年 1 回（市町村合併対応）
- **地域ブロックデータ**: 変更なし（固定）

### データソース

- **都道府県**: 手動定義（prefectures.json）
- **市区町村**: e-Stat API metainfo から自動抽出（e-Stat 構造を保持）
- **地域ブロック**: 手動定義（prefectures.json）

### e-Stat 互換性

municipalities.json は e-Stat API metainfo の area 構造を配列として保持しており、以下の利点があります：

1. **データ整合性**: e-Stat API との完全互換
2. **メンテナンス性**: 再抽出時の変換ロジック不要
3. **拡張性**: 将来的な API 直接取得への布石
4. **階層情報**: level, parentCode が完全保持

### バージョン管理

```json
{
  "version": "2024.03.31",
  "source": "e-Stat 0000020201",
  "extractedAt": "2025-01-16T20:37:00.000Z"
}
```

## パフォーマンス考慮事項

### メモリ使用量

| データ       | 件数  | サイズ/件 | 合計サイズ |
| ------------ | ----- | --------- | ---------- |
| 都道府県     | 47    | 100B      | 4.7KB      |
| 市区町村     | 1,913 | 150B      | 287KB      |
| 地域ブロック | 5     | 200B      | 1KB        |
| **合計**     | -     | -         | **293KB**  |

### 圧縮後サイズ

- **gzip 圧縮**: 約 60KB
- **brotli 圧縮**: 約 50KB

### アクセスパターン

1. **都道府県**: 頻繁（ランキング、ダッシュボード）
2. **市区町村**: 中頻度（詳細表示、検索）
3. **地域ブロック**: 低頻度（フィルタリング）

## 参考資料

- [総務省統計局 市区町村コード一覧](https://www.soumu.go.jp/main_content/000000000.html)
- [e-Stat API ドキュメント](https://www.e-stat.go.jp/api/)
- [地域階層システム仕様](./hierarchy.md)
