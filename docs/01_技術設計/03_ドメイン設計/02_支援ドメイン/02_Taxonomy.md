# Taxonomy（分類管理）ドメイン

## 概要

Taxonomy（分類管理）ドメインは、stats47 プロジェクトの支援ドメインの一つで、統計データの分類体系を管理します。カテゴリ・タグ・メタデータの管理、階層構造とフラット構造の統合管理、ナビゲーション機能、複合フィルタリングなど、統計データの分類に関するすべての機能を提供します。

### ドメインの責務と目的

1. **統計カテゴリの管理**: 統計データの大分類・細分類の管理
2. **カテゴリ階層の管理**: カテゴリとサブカテゴリの階層構造管理
3. **サブカテゴリの管理**: カテゴリの細分類の管理
4. **カテゴリの表示名管理**: ユーザーに表示されるカテゴリ名の管理
5. **カテゴリの並び順管理**: 表示順序の制御
6. **タグ管理**: 統計データやコンテンツに付与するタグの管理
7. **複合フィルタリング**: 複数の条件を組み合わせた精密な検索

### ビジネス価値

- **体系的なデータ整理**: 統計データを論理的に分類し、ユーザーが目的のデータに効率的にアクセス
- **柔軟な分類体系**: 階層構造とフラット構造を組み合わせた柔軟な分類
- **高度な検索・フィルタリング**: 複数の条件を組み合わせた精密な検索
- **関連性の発見**: タグ機能により、関連する統計データやコンテンツを発見
- **ユーザビリティ向上**: 直感的なナビゲーションと分類体系

## アーキテクチャ

### サービスレイヤー構成

```
src/lib/taxonomy/
├── category/           # カテゴリサブドメイン
│   ├── model/
│   │   ├── Category.ts
│   │   ├── Subcategory.ts
│   │   ├── CategoryHierarchy.ts
│   │   ├── CategoryId.ts
│   │   ├── SubcategoryId.ts
│   │   └── DisplayOrder.ts
│   ├── service/
│   │   ├── CategoryService.ts
│   │   ├── NavigationService.ts
│   │   └── HierarchyService.ts
│   └── repositories/
│       └── CategoryRepository.ts
│
├── tag/                # タグサブドメイン
│   ├── model/
│   │   ├── Tag.ts
│   │   ├── TagCloud.ts
│   │   ├── TagId.ts
│   │   └── TagWeight.ts
│   ├── service/
│   │   ├── TagService.ts
│   │   └── TagCloudService.ts
│   └── repositories/
│       └── TagRepository.ts
│
└── filtering/          # フィルタリングサブドメイン
    ├── model/
    │   ├── FilterCriteria.ts
    │   └── FilterResult.ts
    └── service/
        └── FilteringService.ts
```

## サブドメイン

Taxonomy ドメインは、責務の明確化のため 3 つのサブドメインに分割されています。

### Category（カテゴリサブドメイン）

カテゴリとサブカテゴリの階層管理を担当します。

**責務:**

- カテゴリの作成・更新・削除
- サブカテゴリの管理
- 階層構造の維持
- 表示順序の制御
- ナビゲーション機能

**主要エンティティ:**

- `Category`: カテゴリの集約ルート
- `Subcategory`: サブカテゴリエンティティ
- `CategoryHierarchy`: 階層構造管理

### Tag（タグサブドメイン）

タグ管理とタグクラウド機能を担当します。

**責務:**

- タグの作成・更新・削除
- タグの使用回数管理
- タグクラウド生成
- 関連タグの提案

**主要エンティティ:**

- `Tag`: タグエンティティ
- `TagCloud`: タグクラウド値オブジェクト

### Filtering（フィルタリングサブドメイン）

複合フィルタリング機能を担当します。

**責務:**

- フィルタ条件の組み合わせ
- カテゴリ・タグ・地域・期間での絞り込み
- フィルタ結果の生成
- フィルタサジェスト機能

**主要エンティティ:**

- `FilterCriteria`: フィルタ条件値オブジェクト
- `FilterResult`: フィルタ結果値オブジェクト

## モデル設計

### エンティティ

#### Category（カテゴリ）

統計データの主要カテゴリを管理するエンティティ。

```typescript
interface Category {
  /** カテゴリID */
  id: CategoryId;
  /** カテゴリ名 */
  name: string;
  /** URLスラッグ */
  slug: string;
  /** アイコン */
  icon: string;
  /** テーマカラー */
  color: string;
  /** 表示順序 */
  displayOrder: DisplayOrder;
  /** 有効フラグ */
  isActive: boolean;
  /** サブカテゴリのリスト */
  subcategories: Subcategory[];
  /** 説明文 */
  description: string;
}
```

**属性:**

- `id`: カテゴリ ID
- `name`: カテゴリ名
- `slug`: URL スラッグ
- `icon`: アイコン
- `color`: テーマカラー
- `displayOrder`: 表示順序
- `isActive`: 有効フラグ
- `subcategories`: サブカテゴリのリスト
- `description`: 説明文

#### Subcategory（サブカテゴリ）

カテゴリの下位分類を管理するエンティティ。

```typescript
interface Subcategory {
  /** サブカテゴリID */
  id: SubcategoryId;
  /** サブカテゴリ名 */
  name: string;
  /** URLスラッグ */
  slug: string;
  /** 所属カテゴリID */
  categoryId: CategoryId;
  /** 表示順序 */
  displayOrder: DisplayOrder;
  /** 有効フラグ */
  isActive: boolean;
  /** ダッシュボードコンポーネント */
  dashboardComponent: string;
  /** 説明文 */
  description: string;
}
```

**属性:**

- `id`: サブカテゴリ ID
- `name`: サブカテゴリ名
- `slug`: URL スラッグ
- `categoryId`: 所属カテゴリ ID
- `displayOrder`: 表示順序
- `isActive`: 有効フラグ
- `dashboardComponent`: ダッシュボードコンポーネント
- `description`: 説明文

#### Tag（タグ）

統計データやコンテンツに付与するタグを管理するエンティティ。

```typescript
interface Tag {
  /** タグID */
  id: TagId;
  /** タグ名 */
  name: string;
  /** URLスラッグ */
  slug: string;
  /** 使用回数 */
  usageCount: number;
  /** 関連タグ */
  relatedTags: TagId[];
  /** 有効フラグ */
  isActive: boolean;
  /** 説明文 */
  description: string;
}
```

**属性:**

- `id`: タグ ID
- `name`: タグ名
- `slug`: URL スラッグ
- `usageCount`: 使用回数
- `relatedTags`: 関連タグ
- `isActive`: 有効フラグ
- `description`: 説明文

### 値オブジェクト

#### CategoryId（カテゴリ ID）

カテゴリの一意識別子を表現する値オブジェクト。

- **具体例**: `population`（人口・世帯）, `landweather`（国土・気象）, `economy`（企業・家計・経済）, `education`（教育・文化・スポーツ）
- **制約**: 小文字英数字とハイフンのみ許可、空文字列不可、最大 50 文字、URL スラッグとして使用可能
- **用途**: URL 生成（`/population/basic-population`）、データベースキー、API レスポンス、ルーティング識別子

#### DisplayOrder（表示順序）

表示順序を表現する値オブジェクト。

- **具体例**: `0`（最初に表示）、`1`（2 番目に表示）、`5`（6 番目に表示）、`10`（11 番目に表示）
- **制約**: 0 以上の整数、最大 9999、重複可能（同じ順序の場合は名前順）
- **用途**: UI 表示順序の制御、ナビゲーションメニューの並び順、カテゴリ・サブカテゴリのソート

#### TagWeight（タグ重み）

タグクラウドでのタグの重みを表現する値オブジェクト。

- **具体例**: `95`（非常に人気のタグ）、`75`（人気のタグ）、`50`（中程度のタグ）、`25`（低頻度のタグ）、`5`（非常に低頻度のタグ）
- **制約**: 0-100 の範囲、小数点以下 1 桁まで、使用回数に基づいて自動計算
- **用途**: タグクラウドのサイズ計算（10px-30px）、タグの視覚的重要度表現、フィルタリング時の優先度

## 実装パターン

### 基本的な使い方

```typescript
import { CategoryService, TagService, FilteringService } from "@/lib/taxonomy";

// カテゴリを取得
const categories = await CategoryService.getAllCategories();
console.log(categories[0].name); // "人口・世帯"

// サブカテゴリを取得
const subcategories = await CategoryService.getSubcategoriesByCategory(
  "population"
);
console.log(subcategories[0].name); // "基本人口"

// タグを取得
const tags = await TagService.getPopularTags(10);
console.log(tags[0].name); // "人口"

// フィルタリング
const results = await FilteringService.applyFilters({
  categoryId: "population",
  tags: ["人口", "世帯"],
  areaCode: "13000",
});
```

### カテゴリナビゲーション

```typescript
// ナビゲーション用のカテゴリ階層を取得
const navigation = await CategoryService.getNavigationHierarchy();

// 表示順序でソートされたカテゴリを取得
const sortedCategories = await CategoryService.getCategoriesByDisplayOrder();
```

### タグクラウド生成

```typescript
// タグクラウドを生成
const tagCloud = await TagService.generateTagCloud({
  maxSize: 30,
  minSize: 10,
  limit: 50,
});

// 関連タグを取得
const relatedTags = await TagService.getRelatedTags("人口", 5);
```

## ドメインサービス

### CategoryService

カテゴリの基本操作を実装するドメインサービス。

- **責務**: カテゴリの CRUD 操作、階層構造の管理、表示順序の制御
- **主要メソッド**:
  - `getCategory(id)`: カテゴリ ID による取得
  - `getAllCategories()` / `getActiveCategories()`: カテゴリ一覧取得
  - `getCategoriesByDisplayOrder()`: 表示順序でソートされたカテゴリ取得
  - `createCategory(props)`: 新規カテゴリ作成（重複チェック含む）
  - `updateCategoryOrder(categoryId, newOrder)`: 表示順序の更新
- **使用例**: カテゴリナビゲーション、カテゴリ管理画面、URL 生成

### TagService

タグの管理を実装するドメインサービス。

- **責務**: タグの CRUD 操作、使用回数管理、タグクラウド生成
- **主要メソッド**:
  - `getTag(id)`: タグ ID による取得
  - `getAllTags()` / `getActiveTags()`: タグ一覧取得
  - `getPopularTags(limit)`: 人気タグの取得（使用回数順）
  - `createTag(props)`: 新規タグ作成
  - `incrementUsage(tagId)`: 使用回数のインクリメント
  - `generateTagCloud()`: タグクラウドの生成
- **使用例**: タグ検索、タグクラウド表示、関連コンテンツ検索

### FilteringService

複合フィルタリングのロジックを実装するドメインサービス。

- **責務**: 複数条件によるフィルタリング、フィルタサジェスト、フィルタ結果の生成
- **主要メソッド**:
  - `applyFilters(criteria)`: フィルタ条件の適用（カテゴリ、タグ、地域、期間）
  - `getFilterSuggestions(query)`: フィルタサジェストの取得
- **使用例**: 統計データの絞り込み検索、高度な検索機能、関連データの発見

## リポジトリ

### CategoryRepository

カテゴリデータの永続化を抽象化するリポジトリインターフェース。

- **責務**: カテゴリ・サブカテゴリの CRUD 操作、検索、階層構造の取得
- **主要メソッド**:
  - `findById(id)` / `findBySlug(slug)`: ID・スラッグによる検索
  - `findAll()` / `findActive()`: 全カテゴリ・アクティブなカテゴリの取得
  - `findSubcategoryById(id)`: サブカテゴリの取得
  - `findSubcategoriesByCategory(categoryId)`: カテゴリ配下のサブカテゴリ取得
  - `search(query)`: カテゴリ名による検索
  - `save(category)` / `saveSubcategory(subcategory)`: データの保存
  - `delete(id)`: カテゴリの削除

### TagRepository

タグデータの永続化を抽象化するリポジトリインターフェース。

- **責務**: タグの CRUD 操作、使用回数による検索、タグ名検索
- **主要メソッド**:
  - `findById(id)` / `findBySlug(slug)`: ID・スラッグによる検索
  - `findAll()` / `findActive()`: 全タグ・アクティブなタグの取得
  - `findByUsageCount(minCount)`: 使用回数による検索
  - `search(query)`: タグ名による検索
  - `save(tag)` / `delete(id)`: データの保存・削除

## ベストプラクティス

### 1. 階層構造の管理

- カテゴリとサブカテゴリの適切な分離
- 階層の深さ制限
- 循環参照の防止

### 2. パフォーマンス最適化

- 表示順序による効率的なソート
- タグクラウドの生成最適化
- フィルタリングの高速化

### 3. ユーザビリティ

- 直感的なナビゲーション
- 関連タグの提案
- フィルタ条件の視覚的表示

### 4. 拡張性

- 新しい分類体系の追加
- カスタムフィルタの実装
- 多言語対応の準備

## 他ドメインとの関係性

### 依存するドメイン

なし（最も基盤的なドメインの一つ）

### 依存されるドメイン

- **Ranking ドメイン**: カテゴリ別統計データの分析
- **Search ドメイン**: 分類ベース検索の実装
- **Content ドメイン**: ブログコンテンツの分類
- **Visualization ドメイン**: カテゴリ別可視化
- **EstatAPI ドメイン**: 統計データの分類

## 関連ドキュメント

- [DDD ドメイン分類](../../01_システム概要/04_DDDドメイン分類.md#支援ドメイン)
- [システムアーキテクチャ](../../01_システム概要/システムアーキテクチャ.md)
- [ルーティング設計](../../05_フロントエンド設計/ルーティング設計.md)
