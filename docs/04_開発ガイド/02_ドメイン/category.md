---
title: Category（カテゴリ管理）ドメイン完全ガイド
created: 2025-10-26
updated: 2025-01-26
status: published
tags:
  - stats47
  - domain/category
  - complete-guide
author: 開発チーム
version: 3.0.0
---

# Category（カテゴリ管理）ドメイン完全ガイド

## 目次

1. [概要・責任](#概要責任)
2. [アーキテクチャ設計](#アーキテクチャ設計)
3. [データ構造](#データ構造)
4. [API 仕様](#api仕様)
5. [実装ガイド](#実装ガイド)
6. [ナビゲーション実装](#ナビゲーション実装)
7. [開始ガイド](#開始ガイド)
8. [トラブルシューティング](#トラブルシューティング)

---

# 概要・責任

## ドメインの責任

カテゴリ管理（Category）ドメインは、Stats47 プロジェクトにおける統計データの分類・管理・ナビゲーション機能を統合管理します。

### 主な責任

1. **カテゴリ・サブカテゴリの管理**: カテゴリの定義と構造化、サブカテゴリの階層管理
2. **検索・フィルタリング機能**: カテゴリ名での検索、条件によるフィルタリング
3. **ナビゲーション機能**: UI コンポーネントでのカテゴリ表示、ルーティング管理
4. **データ正規化・バリデーション**: データの整合性確保、型安全性の提供
5. **パフォーマンス最適化**: 効率的なデータ取得とキャッシュ戦略

### 主要機能

1. **カテゴリ CRUD 操作**

   - カテゴリの作成、読み取り、更新、削除
   - サブカテゴリの階層管理
   - 表示順序の制御

2. **検索・フィルタリング**

   - カテゴリ名での検索
   - サブカテゴリ名での検索
   - 条件によるフィルタリング

3. **ソート機能**

   - 名前順ソート
   - 表示順序ソート
   - カスタムソート

4. **ナビゲーション支援**
   - サイドバー用データ生成
   - ルーティング情報の提供
   - UI コンポーネント用データ変換

---

# アーキテクチャ設計

## 実装構造

```
src/infrastructure/taxonomy/category/
├── types/
│   └── index.ts           # 型定義（Category, Subcategory, 検索オプションなど）
├── service/
│   └── category.ts        # CategoryService（全機能を集約）
└── index.ts               # エクスポート管理
```

## CategoryService の責務

CategoryService は以下の機能を提供します：

1. **データ取得**: カテゴリ・サブカテゴリの取得
2. **検索・フィルタリング**: 条件に基づくデータ絞り込み
3. **ソート**: 各種ソート機能
4. **ナビゲーション**: UI 用データ変換
5. **バリデーション**: データ整合性チェック

## アーキテクチャパターン

### Service Layer パターン

```typescript
// CategoryService による統一的な API
const categories = CategoryService.getAllCategories();
const filtered = CategoryService.searchCategories(query);
const sorted = CategoryService.sortCategories(categories, options);
```

### Type Safety パターン

```typescript
// 型安全なデータ操作
interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface CategorySearchOptions {
  query?: string;
  hasSubcategories?: boolean;
}
```

---

# データ構造

## 基本データ構造

### Category（カテゴリ）

統計データの主要な分類を表すエンティティです。

```typescript
interface Category {
  id: string; // カテゴリID（一意）
  name: string; // カテゴリ名（表示用）
  icon?: string; // アイコン（絵文字またはアイコン名）
  color?: string; // 色（Tailwind CSSの色名）
  description?: string; // 説明文
  displayOrder?: number; // 表示順序（数値が小さいほど上位）
  subcategories?: Subcategory[]; // サブカテゴリ一覧
}
```

#### フィールド詳細

| フィールド      | 型              | 必須 | 説明                           | 例                                   |
| --------------- | --------------- | ---- | ------------------------------ | ------------------------------------ |
| `id`            | `string`        | ✅   | カテゴリの一意識別子           | `"tech"`, `"lifestyle"`              |
| `name`          | `string`        | ✅   | ユーザーに表示される名前       | `"テクノロジー"`, `"ライフスタイル"` |
| `icon`          | `string`        | ❌   | アイコン（絵文字推奨）         | `"💻"`, `"🏠"`                       |
| `color`         | `string`        | ❌   | 色の識別子                     | `"blue"`, `"green"`                  |
| `description`   | `string`        | ❌   | カテゴリの説明文               | `"技術関連の統計データ"`             |
| `displayOrder`  | `number`        | ❌   | 表示順序（デフォルト: 配列順） | `1`, `2`, `3`                        |
| `subcategories` | `Subcategory[]` | ❌   | サブカテゴリの配列             | `[{...}, {...}]`                     |

### Subcategory（サブカテゴリ）

カテゴリの下位分類を表すエンティティです。

```typescript
interface Subcategory {
  id: string; // サブカテゴリID（一意）
  name: string; // サブカテゴリ名（表示用）
  description?: string; // 説明文
  displayOrder?: number; // 表示順序
  categoryId: string; // 親カテゴリのID
}
```

## 検索・フィルタオプション

### CategorySearchOptions

```typescript
interface CategorySearchOptions {
  query?: string; // 検索クエリ
  hasSubcategories?: boolean; // サブカテゴリの有無
}
```

### CategorySortOptions

```typescript
interface CategorySortOptions {
  field: "name" | "displayOrder" | "id"; // ソートフィールド
  order: "asc" | "desc"; // ソート順序
}
```

## JSON データ構造

```json
[
  {
    "id": "tech",
    "name": "テクノロジー",
    "icon": "💻",
    "color": "blue",
    "description": "技術関連の統計データ",
    "displayOrder": 1,
    "subcategories": [
      {
        "id": "ai",
        "name": "人工知能",
        "description": "AI関連の統計",
        "displayOrder": 1,
        "categoryId": "tech"
      }
    ]
  }
]
```

---

# API 仕様

## CategoryService API

### 基本メソッド

#### `getAllCategories(options?)`

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

#### `getCategoryById(id)`

ID でカテゴリを取得します。

```typescript
static getCategoryById(id: string): Category | null
```

**パラメータ:**

- `id`: カテゴリ ID

**戻り値:** `Category | null` - カテゴリまたは null

#### `searchCategories(query, options?)`

カテゴリを検索します。

```typescript
static searchCategories(
  query: string,
  options?: CategorySearchOptions
): Category[]
```

**パラメータ:**

- `query`: 検索クエリ
- `options` (optional): 検索オプション

**戻り値:** `Category[]` - 検索結果の配列

#### `getSubcategoriesByCategoryId(categoryId)`

指定されたカテゴリのサブカテゴリを取得します。

```typescript
static getSubcategoriesByCategoryId(categoryId: string): Subcategory[]
```

**パラメータ:**

- `categoryId`: 親カテゴリの ID

**戻り値:** `Subcategory[]` - サブカテゴリの配列

### ナビゲーション用メソッド

#### `getNavigationCategories()`

ナビゲーション表示用のカテゴリ一覧を取得します。

```typescript
static getNavigationCategories(): Category[]
```

**戻り値:** `Category[]` - `displayOrder`順にソートされたカテゴリ配列

#### `getCategoriesForSidebar()`

サイドバー用のカテゴリデータを取得します。

```typescript
static getCategoriesForSidebar(): SidebarCategoryItem[]
```

**戻り値:** `SidebarCategoryItem[]` - サイドバー用に変換されたデータ

### SidebarCategoryItem 型

```typescript
interface SidebarCategoryItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  href: string; // 自動生成されるルート
  subcategories: SidebarSubcategoryItem[];
}

interface SidebarSubcategoryItem {
  id: string;
  name: string;
  href: string; // 自動生成されるルート
  categoryId: string;
}
```

---

# 実装ガイド

## 基本的な使用方法

### 1. カテゴリ一覧の取得

```typescript
import { CategoryService } from "@/infrastructure/taxonomy/category";

// 全カテゴリを取得
const categories = CategoryService.getAllCategories();

// ソート付きで取得
const sortedCategories = CategoryService.getAllCategories({
  field: "displayOrder",
  order: "asc",
});
```

### 2. カテゴリの検索

```typescript
// 名前で検索
const techCategories = CategoryService.searchCategories("テクノロジー");

// サブカテゴリを持つカテゴリのみ検索
const categoriesWithSub = CategoryService.getAllCategories({
  hasSubcategories: true,
});
```

### 3. 特定カテゴリの取得

```typescript
// ID でカテゴリを取得
const techCategory = CategoryService.getCategoryById("tech");

if (techCategory) {
  console.log(techCategory.name); // "テクノロジー"
}
```

### 4. サブカテゴリの取得

```typescript
// 特定カテゴリのサブカテゴリを取得
const techSubcategories = CategoryService.getSubcategoriesByCategoryId("tech");
```

## React コンポーネントでの使用

### カテゴリ一覧コンポーネント

```typescript
import { CategoryService } from "@/infrastructure/taxonomy/category";

export function CategoryList() {
  const categories = CategoryService.getAllCategories();

  return (
    <div>
      {categories.map((category) => (
        <div key={category.id}>
          <h3>{category.name}</h3>
          {category.subcategories?.map((sub) => (
            <div key={sub.id}>{sub.name}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 検索機能付きコンポーネント

```typescript
import { useState } from "react";
import { CategoryService } from "@/infrastructure/taxonomy/category";

export function CategorySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = (searchQuery: string) => {
    const searchResults = CategoryService.searchCategories(searchQuery);
    setResults(searchResults);
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSearch(query)}
        placeholder="カテゴリを検索..."
      />
      <div>
        {results.map((category) => (
          <div key={category.id}>{category.name}</div>
        ))}
      </div>
    </div>
  );
}
```

## 設定ファイル

### categories.json

`src/config/categories.json`にカテゴリデータを定義します：

```json
[
  {
    "id": "tech",
    "name": "テクノロジー",
    "icon": "💻",
    "color": "blue",
    "description": "技術関連の統計データ",
    "displayOrder": 1,
    "subcategories": [
      {
        "id": "ai",
        "name": "人工知能",
        "description": "AI関連の統計",
        "displayOrder": 1,
        "categoryId": "tech"
      },
      {
        "id": "mobile",
        "name": "モバイル",
        "description": "モバイル関連の統計",
        "displayOrder": 2,
        "categoryId": "tech"
      }
    ]
  },
  {
    "id": "lifestyle",
    "name": "ライフスタイル",
    "icon": "🏠",
    "color": "green",
    "description": "生活関連の統計データ",
    "displayOrder": 2,
    "subcategories": [
      {
        "id": "food",
        "name": "食生活",
        "description": "食生活関連の統計",
        "displayOrder": 1,
        "categoryId": "lifestyle"
      }
    ]
  }
]
```

---

# ナビゲーション実装

## ナビゲーション機能

カテゴリ管理ドメインのナビゲーション機能は、UI コンポーネント（サイドバー、ヘッダー、メニューなど）でカテゴリデータを表示するための便利な関数を提供します。

### `getNavigationCategories()`

ナビゲーション表示用のカテゴリ一覧を取得します。

```typescript
import { CategoryService } from "@/infrastructure/taxonomy/category";

const categories = CategoryService.getNavigationCategories();
// Category[] 型で返される
```

**特徴:**

- `displayOrder`順でソート済み
- 元の`Category`型のまま返される
- カスタムフィルタ・ソートのベースとして使用可能

### `getCategoriesForSidebar()`

サイドバーのカテゴリセクション用データを取得します。

```typescript
import { CategoryService } from "@/infrastructure/taxonomy/category";

const sidebarCategories = CategoryService.getCategoriesForSidebar();
// SidebarCategoryItem[] 型で返される
```

**特徴:**

- `SidebarCategoryItem`型に変換
- `href`プロパティが自動生成
- サブカテゴリ情報も含む
- サイドバー以外のナビゲーションでも利用可能

## サイドバーコンポーネント実装

```typescript
import { CategoryService } from "@/infrastructure/taxonomy/category";

export function CategorySidebar() {
  const sidebarCategories = CategoryService.getCategoriesForSidebar();

  return (
    <nav className="space-y-2">
      {sidebarCategories.map((category) => (
        <div key={category.id}>
          <Link
            href={category.href}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
          >
            {category.icon && <span>{category.icon}</span>}
            <span>{category.name}</span>
          </Link>

          {category.subcategories.length > 0 && (
            <div className="ml-4 space-y-1">
              {category.subcategories.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  href={subcategory.href}
                  className="block p-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  {subcategory.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
```

## ルーティング統合

### Next.js App Router での使用

```typescript
// app/(stats)/[category]/page.tsx
export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const category = CategoryService.getCategoryById(params.category);

  if (!category) {
    return <div>カテゴリが見つかりません</div>;
  }

  return (
    <div>
      <h1>{category.name}</h1>
      <p>{category.description}</p>
    </div>
  );
}
```

### 動的ルート生成

```typescript
// 静的生成用のパス生成
export async function generateStaticParams() {
  const categories = CategoryService.getAllCategories();

  return categories.map((category) => ({
    category: category.id,
  }));
}
```

---

# 開始ガイド

## 前提条件

- Node.js 18 以上
- TypeScript 4.5 以上
- Next.js 15 以上

## 依存関係

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

## セットアップ手順

### 1. カテゴリデータの準備

`src/config/categories.json`にカテゴリデータを定義します：

```json
[
  {
    "id": "tech",
    "name": "テクノロジー",
    "icon": "💻",
    "color": "blue",
    "description": "技術関連の統計データ",
    "displayOrder": 1,
    "subcategories": [
      {
        "id": "ai",
        "name": "人工知能",
        "description": "AI関連の統計",
        "displayOrder": 1,
        "categoryId": "tech"
      }
    ]
  }
]
```

### 2. CategoryService のインポート

```typescript
import { CategoryService } from "@/infrastructure/taxonomy/category";
```

### 3. 基本的な使用

```typescript
// 全カテゴリを取得
const categories = CategoryService.getAllCategories();

// 特定のカテゴリを取得
const techCategory = CategoryService.getCategoryById("tech");

// カテゴリを検索
const searchResults = CategoryService.searchCategories("テクノロジー");
```

## よくある使用パターン

### 1. カテゴリ一覧の表示

```typescript
export function CategoryList() {
  const categories = CategoryService.getAllCategories();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <div key={category.id} className="p-4 border rounded-lg">
          <h3 className="font-semibold">{category.name}</h3>
          <p className="text-gray-600">{category.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. 検索機能の実装

```typescript
export function CategorySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      const searchResults = CategoryService.searchCategories(searchQuery);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        placeholder="カテゴリを検索..."
        className="w-full p-2 border rounded"
      />

      {results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.map((category) => (
            <div key={category.id} className="p-2 bg-gray-50 rounded">
              {category.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

# トラブルシューティング

## よくある問題

### 1. カテゴリが取得できない

**原因**: 設定ファイルのパスが間違っている
**解決策**:

```typescript
// 正しいパスを確認
import { CategoryService } from "@/infrastructure/taxonomy/category";
```

### 2. 型エラーが発生する

**原因**: TypeScript の型定義が正しくインポートされていない
**解決策**:

```typescript
// 型定義を正しくインポート
import type { Category, Subcategory } from "@/infrastructure/taxonomy/category";
```

### 3. 検索結果が空になる

**原因**: 検索クエリの形式が間違っている
**解決策**:

```typescript
// 正しい検索方法
const results = CategoryService.searchCategories("テクノロジー");
// 部分一致でも検索される
```

### 4. サブカテゴリが表示されない

**原因**: カテゴリデータにサブカテゴリが含まれていない
**解決策**:

```json
// categories.json でサブカテゴリを正しく定義
{
  "id": "tech",
  "name": "テクノロジー",
  "subcategories": [
    {
      "id": "ai",
      "name": "人工知能",
      "categoryId": "tech"
    }
  ]
}
```

## デバッグ方法

### 1. カテゴリデータの確認

```typescript
// 全カテゴリをコンソールに出力
const categories = CategoryService.getAllCategories();
console.log("Categories:", categories);
```

### 2. 検索結果の確認

```typescript
// 検索結果をデバッグ
const results = CategoryService.searchCategories("テクノロジー");
console.log("Search results:", results);
```

### 3. 型の確認

```typescript
// 型情報を確認
import type { Category } from "@/infrastructure/taxonomy/category";
const category: Category = CategoryService.getCategoryById("tech");
console.log("Category type:", typeof category);
```

## パフォーマンス最適化

### 1. メモ化の使用

```typescript
import { useMemo } from "react";

export function CategoryList() {
  const categories = useMemo(() => {
    return CategoryService.getAllCategories();
  }, []);

  return (
    <div>
      {categories.map((category) => (
        <div key={category.id}>{category.name}</div>
      ))}
    </div>
  );
}
```

### 2. 遅延読み込み

```typescript
// 必要に応じてカテゴリを読み込み
const [categories, setCategories] = useState([]);

useEffect(() => {
  const loadCategories = async () => {
    const data = CategoryService.getAllCategories();
    setCategories(data);
  };

  loadCategories();
}, []);
```

---

## 参考資料

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React 19 Documentation](https://react.dev/)
