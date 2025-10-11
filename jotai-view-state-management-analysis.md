# ViewSwitchButtonsのJotai状態管理分析

## 現在の実装

### コンポーネント構造
`src/components/subcategories/ViewSwitchButtons.tsx`は、ランキング表示とダッシュボード表示を切り替えるボタンコンポーネントです。

```tsx
interface ViewSwitchButtonsProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentView: "dashboard" | "ranking";
  areaCode?: string;
}
```

### 現在の実装方式
- **URL駆動型**: Next.jsのルーティング機能を使用
- **状態管理**: propsとして`currentView`を受け取る
- **ナビゲーション**: Next.jsの`Link`コンポーネントでURL遷移
- **真実の源**: URLが状態の唯一の真実の源（Single Source of Truth）

### ルーティング構造
- ランキング: `/{category.id}/{subcategory.id}/ranking`
- ダッシュボード: `/{category.id}/{subcategory.id}/dashboard/{areaCode}`

---

## Jotaiでの状態管理の可能性

### 結論
**可能ですが、現在の実装ではメリットが限定的です。**

プロジェクトには既にjotai v2.13.1がインストールされていますが、現時点では使用されていません。

---

## メリットとデメリット

### Jotaiを使うメリット

#### 1. グローバル状態管理
```tsx
// 複数のコンポーネントから同じ状態にアクセス可能
const [currentView, setCurrentView] = useAtom(viewAtom);
```

#### 2. コンポーネント間での状態共有
- ヘッダー、サイドバー、メインコンテンツで同じ状態を参照
- propsのバケツリレーを回避

#### 3. URLに依存しない柔軟な状態管理
- 同じページ内でビューを切り替える（URLを変更せずに）
- アニメーション遷移などの実装が容易

#### 4. 最小限の再レンダリング
- Jotaiは原子的な状態管理を提供
- 必要なコンポーネントのみが再レンダリング

#### 5. TypeScript完全サポート
- 型安全な状態管理
- 開発体験の向上

### Jotaiを使うデメリット

#### 1. URLと状態の同期が必要
```tsx
// URLの変更を監視して状態を更新する必要がある
useEffect(() => {
  setCurrentView(pathname.includes('/ranking') ? 'ranking' : 'dashboard');
}, [pathname]);
```

#### 2. ブラウザの戻る/進むボタンへの対応
- 追加の実装が必要
- 状態とURLの整合性を保つ必要がある

#### 3. 直接URLアクセス時の状態初期化
- リロードやブックマークからのアクセスに対応
- サーバーサイドとクライアントサイドの状態を同期

#### 4. SEO/SSRの考慮
- Next.js App RouterではServer Componentsがデフォルト
- Jotaiは`'use client'`が必要（Client Componentのみ）
- SEO的にはURL駆動の方が有利

#### 5. 実装の複雑さ
- 既存のシンプルな実装に比べて複雑化
- メンテナンスコストの増加

---

## 現在の実装を推奨する理由

### 1. Next.jsのベストプラクティスに準拠
- App RouterはURL駆動のナビゲーションが標準
- Server Componentsとの親和性

### 2. SEO最適化
- URLベースなのでクローラーが理解しやすい
- 各ビューが独立したURLを持つ

### 3. ブラウザの標準機能を活用
- 戻る/進むボタンが自然に動作
- ブックマーク、共有が容易

### 4. シンプルで保守性が高い
- 状態同期の複雑さがない
- バグの発生リスクが低い

---

## Jotaiを使うべきケース

以下の要件がある場合は、Jotaiの導入を検討する価値があります：

### 1. 同一ページ内でのビュー切り替え
URLを変更せずに、コンテンツだけを切り替える必要がある場合

```tsx
// URLは変わらず、表示内容のみが変わる
const [view, setView] = useAtom(viewAtom);
```

### 2. 複雑な状態管理が必要
ビューの状態以外にも、フィルター、ソート、ページネーションなど複数の状態を管理する必要がある場合

```tsx
const [view, setView] = useAtom(viewAtom);
const [filters, setFilters] = useAtom(filtersAtom);
const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);
```

### 3. リアルタイム更新
WebSocketやAPIポーリングでリアルタイムにデータを更新する必要がある場合

### 4. 複数コンポーネント間での状態共有
多数のコンポーネントが同じ状態を参照・更新する必要がある場合

---

## Jotaiでの実装手順

### ステップ1: Atomの定義

```tsx
// src/store/viewAtom.ts
import { atom } from 'jotai';
import { atomWithHash } from 'jotai-location';

// 基本的なAtom
export const viewAtom = atom<'dashboard' | 'ranking'>('ranking');

// URLハッシュと同期するAtom（オプション）
export const viewWithHashAtom = atomWithHash<'dashboard' | 'ranking'>(
  'view',
  'ranking'
);
```

### ステップ2: Providerの設定（オプション）

App Router環境では、通常Providerは不要ですが、必要に応じて設定できます。

```tsx
// src/app/layout.tsx
'use client';

import { Provider } from 'jotai';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
```

### ステップ3: ViewSwitchButtonsの改修

```tsx
// src/components/subcategories/ViewSwitchButtons.tsx
'use client';

import React from "react";
import { useAtom } from "jotai";
import { useRouter, usePathname } from "next/navigation";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { viewAtom } from "@/store/viewAtom";

interface ViewSwitchButtonsProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode?: string;
}

export const ViewSwitchButtons: React.FC<ViewSwitchButtonsProps> = ({
  category,
  subcategory,
  areaCode = "00000",
}) => {
  const [currentView, setCurrentView] = useAtom(viewAtom);
  const router = useRouter();
  const pathname = usePathname();

  // URLとの同期（初回レンダリング時）
  React.useEffect(() => {
    const view = pathname.includes('/ranking') ? 'ranking' : 'dashboard';
    setCurrentView(view);
  }, [pathname, setCurrentView]);

  const handleViewChange = (view: 'dashboard' | 'ranking') => {
    setCurrentView(view);

    // URLも更新（オプション）
    const href = view === 'ranking'
      ? `/${category.id}/${subcategory.id}/ranking`
      : `/${category.id}/${subcategory.id}/dashboard/${areaCode}`;

    router.push(href);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <button
        onClick={() => handleViewChange('ranking')}
        className={`
          inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border transition-colors
          ${
            currentView === "ranking"
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:border-neutral-500"
          }
        `}
        aria-current={currentView === "ranking" ? "page" : undefined}
      >
        ランキング
      </button>
      <button
        onClick={() => handleViewChange('dashboard')}
        className={`
          inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border transition-colors
          ${
            currentView === "dashboard"
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:border-neutral-500"
          }
        `}
        aria-current={currentView === "dashboard" ? "page" : undefined}
      >
        ダッシュボード
      </button>
    </div>
  );
};
```

### ステップ4: 他のコンポーネントでの利用

```tsx
// src/components/example/AnotherComponent.tsx
'use client';

import { useAtomValue } from 'jotai';
import { viewAtom } from '@/store/viewAtom';

export const AnotherComponent = () => {
  const currentView = useAtomValue(viewAtom);

  return (
    <div>
      現在のビュー: {currentView === 'ranking' ? 'ランキング' : 'ダッシュボード'}
    </div>
  );
};
```

---

## 代替案: URLハッシュとの同期

URLを変更せずにビューを切り替えたい場合、URLハッシュとの同期が有効です。

### 実装例

```tsx
// src/store/viewAtom.ts
import { atomWithHash } from 'jotai-location';

export const viewAtom = atomWithHash<'dashboard' | 'ranking'>(
  'view',
  'ranking',
  {
    replaceState: true, // 履歴を残さない
  }
);
```

この場合、URLは以下のようになります：
- `/{category.id}/{subcategory.id}#view=ranking`
- `/{category.id}/{subcategory.id}#view=dashboard`

---

## パフォーマンスの考慮

### 現在のURL駆動型
- ページ遷移ごとに新しいページをレンダリング
- Server Componentsを活用可能
- 初期ロードは遅いが、キャッシュが効く

### Jotai + クライアント側レンダリング
- ページ遷移なしでビューを切り替え
- アニメーションが滑らか
- すべてClient Componentsになるため、初期バンドルサイズが増加

---

## 推奨事項

### 現在の実装を維持すべき場合
- URL駆動のナビゲーションで問題ない
- SEOが重要
- シンプルな実装を維持したい
- ブラウザの標準機能を活用したい

### Jotaiを導入すべき場合
- 同一ページ内でビューを切り替えたい
- 複数の状態を管理する必要がある
- リアルタイム更新が必要
- 複雑なフィルタリング/ソート機能を実装する

---

## まとめ

**Jotaiでの状態管理は技術的に可能ですが、現在のURL駆動型の実装の方が適しています。**

理由：
1. Next.js App Routerのベストプラクティスに準拠
2. SEO最適化
3. ブラウザの標準機能を活用
4. シンプルで保守性が高い

ただし、以下のような要件が出てきた場合は、Jotaiの導入を検討する価値があります：
- ビュー以外の複雑な状態管理（フィルター、ソート、ページネーション等）
- リアルタイム更新
- 同一ページ内でのビュー切り替え
- 多数のコンポーネント間での状態共有

---

## 参考リンク

- [Jotai公式ドキュメント](https://jotai.org/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [atomWithHash](https://jotai.org/docs/utilities/location)
