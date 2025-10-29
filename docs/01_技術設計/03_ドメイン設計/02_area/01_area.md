# Area（地域管理）ドメイン技術設計

## 概要

Area（地域管理）ドメインは、stats47 プロジェクトの支援ドメインの一つで、日本の行政区画の階層構造を管理します。都道府県・市区町村の階層構造、地域コードの検証と変換、地域検索・フィルタリングなど、行政区画に関するすべての情報と操作を担当します。

### ドメインの責務と目的

1. **都道府県データの管理**: 47 都道府県の基本情報の提供
2. **市区町村データの管理**: 全国約 1,900 の市区町村情報の提供
3. **地域階層の管理**: 国 → 都道府県 → 市区町村の親子関係の管理（設計中）
4. **地域コードの検証**: 地域コードの妥当性検証と正規化
5. **地域検索機能**: 名前・コードによる地域検索
6. **地域ブロック管理**: 北海道・東北、関東・中部などの地域区分管理

### ビジネス価値

- **行政区画の一元管理**: 日本の行政区画データを統一的に管理し、一貫性を保つ
- **階層構造の活用**: 都道府県 → 市区町村の階層関係を活用した効率的なデータ検索
- **地域コードの統一**: 異なるデータソース間の地域コードマッピング管理
- **地域検索の最適化**: 効率的な地域検索・フィルタリング機能
- **統計データの地域軸**: 全ての統計データは地域コードで分類される
- **ユーザビリティ向上**: 地域名での検索・フィルタリングが可能
- **データ整合性**: 単一データソースにより地域データの一貫性を保証

### 実装状況

**実装済み**:
- 都道府県・市区町村の基本CRUD操作
- 地域コード検証・変換ユーティリティ
- R2ストレージからのデータ取得（フォールバック付き）
- 地域ブロック管理

**未実装**:
- 階層構造管理（親子関係、階層パス取得）
- AreaHierarchyエンティティ
- 高度な検索機能（複合条件、地域タイプ別）

## アーキテクチャ

### サービスレイヤー構成

```
src/features/area/
├── repositories/
│   └── area-repository.ts        # データアクセス層（純粋な関数）
├── services/
│   ├── prefecture-service.ts     # 都道府県サービス（純粋な関数）
│   └── city-service.ts           # 市区町村サービス（純粋な関数）
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

## 設計判断

### 値オブジェクトとして設計

**理由**:

- **不変性**: 行政区画コードと名称は変更されない
- **識別性不要**: `prefCode` や `municipalityCode` 自体が識別子
- **比較可能**: コードによる等価性判定が可能
- **軽量**: シンプルなデータ構造

**エンティティが不適切な理由**:

- ライフサイクル管理が不要
- 履歴管理が不要
- 複雑な状態遷移がない

### R2 ストレージ（静的 JSON）を採用

**理由**:

- **更新頻度が低い**: 年に数回の市町村合併程度
- **全件取得が主**: ドロップダウン選択、コード → 名称変換
- **シンプル**: JSON 形式でそのまま利用可能
- **パフォーマンス**: CDN 配信で高速アクセス
- **コスト**: 読み取り無料

**D1 を採用しない理由**:

- 複雑な SQL クエリは不要
- JavaScript 配列の `filter` で十分高速
- データベース管理のオーバーヘッドが不要

## データソースとストレージ

### データ配置戦略

```
data/mock/area/          # ローカル開発用
├── prefectures.json     # 都道府県マスターデータ
└── cities.json          # 市区町村マスターデータ

Cloudflare R2 (本番)     # 本番環境
└── area/
    ├── prefectures.json # 都道府県マスターデータ（公開URL）
    └── cities.json      # 市区町村マスターデータ（公開URL）
```

### データアクセス戦略

**サーバーサイド**: R2公開URL → ローカルフォールバック（開発環境のみ）
**クライアントサイド**: API Route経由 (`/api/area/prefectures`, `/api/area/cities`)

### データ構造

#### prefectures.json（配列形式）

```json
[
  {
    "prefCode": "01000",
    "prefName": "北海道"
  },
  {
    "prefCode": "02000",
    "prefName": "青森県"
  }
]
```

**フィールド定義**:
- `prefCode` (string): 都道府県コード（5桁、末尾000）
- `prefName` (string): 都道府県名

#### cities.json（配列形式）

```json
[
  {
    "cityCode": "01101",
    "cityName": "札幌市中央区",
    "prefCode": "01000",
    "level": "3"
  },
  {
    "cityCode": "01202",
    "cityName": "函館市",
    "prefCode": "01000",
    "level": "2"
  }
]
```

**フィールド定義**:
- `cityCode` (string): 市区町村コード（5桁）
- `cityName` (string): 市区町村名
- `prefCode` (string): 都道府県コード（5桁）
- `level` (string): 地域レベル（"2": 市、"3": 区）

### 地域コード体系

#### 都道府県コード
- **形式**: `XX000`（XX = 01-47）
- **例**: `01000`（北海道）、`13000`（東京都）

#### 市区町村コード
- **形式**: `XXXXX`（5桁）
- **上位2桁**: 都道府県コード
- **下位3桁**: 市区町村識別コード
  - `000`: 都道府県全体
  - `100`: 政令指定都市
  - `101-199`: 政令指定都市の区
  - `201-999`: 一般市町村

**例**:
- `13000`: 東京都
- `13101`: 千代田区
- `01100`: 札幌市
- `01101`: 札幌市中央区

## リポジトリ実装方針

```typescript
// 静的 JSON からの読み込み
export class AreaRepository {
  private prefecturesCache: Prefecture[] | null = null;
  private municipalitiesCache: Municipality[] | null = null;

  async getPrefectures(): Promise<Prefecture[]> {
    if (!this.prefecturesCache) {
      // ビルド時: 静的 import
      const data = await import("@/config/areas/prefectures.json");
      this.prefecturesCache = data.prefectures.map(Prefecture.fromJson);
    }
    return this.prefecturesCache;
  }

  async getMunicipalities(): Promise<Municipality[]> {
    if (!this.municipalitiesCache) {
      const data = await import("@/data/mock/cities.json");
      this.municipalitiesCache = data.map(Municipality.fromJson);
    }
    return this.municipalitiesCache;
  }

  async searchByName(query: string): Promise<Area[]> {
    const all = await this.getAllAreas();
    return all.filter((area) => area.name.includes(query));
  }
}
```

## モデル設計

### 実装済みエンティティ

#### Prefecture（都道府県）

都道府県の基本情報を管理するインターフェース。

```typescript
interface Prefecture {
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 都道府県名 */
  prefName: string;
}
```

**実装ファイル**: `src/features/area/types/index.ts`

#### City（市区町村）

市区町村の基本情報を管理するインターフェース。

```typescript
interface City {
  /** 市区町村コード（5桁） */
  cityCode: string;
  /** 市区町村名 */
  cityName: string;
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 地域レベル（"2": 都道府県・政令指定都市, "3": 市区町村） */
  level: string;
}
```

**実装ファイル**: `src/features/area/types/index.ts`

#### Region（地域ブロック）

地域ブロックの定義。

```typescript
interface Region {
  /** 地域ブロックコード */
  regionCode: string;
  /** 地域ブロック名 */
  regionName: string;
  /** 都道府県リスト */
  prefectures: string[];
}
```

**実装ファイル**: `src/features/area/types/index.ts`

### 設計中のエンティティ（未実装）

#### AreaHierarchy（地域階層）

地域の階層構造を管理するエンティティ（将来実装予定）。

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

**目的**: 親子関係、階層パス取得など高度な階層管理機能

### 型定義

#### AreaType

```typescript
type AreaType = "national" | "prefecture" | "city";
```

**実装状況**: ✅ 実装済み

#### AreaValidationResult

地域コード検証結果。

```typescript
interface AreaValidationResult {
  isValid: boolean;
  areaType?: AreaType;
  message: string;
  details?: {
    code: string;
    expectedFormat: string;
    actualFormat: string;
  };
}
```

**実装状況**: ✅ 実装済み

## 階層構造設計（将来実装）

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
└── ...
```

### 階層レベル定義

| レベル | 名称     | コード形式 | 例    |
| ------ | -------- | ---------- | ----- |
| 0      | 国       | 00000      | 00000 |
| 1      | 都道府県 | XX000      | 13000 |
| 2      | 市区町村 | XXXXX      | 13101 |

### 親子関係の設計方針

- **都道府県 → 市区町村**: `prefCode`による関連
- **政令指定都市 → 区**: コード体系による判定（100番台）
- **検索最適化**: インデックス構造の活用

## 実装パターン

### 基本的な使い方

```typescript
import {
  listPrefectures,
  findPrefectureByCode,
  listMunicipalities,
  findMunicipalityByCode,
} from "@/features/area";

// 都道府県を取得
const tokyo = await findPrefectureByCode("13");
console.log(tokyo?.prefName); // "東京都"

// 市区町村を取得
const chiyoda = await findMunicipalityByCode("13101");
console.log(chiyoda?.name); // "千代田区"

// 都道府県リストを取得
const prefectures = await listPrefectures();
console.log(prefectures.length); // 47

// 市区町村リストを取得
const municipalities = await listMunicipalities();
console.log(municipalities.length); // 約1900
```

### 地域検索

```typescript
import {
  searchPrefectures,
  searchMunicipalities,
  listPrefecturesByRegion,
  listMunicipalitiesByType,
} from "@/features/area";

// 都道府県検索
const prefectures = await searchPrefectures("東京");
console.log(prefectures); // 東京都を含む都道府県

// 市区町村検索
const municipalities = await searchMunicipalities("千代田");
console.log(municipalities); // 千代田を含む市区町村

// 地域ブロック別都道府県取得
const kantoPrefectures = await listPrefecturesByRegion("kanto");
console.log(kantoPrefectures.length); // 関東地方の都道府県数

// タイプ別市区町村取得
const cities = await listMunicipalitiesByType("city");
console.log(cities.length); // 市の数
```

### 階層構造の構築

```typescript
import {
  listMunicipalitiesByPrefecture,
  lookupPrefectureName,
  lookupMunicipalityName,
} from "@/features/area";

// 都道府県内の市区町村取得
const tokyoMunicipalities = await listMunicipalitiesByPrefecture("13");
console.log(tokyoMunicipalities.length); // 東京都内の市区町村数

// 都道府県名の取得
const prefName = await lookupPrefectureName("13");
console.log(prefName); // "東京都"

// 市区町村名の取得
const muniName = await lookupMunicipalityName("13101");
console.log(muniName); // "千代田区"
```

## ドメインサービス

### AreaRepository（データアクセス層）

地域データの基本操作を実装するリポジトリ層。

- **責務**: 外部データソース（JSON、R2）からのデータ取得、キャッシュ管理
- **主要関数**:
  - `fetchPrefectures()`: 都道府県データの取得
  - `fetchMunicipalities()`: 市区町村データの取得
  - `findPrefectureByCode(code)`: 都道府県コードによる検索
  - `findMunicipalityByCode(code)`: 市区町村コードによる検索
  - `clearAreaCache()`: キャッシュのクリア
  - `buildAreaCacheStatus()`: キャッシュ状態の構築

### PrefectureService（都道府県サービス）

都道府県データの操作を実装するサービス層。

- **責務**: 都道府県データの取得、検索、地域ブロック管理
- **主要関数**:
  - `listPrefectures()`: 全都道府県の取得
  - `findPrefectureByCode(code)`: 都道府県コードによる検索
  - `searchPrefectures(query)`: 都道府県名による検索
  - `listPrefecturesByRegion(regionKey)`: 地域ブロック別取得
  - `listRegions()`: 地域ブロック一覧の取得
  - `lookupPrefectureName(prefCode)`: 都道府県名の取得

### MunicipalityService（市区町村サービス）

市区町村データの操作を実装するサービス層。

- **責務**: 市区町村データの取得、検索、階層管理
- **主要関数**:
  - `listMunicipalities()`: 全市区町村の取得
  - `listMunicipalitiesByPrefecture(prefCode)`: 都道府県別市区町村取得
  - `findMunicipalityByCode(code)`: 市区町村コードによる検索
  - `searchMunicipalities(query)`: 市区町村名による検索
  - `listMunicipalitiesByType(type)`: タイプ別市区町村取得
  - `lookupMunicipalityName(code)`: 市区町村名の取得
  - `buildMunicipalityStats()`: 統計情報の構築

## リポジトリ

### AreaRepository

地域データの永続化を抽象化するリポジトリインターフェース。

- **責務**: 都道府県・市区町村データの CRUD 操作、階層構造の検索、地域コードによる検索
- **主要メソッド**:
  - `findPrefectureByCode(code)`: 都道府県コードによる検索
  - `findMunicipalityByCode(code)`: 市区町村コードによる検索
  - `findMunicipalitiesByPrefecture(prefectureCode)`: 都道府県配下の市区町村取得
  - `search(query, level)`: 地域名による検索
  - `findAllPrefectures()` / `findAllMunicipalities()`: 全データの取得
  - `save(area)` / `delete(code)`: データの保存・削除

## パフォーマンス

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

## GeoShape統合とR2キャッシング戦略

### 背景と課題

#### 現状の問題点
1. **デプロイサイズの肥大化**
   - 都道府県47個 + 市区町村データ（47×2ファイル）= 約95ファイル
   - TopoJSON合計サイズ: 40-50MB
   - Next.jsビルドに含めるとビルド時間・デプロイサイズが増大

2. **外部URL依存のリスク**
   - GeoShape公式サーバーのレスポンス速度: 500-800ms
   - 可用性への依存
   - 帯域幅の制約

### 解決策：ハイブリッドアプローチ

```
┌─────────────────────────────────────────┐
│ レベル1: 静的データ（ビルド含む）      │
│ → src/data/geoshape/prefectures/       │
│   - jp_pref.topojson（都道府県境界）    │
│   サイズ: ~2-3MB                        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ レベル2: 動的データ（R2自動キャッシュ）│
│ → Cloudflare R2 + CDN                   │
│   - 市区町村データ（オンデマンド）      │
│   - 初回: 外部URL → 自動でR2に保存     │
│   - 2回目以降: R2から高速配信          │
│   サイズ: ~40-50MB                      │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ レベル3: フォールバック                 │
│ → 外部URL（GeoShape公式）               │
│   - R2障害時の自動フォールバック        │
└─────────────────────────────────────────┘
```

### パフォーマンス指標

| 指標                   | 目標     | 測定方法        |
| ---------------------- | -------- | --------------- |
| 初回ロード（外部URL）  | < 1000ms | Performance API |
| 2回目以降（R2）        | < 100ms  | Performance API |
| キャッシュヒット率     | > 95%    | ログ分析        |
| R2レスポンス時間       | < 50ms   | CDN Analytics   |

### コスト試算（Cloudflare R2）

| 項目                     | 料金       | 想定使用量 | 月額コスト     |
| ------------------------ | ---------- | ---------- | -------------- |
| ストレージ               | $0.015/GB  | 0.05 GB    | $0.00075       |
| Class A操作（書き込み）  | $4.50/百万 | 100回      | $0.00045       |
| Class B操作（読み取り）  | $0.36/百万 | 10,000回   | $0.0036        |
| データ転送（外向き）     | 無料       | -          | $0             |
| **合計**                 |            |            | **< $0.01/月** |

### 行政区域データ管理

#### ディレクトリ構造
```
src/data/geoshape/
├── prefectures/
│   ├── jp_pref.topojson          # 都道府県境界（TopoJSON）
│   └── jp_pref.geojson           # 都道府県境界（GeoJSON）
├── municipalities/               # 市区町村（R2キャッシュ）
│   ├── 01_city.topojson
│   ├── 13_city.topojson
│   └── ...
└── metadata/
    ├── version.json              # バージョン情報
    └── area-code-mapping.json    # 地域コードマッピング
```

#### データバージョン管理
- **メジャーバージョン**: 年単位（例: 2024）
- **マイナーバージョン**: 月単位（例: 03）
- **パッチバージョン**: 日単位（例: 31）

### e-Stat地域コードとの統合

地域コードマッピングにより、e-Stat API の地域コードと GeoShape の ID を相互変換可能。

## ベストプラクティス

### 1. データ整合性の維持

- 地域コードの一意性保証
- 階層関係の整合性チェック
- マッピング情報の適切な管理
- e-Stat APIとのコード互換性維持

### 2. パフォーマンス最適化

- R2キャッシュの効果的活用
- Next.js Fetch APIキャッシュの活用（24時間）
- クライアント・サーバー両方での最適化
- フォールバック戦略の実装

### 3. データソース統合

- R2 → ローカルモックの段階的フォールバック
- 開発環境と本番環境の透過的な切り替え
- エラーハンドリングとログ出力

## 他ドメインとの関係性

### 依存するドメイン

なし（最も基盤的なドメイン）

### 依存されるドメイン

- **Ranking ドメイン**: 都道府県・市区町村別ランキングで使用
- **EstatAPI ドメイン**: e-Stat API から取得したデータの地域コード解決
- **Visualization ドメイン**: ダッシュボードの地域フィルタリング、コロプレス地図での地域表示
- **Geoshape ドメイン**: 地理データの管理（TopoJSON）
- **DataIntegration ドメイン**: 地域データの取得と統合

## 将来の拡張計画

### フェーズ1（完了）
- ✅ 基本的な都道府県・市区町村CRUD
- ✅ 地域コード検証ユーティリティ
- ✅ R2ストレージ統合
- ✅ 地域ブロック管理

### フェーズ2（計画中）
- ⬜ AreaHierarchyエンティティの実装
- ⬜ 階層パス取得機能
- ⬜ 親子関係ナビゲーション
- ⬜ 高度な検索機能（複合条件）

### フェーズ3（検討中）
- ⬜ 市町村合併履歴管理
- ⬜ 時系列での地域コード変換
- ⬜ GeoShapeとの完全統合

## 関連ドキュメント

### 技術設計
- [DDD ドメイン分類](../../01_システム概要/04_DDDドメイン分類.md#支援ドメイン)
- [システムアーキテクチャ](../../01_システム概要/システムアーキテクチャ.md)
- [R2 ストレージガイド](03_R2ストレージガイド.md)

### 開発ガイド
- [Areaドメイン開発ガイド](area.md)

## 更新履歴

- **v3.0.0** (2025-10-29): 技術設計と開発ガイドを分離、実装状況を明確化
- **v2.0.0** (2025-10-26): GeoShape統合戦略とR2キャッシング設計を追加
- **v1.0.0** (2025-01-16): 初版作成
