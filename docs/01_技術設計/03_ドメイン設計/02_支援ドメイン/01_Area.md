# Area（地域管理）ドメイン

## 概要

Area（地域管理）ドメインは、stats47 プロジェクトの支援ドメインの一つで、日本の行政区画の階層構造を管理します。都道府県・市区町村の階層構造、地域コードの検証と変換、地域検索・フィルタリングなど、行政区画に関するすべての情報と操作を担当します。

### ドメインの責務と目的

1. **都道府県データの管理**: 47 都道府県の基本情報の提供
2. **市区町村データの管理**: 全国約 1,900 の市区町村情報の提供
3. **地域階層の管理**: 国 → 都道府県 → 市区町村の親子関係の管理
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

## アーキテクチャ

### サービスレイヤー構成

```
src/features/area/
├── repositories/
│   └── area-repository.ts        # データアクセス層（純粋な関数）
├── services/
│   ├── prefecture-service.ts     # 都道府県サービス（純粋な関数）
│   └── municipality-service.ts   # 市区町村サービス（純粋な関数）
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
src/config/areas/
├── prefectures.json      # 都道府県マスターデータ (4KB)
└── municipalities.json   # 市区町村マスターデータ (258KB)
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

## データソース

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
      const data = await import("@/config/areas/municipalities.json");
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

### エンティティ

#### Prefecture（都道府県）

都道府県の基本情報を管理する値オブジェクト。

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

**属性:**

- `prefCode`: 都道府県コード（5 桁）
- `prefName`: 都道府県名
- `regionKey`: 地域ブロックキー

#### Municipality（市区町村）

市区町村の基本情報を管理する値オブジェクト。

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

**属性:**

- `code`: 市区町村コード（5 桁）
- `name`: 市区町村名
- `fullName`: 完全名称（都道府県名を含む）
- `prefCode`: 都道府県コード（2 桁）
- `parentCode`: 親コード（政令指定都市の区の場合）
- `type`: 市区町村タイプ（市/町/村/特別区）
- `level`: 階層レベル（1-3）

#### AreaHierarchy（地域階層）

地域の階層構造を管理するエンティティ。

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

**属性:**

- `areaCode`: 地域コード
- `areaName`: 地域名
- `areaType`: 地域タイプ
- `areaLevel`: 階層レベル
- `parentCode`: 親地域コード
- `children`: 子地域コードリスト

### 値オブジェクト

#### AreaCode（地域コード）

地域コードを表現する値オブジェクト。

- **具体例**: `01000`（北海道）, `13000`（東京都）, `13101`（千代田区）
- **制約**: 5 桁の数字、都道府県は末尾 000、市区町村は末尾 000 以外
- **用途**: 地域の一意識別、階層構造の判定、データベース検索キー

#### AreaLevel（地域レベル）

地域の階層レベルを表現する値オブジェクト。

- **具体例**: `country`（国）, `region`（地方）, `prefecture`（都道府県）, `municipality`（市区町村）
- **制約**: 定義済みの 4 段階レベル
- **用途**: 階層構造の判定、検索範囲の指定、表示レベルの制御

#### Region（地方区分）

地方区分を表現する値オブジェクト。

- **具体例**: `01`（北海道）, `03`（関東）, `05`（関西）
- **制約**: 2 桁のコード、定義済みの 8 地方区分
- **用途**: 地域グループ化、統計データの集計、UI 表示の分類

#### MunicipalityType（市区町村タイプ）

```typescript
type MunicipalityType = "city" | "ward" | "town" | "village";
```

| タイプ  | 説明 | 例             |
| ------- | ---- | -------------- |
| city    | 市   | 札幌市、函館市 |
| ward    | 区   | 中央区、北区   |
| town    | 町   | 旭川町         |
| village | 村   | 美瑛村         |

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

## ベストプラクティス

### 1. データ整合性の維持

- 地域コードの一意性保証
- 階層関係の整合性チェック
- マッピング情報の適切な管理

### 2. パフォーマンス最適化

- 階層構造の効率的な検索
- 地域検索のインデックス最適化
- キャッシュ戦略の実装

### 3. データソース統合

- 複数データソースの統合管理
- データ品質の統一基準
- コード変換の正確性保証

## 他ドメインとの関係性

### 依存するドメイン

なし（最も基盤的なドメイン）

### 依存されるドメイン

- **Ranking ドメイン**: 都道府県・市区町村別ランキングで使用
- **EstatAPI ドメイン**: e-Stat API から取得したデータの地域コード解決
- **Visualization ドメイン**: ダッシュボードの地域フィルタリング、コロプレス地図での地域表示
- **Geoshape ドメイン**: 地理データの管理（TopoJSON）
- **DataIntegration ドメイン**: 地域データの取得と統合

## 関連ドキュメント

- [DDD ドメイン分類](../../01_システム概要/04_DDDドメイン分類.md#支援ドメイン)
- [システムアーキテクチャ](../../01_システム概要/システムアーキテクチャ.md)
- [R2 ストレージガイド](../../04_開発ガイド/03_インフラ/データベース/03_R2ストレージガイド.md)
