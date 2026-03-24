# @stats47/area

都道府県・市区町村の地域データ管理パッケージ。

## 概要

Area（地域管理）ドメインは、stats47 プロジェクトの支援ドメインの一つで、日本の行政区画の階層構造を管理します。都道府県・市区町村の階層構造、地域コードの検証と変換、地域検索・フィルタリングなど、行政区画に関するすべての情報と操作を担当します。

### ビジネス価値

- **行政区画の一元管理**: 日本の行政区画データを統一的に管理し、一貫性を保つ
- **階層構造の活用**: 都道府県 → 市区町村の階層関係を活用した効率的なデータ検索
- **地域コードの統一**: 異なるデータソース間の地域コードマッピング管理
- **統計データの地域軸**: 全ての統計データは地域コードで分類される

## 責務

| 責務 | 説明 |
| :--- | :--- |
| **都道府県データ管理** | 47 都道府県の基本情報の提供 |
| **市区町村データ管理** | 全国約 1,900 の市区町村情報の提供 |
| **地域コード検証** | 地域コードの妥当性検証と正規化 |
| **地域コード変換** | 2桁・5桁コード変換、親子関係の導出 |
| **地域検索機能** | 名前・コードによる地域検索 |
| **地域ブロック管理** | 北海道・東北、関東・中部などの地域区分管理 |

## 主要機能

### 型定義

| 型 | 説明 |
|---|------|
| `AreaType` | 地域タイプ（`"national"` / `"prefecture"` / `"city"`） |
| `Prefecture` | 都道府県（prefCode, prefName） |
| `City` | 市区町村（cityCode, cityName, prefCode, level） |
| `Region` | 地域ブロック（北海道、東北、関東など） |

### ユーティリティ関数

```typescript
import {
  determineAreaType,     // 地域コード → 地域タイプ判定
  extractPrefectureCode, // 地域コード → 都道府県コード（2桁）抽出
  validateAreaCode,      // 地域コードの妥当性検証
  normalizeAreaCode,     // 地域コードの正規化（全角→半角、2桁→5桁）
  lookupAreaNameSync,    // 地域コード → 地域名の同期検索
} from "@stats47/area";

determineAreaType("13000");     // "prefecture"
extractPrefectureCode("13113"); // "13"
validateAreaCode("13000");      // true
lookupAreaNameSync("13000");    // "東京都"
```

### データ取得

```typescript
import { fetchPrefectures, fetchCities } from "@stats47/area";

const prefectures = fetchPrefectures(); // 47都道府県
const cities = fetchCities();           // 全市区町村
```

## アーキテクチャ設計

### レイヤー構造

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  (AreaNavigator 等)                     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│     Application Layer                   │
│  (Server Actions)                       │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│     Service / Repository Layer          │
│  (@stats47/area)                        │
│  - fetchPrefectures()                   │
│  - fetchCities()                        │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│     Infrastructure Layer                │
│  R2 Storage / Local JSON                │
└─────────────────────────────────────────┘
```

### キャッシュ戦略

| 環境 | キャッシュ設定 |
| :--- | :--- |
| 本番 | `force-cache` + `revalidate: 86400` + tags |
| 開発 | `no-store`（常に最新） |

**タグ**:
- 都道府県: `["area-prefectures"]`
- 市区町村: `["area-cities"]`

## ディレクトリ構成

```
src/
├── types/          # 型定義
├── utils/          # ユーティリティ関数
├── data/           # 静的JSONデータ
├── repositories/   # データ取得関数
└── __tests__/      # テスト
```

## 将来の拡張

データソースを静的JSONからR2/CDNに変更する場合、`repositories/` の実装を非同期に変更するだけで対応可能。

```typescript
// 現在（同期）
export function fetchPrefectures(): Prefecture[]

// 将来（非同期）
export async function fetchPrefectures(): Promise<Prefecture[]>
```
