---
title: Taxonomy Management ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - 支援ドメイン
  - Taxonomy Management
---

# Taxonomy Management ドメイン

## 概要

Taxonomy Management ドメインは、stats47 プロジェクトの支援ドメインの一つで、統計データの分類体系を管理します。カテゴリ・タグ・メタデータの管理、階層構造とフラット構造の統合管理、ナビゲーション機能、複合フィルタリングなど、統計データの分類に関するすべての機能を提供します。

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

## 主要エンティティ

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

```typescript
export class CategoryId {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<CategoryId> {
    if (!value || value.trim().length === 0) {
      return Result.fail("Category ID cannot be empty");
    }
    if (!/^[a-z0-9-_]+$/.test(value)) {
      return Result.fail("Category ID must contain only lowercase letters, numbers, hyphens, and underscores");
    }
    return Result.ok(new CategoryId(value));
  }

  toString(): string {
    return this.value;
  }

  equals(other: CategoryId): boolean {
    return this.value === other.value;
  }
}
```

### DisplayOrder（表示順序）

表示順序を表現する値オブジェクト。

```typescript
export class DisplayOrder {
  private constructor(private readonly value: number) {}

  static create(value: number): Result<DisplayOrder> {
    if (value < 0) {
      return Result.fail("Display order must be non-negative");
    }
    return Result.ok(new DisplayOrder(value));
  }

  getValue(): number {
    return this.value;
  }

  isFirst(): boolean {
    return this.value === 0;
  }

  isAfter(other: DisplayOrder): boolean {
    return this.value > other.value;
  }

  increment(): DisplayOrder {
    return new DisplayOrder(this.value + 1);
  }
}
```

### TagWeight（タグ重み）

タグクラウドでのタグの重みを表現する値オブジェクト。

```typescript
export class TagWeight {
  private constructor(
    private readonly value: number,
    private readonly minWeight: number,
    private readonly maxWeight: number
  ) {}

  static create(
    value: number,
    minWeight: number = 0,
    maxWeight: number = 100
  ): Result<TagWeight> {
    if (value < minWeight || value > maxWeight) {
      return Result.fail(`Tag weight must be between ${minWeight} and ${maxWeight}`);
    }
    return Result.ok(new TagWeight(value, minWeight, maxWeight));
  }

  getValue(): number {
    return this.value;
  }

  getNormalizedValue(): number {
    return (this.value - this.minWeight) / (this.maxWeight - this.minWeight);
  }

  getSize(): number {
    // タグクラウドでのサイズ計算（例：10px - 30px）
    const minSize = 10;
    const maxSize = 30;
    return minSize + (this.getNormalizedValue() * (maxSize - minSize));
  }
}
```

## ドメインサービス

### CategoryService

カテゴリの基本操作を実装するドメインサービス。

```typescript
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly hierarchyService: HierarchyService
  ) {}

  async getCategory(id: CategoryId): Promise<Category | null> {
    return await this.categoryRepository.findById(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }

  async getActiveCategories(): Promise<Category[]> {
    return await this.categoryRepository.findActive();
  }

  async getCategoriesByDisplayOrder(): Promise<Category[]> {
    const categories = await this.getActiveCategories();
    return categories.sort((a, b) => 
      a.getDisplayOrder().getValue() - b.getDisplayOrder().getValue()
    );
  }

  async createCategory(props: {
    id: CategoryId;
    name: string;
    slug: string;
    icon: string;
    color: string;
    description?: string;
  }): Promise<Result<Category>> {
    // 重複チェック
    const existing = await this.categoryRepository.findById(props.id);
    if (existing) {
      return Result.fail("Category with this ID already exists");
    }

    const category = Category.create({
      ...props,
      displayOrder: DisplayOrder.create(0).getValue(),
      isActive: true,
      subcategories: [],
    });

    if (!category.isSuccess()) {
      return Result.fail(category.getError());
    }

    await this.categoryRepository.save(category.getValue());
    return Result.ok(category.getValue());
  }

  async updateCategoryOrder(categoryId: CategoryId, newOrder: DisplayOrder): Promise<Result<void>> {
    const category = await this.getCategory(categoryId);
    if (!category) {
      return Result.fail("Category not found");
    }

    category.updateDisplayOrder(newOrder);
    await this.categoryRepository.save(category);
    return Result.ok();
  }
}
```

### TagService

タグの管理を実装するドメインサービス。

```typescript
export class TagService {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly tagCloudService: TagCloudService
  ) {}

  async getTag(id: TagId): Promise<Tag | null> {
    return await this.tagRepository.findById(id);
  }

  async getAllTags(): Promise<Tag[]> {
    return await this.tagRepository.findAll();
  }

  async getActiveTags(): Promise<Tag[]> {
    return await this.tagRepository.findActive();
  }

  async getPopularTags(limit: number = 20): Promise<Tag[]> {
    const tags = await this.getActiveTags();
    return tags
      .sort((a, b) => b.getUsageCount() - a.getUsageCount())
      .slice(0, limit);
  }

  async createTag(props: {
    id: TagId;
    name: string;
    slug: string;
    description?: string;
  }): Promise<Result<Tag>> {
    // 重複チェック
    const existing = await this.tagRepository.findById(props.id);
    if (existing) {
      return Result.fail("Tag with this ID already exists");
    }

    const tag = Tag.create({
      ...props,
      usageCount: 0,
      relatedTags: [],
      isActive: true,
    });

    if (!tag.isSuccess()) {
      return Result.fail(tag.getError());
    }

    await this.tagRepository.save(tag.getValue());
    return Result.ok(tag.getValue());
  }

  async incrementUsage(tagId: TagId): Promise<Result<void>> {
    const tag = await this.getTag(tagId);
    if (!tag) {
      return Result.fail("Tag not found");
    }

    tag.incrementUsage();
    await this.tagRepository.save(tag);
    return Result.ok();
  }

  async generateTagCloud(): Promise<TagCloud> {
    const tags = await this.getActiveTags();
    return this.tagCloudService.generateTagCloud(tags);
  }
}
```

### FilteringService

複合フィルタリングのロジックを実装するドメインサービス。

```typescript
export class FilteringService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagRepository
  ) {}

  async applyFilters(criteria: FilterCriteria): Promise<FilterResult> {
    const filters: Filter[] = [];

    // カテゴリフィルタ
    if (criteria.getCategoryId()) {
      const category = await this.categoryRepository.findById(criteria.getCategoryId()!);
      if (category) {
        filters.push(new CategoryFilter(category));
      }
    }

    // サブカテゴリフィルタ
    if (criteria.getSubcategoryId()) {
      const subcategory = await this.categoryRepository.findSubcategoryById(criteria.getSubcategoryId()!);
      if (subcategory) {
        filters.push(new SubcategoryFilter(subcategory));
      }
    }

    // タグフィルタ
    if (criteria.getTags().length > 0) {
      const tags = await Promise.all(
        criteria.getTags().map(tagId => this.tagRepository.findById(tagId))
      );
      const validTags = tags.filter(tag => tag !== null) as Tag[];
      if (validTags.length > 0) {
        filters.push(new TagFilter(validTags));
      }
    }

    // 地域フィルタ
    if (criteria.getAreaCode()) {
      filters.push(new AreaFilter(criteria.getAreaCode()!));
    }

    // 期間フィルタ
    if (criteria.getDateRange()) {
      filters.push(new DateRangeFilter(criteria.getDateRange()!));
    }

    return new FilterResult(filters, criteria);
  }

  async getFilterSuggestions(query: string): Promise<FilterSuggestion[]> {
    const suggestions: FilterSuggestion[] = [];

    // カテゴリサジェスト
    const categories = await this.categoryRepository.search(query);
    suggestions.push(...categories.map(cat => new FilterSuggestion(
      cat.getName(),
      FilterType.CATEGORY,
      cat.getId()
    )));

    // タグサジェスト
    const tags = await this.tagRepository.search(query);
    suggestions.push(...tags.map(tag => new FilterSuggestion(
      tag.getName(),
      FilterType.TAG,
      tag.getId()
    )));

    return suggestions;
  }
}
```

## リポジトリ

### CategoryRepository

カテゴリデータの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface CategoryRepository {
  findById(id: CategoryId): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findActive(): Promise<Category[]>;
  findSubcategoryById(id: SubcategoryId): Promise<Subcategory | null>;
  findSubcategoriesByCategory(categoryId: CategoryId): Promise<Subcategory[]>;
  search(query: string): Promise<Category[]>;
  save(category: Category): Promise<void>;
  saveSubcategory(subcategory: Subcategory): Promise<void>;
  delete(id: CategoryId): Promise<void>;
  exists(id: CategoryId): Promise<boolean>;
}
```

### TagRepository

タグデータの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface TagRepository {
  findById(id: TagId): Promise<Tag | null>;
  findBySlug(slug: string): Promise<Tag | null>;
  findAll(): Promise<Tag[]>;
  findActive(): Promise<Tag[]>;
  findByUsageCount(minCount: number): Promise<Tag[]>;
  search(query: string): Promise<Tag[]>;
  save(tag: Tag): Promise<void>;
  delete(id: TagId): Promise<void>;
  exists(id: TagId): Promise<boolean>;
}
```

## ディレクトリ構造

```
src/domain/taxonomy/
├── entities/
│   ├── Category.ts
│   ├── Subcategory.ts
│   ├── CategoryHierarchy.ts
│   ├── Tag.ts
│   ├── TagCloud.ts
│   └── FilterCriteria.ts
├── value-objects/
│   ├── CategoryId.ts
│   ├── SubcategoryId.ts
│   ├── TagId.ts
│   ├── DisplayOrder.ts
│   ├── CategoryIcon.ts
│   └── TagWeight.ts
├── services/
│   ├── CategoryService.ts
│   ├── NavigationService.ts
│   ├── HierarchyService.ts
│   ├── TagService.ts
│   ├── TagCloudService.ts
│   └── FilteringService.ts
├── repositories/
│   ├── CategoryRepository.ts
│   └── TagRepository.ts
├── filters/
│   ├── CategoryFilter.ts
│   ├── SubcategoryFilter.ts
│   ├── TagFilter.ts
│   ├── AreaFilter.ts
│   └── DateRangeFilter.ts
└── specifications/
    ├── CategorySpecification.ts
    └── TagSpecification.ts
```

## DDDパターン実装例

### エンティティ実装例

```typescript
// src/domain/taxonomy/entities/Category.ts
export class Category {
  private constructor(
    private readonly id: CategoryId,
    private name: string,
    private readonly slug: string,
    private icon: string,
    private color: string,
    private displayOrder: DisplayOrder,
    private isActive: boolean,
    private subcategories: Subcategory[],
    private description: string
  ) {}

  static create(props: {
    id: CategoryId;
    name: string;
    slug: string;
    icon: string;
    color: string;
    displayOrder: DisplayOrder;
    isActive: boolean;
    subcategories?: Subcategory[];
    description?: string;
  }): Result<Category> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail("Category name cannot be empty");
    }
    if (!props.slug || props.slug.trim().length === 0) {
      return Result.fail("Category slug cannot be empty");
    }

    return Result.ok(
      new Category(
        props.id,
        props.name,
        props.slug,
        props.icon,
        props.color,
        props.displayOrder,
        props.isActive,
        props.subcategories || [],
        props.description || ""
      )
    );
  }

  addSubcategory(subcategory: Subcategory): Result<void> {
    if (!subcategory.getCategoryId().equals(this.id)) {
      return Result.fail("Subcategory does not belong to this category");
    }

    const exists = this.subcategories.some(sub => 
      sub.getId().equals(subcategory.getId())
    );
    if (exists) {
      return Result.fail("Subcategory already exists");
    }

    this.subcategories.push(subcategory);
    this.subcategories.sort((a, b) => 
      a.getDisplayOrder().getValue() - b.getDisplayOrder().getValue()
    );
    return Result.ok();
  }

  updateDisplayOrder(newOrder: DisplayOrder): void {
    this.displayOrder = newOrder;
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  getId(): CategoryId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getSlug(): string {
    return this.slug;
  }

  getIcon(): string {
    return this.icon;
  }

  getColor(): string {
    return this.color;
  }

  getDisplayOrder(): DisplayOrder {
    return this.displayOrder;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getSubcategories(): ReadonlyArray<Subcategory> {
    return this.subcategories;
  }

  getDescription(): string {
    return this.description;
  }
}
```

### 仕様実装例

```typescript
// src/domain/taxonomy/specifications/CategorySpecification.ts
export class CategorySpecification {
  static isActive(category: Category): boolean {
    return category.getIsActive();
  }

  static hasSubcategories(category: Category): boolean {
    return category.getSubcategories().length > 0;
  }

  static isFirstInOrder(category: Category): boolean {
    return category.getDisplayOrder().isFirst();
  }

  static hasDescription(category: Category): boolean {
    return category.getDescription().trim().length > 0;
  }

  static isPopular(category: Category, minSubcategories: number = 5): boolean {
    return category.getSubcategories().length >= minSubcategories;
  }
}
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

- **Analytics ドメイン**: カテゴリ別統計データの分析
- **Search ドメイン**: 分類ベース検索の実装
- **Content Management ドメイン**: ブログコンテンツの分類

---

**更新履歴**:

- 2025-01-20: 初版作成
