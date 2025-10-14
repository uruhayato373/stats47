# コーディング規約

## 概要

このドキュメントは、stats47プロジェクトにおけるコーディング規約と開発環境のセットアップガイドです。一貫性のあるコード品質を維持し、チーム開発を効率化することを目的としています。

## 1. 開発環境セットアップ

### 1.1 必要なパッケージ

プロジェクトの開発に必要なパッケージをインストールします：

```bash
npm install @supabase/supabase-js
npm install react-hook-form
npm install @tailwindcss/typography
npm install lucide-react
npm install next-seo
```

### 1.2 環境変数設定

プロジェクトのルートディレクトリに`.env.local`ファイルを作成し、以下の環境変数を設定します：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 1.3 開発サーバーの起動

```bash
npm run dev
```

開発サーバーは`http://localhost:3000`で起動します。

## 2. TypeScript規約

### 2.1 型定義

- すべてのコンポーネントに適切な型定義を追加
- `any`型の使用を避け、具体的な型を定義
- インターフェースとタイプエイリアスを適切に使い分け

```typescript
// ✅ 推奨
interface UserProps {
  id: string;
  name: string;
  email: string;
}

// ❌ 避ける
const user: any = { ... };
```

### 2.2 関数の型定義

```typescript
// ✅ 推奨
const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
  // 処理
};

// ✅ 推奨（非同期関数）
const fetchUser = async (id: string): Promise<User | null> => {
  // 処理
};
```

## 3. React/Next.js規約

### 3.1 コンポーネント定義

```typescript
// ✅ 推奨（関数コンポーネント）
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded ${
        variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### 3.2 カスタムフック

```typescript
// ✅ 推奨（カスタムフック）
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### 3.3 Next.js App Router規約

```typescript
// ✅ 推奨（ページコンポーネント）
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ページタイトル',
  description: 'ページの説明',
};

export default function Page() {
  return (
    <div>
      {/* コンテンツ */}
    </div>
  );
}
```

## 4. Tailwind CSS規約

### 4.1 クラス名の順序

```typescript
// ✅ 推奨（レイアウト → サイズ → 色 → その他）
<div className="flex items-center justify-between w-full h-12 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
```

### 4.2 カスタムクラスの定義

```css
/* globals.css */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500;
  }
  
  .card-base {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
  }
}
```

### 4.3 レスポンシブデザイン

```typescript
// ✅ 推奨（モバイルファースト）
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* コンテンツ */}
</div>
```

## 5. ファイル・ディレクトリ規約

### 5.1 ファイル命名

```
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── index.ts
├── Header/
│   ├── Header.tsx
│   └── index.ts
└── index.ts
```

### 5.2 インポート順序

```typescript
// ✅ 推奨（外部ライブラリ → 内部モジュール → 相対パス）
import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

import { Button } from '@/components/Button';
import { Header } from '@/components/Header';

import styles from './Page.module.css';
```

## 6. エラーハンドリング

### 6.1 エラーバウンダリ

```typescript
// ✅ 推奨（エラーバウンダリ）
'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800">エラーが発生しました</h2>
          <p className="text-red-600">ページを再読み込みしてください。</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 6.2 API エラーハンドリング

```typescript
// ✅ 推奨（API エラーハンドリング）
export async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}
```

## 7. テスト規約

### 7.1 ユニットテスト

```typescript
// ✅ 推奨（Jest + Testing Library）
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 7.2 E2Eテスト

```typescript
// ✅ 推奨（Playwright）
import { test, expect } from '@playwright/test';

test('user can navigate to blog page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=ブログ');
  await expect(page).toHaveURL('/blog');
});
```

## 8. パフォーマンス規約

### 8.1 メモ化

```typescript
// ✅ 推奨（useMemo, useCallback）
import { useMemo, useCallback } from 'react';

export default function ExpensiveComponent({ items }: { items: Item[] }) {
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);

  const handleClick = useCallback((id: string) => {
    // 処理
  }, []);

  return (
    <div>
      <p>Total: {expensiveValue}</p>
      <button onClick={() => handleClick('1')}>Click</button>
    </div>
  );
}
```

### 8.2 遅延読み込み

```typescript
// ✅ 推奨（動的インポート）
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});

export default function Page() {
  return (
    <div>
      <HeavyComponent />
    </div>
  );
}
```

## 9. セキュリティ規約

### 9.1 XSS対策

```typescript
// ✅ 推奨（dangerouslySetInnerHTMLの適切な使用）
export default function SafeHTML({ content }: { content: string }) {
  // サニタイズされたHTMLのみ使用
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />;
}
```

### 9.2 CSRF対策

```typescript
// ✅ 推奨（CSRFトークンの使用）
export async function submitForm(data: FormData) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken || '',
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
}
```

## 10. アクセシビリティ規約

### 10.1 ARIA属性

```typescript
// ✅ 推奨（適切なARIA属性）
export default function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg p-6">
        <h2 id="modal-title">モーダルタイトル</h2>
        {children}
        <button
          onClick={onClose}
          aria-label="モーダルを閉じる"
        >
          ×
        </button>
      </div>
    </div>
  );
}
```

### 10.2 キーボードナビゲーション

```typescript
// ✅ 推奨（キーボードイベントの処理）
export default function InteractiveComponent() {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // 処理
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      インタラクティブな要素
    </div>
  );
}
```

## 11. Git規約

### 11.1 コミットメッセージ

```
feat: 新機能の追加
fix: バグ修正
docs: ドキュメントの更新
style: コードスタイルの変更
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスやツールの変更
```

### 11.2 ブランチ命名

```
feature/user-authentication
bugfix/login-error
hotfix/security-patch
refactor/component-structure
```

## 12. コードレビュー規約

### 12.1 レビューチェックリスト

- [ ] 型定義が適切に設定されているか
- [ ] エラーハンドリングが実装されているか
- [ ] アクセシビリティが考慮されているか
- [ ] パフォーマンスに問題がないか
- [ ] テストが適切に書かれているか
- [ ] セキュリティに問題がないか
- [ ] コメントが適切に書かれているか

### 12.2 レビューコメント

```typescript
// ✅ 推奨（建設的なコメント）
// この関数は複雑になりすぎているので、小さな関数に分割することを検討してください
// また、エラーハンドリングを追加することをお勧めします

// ❌ 避ける（非建設的なコメント）
// これは良くない
```

## まとめ

このコーディング規約に従うことで、以下の効果が期待できます：

1. **コードの一貫性**: チーム全体で統一されたコードスタイル
2. **保守性の向上**: 読みやすく、理解しやすいコード
3. **バグの削減**: 型安全性とエラーハンドリングの徹底
4. **パフォーマンスの向上**: 最適化されたコードパターン
5. **セキュリティの強化**: セキュリティベストプラクティスの適用

## 関連ドキュメント

- [コンポーネントガイド](./02_コンポーネントガイド.md)
- [スタイリングガイド](./03_スタイリングガイド.md)
- [テストガイド](./04_テストガイド.md)
- [SEOガイド](./05_SEOガイド.md)

---

**作成日**: 2024年10月14日  
**最終更新日**: 2024年10月14日  
**バージョン**: 1.0
