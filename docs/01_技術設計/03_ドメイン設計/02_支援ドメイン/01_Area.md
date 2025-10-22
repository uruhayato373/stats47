---
title: Area ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - 支援ドメイン
  - Area
---

# Area ドメイン

## 概要

Area ドメインは、stats47 プロジェクトの支援ドメインの一つで、日本の行政区画の階層構造を管理します。都道府県・市区町村の階層構造、地域コードの検証と変換、地域検索・フィルタリングなど、行政区画に関するすべての情報と操作を担当します。

### ビジネス価値

- **行政区画の一元管理**: 日本の行政区画データを統一的に管理し、一貫性を保つ
- **階層構造の活用**: 都道府県→市区町村の階層関係を活用した効率的なデータ検索
- **地域コードの統一**: 異なるデータソース間の地域コードマッピング管理
- **地域検索の最適化**: 効率的な地域検索・フィルタリング機能

## 責務

- 都道府県・市区町村の階層構造管理
- 地域コードの検証と変換
- 地域検索・フィルタリング
- 市区町村 ID と標準地域コードのマッピング管理
- 地域データの整合性保証

## 主要エンティティ

### Prefecture（都道府県）

都道府県の基本情報を管理するエンティティ。

**属性:**
- `code`: 都道府県コード（5 桁）
- `name`: 都道府県名
- `region`: 地方区分
- `municipalities`: 所属市区町村のリスト
- `population`: 人口
- `area`: 面積

### Municipality（市区町村）

市区町村の基本情報を管理するエンティティ。

**属性:**
- `code`: 市区町村コード（5 桁）
- `name`: 市区町村名
- `prefectureCode`: 所属都道府県コード
- `type`: 市区町村タイプ（市/町/村/特別区）
- `population`: 人口
- `area`: 面積
- `establishedDate`: 設置日

### AreaHierarchy（地域階層）

地域の階層構造を管理するエンティティ。

**属性:**
- `level`: 階層レベル（国/地方/都道府県/市区町村）
- `parent`: 親地域
- `children`: 子地域のリスト
- `depth`: 階層の深さ


### AreaCodeMapping（地域コードマッピング）

異なるデータソース間の地域コードマッピングを管理するエンティティ。

**属性:**
- `municipalityId`: 市区町村 ID（歴史的行政区域データセット）
- `standardAreaCode`: 標準地域コード（e-Stat）
- `name`: 地域名
- `prefectureName`: 都道府県名
- `validFrom`: 有効開始日
- `validTo`: 有効終了日
- `dataSource`: データソース


## 値オブジェクト

### AreaCode（地域コード）

地域コードを表現する値オブジェクト。

- **具体例**: `01000`（北海道）, `13000`（東京都）, `13101`（千代田区）
- **制約**: 5桁の数字、都道府県は末尾000、市区町村は末尾000以外
- **用途**: 地域の一意識別、階層構造の判定、データベース検索キー

### AreaLevel（地域レベル）

地域の階層レベルを表現する値オブジェクト。

- **具体例**: `country`（国）, `region`（地方）, `prefecture`（都道府県）, `municipality`（市区町村）
- **制約**: 定義済みの4段階レベル
- **用途**: 階層構造の判定、検索範囲の指定、表示レベルの制御

### Region（地方区分）

地方区分を表現する値オブジェクト。

- **具体例**: `01`（北海道）, `03`（関東）, `05`（関西）
- **制約**: 2桁のコード、定義済みの8地方区分
- **用途**: 地域グループ化、統計データの集計、UI表示の分類

## ドメインサービス

### AreaService

地域データの基本操作を実装するドメインサービス。

- **責務**: 都道府県・市区町村の取得、階層構造の構築、地域検索
- **主要メソッド**: 
  - `getPrefecture(code)`: 都道府県情報の取得
  - `getMunicipalities(prefectureCode)`: 市区町村リストの取得
  - `getAreaHierarchy(areaCode)`: 階層構造の構築
  - `searchAreas(query, level)`: 地域検索
- **使用例**: 地域選択UI、統計データの地域フィルタリング、階層ナビゲーション

### AreaCodeMappingService

地域コードマッピングの管理を実装するドメインサービス。

- **責務**: 異なるデータソース間の地域コード変換、マッピング情報の管理
- **主要メソッド**:
  - `convertToStandardAreaCode(municipalityId)`: 市区町村IDから標準地域コードへの変換
  - `convertToMunicipalityId(standardAreaCode)`: 標準地域コードから市区町村IDへの変換
  - `getValidMappings(date)`: 有効なマッピング情報の取得
- **使用例**: e-Stat APIと歴史的行政区域データセット間のコード変換


## リポジトリ

### AreaRepository

地域データの永続化を抽象化するリポジトリインターフェース。

- **責務**: 都道府県・市区町村データのCRUD操作、階層構造の検索、地域コードによる検索
- **主要メソッド**:
  - `findPrefectureByCode(code)`: 都道府県コードによる検索
  - `findMunicipalityByCode(code)`: 市区町村コードによる検索
  - `findMunicipalitiesByPrefecture(prefectureCode)`: 都道府県配下の市区町村取得
  - `search(query, level)`: 地域名による検索
  - `findAllPrefectures()` / `findAllMunicipalities()`: 全データの取得
  - `save(area)` / `delete(code)`: データの保存・削除


## ディレクトリ構造

```
src/lib/area/
├── model/
│   ├── Prefecture.ts
│   ├── Municipality.ts
│   ├── AreaHierarchy.ts
│   ├── AreaCodeMapping.ts
│   ├── AreaCode.ts
│   ├── AreaLevel.ts
│   ├── Region.ts
│   ├── MunicipalityId.ts
│   └── StandardAreaCode.ts
├── service/
│   ├── AreaService.ts
│   ├── AreaHierarchyService.ts
│   └── AreaCodeMappingService.ts
└── repositories/
    ├── AreaRepository.ts
    └── AreaCodeMappingRepository.ts
```

## DDDパターン実装例

### エンティティ実装例


### 仕様実装例


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

## 関連ドメイン

- **Ranking ドメイン**: 地域別統計データの分析
- **Geographic ドメイン**: 地理データの管理（GeoJSON/TopoJSON）
- **Data Integration ドメイン**: 地域データの取得と統合

---

**更新履歴**:

- 2025-01-20: 初版作成
