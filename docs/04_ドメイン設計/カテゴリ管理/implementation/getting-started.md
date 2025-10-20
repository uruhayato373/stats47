---
title: カテゴリ管理ドメイン - はじめに
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/category
  - implementation
---

# カテゴリ管理ドメイン - はじめに

## 概要

カテゴリ管理ドメインの基本的な使用方法を説明します。統計全体で共通のカテゴリ・サブカテゴリ管理機能を簡単に利用できます。

## インストール・セットアップ

### 前提条件

- Node.js 18 以上
- TypeScript 4.5 以上
- Next.js 15 以上

### 依存関係

カテゴリ管理ドメインは以下の依存関係を使用します：

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 設定ファイル

`src/config/categories.json`にカテゴリデータを定義します：

```json
[
  {
    "id": "tech",
    "name": "テクノロジー",
    "icon": "💻",
    "color": "blue",
    "subcategories": [
      {
        "id": "programming",
        "name": "プログラミング",
        "href": "/tech/programming",
        "dashboardComponent": "ProgrammingDashboard",
        "displayOrder": 1
      }
    ]
  }
]
```

## 基本的な使用方法

### 1. インポート

```typescript
import { CategoryService } from "@/lib/category";
// または個別の関数をインポート
import {
  getAllCategories,
  getCategoryById,
  getSubcategoryById,
} from "@/lib/category";
```

### 2. 全カテゴリの取得

```typescript
// 全カテゴリを取得
const categories = CategoryService.getAllCategories();
console.log(categories); // Category[]の配列

// または関数形式で
const categories = getAllCategories();
```

### 3. 特定のカテゴリの取得

```typescript
// IDでカテゴリを取得
const category = CategoryService.getCategoryById("tech");
if (category) {
  console.log(category.name); // "テクノロジー"
} else {
  console.log("カテゴリが見つかりません");
}
```

### 4. サブカテゴリの取得

```typescript
// IDでサブカテゴリを取得
const result = CategoryService.getSubcategoryById("programming");
if (result) {
  console.log(result.category.name); // "テクノロジー"
  console.log(result.subcategory.name); // "プログラミング"
}
```

## 検索・フィルタリング

### 1. カテゴリ名で検索

```typescript
// 全カテゴリを取得
const allCategories = CategoryService.getAllCategories();

// カテゴリ名で検索
const searchResults = CategoryService.searchCategories(allCategories, {
  query: "テクノロジー",
});

// サブカテゴリ名も含めて検索
const searchWithSubs = CategoryService.searchCategories(allCategories, {
  query: "プログラミング",
  includeSubcategories: true,
});
```

### 2. フィルタリング

```typescript
const allCategories = CategoryService.getAllCategories();

// サブカテゴリを持つカテゴリのみ
const withSubs = CategoryService.filterCategories(allCategories, {
  hasSubcategories: true,
});

// 特定のカテゴリのみ
const specific = CategoryService.filterCategories(allCategories, {
  categoryIds: ["tech", "lifestyle"],
});
```

### 3. ソート

```typescript
const allCategories = CategoryService.getAllCategories();

// 名前で昇順ソート
const sorted = CategoryService.sortCategories(allCategories, {
  field: "name",
  order: "asc",
});

// 表示順序で降順ソート
const sortedByOrder = CategoryService.sortCategories(allCategories, {
  field: "displayOrder",
  order: "desc",
});
```

### 4. 組み合わせた検索

```typescript
// 検索・フィルタ・ソートを組み合わせ
const results = CategoryService.getAllCategories({
  query: "テクノロジー",
  hasSubcategories: true,
  field: "name",
  order: "asc",
});
```

## 高度な検索

### advancedSearch の使用

```typescript
// 高度な検索機能
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

## バリデーション

### 1. カテゴリ ID のバリデーション

```typescript
const validation = CategoryService.validateCategoryId("tech");
if (validation.isValid) {
  console.log("有効なカテゴリIDです");
} else {
  console.log("エラー:", validation.errors);
}
```

### 2. サブカテゴリ ID のバリデーション

```typescript
const validation = CategoryService.validateSubcategoryId("programming");
if (validation.isValid) {
  console.log("有効なサブカテゴリIDです");
} else {
  console.log("エラー:", validation.errors);
}
```

### 3. 存在確認

```typescript
// カテゴリの存在確認
if (CategoryService.existsCategory("tech")) {
  console.log("カテゴリが存在します");
}

// サブカテゴリの存在確認
if (CategoryService.existsSubcategory("programming")) {
  console.log("サブカテゴリが存在します");
}
```

## 統計情報の取得

```typescript
const stats = CategoryService.getCategoryStats();
console.log(`総カテゴリ数: ${stats.totalCategories}`);
console.log(`総サブカテゴリ数: ${stats.totalSubcategories}`);
console.log(
  `サブカテゴリを持つカテゴリ数: ${stats.categoriesWithSubcategories}`
);
```

## 実際の使用例

### 1. ページコンポーネントでの使用

```typescript
// app/[category]/page.tsx
import { CategoryService } from "@/lib/category";

export default async function CategoryPage({ params }: PageProps) {
  const { category: categoryId } = await params;

  // カテゴリの存在確認
  const category = CategoryService.getCategoryById(categoryId);
  if (!category) {
    notFound();
  }

  return <CategoryPageClient category={category} />;
}
```

### 2. コンポーネントでの使用

```typescript
// components/CategoryList.tsx
"use client";

import { useState, useEffect } from "react";
import { CategoryService } from "@/lib/category";

export function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const allCategories = CategoryService.getAllCategories();
    setCategories(allCategories);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = CategoryService.searchCategories(categories, {
      query,
      includeSubcategories: true,
    });
    setCategories(filtered);
  };

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="カテゴリを検索..."
      />
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            {category.icon} {category.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3. カスタムフックでの使用

```typescript
// hooks/useCategories.ts
import { useState, useEffect } from "react";
import { CategoryService } from "@/lib/category";
import type { Category } from "@/lib/category";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const allCategories = CategoryService.getAllCategories();
      setCategories(allCategories);
    } catch (err) {
      setError("カテゴリの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCategories = (query: string) => {
    const results = CategoryService.searchCategories(categories, {
      query,
      includeSubcategories: true,
    });
    return results;
  };

  return {
    categories,
    loading,
    error,
    searchCategories,
  };
}
```

## エラーハンドリング

### 基本的なエラーハンドリング

```typescript
try {
  const category = CategoryService.getCategoryById("tech");
  if (!category) {
    throw new Error("カテゴリが見つかりません");
  }
  // カテゴリを使用
} catch (error) {
  console.error("エラーが発生しました:", error);
  // エラー処理
}
```

### バリデーションを使用したエラーハンドリング

```typescript
const validation = CategoryService.validateCategoryId("tech");
if (!validation.isValid) {
  console.error("バリデーションエラー:", validation.errors);
  // エラー処理
  return;
}

const category = CategoryService.getCategoryById("tech");
// 安全にカテゴリを使用
```

## パフォーマンスの最適化

### 1. 必要な時のみ検索・フィルタを実行

```typescript
// 良い例: 必要な時のみ検索
const allCategories = CategoryService.getAllCategories();
const searchResults = allCategories.filter((cat) =>
  cat.name.includes("テクノロジー")
);

// より良い例: サービスメソッドを活用
const searchResults = CategoryService.searchCategories(allCategories, {
  query: "テクノロジー",
});
```

### 2. メモ化の活用

```typescript
import { useMemo } from "react";

function CategoryList({ searchQuery }: { searchQuery: string }) {
  const allCategories = CategoryService.getAllCategories();

  const filteredCategories = useMemo(() => {
    return CategoryService.searchCategories(allCategories, {
      query: searchQuery,
      includeSubcategories: true,
    });
  }, [allCategories, searchQuery]);

  return (
    <ul>
      {filteredCategories.map((category) => (
        <li key={category.id}>{category.name}</li>
      ))}
    </ul>
  );
}
```

## 次のステップ

1. [ベストプラクティス](./best-practices.md)を読んで、より高度な使用方法を学ぶ
2. [使用例](./examples.md)を参考にして、具体的な実装パターンを理解する
3. プロジェクトにカテゴリ管理機能を統合する

## トラブルシューティング

### よくある問題

1. **カテゴリが見つからない**

   - categories.json の設定を確認
   - ID の大文字小文字を確認

2. **検索結果が空**

   - 検索クエリを確認
   - includeSubcategories オプションを確認

3. **型エラーが発生**
   - TypeScript の設定を確認
   - インポート文を確認

詳細は[ベストプラクティス](./best-practices.md)のトラブルシューティングセクションを参照してください。
