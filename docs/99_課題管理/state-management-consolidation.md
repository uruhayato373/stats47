---
title: 状態管理の統一：Jotai への一本化
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/architecture
  - refactoring
  - state-management
  - jotai
---

# 状態管理の統一：Jotai への一本化

## 概要

`src/contexts`と`src/atoms`で状態管理が混在している問題を解決しました。現在 Jotai が実際に使用されており、React Context API の ThemeProvider はコメントアウトされていたため、未使用の Context API コードを削除して Jotai に統一しました。

## 実装完了状況

### ✅ 完了した作業

1. **未使用ファイルの削除**:

   - `src/contexts/ThemeContext.tsx` を削除
   - `src/contexts/` ディレクトリを削除

2. **コメントアウトされた import の削除**:

   - `src/app/layout.tsx` からコメントアウトされた行を削除

3. **参照箇所の確認**:
   - ThemeContext への参照: なし
   - contexts/ への参照: なし

## 統一後の状態管理構造

### Jotai (`src/atoms/`)

```
src/atoms/
├── theme.ts           # テーマ管理
└── choropleth.ts      # コロプレス地図状態管理
```

### 使用パターン

#### テーマ管理

```typescript
// src/atoms/theme.ts
export const themeAtom = atomWithStorage<Theme>("theme", "light");
export const effectiveThemeAtom = atom(/* 派生値 */);
export const toggleThemeAtom = atom(/* 書き込み専用 */);

// src/hooks/useTheme.ts
import { useAtom, useSetAtom } from "jotai";
import {
  effectiveThemeAtom,
  mountedAtom,
  toggleThemeAtom,
} from "@/store/theme";

export function useTheme() {
  const [theme] = useAtom(effectiveThemeAtom);
  const [mounted] = useAtom(mountedAtom);
  const toggleTheme = useSetAtom(toggleThemeAtom);
  return { theme, mounted, toggleTheme };
}
```

#### コロプレス地図状態管理

```typescript
// src/atoms/choropleth.ts
export const selectedCategoryAtom = atom<string | null>(null);
export const selectedSubcategoryAtom = atom<string | null>(null);
export const selectedYearAtom = atom<string | null>(null);
export const mapVisualizationSettingsAtom = atom<MapVisualizationSettings>({
  colorScheme: "interpolateBlues",
  divergingMidpoint: "zero",
  showLegend: true,
  showTooltip: true,
});
```

#### プロバイダー設定

```typescript
// src/providers/JotaiProvider.tsx
import { Provider } from "jotai";

export function JotaiProvider({ children }: JotaiProviderProps) {
  return (
    <Provider>
      <SWRConfig>
        <ThemeInitializer />
        {children}
      </SWRConfig>
    </Provider>
  );
}

// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="relative min-h-full">
      <body
        className={`${inter.variable} font-sans bg-gray-100 dark:bg-neutral-900 antialiased`}
      >
        <JotaiProvider>
          <ThemeInitializer />
          <Header />
          <Sidebar />
          <main className="lg:ps-60 pt-16">{children}</main>
        </JotaiProvider>
      </body>
    </html>
  );
}
```

## 統一後のメリット

### 1. コードの簡潔性

- 状態管理ライブラリが 1 つに統一
- 学習コストの削減
- メンテナンスの容易性向上

### 2. パフォーマンス

- Jotai は軽量で高速（~2.9KB）
- 不要な再レンダリングを最小化
- Atomic 設計による細粒度の状態管理

### 3. 開発体験

- 一貫した API
- TypeScript 型推論の向上
- デバッグの容易性（Redux DevTools 対応）

## Jotai vs React Context API 比較

| 特徴               | Jotai                       | Context API                        |
| ------------------ | --------------------------- | ---------------------------------- |
| **バンドルサイズ** | 小（~2.9KB）                | 大（React 本体）                   |
| **学習曲線**       | 緩やか                      | 中程度                             |
| **パフォーマンス** | 高（Atomic 更新）           | 低（Context 全体が再レンダリング） |
| **型安全性**       | 優れている                  | 要型定義                           |
| **デバッグ**       | 容易（Redux DevTools 対応） | 難しい                             |
| **コード量**       | 少ない                      | 多い（Provider, Context, Hook）    |

## 現在の活用状況

### テーマ管理

- **localStorage 連携**: `atomWithStorage` で永続化
- **システム設定対応**: ユーザー設定がない場合は OS 設定を使用
- **SSR 対応**: マウント状態管理でハイドレーション対応
- **DOM 適用**: テーマ変更時に自動で CSS クラスを適用

### コロプレス地図

- **階層状態管理**: カテゴリ → サブカテゴリ → 年度の選択状態
- **派生状態**: 選択されたカテゴリに基づくサブカテゴリ一覧
- **可視化設定**: 色スキーム、凡例表示などの設定管理
- **アクション**: 選択状態のリセット、一括更新

## 今後の方針

### Jotai の活用範囲拡大

将来的に以下の状態管理も Jotai で統一を検討:

1. **フォーム状態管理**

   - バリデーション状態
   - 送信状態
   - エラー状態

2. **モーダル状態管理**

   - 開閉状態
   - モーダル種別
   - データ連携

3. **ローディング状態管理**

   - グローバルローディング
   - コンポーネント別ローディング
   - プログレス表示

4. **エラー状態管理**
   - グローバルエラー
   - コンポーネント別エラー
   - エラーレポート

### ベストプラクティス

```typescript
// ✅ Good: Atom を小さく保つ
export const userNameAtom = atom<string>("");
export const userEmailAtom = atom<string>("");

// ❌ Bad: 大きなオブジェクトを atom に
export const userAtom = atom<User>({ name: "", email: "", ... });

// ✅ Good: 派生値を使う
export const fullNameAtom = atom((get) => {
  const firstName = get(firstNameAtom);
  const lastName = get(lastNameAtom);
  return `${firstName} ${lastName}`;
});

// ✅ Good: 書き込み専用 atom でアクション定義
export const submitFormAtom = atom(null, async (get, set) => {
  const name = get(userNameAtom);
  const email = get(userEmailAtom);
  await submitAPI({ name, email });
});

// ✅ Good: 非同期処理の状態管理
export const dataAtom = atom(async () => {
  const response = await fetch("/api/data");
  return response.json();
});

// ✅ Good: エラーハンドリング
export const dataWithErrorAtom = atom(
  async () => {
    try {
      const response = await fetch("/api/data");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    } catch (error) {
      throw error;
    }
  }
);
```

## パフォーマンス最適化

### 1. Atom の分割

```typescript
// ❌ Bad: 大きな atom
const userAtom = atom({
  name: "",
  email: "",
  preferences: { theme: "light", language: "ja" },
  settings: { notifications: true, privacy: "public" },
});

// ✅ Good: 細かく分割
const userNameAtom = atom("");
const userEmailAtom = atom("");
const userThemeAtom = atom("light");
const userLanguageAtom = atom("ja");
const notificationsAtom = atom(true);
const privacyAtom = atom("public");
```

### 2. 不要な再レンダリングの防止

```typescript
// ✅ Good: 必要な部分のみ購読
function UserName() {
  const [name] = useAtom(userNameAtom); // 名前のみ購読
  return <span>{name}</span>;
}

function UserEmail() {
  const [email] = useAtom(userEmailAtom); // メールのみ購読
  return <span>{email}</span>;
}
```

### 3. メモ化の活用

```typescript
// ✅ Good: 重い計算をメモ化
const expensiveValueAtom = atom((get) => {
  const data = get(dataAtom);
  return expensiveCalculation(data);
});

// ✅ Good: 条件付き計算
const filteredDataAtom = atom((get) => {
  const data = get(dataAtom);
  const filter = get(filterAtom);
  return filter ? data.filter((item) => item.category === filter) : data;
});
```

## デバッグと開発者体験

### 1. Redux DevTools 連携

```typescript
// src/providers/JotaiProvider.tsx
import { Provider } from "jotai";
import { useAtomDevtools } from "jotai/devtools";

function DevTools() {
  useAtomDevtools(themeAtom, "theme");
  useAtomDevtools(selectedCategoryAtom, "selectedCategory");
  return null;
}

export function JotaiProvider({ children }: JotaiProviderProps) {
  return (
    <Provider>
      {process.env.NODE_ENV === "development" && <DevTools />}
      {children}
    </Provider>
  );
}
```

### 2. ログとトレーシング

```typescript
// デバッグ用の atom
const debugAtom = atom((get) => {
  const theme = get(themeAtom);
  const category = get(selectedCategoryAtom);
  console.log("State update:", { theme, category });
  return { theme, category };
});
```

## テスト戦略

### 1. Atom の単体テスト

```typescript
// src/atoms/__tests__/theme.test.ts
import { createStore } from "jotai";
import { themeAtom, toggleThemeAtom } from "../theme";

describe("theme atoms", () => {
  it("should toggle theme", () => {
    const store = createStore();
    store.set(themeAtom, "light");

    store.set(toggleThemeAtom, null);
    expect(store.get(themeAtom)).toBe("dark");
  });
});
```

### 2. コンポーネントテスト

```typescript
// src/components/__tests__/ThemeToggle.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "jotai";
import { ThemeToggleButton } from "../ThemeToggleButton";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider>{children}</Provider>
);

test("should toggle theme when clicked", () => {
  render(
    <TestWrapper>
      <ThemeToggleButton />
    </TestWrapper>
  );

  const button = screen.getByRole("button");
  fireEvent.click(button);

  // テーマが切り替わったことを確認
});
```

## 移行ガイド

### 既存の Context API から Jotai への移行

1. **Context の削除**:

   ```typescript
   // ❌ 削除
   const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
   export const ThemeProvider = ({ children }) => {
     /* ... */
   };
   ```

2. **Atom の作成**:

   ```typescript
   // ✅ 作成
   export const themeAtom = atomWithStorage<Theme>("theme", "light");
   export const toggleThemeAtom = atom(null, (get, set) => {
     const current = get(themeAtom);
     set(themeAtom, current === "light" ? "dark" : "light");
   });
   ```

3. **Hook の更新**:

   ```typescript
   // ❌ 旧
   const { theme, toggleTheme } = useContext(ThemeContext);

   // ✅ 新
   const [theme] = useAtom(themeAtom);
   const toggleTheme = useSetAtom(toggleThemeAtom);
   ```

## 参考資料

- [Jotai Documentation](https://jotai.org/)
- [Jotai vs React Context](https://jotai.org/docs/basics/comparison)
- [Jotai Best Practices](https://jotai.org/docs/guides/best-practices)
- [Jotai DevTools](https://jotai.org/docs/tools/devtools)

---

**実装完了日**: 2025-10-16  
**実装者**: AI Assistant  
**ステータス**: 完了  
**影響範囲**: 状態管理システム全体
