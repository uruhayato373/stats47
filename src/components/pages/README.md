# Pages（ページ）

特定のページで使用される、ページ固有のコンポーネントです。

## 概要

Pagesは、特定のページやルートで使用される、ページ固有のコンポーネントです。これらはTemplatesとOrganismsを組み合わせて、特定のページの機能を実装します。

## 含まれるべきコンポーネント

- **ホームページ** (`HomePage.tsx`) - Hero + Features + Categories
- **ダッシュボードページ** (`DashboardPage.tsx`) - CategoryList + Search + Stats
- **カテゴリ詳細ページ** (`CategoryDetailPage.tsx`) - CategoryInfo + Subcategories + Data
- **サブカテゴリページ** (`SubcategoryPage.tsx`) - Breadcrumb + Data + Charts
- **設定ページ** (`SettingsPage.tsx`) - Profile + Preferences + Security

## 命名規則

- ファイル名: `PascalCase.tsx` (例: `HomePage.tsx`)
- コンポーネント名: `PascalCase` (例: `HomePage`)
- フォルダ名: `kebab-case` (例: `home-page/`)

## 実装例

```typescript
// HomePage.tsx
import { Hero } from '../organisms/Hero';
import { Features } from '../organisms/Features';
import { Categories } from '../organisms/Categories';

export function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero 
        title="地域統計ダッシュボード"
        subtitle="e-Stat APIによる地域統計データの可視化"
        ctaText="ダッシュボードを見る"
        ctaLink="/dashboard"
      />
      
      <Features 
        features={[
          { title: "リアルタイムデータ", description: "最新の統計データ" },
          { title: "美しい可視化", description: "高品質なグラフ" },
          { title: "レスポンシブ対応", description: "全デバイス対応" }
        ]}
      />
      
      <Categories 
        title="主要統計カテゴリ"
        categories={categories}
      />
    </div>
  );
}
```

## 原則

1. **ページ固有**: 特定のページでのみ使用
2. **機能実装**: ページの主要機能を実装
3. **テンプレート使用**: TemplatesとOrganismsを適切に組み合わせ
4. **一貫性**: ページ間で一貫したユーザーエクスペリエンス
