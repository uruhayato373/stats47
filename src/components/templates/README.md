# Templates（テンプレート）

Organismsを配置してページレイアウトを作成するテンプレートです。

## 概要

Templatesは、Organismsを配置してページのレイアウト構造を定義します。これらは特定のページタイプやレイアウトパターンを提供します。

## 含まれるべきコンポーネント

- **ダッシュボードレイアウト** (`DashboardLayout.tsx`) - Header + Sidebar + Main + Footer
- **フォームレイアウト** (`FormLayout.tsx`) - Header + Form + Actions + Footer
- **リストレイアウト** (`ListLayout.tsx`) - Header + Filters + Table + Pagination
- **詳細レイアウト** (`DetailLayout.tsx`) - Header + Breadcrumb + Content + Actions
- **認証レイアウト** (`AuthLayout.tsx`) - Logo + Form + Links

## 命名規則

- ファイル名: `PascalCase.tsx` (例: `DashboardLayout.tsx`)
- コンポーネント名: `PascalCase` (例: `DashboardLayout`)
- フォルダ名: `kebab-case` (例: `dashboard-layout/`)

## 実装例

```typescript
// DashboardLayout.tsx
import { Header } from '../organisms/Header';
import { Sidebar } from '../organisms/Sidebar';
import { Footer } from '../organisms/Footer';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems?: SidebarItem[];
}

export function DashboardLayout({ children, sidebarItems }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar items={sidebarItems} />
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
```

## 原則

1. **レイアウト**: ページの構造とレイアウトを定義
2. **配置**: Organismsの適切な配置
3. **一貫性**: 同様のページタイプで一貫したレイアウト
4. **柔軟性**: 異なるコンテンツに対応可能
