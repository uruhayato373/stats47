---
title: Taxonomy ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - 支援ドメイン
  - Taxonomy
---

# Taxonomy ドメイン

## 概要

Taxonomy ドメインは、stats47 プロジェクトの支援ドメインの一つで、統計データの分類体系を管理します。カテゴリ・タグ・メタデータの管理、階層構造とフラット構造の統合管理、ナビゲーション機能、複合フィルタリングなど、統計データの分類に関するすべての機能を提供します。

### ビジネス価値

- **体系的なデータ整理**: 統計データを論理的に分類し、ユーザーが目的のデータに効率的にアクセス
- **柔軟な分類体系**: 階層構造とフラット構造を組み合わせた柔軟な分類
- **高度な検索・フィルタリング**: 複数の条件を組み合わせた精密な検索
- **関連性の発見**: タグ機能により、関連する統計データやコンテンツを発見

## 責務

- 分類体系の管理（カテゴリ・タグ・メタデータ）
- 階層構造とフラット構造の統合管理
- ナビゲーション機能
- 表示順序の管理
- 複合フィルタリング
- 分類ベース検索
- タグ管理
- タグクラウド生成
- 関連コンテンツ検索

## サブドメイン

Taxonomyドメインは、責務の明確化のため3つのサブドメインに分割されています。

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

### Category（カテゴリ）

統計データの主要カテゴリを管理するエンティティ。

**属性:**
- `id`: カテゴリ ID
- `name`: カテゴリ名
- `slug`: URLスラッグ
- `icon`: アイコン
- `color`: テーマカラー
- `displayOrder`: 表示順序
- `isActive`: 有効フラグ
- `subcategories`: サブカテゴリのリスト
- `description`: 説明文

### Subcategory（サブカテゴリ）

カテゴリの下位分類を管理するエンティティ。

**属性:**
- `id`: サブカテゴリ ID
- `name`: サブカテゴリ名
- `slug`: URLスラッグ
- `categoryId`: 所属カテゴリ ID
- `displayOrder`: 表示順序
- `isActive`: 有効フラグ
- `dashboardComponent`: ダッシュボードコンポーネント
- `description`: 説明文

### CategoryHierarchy（カテゴリ階層）

カテゴリの階層構造を管理するエンティティ。

**属性:**
- `root`: ルートカテゴリ
- `depth`: 階層の深さ
- `path`: 階層パス
- `children`: 子カテゴリのリスト

### Tag（タグ）

統計データやコンテンツに付与するタグを管理するエンティティ。

**属性:**
- `id`: タグID
- `name`: タグ名
- `slug`: URLスラッグ
- `usageCount`: 使用回数
- `relatedTags`: 関連タグ
- `isActive`: 有効フラグ
- `description`: 説明文

### TagCloud（タグクラウド）

タグクラウドの表示情報を管理するエンティティ。

**属性:**
- `tags`: タグリスト
- `weights`: 重み付け
- `maxSize`: 最大サイズ
- `minSize`: 最小サイズ
- `totalCount`: 総タグ数

### FilterCriteria（フィルタ条件）

複合フィルタリングの条件を管理するエンティティ。

**属性:**
- `categoryId`: カテゴリID
- `subcategoryId`: サブカテゴリID
- `tags`: タグリスト
- `areaCode`: 地域コード
- `dateRange`: 期間範囲
- `dataSource`: データソース
- `isActive`: 有効フラグ

## 値オブジェクト

### CategoryId（カテゴリID）

カテゴリの一意識別子を表現する値オブジェクト。

**具体例:**
- `population`: 人口・世帯カテゴリ
- `landweather`: 国土・気象カテゴリ
- `economy`: 企業・家計・経済カテゴリ
- `education`: 教育・文化・スポーツカテゴリ

**制約:**
- 小文字英数字とハイフンのみ許可
- 空文字列不可
- 最大50文字
- URLスラッグとして使用可能

**用途:**
- URL生成（`/population/basic-population`）
- データベースキー
- API レスポンス
- ルーティング識別子

### DisplayOrder（表示順序）

表示順序を表現する値オブジェクト。

**具体例:**
- `0`: 最初に表示（最優先）
- `1`: 2番目に表示
- `5`: 6番目に表示
- `10`: 11番目に表示

**制約:**
- 0以上の整数
- 最大9999
- 重複可能（同じ順序の場合は名前順）

**用途:**
- UI表示順序の制御
- ナビゲーションメニューの並び順
- カテゴリ・サブカテゴリのソート

### TagWeight（タグ重み）

タグクラウドでのタグの重みを表現する値オブジェクト。

**具体例:**
- `95`: 非常に人気のタグ（最大サイズ）
- `75`: 人気のタグ（大きめサイズ）
- `50`: 中程度のタグ（標準サイズ）
- `25`: 低頻度のタグ（小さめサイズ）
- `5`: 非常に低頻度のタグ（最小サイズ）

**制約:**
- 0-100の範囲
- 小数点以下1桁まで
- 使用回数に基づいて自動計算

**用途:**
- タグクラウドのサイズ計算（10px-30px）
- タグの視覚的重要度表現
- フィルタリング時の優先度

## ドメインサービス

### CategoryService

カテゴリの基本操作を実装するドメインサービス。

- **責務**: カテゴリのCRUD操作、階層構造の管理、表示順序の制御
- **主要メソッド**:
  - `getCategory(id)`: カテゴリIDによる取得
  - `getAllCategories()` / `getActiveCategories()`: カテゴリ一覧取得
  - `getCategoriesByDisplayOrder()`: 表示順序でソートされたカテゴリ取得
  - `createCategory(props)`: 新規カテゴリ作成（重複チェック含む）
  - `updateCategoryOrder(categoryId, newOrder)`: 表示順序の更新
- **使用例**: カテゴリナビゲーション、カテゴリ管理画面、URL生成

### TagService

タグの管理を実装するドメインサービス。

- **責務**: タグのCRUD操作、使用回数管理、タグクラウド生成
- **主要メソッド**:
  - `getTag(id)`: タグIDによる取得
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

- **責務**: カテゴリ・サブカテゴリのCRUD操作、検索、階層構造の取得
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

- **責務**: タグのCRUD操作、使用回数による検索、タグ名検索
- **主要メソッド**:
  - `findById(id)` / `findBySlug(slug)`: ID・スラッグによる検索
  - `findAll()` / `findActive()`: 全タグ・アクティブなタグの取得
  - `findByUsageCount(minCount)`: 使用回数による検索
  - `search(query)`: タグ名による検索
  - `save(tag)` / `delete(id)`: データの保存・削除

## ディレクトリ構造

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

## 関連ドメイン

- **Ranking ドメイン**: カテゴリ別統計データの分析
- **Search ドメイン**: 分類ベース検索の実装
- **Content Management ドメイン**: ブログコンテンツの分類

---

**更新履歴**:

- 2025-01-20: 初版作成
