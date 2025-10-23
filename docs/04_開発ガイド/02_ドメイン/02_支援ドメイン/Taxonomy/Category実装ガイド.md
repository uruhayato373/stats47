---
title: Category 実装ガイド
created: 2025-10-23
updated: 2025-10-23
tags:
  - domain/taxonomy
  - category
  - implementation-guide
---

# Category 実装ガイド

## 概要

Category サブドメインは、統計データの分類管理を担当します。カテゴリ・サブカテゴリの CRUD 操作、検索・フィルタリング・ソート機能、ナビゲーション用データ提供、データ正規化・バリデーション機能を提供します。

## アーキテクチャ

### 実装構造

```
src/lib/taxonomy/category/
├── types/
│   └── index.ts           # 型定義（Category, Subcategory, 検索オプションなど）
├── service/
│   └── category.ts        # CategoryService（全機能を集約）
└── index.ts               # エクスポート管理
```

### CategoryService の責務

- **カテゴリの CRUD、検索、ソート、フィルタリング**
- **ナビゲーション用データ取得**（getSidebarCategories）
- **データ正規化**（normalizeCategoryData）
- **バリデーション**（validateSubcategory）

## 基本的な使用方法

### インポート

```typescript
import {
  allCategories,
  categoryById,
  sidebarCategories,
} from "@/lib/taxonomy/category";
// または個別の関数をインポート
import {
  allCategories,
  categoryById,
  sidebarCategories,
} from "@/lib/taxonomy/category";
```

### カテゴリの取得

```typescript
// 全カテゴリを取得
const categories = allCategories();

// ソートオプション付きで取得
const sortedCategories = allCategories({
  field: "displayOrder",
  order: "asc",
});

// 特定のカテゴリを取得
const category = categoryById("population");
if (category) {
  console.log(category.name); // "人口"
}
```

### サブカテゴリの取得

```typescript
// サブカテゴリを取得（カテゴリ情報付き）
const result = subcategoryById("basic-population");
if (result) {
  console.log(result.category.name); // "人口"
  console.log(result.subcategory.name); // "基本人口"
}
```

## 検索・フィルタリング

### 基本的な検索

```typescript
// カテゴリ名で検索
const searchResult = searchCategories({
  query: "人口",
  includeSubcategories: false,
});

console.log(searchResult.categories); // マッチしたカテゴリ
console.log(searchResult.totalCount); // マッチ数
```

### サブカテゴリを含む検索

```typescript
// カテゴリとサブカテゴリの両方で検索
const searchResult = searchCategories({
  query: "基本",
  includeSubcategories: true,
});

console.log(searchResult.categories); // マッチしたカテゴリ
console.log(searchResult.subcategories); // マッチしたサブカテゴリ
```

### フィルタリング

```typescript
// サブカテゴリを持つカテゴリのみを取得
const categoriesWithSubs = filterCategories(allCategories(), {
  hasSubcategories: true,
});

// 特定のカテゴリIDのみを取得
const specificCategories = filterCategories(allCategories(), {
  categoryIds: ["population", "economy"],
});
```

### 高度な検索

```typescript
// 複数条件の組み合わせ検索
const result = advancedSearch(
  { query: "人口", includeSubcategories: true }, // 検索条件
  { hasSubcategories: true }, // フィルタ条件
  { field: "name", order: "asc" } // ソート条件
);
```

## ナビゲーション機能

### サイドバー用データの取得

```typescript
import { getSidebarCategories } from "@/lib/taxonomy/category";

// サイドバー用のカテゴリデータを取得
const sidebarCategories = getSidebarCategories();

// 結果の例
// [
//   {
//     id: "population",
//     name: "人口",
//     icon: "Users",
//     color: "blue",
//     href: "/population",
//     subcategories: [
//       { id: "basic-population", name: "基本人口", href: "/basic-population" }
//     ]
//   }
// ]
```

### ナビゲーション表示用データの取得

```typescript
import { getNavigationCategories } from "@/lib/taxonomy/category";

// ナビゲーション表示用のカテゴリ一覧を取得
const navigationCategories = getNavigationCategories();
```

## データ正規化

### カテゴリデータの正規化

```typescript
import { normalizeCategoryData } from "@/lib/taxonomy/category";

const category = categoryById("population");
if (category) {
  // 必須フィールドにデフォルト値を設定
  const normalized = normalizeCategoryData(category);

  console.log(normalized.description); // "" (デフォルト値)
  console.log(normalized.icon); // "" (デフォルト値)
  console.log(normalized.color); // "gray" (デフォルト値)
}
```

### 複数カテゴリの一括正規化

```typescript
import { normalizeCategoriesData } from "@/lib/taxonomy/category";

const categories = allCategories();
const normalizedCategories = normalizeCategoriesData(categories);
```

## バリデーション

### カテゴリ ID のバリデーション

```typescript
import { validateCategoryId } from "@/lib/taxonomy/category";

const validation = validateCategoryId("population");
if (validation.isValid) {
  console.log("有効なカテゴリIDです");
} else {
  console.error("エラー:", validation.errors);
}
```

### サブカテゴリのバリデーション

```typescript
import { validateSubcategory } from "@/lib/taxonomy/category";

const validation = validateSubcategory("population", "basic-population");
if (validation.isValid) {
  console.log("有効なサブカテゴリです");
  console.log(validation.subcategoryData);
} else {
  console.error("エラー:", validation.error);
}
```

### バリデーション（エラー時は 404）

```typescript
import { validateSubcategoryOrThrow } from "@/lib/taxonomy/category";

// 無効な場合は自動的に404エラーが発生
const subcategoryData = validateSubcategoryOrThrow(
  "population",
  "basic-population"
);
```

## 統計情報の取得

```typescript
import { getCategoryStats } from "@/lib/taxonomy/category";

const stats = getCategoryStats();
console.log(stats.totalCategories); // 全カテゴリ数
console.log(stats.totalSubcategories); // 全サブカテゴリ数
console.log(stats.categoriesWithSubcategories); // サブカテゴリを持つカテゴリ数
```

## 存在確認

```typescript
// カテゴリの存在確認
const exists = categoryExists("population");
console.log(exists); // true or false

// サブカテゴリの存在確認
const subExists = subcategoryExists("basic-population");
console.log(subExists); // true or false
```

## ベストプラクティス

### 1. エラーハンドリング

```typescript
// 良い例: 適切なエラーハンドリング
const category = categoryById("population");
if (!category) {
  console.error("カテゴリが見つかりません");
  return;
}

// バリデーション結果の確認
const validation = validateCategoryId("invalid-id");
if (!validation.isValid) {
  console.error("バリデーションエラー:", validation.errors);
  return;
}
```

### 2. パフォーマンスの考慮

```typescript
// 良い例: 必要なデータのみを取得
const categories = allCategories({
  field: "displayOrder",
  order: "asc",
});

// 悪い例: 不要な検索を実行
const allCategories = allCategories();
const filtered = allCategories.filter((cat) => cat.displayOrder > 0);
```

### 3. 型安全性の活用

```typescript
// 良い例: 型を活用した安全なコード
const category: Category | null = categoryById("population");
if (category && category.subcategories) {
  category.subcategories.forEach((sub) => {
    console.log(sub.name); // 型安全
  });
}
```

## トラブルシューティング

### よくある問題

1. **インポートエラー**

   ```typescript
   // エラー: Module not found
   import { CategoryService } from "@/lib/category";

   // 修正: 正しいパスを使用
   import { allCategories, categoryById } from "@/lib/taxonomy/category";
   ```

2. **型エラー**

   ```typescript
   // エラー: Type 'undefined' is not assignable
   const category = categoryById("invalid");
   console.log(category.name); // エラー

   // 修正: null チェックを追加
   const category = categoryById("invalid");
   if (category) {
     console.log(category.name); // OK
   }
   ```

3. **色機能のエラー**

   ```typescript
   // エラー: Module not found: './color-mapping'
   import { getCategoryColorClasses } from "@/lib/category/color-mapping";

   // 修正: カラーマッピング機能は削除されました
   // 代替のスタイリング手法を使用してください
   ```

### デバッグのヒント

1. **ログの活用**

   ```typescript
   const categories = allCategories();
   console.log("カテゴリ数:", categories.length);
   console.log(
     "カテゴリ一覧:",
     categories.map((c) => c.name)
   );
   ```

2. **バリデーション結果の確認**
   ```typescript
   const validation = validateSubcategory("population", "basic-population");
   console.log("バリデーション結果:", validation);
   ```

## 関連ドキュメント

- [CategoryAPI リファレンス](./CategoryAPIリファレンス.md) - 全メソッドの詳細仕様
- [Taxonomy ドメイン設計](../../../01_技術設計/03_ドメイン設計/02_支援ドメイン/02_Taxonomy.md) - ドメインの設計思想
