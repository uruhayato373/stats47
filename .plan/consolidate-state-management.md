# 状態管理の統一：Jotai への一本化

## 概要

`src/contexts`と`src/atoms`で状態管理が混在している問題を解決します。現在 Jotai が実際に使用されており、React Context API の ThemeProvider はコメントアウトされているため、未使用の Context API コードを削除して Jotai に統一します。

## 現状分析

### 状態管理の混在状況

#### 使用中: Jotai (`src/atoms/`)

- **テーマ管理**: `src/atoms/theme.ts`

  - `themeAtom`, `effectiveThemeAtom`, `toggleThemeAtom` などを定義
  - `src/hooks/useTheme.ts` で使用
  - `src/components/common/ThemeToggleButton.tsx` で使用
  - `src/providers/JotaiProvider.tsx` で初期化

- **コロプレス地図**: `src/atoms/choropleth.ts`
  - カテゴリ選択、サブカテゴリ選択、年度選択などの状態管理
  - 地図可視化設定の管理

#### 未使用: React Context API (`src/contexts/`)

- **ThemeContext**: `src/contexts/ThemeContext.tsx`
  - `src/app/layout.tsx` でコメントアウト済み
  - 実際には使われていない

### 現在の実装状況

```typescript
// src/app/layout.tsx (line 9)
// import { ThemeProvider } from "@/contexts/ThemeContext"; // 無効化: Jotai版テーマシステムに統一
```

**結論**: すでに Jotai に移行済みで、Context API は未使用

## 削除対象

### 1. 未使用のファイル

```
src/contexts/
└── ThemeContext.tsx  # 削除対象：完全に未使用
```

### 2. 未使用のディレクトリ

```
src/contexts/  # ThemeContext.tsx削除後、ディレクトリも削除
```

## 統一後の状態管理構造

### Jotai (`src/atoms/`)

```
src/atoms/
├── theme.ts           # テーマ管理（既存）
└── choropleth.ts      # コロプレス地図状態（既存）
```

### 使用パターン

**テーマ管理**:

```typescript
// src/hooks/useTheme.ts
import { useAtom, useSetAtom } from "jotai";
import {
  effectiveThemeAtom,
  mountedAtom,
  toggleThemeAtom,
} from "@/atoms/theme";

export function useTheme() {
  const [theme] = useAtom(effectiveThemeAtom);
  const [mounted] = useAtom(mountedAtom);
  const toggleTheme = useSetAtom(toggleThemeAtom);
  return { theme, mounted, toggleTheme };
}
```

**プロバイダー**:

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
```

## 実装手順

### Phase 1: 未使用コードの削除（5 分）

1. **ThemeContext.tsx の削除**:

   ```bash
   rm src/contexts/ThemeContext.tsx
   ```

2. **contexts ディレクトリの削除**:

   ```bash
   rmdir src/contexts
   ```

3. **コメントアウトされた import の削除**:
   - `src/app/layout.tsx` からコメントアウトされた行を削除

### Phase 2: 確認とテスト（5 分）

1. **参照箇所の確認**:

   ```bash
   grep -r "ThemeContext" src/
   grep -r "contexts/" src/
   ```

2. **ビルド確認**:

   ```bash
   npm run build
   ```

3. **動作確認**:
   - テーマ切り替え機能が正常に動作するか
   - コロプレス地図の状態管理が正常に動作するか

## 統一後のメリット

### 1. コードの簡潔性

- 状態管理ライブラリが 1 つに統一
- 学習コストの削減
- メンテナンスの容易性向上

### 2. パフォーマンス

- Jotai は軽量で高速
- 不要な再レンダリングを最小化
- Atomic 設計による細粒度の状態管理

### 3. 開発体験

- 一貫した API
- TypeScript 型推論の向上
- デバッグの容易性

## Jotai の利点

### vs React Context API

| 特徴               | Jotai                       | Context API                        |
| ------------------ | --------------------------- | ---------------------------------- |
| **バンドルサイズ** | 小（~2.9KB）                | 大（React 本体）                   |
| **学習曲線**       | 緩やか                      | 中程度                             |
| **パフォーマンス** | 高（Atomic 更新）           | 低（Context 全体が再レンダリング） |
| **型安全性**       | 優れている                  | 要型定義                           |
| **デバッグ**       | 容易（Redux DevTools 対応） | 難しい                             |
| **コード量**       | 少ない                      | 多い（Provider, Context, Hook）    |

### 現在の活用状況

```typescript
// src/atoms/theme.ts
export const themeAtom = atomWithStorage<Theme>("theme", "light");
export const effectiveThemeAtom = atom(/* 派生値 */);
export const toggleThemeAtom = atom(/* 書き込み専用 */);

// src/atoms/choropleth.ts
export const selectedCategoryAtom = atom<string | null>(null);
export const selectedSubcategoryAtom = atom<string | null>(null);
export const selectedYearAtom = atom<string | null>(null);
```

## リスク管理

### 低リスク

- ThemeContext は既にコメントアウト済み
- Jotai 実装が既に完全稼働中
- 削除するのは未使用コードのみ

### ロールバック計画

- Git 履歴から簡単に復元可能
- 破壊的変更なし

## 検証項目

### 削除前

- [ ] ThemeContext が本当に未使用か確認
- [ ] layout.tsx でコメントアウトされているか確認
- [ ] 他の参照箇所がないか確認

### 削除後

- [ ] ビルドエラーがないか確認
- [ ] テーマ切り替えが動作するか確認
- [ ] コロプレス地図が動作するか確認
- [ ] localStorage 連携が動作するか確認

## 今後の方針

### Jotai の活用範囲拡大

将来的に以下の状態管理も Jotai で統一を検討:

1. **フォーム状態管理**
2. **モーダル状態管理**
3. **ローディング状態管理**
4. **エラー状態管理**

### ベストプラクティス

```typescript
// ✅ Good: Atomを小さく保つ
export const userNameAtom = atom<string>("");
export const userEmailAtom = atom<string>("");

// ❌ Bad: 大きなオブジェクトをatomに
export const userAtom = atom<User>({ name: "", email: "", ... });

// ✅ Good: 派生値を使う
export const fullNameAtom = atom((get) => {
  const firstName = get(firstNameAtom);
  const lastName = get(lastNameAtom);
  return `${firstName} ${lastName}`;
});

// ✅ Good: 書き込み専用atomでアクション定義
export const submitFormAtom = atom(null, async (get, set) => {
  const name = get(userNameAtom);
  const email = get(userEmailAtom);
  await submitAPI({ name, email });
});
```

## 参考資料

- [Jotai Documentation](https://jotai.org/)
- [Jotai vs React Context](https://jotai.org/docs/basics/comparison)
- [Jotai Best Practices](https://jotai.org/docs/guides/best-practices)

---

**作成日**: 2025-10-16  
**優先度**: 中  
**所要時間**: 10 分
