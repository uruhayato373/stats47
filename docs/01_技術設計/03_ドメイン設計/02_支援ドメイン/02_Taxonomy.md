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
src/infrastructure/taxonomy/
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
  id: string;
  /** カテゴリ名 */
  name: string;
  /** アイコン名（lucide-reactのアイコン名） */
  icon?: string;
  /** テーマカラー */
  color?: string;
  /** 表示順序 */
  displayOrder?: number;
  /** サブカテゴリのリスト */
  subcategories?: Subcategory[];
  /** 説明文（オプション） */
  description?: string;
}
```

**属性:**

- `id`: カテゴリ ID（URL スラッグとして使用）
- `name`: カテゴリ名（ユーザーに表示される名前）
- `icon`: アイコン名（lucide-react のアイコン名、例: MapPin, Users）
- `color`: テーマカラー（例: blue, teal, yellow）
- `displayOrder`: 表示順序（categories.json の配列順序に基づいて自動設定）
- `subcategories`: サブカテゴリのリスト
- `description`: 説明文（現在は空文字列、将来的に追加予定）

**現在の実装について:**

- `slug`と`isActive`は設計の参考として記載していますが、現在の実装では使用していません
- `id`が URL スラッグとして直接使用されています（例: `/population`, `/landweather`）
- 全てのカテゴリがアクティブとして扱われます
- データソースは`src/config/categories.json`です

#### Subcategory（サブカテゴリ）

カテゴリの下位分類を管理するエンティティ。

```typescript
interface Subcategory {
  /** サブカテゴリID */
  id: string;
  /** サブカテゴリ名 */
  name: string;
  /** 所属カテゴリID */
  categoryId: string;
  /** URL href */
  href?: string;
  /** 表示順序 */
  displayOrder?: number;
}
```

**属性:**

- `id`: サブカテゴリ ID（URL の一部として使用）
- `name`: サブカテゴリ名（ユーザーに表示される名前）
- `categoryId`: 所属カテゴリ ID（親カテゴリとの関連）
- `href`: URL href（例: `/basic-population`）
- `displayOrder`: 表示順序（categories.json の displayOrder フィールドから取得、デフォルト 0）

**現在の実装について:**

- `slug`と`isActive`は設計の参考として記載していますが、現在の実装では使用していません
- `id`が URL の一部として使用されます（例: `/population/basic-population`）
- データソースは`src/config/categories.json`の各カテゴリ内の subcategories 配列です

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

以下は概念的な設計です。現在の実装では型レベルでの値オブジェクトは実装しておらず、シンプルな string/number 型を使用しています。

#### CategoryId（カテゴリ ID）

カテゴリの一意識別子を表現する概念。

- **実装型**: `string`
- **具体例**: `"population"`, `"landweather"`, `"economy"`, `"education"`
- **推奨される制約**: 小文字英数字とハイフンのみ、空文字列不可、最大 50 文字
- **用途**: URL 生成（`/{categoryId}`）、ナビゲーション、カテゴリ識別

#### SubcategoryId（サブカテゴリ ID）

サブカテゴリの一意識別子を表現する概念。

- **実装型**: `string`
- **具体例**: `"basic-population"`, `"land-area"`, `"weather-climate"`
- **推奨される制約**: 小文字英数字とハイフンのみ、空文字列不可、最大 50 文字
- **用途**: URL 生成（`/{categoryId}/{subcategoryId}`）、サブカテゴリ識別

#### DisplayOrder（表示順序）

表示順序を表現する概念。

- **実装型**: `number`
- **具体例**: `0`, `1`, `2`, `3`（配列インデックス+1、または categories.json の displayOrder フィールド）
- **推奨される制約**: 0 以上の整数、最大 9999、重複可能（同じ順序の場合は配列順）
- **用途**: UI での表示順序制御、ナビゲーションメニューのソート

**注意**: これらは概念的な制約であり、現在の実装ではランタイムバリデーションは行っていません。

## 実装パターン

### 基本的な使い方

```typescript
import { CategoryService, TagService, FilteringService } from "@/infrastructure/taxonomy";

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

## 設計原則

### YAGNI (You Aren't Gonna Need It)

このドメインでは、実際に必要になるまで機能を実装しない「YAGNI 原則」に従っています。

#### 適用方針

1. **必要最小限の実装**: 現在使用されている機能のみを実装
2. **段階的な追加**: 新しい要件が発生した時点で機能を追加
3. **定期的な見直し**: 未使用コードは積極的に削除

#### 現在の実装範囲

以下の 5 つの関数のみを提供しています:

- `listCategories()` - 全カテゴリ取得（可視化設定で使用）
- `findSubcategoryById()` - サブカテゴリ検索（ランキング表示で使用）
- `validateSubcategoryOrThrow()` - サブカテゴリ検証（ルーティングで使用）
- `normalizeCategoryData()` - データ正規化（ランキング表示で使用）
- `validateSubcategory()` - 内部バリデーション（validateSubcategoryOrThrow 内で使用）

#### 命名規約の適用

Zenn の記事「[Get で始まる名前を関数につける前に読む記事](https://zenn.dev/blue_jam/articles/2a347b36b43d59)」に基づいて、適切な動詞を選択しています:

- `listCategories()` - 配列全体を返す操作には`list`が適切
- `findSubcategoryById()` - 検索操作には`find`が適切
- `validate*()` - 検証操作には`validate`が適切
- `normalize*()` - データ変換には`normalize`が適切

#### 将来的に必要になる可能性のある機能

必要に応じて以下の機能を追加できます:

- カテゴリ検索機能 (`searchCategories`)
- 高度なフィルタリング (`filterCategories`)
- カスタムソート (`sortCategories`)
- カテゴリ統計情報 (`categoryStats`)
- ナビゲーション用データ生成 (`sidebarCategories`)

これらは実際の要件が明確になった時点で実装します。

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

### 5. コード品質管理

#### 未使用コードの管理

**YAGNI 原則の適用**:

「必要になるまで実装しない (You Aren't Gonna Need It)」の原則に従います。

**理由**:

- コードベースの肥大化を防ぐ
- 保守コストを削減
- テストの対象範囲を最小化
- 実際の要件に基づいた設計が可能

#### 実装タイミング

1. **実装する**: 現在のユースケースで確実に使用される機能
2. **実装しない**: 将来使うかもしれない機能、推測に基づく機能
3. **リファクタリング時に追加**: 同様のパターンが 3 回以上出現した時

#### 未使用コードの検出と削除

定期的に以下を実行します:

```bash
# 未使用エクスポートの検出
npx ts-prune

# 未使用インポートの削除
npx eslint --fix
```

**削除対象**:

- 一度も参照されていない関数・クラス
- テストコードからのみ参照される実装コード
- コメントアウトされたコード

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
