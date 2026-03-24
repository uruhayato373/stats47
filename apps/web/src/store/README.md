# Store（状態管理）

## 概要

`store/`ディレクトリは、Zustandを使用したグローバルな状態管理ストアを配置する場所です。アプリケーション全体で共有される状態を管理します。

## 設計原則

### 状態管理のみに集中

ストアは**状態管理のみ**に責務を集中させます。以下のようなロジックは含めません：

- URL同期ロジック（フックで処理）
- データ変換ロジック（ユーティリティ関数で処理）
- ビジネスロジック（サービス層で処理）
- 副作用（useEffectなどはフックで処理）

### 責務の分離

| 責務 | 配置場所 | 例 |
|:-----|:---------|:---|
| 状態管理 | `store/` | `areaCode`, `pageType`, `isOpen` |
| URL同期 | `features/{domain}/hooks/` | `useAreaCode`, `usePageType` |
| データ変換 | `features/{domain}/utils/` | `extractAreaCodeFromPath` |
| ビジネスロジック | `features/{domain}/services/` | 複雑な計算処理 |

## 配置すべき判断基準

以下の条件を**すべて満たす**場合、`store/`に配置すべきです：

- [ ] アプリケーション全体で共有される状態である
- [ ] 複数のコンポーネントからアクセスされる
- [ ] 状態の読み取りと更新のみを提供する
- [ ] URL同期やデータ変換などのロジックを含まない
- [ ] ローカルストレージへの永続化が必要（オプション）

## 実装パターン

### 基本的なストア構造

```typescript
// store/example-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ExampleStore {
  // 状態
  value: string;
  // アクション（状態更新のみ）
  setValue: (value: string) => void;
  reset: () => void;
}

export const useExampleStore = create<ExampleStore>()(
  persist(
    (set) => ({
      value: "default",
      setValue: (value) => set({ value }),
      reset: () => set({ value: "default" }),
    }),
    {
      name: "example-storage",
    }
  )
);
```

### 正しいパターン：責務の分離

```typescript
// ✅ Good: ストアは状態管理のみ
// store/area-code-store.ts
interface AreaCodeStore {
  areaCode: string;
  setAreaCode: (code: string) => void;
}

// ✅ Good: URL同期はフックで処理
// @/features/area から useAreaCode をインポート
export function useAreaCode() {
  const pathname = usePathname();
  const setAreaCode = useAreaCodeStore((state) => state.setAreaCode);
  
  useEffect(() => {
    if (pathname) {
      const extractedAreaCode = extractAreaCodeFromPath(pathname);
      if (extractedAreaCode) {
        setAreaCode(extractedAreaCode);
      }
    }
  }, [pathname, setAreaCode]);
}
```

### 避けるべきパターン

```typescript
// ❌ Bad: ストアにURL同期ロジックを含める
interface AreaCodeStore {
  areaCode: string;
  setAreaCode: (code: string) => void;
  syncWithUrl: (pathname: string) => void; // 削除すべき
}

// ❌ Bad: ストアにデータ変換ロジックを含める
interface AreaCodeStore {
  areaCode: string;
  setAreaCode: (code: string) => void;
  extractAndSet: (pathname: string) => void; // 削除すべき
}
```

## 既存のストア

### area-code-store.ts

地域コードを管理するストア。URL同期は`@/features/area`の`useAreaCode`で処理されます。

```typescript
import { useAreaCode } from "@/features/area";
import { useAreaCodeStore } from "@/store/area-code-store";

function MyComponent() {
  useAreaCode(); // URL変更時にストアを自動更新
  const { areaCode } = useAreaCodeStore();
  // ...
}
```

### page-type-store.ts

ページタイプ（ranking、dashboard、blog）を管理するストア。URL同期は`@/hooks/usePageType`で処理されます。

```typescript
import { usePageType } from "@/hooks/usePageType";
import { usePageTypeStore } from "@/store/page-type-store";

function MyComponent() {
  usePageType(); // URL変更時にストアを自動更新
  const { pageType } = usePageTypeStore();
  // ...
}
```

### sidebar-store.ts

サイドバーの開閉状態を管理するストア。

## 永続化（Persist）

ローカルストレージへの永続化が必要な場合は、`persist`ミドルウェアを使用します：

```typescript
export const useExampleStore = create<ExampleStore>()(
  persist(
    (set) => ({
      // ストアの実装
    }),
    {
      name: "example-storage", // ローカルストレージのキー名
    }
  )
);
```

## 関連ディレクトリ

### 下位レイヤー: フック

URL同期などの副作用は、各ドメインの`hooks/`ディレクトリで処理します。

```
features/area/hooks/useAreaCode.ts
  → store/area-code-store.ts を使用
```

### 上位レイヤー: コンポーネント

コンポーネントからは、ストアとフックの両方を使用します。

```
components/organisms/Header/Header.tsx
  → useAreaCodeStore() で状態取得
  → useAreaCode() でURL同期
```

## 参考

- [Zustand公式ドキュメント](https://docs.pmnd.rs/zustand)
- [Next.js App RouterでのZustand使用](https://docs.pmnd.rs/zustand/guides/nextjs)
- [Organisms README](../components/organisms/README.md) - コンポーネントでの状態管理の使用例
