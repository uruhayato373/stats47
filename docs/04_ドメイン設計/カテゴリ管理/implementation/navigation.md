# ナビゲーション機能

## 概要

カテゴリ管理ドメインのナビゲーション機能は、UI コンポーネント（サイドバー、ヘッダー、メニューなど）でカテゴリデータを表示するための便利な関数を提供します。

## 機能一覧

### 1. `getNavigationCategories()`

ナビゲーション表示用のカテゴリ一覧を取得します。`displayOrder`順にソートされた状態で返します。

```typescript
import { getNavigationCategories } from "@/lib/category";

const categories = getNavigationCategories();
// Category[] 型で返される
```

**特徴:**

- `displayOrder`順でソート済み
- 元の`Category`型のまま返される
- カスタムフィルタ・ソートのベースとして使用可能

### 2. `getCategoriesForSidebar()`

サイドバーのカテゴリセクション用データを取得します。ナビゲーションアイテムとして使用しやすい形式に変換されます。

```typescript
import { getCategoriesForSidebar } from "@/lib/category";

const sidebarCategories = getCategoriesForSidebar();
// SidebarCategoryItem[] 型で返される
```

**特徴:**

- `SidebarCategoryItem`型に変換
- `href`プロパティが自動生成
- サブカテゴリ情報も含む
- サイドバー以外のナビゲーションでも利用可能

## 型定義

### `SidebarCategoryItem`

```typescript
export interface SidebarCategoryItem {
  id: string; // カテゴリID
  name: string; // カテゴリ名
  icon: string; // アイコン名
  color: string; // カテゴリ色
  href: string; // リンク先URL
  subcategories?: Array<{
    id: string; // サブカテゴリID
    name: string; // サブカテゴリ名
    href: string; // サブカテゴリリンク先URL
  }>;
}
```

## 使用例

### 基本的な使用方法

#### サイドバーでの使用

```typescript
import { getCategoriesForSidebar } from "@/lib/category";
import { useMemo } from "react";

function Sidebar() {
  const categories = useMemo(() => getCategoriesForSidebar(), []);

  return (
    <nav>
      {categories.map((category) => (
        <a key={category.id} href={category.href}>
          <CategoryIcon iconName={category.icon} />
          <span>{category.name}</span>
        </a>
      ))}
    </nav>
  );
}
```

#### ヘッダーメニューでの使用

```typescript
import { getCategoriesForSidebar } from "@/lib/category";

function HeaderMenu() {
  const categories = getCategoriesForSidebar();

  return (
    <div className="dropdown-menu">
      {categories.map((category) => (
        <div key={category.id} className="menu-item">
          <a href={category.href} className="menu-link">
            <span className="icon" style={{ color: category.color }}>
              {category.icon}
            </span>
            {category.name}
          </a>
          {category.subcategories && (
            <div className="submenu">
              {category.subcategories.map((sub) => (
                <a key={sub.id} href={sub.href} className="submenu-link">
                  {sub.name}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### カスタムフィルタ・ソート

#### アクティブなカテゴリのみ表示

```typescript
import { getNavigationCategories } from "@/lib/category";

function ActiveCategories() {
  const categories = useMemo(() => {
    const allCategories = getNavigationCategories();
    return allCategories.filter((category) => category.active);
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

#### 名前順でソート

```typescript
import { getNavigationCategories } from "@/lib/category";

function SortedCategories() {
  const categories = useMemo(() => {
    const allCategories = getNavigationCategories();
    return allCategories.sort((a, b) => a.name.localeCompare(b.name));
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

### パフォーマンス最適化

#### useMemo による最適化

```typescript
import { getCategoriesForSidebar } from "@/lib/category";
import { useMemo } from "react";

function OptimizedSidebar() {
  // 依存配列を空にして、初回のみ実行
  const categories = useMemo(() => getCategoriesForSidebar(), []);

  return (
    <nav>
      {categories.map((category) => (
        <CategoryItem key={category.id} category={category} />
      ))}
    </nav>
  );
}
```

#### 条件付きレンダリング

```typescript
import { getCategoriesForSidebar } from "@/lib/category";

function ConditionalNavigation({ showSubcategories = false }) {
  const categories = useMemo(() => {
    const allCategories = getCategoriesForSidebar();
    return showSubcategories
      ? allCategories
      : allCategories.map((cat) => ({ ...cat, subcategories: undefined }));
  }, [showSubcategories]);

  return (
    <nav>
      {categories.map((category) => (
        <div key={category.id}>
          <a href={category.href}>{category.name}</a>
          {showSubcategories && category.subcategories && (
            <div className="subcategories">
              {category.subcategories.map((sub) => (
                <a key={sub.id} href={sub.href}>
                  {sub.name}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
```

## ベストプラクティス

### 1. メモ化の活用

```typescript
// ✅ 良い例: useMemoでメモ化
const categories = useMemo(() => getCategoriesForSidebar(), []);

// ❌ 悪い例: 毎回再計算
const categories = getCategoriesForSidebar();
```

### 2. 型安全性の確保

```typescript
// ✅ 良い例: 型を明示
const categories: SidebarCategoryItem[] = getCategoriesForSidebar();

// ✅ 良い例: 型推論を活用
const categories = getCategoriesForSidebar(); // 型推論される
```

### 3. エラーハンドリング

```typescript
import { getCategoriesForSidebar } from "@/lib/category";

function SafeNavigation() {
  const categories = useMemo(() => {
    try {
      return getCategoriesForSidebar();
    } catch (error) {
      console.error("カテゴリデータの取得に失敗しました:", error);
      return []; // フォールバック
    }
  }, []);

  if (categories.length === 0) {
    return <div>カテゴリが見つかりません</div>;
  }

  return (
    <nav>
      {categories.map((category) => (
        <CategoryItem key={category.id} category={category} />
      ))}
    </nav>
  );
}
```

### 4. アクセシビリティの考慮

```typescript
function AccessibleNavigation() {
  const categories = useMemo(() => getCategoriesForSidebar(), []);

  return (
    <nav role="navigation" aria-label="カテゴリメニュー">
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <a
              href={category.href}
              aria-label={`${category.name}カテゴリに移動`}
            >
              <CategoryIcon iconName={category.icon} aria-hidden="true" />
              <span>{category.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

## パフォーマンス考慮事項

### 1. データサイズ

- **カテゴリ数**: 最大 100 カテゴリ
- **サブカテゴリ数**: 最大 1000 サブカテゴリ
- **メモリ使用量**: 約 1MB 以下

### 2. 実行時間

- **基本取得**: 1ms 以下
- **ソート処理**: 5ms 以下
- **変換処理**: 2ms 以下

### 3. 最適化のヒント

```typescript
// 大量のカテゴリがある場合の最適化
function OptimizedLargeNavigation() {
  const categories = useMemo(() => {
    const allCategories = getCategoriesForSidebar();
    // 表示するカテゴリ数を制限
    return allCategories.slice(0, 20);
  }, []);

  return (
    <nav>
      {categories.map((category) => (
        <CategoryItem key={category.id} category={category} />
      ))}
    </nav>
  );
}
```

## トラブルシューティング

### よくある問題

#### 1. カテゴリが表示されない

```typescript
// デバッグ用のログを追加
const categories = useMemo(() => {
  const result = getCategoriesForSidebar();
  console.log("取得したカテゴリ数:", result.length);
  console.log("カテゴリ一覧:", result);
  return result;
}, []);
```

#### 2. パフォーマンスの問題

```typescript
// 不要な再計算を避ける
const categories = useMemo(() => getCategoriesForSidebar(), []); // 依存配列を空に

// 条件付きでメモ化
const filteredCategories = useMemo(() => {
  return categories.filter((cat) => cat.active);
}, [categories]); // 依存配列にcategoriesを指定
```

#### 3. 型エラーの解決

```typescript
// 型を明示的に指定
const categories: SidebarCategoryItem[] = getCategoriesForSidebar();

// 型アサーションを使用（非推奨）
const categories = getCategoriesForSidebar() as SidebarCategoryItem[];
```

## 関連ドキュメント

- [CategoryService API 仕様](../specifications/api-specification.md)
- [データ構造仕様](../specifications/data-structure.md)
- [Sidebar リファクタリング](../../components/sidebar-refactoring.md)
