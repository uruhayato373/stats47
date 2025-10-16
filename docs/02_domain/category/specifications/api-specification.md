---
title: カテゴリ管理ドメイン - API 仕様
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/category
  - specifications
---

# カテゴリ管理ドメイン - API 仕様

## 概要

カテゴリ管理ドメインの API 仕様書です。CategoryService クラスを通じて提供される機能の詳細な仕様を定義します。

## CategoryService API

### 基本メソッド

#### getAllCategories(options?)

全てのカテゴリを取得します。

```typescript
static getAllCategories(
  options?: CategorySearchOptions & CategoryFilterOptions & CategorySortOptions
): Category[]
```

**パラメータ:**

- `options` (optional): 検索・フィルタ・ソートオプション

**戻り値:** `Category[]` - カテゴリの配列

**使用例:**

```typescript
// 全カテゴリ取得
const allCategories = CategoryService.getAllCategories();

// フィルタ・ソート付きで取得
const filteredCategories = CategoryService.getAllCategories({
  query: "テクノロジー",
  hasSubcategories: true,
  field: "name",
  order: "asc",
});
```

**エラー処理:**

- データの読み込みに失敗した場合、空配列を返します
- 不正なオプションが指定された場合、デフォルト値を使用します

#### getCategoryById(id)

ID でカテゴリを取得します。

```typescript
static getCategoryById(id: string): Category | null
```

**パラメータ:**

- `id`: カテゴリ ID

**戻り値:** `Category | null` - 見つかった場合はカテゴリ、見つからない場合は null

**使用例:**

```typescript
const category = CategoryService.getCategoryById("tech");
if (category) {
  console.log(category.name); // "テクノロジー"
} else {
  console.log("カテゴリが見つかりません");
}
```

**エラー処理:**

- 無効な ID（空文字列、null、undefined）の場合は null を返します
- 存在しない ID の場合は null を返します

#### getSubcategoryById(id)

ID でサブカテゴリを取得します。

```typescript
static getSubcategoryById(id: string): SubcategorySearchResult | null
```

**パラメータ:**

- `id`: サブカテゴリ ID

**戻り値:** `SubcategorySearchResult | null` - 見つかった場合は親カテゴリとサブカテゴリ、見つからない場合は null

**使用例:**

```typescript
const result = CategoryService.getSubcategoryById("programming");
if (result) {
  console.log(result.category.name); // "テクノロジー"
  console.log(result.subcategory.name); // "プログラミング"
}
```

**エラー処理:**

- 無効な ID の場合は null を返します
- 存在しない ID の場合は null を返します

### 検索・フィルタリング機能

#### searchCategories(categories, options)

カテゴリ名で検索します。

```typescript
static searchCategories(
  categories: Category[],
  options: CategorySearchOptions
): Category[]
```

**パラメータ:**

- `categories`: 検索対象のカテゴリ一覧
- `options`: 検索オプション

**戻り値:** `Category[]` - 検索結果のカテゴリ配列

**検索オプション:**

- `query?: string` - 検索クエリ（部分一致、大文字小文字区別なし）
- `includeSubcategories?: boolean` - サブカテゴリ名も検索対象に含めるか

**使用例:**

```typescript
const categories = CategoryService.getAllCategories();
const results = CategoryService.searchCategories(categories, {
  query: "テクノロジー",
  includeSubcategories: true,
});
```

**検索ルール:**

- 大文字小文字を区別しません
- 部分一致で検索します
- 空のクエリの場合は全カテゴリを返します

#### filterCategories(categories, options)

カテゴリをフィルタリングします。

```typescript
static filterCategories(
  categories: Category[],
  options: CategoryFilterOptions
): Category[]
```

**パラメータ:**

- `categories`: フィルタ対象のカテゴリ一覧
- `options`: フィルタオプション

**戻り値:** `Category[]` - フィルタ結果のカテゴリ配列

**フィルタオプション:**

- `hasSubcategories?: boolean` - サブカテゴリを持つカテゴリのみ
- `categoryIds?: string[]` - 特定のカテゴリ ID のみ

**使用例:**

```typescript
const categories = CategoryService.getAllCategories();

// サブカテゴリを持つカテゴリのみ
const withSubs = CategoryService.filterCategories(categories, {
  hasSubcategories: true,
});

// 特定のカテゴリのみ
const specific = CategoryService.filterCategories(categories, {
  categoryIds: ["tech", "lifestyle"],
});
```

**フィルタルール:**

- 複数の条件は AND 条件で結合されます
- 空の配列を指定した場合は空配列を返します

#### sortCategories(categories, options)

カテゴリをソートします。

```typescript
static sortCategories(
  categories: Category[],
  options: CategorySortOptions
): Category[]
```

**パラメータ:**

- `categories`: ソート対象のカテゴリ一覧
- `options`: ソートオプション

**戻り値:** `Category[]` - ソート結果のカテゴリ配列

**ソートオプション:**

- `field: "name" | "displayOrder" | "id"` - ソート対象フィールド
- `order: "asc" | "desc"` - ソート順序

**使用例:**

```typescript
const categories = CategoryService.getAllCategories();

// 名前で昇順ソート
const sorted = CategoryService.sortCategories(categories, {
  field: "name",
  order: "asc",
});
```

**ソートルール:**

- 文字列フィールドは辞書順でソートします
- 数値フィールドは数値順でソートします
- 未定義の値は最後に配置されます

### バリデーション機能

#### validateCategoryId(id)

カテゴリ ID のバリデーションを行います。

```typescript
static validateCategoryId(id: string): CategoryValidationResult
```

**パラメータ:**

- `id`: カテゴリ ID

**戻り値:** `CategoryValidationResult` - バリデーション結果

**使用例:**

```typescript
const result = CategoryService.validateCategoryId("tech");
if (result.isValid) {
  console.log("有効なカテゴリIDです");
} else {
  console.log("エラー:", result.errors);
}
```

**バリデーションルール:**

- 空文字列、null、undefined は無効
- 存在しない ID は無効
- 文字列型でない場合は無効

#### validateSubcategoryId(id)

サブカテゴリ ID のバリデーションを行います。

```typescript
static validateSubcategoryId(id: string): CategoryValidationResult
```

**パラメータ:**

- `id`: サブカテゴリ ID

**戻り値:** `CategoryValidationResult` - バリデーション結果

**使用例:**

```typescript
const result = CategoryService.validateSubcategoryId("programming");
if (result.isValid) {
  console.log("有効なサブカテゴリIDです");
} else {
  console.log("エラー:", result.errors);
}
```

**バリデーションルール:**

- 空文字列、null、undefined は無効
- 存在しない ID は無効
- 文字列型でない場合は無効

### 統計情報機能

#### getCategoryStats()

カテゴリ統計情報を取得します。

```typescript
static getCategoryStats(): CategoryStats
```

**戻り値:** `CategoryStats` - カテゴリ統計情報

**使用例:**

```typescript
const stats = CategoryService.getCategoryStats();
console.log(`総カテゴリ数: ${stats.totalCategories}`);
console.log(`総サブカテゴリ数: ${stats.totalSubcategories}`);
```

**統計情報:**

- `totalCategories`: 総カテゴリ数
- `totalSubcategories`: 総サブカテゴリ数
- `categoriesWithSubcategories`: サブカテゴリを持つカテゴリ数
- `categoriesWithoutSubcategories`: サブカテゴリを持たないカテゴリ数

### 高度な検索機能

#### advancedSearch(options)

高度な検索機能を提供します。

```typescript
static advancedSearch(
  options: CategorySearchOptions & CategoryFilterOptions & CategorySortOptions
): CategorySearchResult
```

**パラメータ:**

- `options`: 検索・フィルタ・ソートオプション

**戻り値:** `CategorySearchResult` - 検索結果

**使用例:**

```typescript
const result = CategoryService.advancedSearch({
  query: "テクノロジー",
  includeSubcategories: true,
  hasSubcategories: true,
  field: "name",
  order: "asc",
});

console.log(`検索結果: ${result.totalCount}件`);
console.log("カテゴリ:", result.categories);
console.log("サブカテゴリ:", result.subcategories);
```

**検索結果:**

- `categories`: マッチしたカテゴリ
- `subcategories`: マッチしたサブカテゴリ（includeSubcategories が true の場合）
- `totalCount`: 総件数

### 存在確認機能

#### existsCategory(id)

カテゴリの存在確認を行います。

```typescript
static existsCategory(id: string): boolean
```

**パラメータ:**

- `id`: カテゴリ ID

**戻り値:** `boolean` - 存在する場合は true、存在しない場合は false

**使用例:**

```typescript
if (CategoryService.existsCategory("tech")) {
  console.log("カテゴリが存在します");
}
```

#### existsSubcategory(id)

サブカテゴリの存在確認を行います。

```typescript
static existsSubcategory(id: string): boolean
```

**パラメータ:**

- `id`: サブカテゴリ ID

**戻り値:** `boolean` - 存在する場合は true、存在しない場合は false

**使用例:**

```typescript
if (CategoryService.existsSubcategory("programming")) {
  console.log("サブカテゴリが存在します");
}
```

## エラーハンドリング

### エラーの種類

1. **データ読み込みエラー**

   - categories.json の読み込みに失敗
   - 不正な JSON 形式

2. **バリデーションエラー**

   - 無効な ID
   - 存在しない ID
   - 不正なパラメータ

3. **処理エラー**
   - メモリ不足
   - 予期しないエラー

### エラーハンドリング戦略

1. **グレースフルデグラデーション**

   - エラーが発生しても可能な限り処理を継続
   - デフォルト値や空配列を返す

2. **詳細なエラー情報**

   - バリデーションエラーでは具体的なエラーメッセージを提供
   - デバッグ用のログ出力

3. **型安全性**
   - TypeScript による型チェック
   - 実行時バリデーション

## パフォーマンス仕様

### 応答時間

- 基本操作（getAllCategories、getCategoryById）: 1ms 以下
- 検索・フィルタリング: 10ms 以下
- ソート: 5ms 以下
- バリデーション: 1ms 以下

### メモリ使用量

- 全カテゴリデータ: 最大 1MB
- 個別カテゴリ: 最大 10KB
- 検索結果: 最大 100KB

### スケーラビリティ

- 最大カテゴリ数: 100 件
- 最大サブカテゴリ数: 1000 件
- 同時検索: 100 リクエスト/秒

## セキュリティ考慮事項

### 入力値の検証

- 全ての入力パラメータを検証
- SQL インジェクション対策（JSON データのため不要）
- XSS 対策（出力時のエスケープ）

### データの整合性

- 読み取り専用データの保護
- 不正なデータの検出と拒否

## 互換性

### バージョン互換性

- 現在のバージョン: 1.0.0
- 後方互換性: メジャーバージョン内で保証
- 前方互換性: 新機能はオプショナル

### ブラウザ互換性

- モダンブラウザ（ES2018 以上）
- Node.js 18 以上
- TypeScript 4.5 以上
