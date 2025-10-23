# Category API リファレンス

## 概要

CategoryService の全メソッドの詳細仕様を記載します。

## CategoryService

### `allCategories(options?: CategorySortOptions): Category[]`

全てのカテゴリを取得します。オプションでソート順を指定できます。

**パラメータ:**

- `options` (optional): ソートオプション
  - `field`: `"name" | "displayOrder" | "id"` - ソートフィールド
  - `order`: `"asc" | "desc"` - ソート順序

**戻り値:**

- `Category[]` - カテゴリの配列

**使用例:**

```typescript
// 全カテゴリを取得
const categories = allCategories();

// ソートオプション付きで取得
const sortedCategories = allCategories({
  field: "displayOrder",
  order: "asc",
});
```

### `categoryById(id: string): Category | null`

ID でカテゴリを取得します。

**パラメータ:**

- `id`: カテゴリ ID

**戻り値:**

- `Category | null` - カテゴリオブジェクト、見つからない場合は null

**使用例:**

```typescript
const category = categoryById("tech");
if (category) {
  console.log(category.name);
}
```

### `subcategoryById(id: string): SubcategorySearchResult | null`

ID でサブカテゴリを取得します（カテゴリ情報付き）。

**パラメータ:**

- `id`: サブカテゴリ ID

**戻り値:**

- `SubcategorySearchResult | null` - サブカテゴリとカテゴリ情報、見つからない場合は null

**使用例:**

```typescript
const result = subcategoryById("programming");
if (result) {
  console.log(result.category.name);
  console.log(result.subcategory.name);
}
```

### `searchCategories(options: CategorySearchOptions): CategorySearchResult`

カテゴリを検索します。

**パラメータ:**

- `options`: 検索オプション
  - `query`: 検索クエリ（カテゴリ名またはサブカテゴリ名）
  - `includeSubcategories`: サブカテゴリも検索対象に含めるか

**戻り値:**

- `CategorySearchResult` - 検索結果

**使用例:**

```typescript
const result = searchCategories({
  query: "テクノロジー",
  includeSubcategories: true,
});
console.log(result.categories);
console.log(result.subcategories);
```

### `filterCategories(categories: Category[], options: CategoryFilterOptions): Category[]`

カテゴリをフィルタリングします。

**パラメータ:**

- `categories`: フィルタリング対象のカテゴリ配列
- `options`: フィルタオプション
  - `hasSubcategories`: サブカテゴリの有無でフィルタ
  - `categoryIds`: カテゴリ ID でフィルタ

**戻り値:**

- `Category[]` - フィルタリングされたカテゴリ配列

**使用例:**

```typescript
const allCategories = allCategories();
const filtered = filterCategories(allCategories, {
  hasSubcategories: true,
});
```

### `sortCategories(categories: Category[], options: CategorySortOptions): Category[]`

カテゴリをソートします。

**パラメータ:**

- `categories`: ソート対象のカテゴリ配列
- `options`: ソートオプション
  - `field`: ソートフィールド
  - `order`: ソート順序

**戻り値:**

- `Category[]` - ソートされたカテゴリ配列

**使用例:**

```typescript
const sorted = sortCategories(categories, {
  field: "name",
  order: "asc",
});
```

### `validateCategoryId(id: string): CategoryValidationResult`

カテゴリ ID のバリデーションを行います。

**パラメータ:**

- `id`: カテゴリ ID

**戻り値:**

- `CategoryValidationResult` - バリデーション結果

**使用例:**

```typescript
const validation = validateCategoryId("tech");
if (!validation.isValid) {
  console.error("エラー:", validation.errors);
}
```

### `validateSubcategoryId(id: string): CategoryValidationResult`

サブカテゴリ ID のバリデーションを行います。

**パラメータ:**

- `id`: サブカテゴリ ID

**戻り値:**

- `CategoryValidationResult` - バリデーション結果

**使用例:**

```typescript
const validation = validateSubcategoryId("programming");
if (!validation.isValid) {
  console.error("エラー:", validation.errors);
}
```

### `categoryStats(): CategoryStats`

カテゴリ統計情報を取得します。

**戻り値:**

- `CategoryStats` - 統計情報

**使用例:**

```typescript
const stats = categoryStats();
console.log(`総カテゴリ数: ${stats.totalCategories}`);
console.log(`総サブカテゴリ数: ${stats.totalSubcategories}`);
```

### `advancedSearch(searchOptions: CategorySearchOptions, filterOptions: CategoryFilterOptions, sortOptions: CategorySortOptions): CategorySearchResult`

高度な検索（複数条件の組み合わせ）を行います。

**パラメータ:**

- `searchOptions`: 検索オプション
- `filterOptions`: フィルタオプション
- `sortOptions`: ソートオプション

**戻り値:**

- `CategorySearchResult` - 検索結果

**使用例:**

```typescript
const result = advancedSearch(
  { query: "テクノロジー", includeSubcategories: true },
  { hasSubcategories: true },
  { field: "name", order: "asc" }
);
```

### `categoryExists(id: string): boolean`

カテゴリの存在確認を行います。

**パラメータ:**

- `id`: カテゴリ ID

**戻り値:**

- `boolean` - 存在するかどうか

**使用例:**

```typescript
if (categoryExists("tech")) {
  console.log("カテゴリが存在します");
}
```

### `subcategoryExists(id: string): boolean`

サブカテゴリの存在確認を行います。

**パラメータ:**

- `id`: サブカテゴリ ID

**戻り値:**

- `boolean` - 存在するかどうか

**使用例:**

```typescript
if (subcategoryExists("programming")) {
  console.log("サブカテゴリが存在します");
}
```

### `navigationCategories(): Category[]`

ナビゲーション表示用のカテゴリ一覧を取得します。

**戻り値:**

- `Category[]` - displayOrder 順にソートされたカテゴリ配列

**使用例:**

```typescript
const navigationCategories = navigationCategories();
```

### `sidebarCategories(): SidebarCategoryItem[]`

サイドバーのカテゴリセクション用データを取得します。

**戻り値:**

- `SidebarCategoryItem[]` - サイドバー用のカテゴリ配列

**使用例:**

```typescript
const sidebarCategories = sidebarCategories();
```

### `normalizeCategoryData(category: Category): NormalizedCategory`

カテゴリデータを正規化します。

**パラメータ:**

- `category`: 正規化対象のカテゴリ

**戻り値:**

- `NormalizedCategory` - 正規化されたカテゴリ

**使用例:**

```typescript
const normalized = normalizeCategoryData(category);
```

### `normalizeCategoriesData(categories: Category[]): NormalizedCategory[]`

複数のカテゴリデータを一括で正規化します。

**パラメータ:**

- `categories`: 正規化対象のカテゴリ配列

**戻り値:**

- `NormalizedCategory[]` - 正規化されたカテゴリ配列

**使用例:**

```typescript
const normalized = normalizeCategoriesData(categories);
```

### `validateCategoryData(category: Category): { isValid: boolean; errors: string[] }`

カテゴリデータの検証を行います。

**パラメータ:**

- `category`: 検証対象のカテゴリ

**戻り値:**

- `{ isValid: boolean; errors: string[] }` - 検証結果

**使用例:**

```typescript
const validation = validateCategoryData(category);
if (!validation.isValid) {
  console.error("エラー:", validation.errors);
}
```

### `validateSubcategory(categoryId: string, subcategoryId: string): SubcategoryValidationResult`

サブカテゴリの存在確認と整合性チェックを行います。

**パラメータ:**

- `categoryId`: カテゴリ ID
- `subcategoryId`: サブカテゴリ ID

**戻り値:**

- `SubcategoryValidationResult` - 検証結果

**使用例:**

```typescript
const validation = validateSubcategory("tech", "programming");
if (!validation.isValid) {
  console.error("エラー:", validation.error);
}
```

### `validateSubcategoryOrThrow(categoryId: string, subcategoryId: string)`

サブカテゴリのバリデーションを行い、無効な場合は 404 エラーを発生させます。

**パラメータ:**

- `categoryId`: カテゴリ ID
- `subcategoryId`: サブカテゴリ ID

**戻り値:**

- `SubcategorySearchResult` - サブカテゴリデータ

**使用例:**

```typescript
try {
  const subcategoryData = validateSubcategoryOrThrow("tech", "programming");
  // 処理を続行
} catch (error) {
  // 404エラーが発生
}
```

## 型定義

### `Category`

```typescript
interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  displayOrder?: number;
  subcategories?: Subcategory[];
}
```

### `Subcategory`

```typescript
interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  href?: string;
  displayOrder?: number;
}
```

### `CategorySearchOptions`

```typescript
interface CategorySearchOptions {
  query?: string;
  includeSubcategories?: boolean;
}
```

### `CategoryFilterOptions`

```typescript
interface CategoryFilterOptions {
  hasSubcategories?: boolean;
  categoryIds?: string[];
}
```

### `CategorySortOptions`

```typescript
interface CategorySortOptions {
  field: "name" | "displayOrder" | "id";
  order: "asc" | "desc";
}
```

### `CategoryValidationResult`

```typescript
interface CategoryValidationResult {
  isValid: boolean;
  errors: string[];
}
```

### `SubcategoryValidationResult`

```typescript
interface SubcategoryValidationResult {
  isValid: boolean;
  error?: string;
  subcategoryData?: SubcategorySearchResult;
}
```

### `CategorySearchResult`

```typescript
interface CategorySearchResult {
  categories: Category[];
  subcategories: Subcategory[];
  totalCount: number;
}
```

### `SubcategorySearchResult`

```typescript
interface SubcategorySearchResult {
  category: Category;
  subcategory: Subcategory;
}
```

### `CategoryStats`

```typescript
interface CategoryStats {
  totalCategories: number;
  totalSubcategories: number;
  categoriesWithSubcategories: number;
  categoriesWithoutSubcategories: number;
}
```

### `SidebarCategoryItem`

```typescript
interface SidebarCategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  href: string;
  subcategories?: Array<{
    id: string;
    name: string;
    href: string;
  }>;
}
```

### `NormalizedCategory`

```typescript
interface NormalizedCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  displayOrder: number;
  subcategories: Subcategory[];
}
```
