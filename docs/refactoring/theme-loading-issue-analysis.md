# テーマローディング永続化エラー - 原因分析と対策

**作成日**: 2025-10-10
**関連ドキュメント**: `EstatRanking-server-component-migration.md`

---

## 🚨 問題の概要

サーバーコンポーネント化のリファクタリング後、「**テーマ状態が読み込めずローディング状態が永続する**」エラーが発生しています。

### 症状

- ThemeToggleButtonが永遠にローディングスピナーを表示
- `mounted`フラグが`false`のままで`true`にならない
- テーマの切り替えができない
- アプリケーション全体が正常に機能しない

---

## 🔍 根本原因の分析

### 原因1: ThemeInitializerの重複 ⚠️

**現状の問題**:

`src/app/layout.tsx`に**2つのThemeInitializer**が存在しています：

```tsx
// layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <JotaiProvider>
          <ThemeInitializer />  {/* ← 1つ目 */}
          {children}
        </JotaiProvider>
      </body>
    </html>
  );
}
```

```tsx
// src/providers/JotaiProvider.tsx
export function JotaiProvider({ children }: JotaiProviderProps) {
  return (
    <Provider>
      <ThemeInitializer />  {/* ← 2つ目（内部で定義されたもの） */}
      {children}
    </Provider>
  );
}
```

**問題点**:
1. 2つのThemeInitializerが同じ`initThemeAtom`を呼び出す
2. 競合状態（race condition）が発生
3. 一方が`mounted`を`true`にする前に、もう一方が再初期化する
4. 結果として`mounted`が永遠に`false`のまま

---

### 原因2: atomWithStorageのサーバーサイド実行 ⚠️

**現状の問題**:

`src/atoms/theme.ts`で`atomWithStorage`が`getOnInit: true`で定義されています：

```tsx
// atoms/theme.ts
export const themeAtom = atomWithStorage<Theme>("theme", "light", undefined, {
  getOnInit: true,  // ← サーバーサイドでも初期化を試みる
});
```

**問題点**:
1. Next.js 15 App Routerでは、一部のコードがサーバーサイドで実行される
2. サーバーサイドには`localStorage`が存在しない
3. `getOnInit: true`により、サーバーサイドで`localStorage`にアクセスしようとする
4. エラーまたは未定義の動作が発生

**エラーログ例**:
```
ReferenceError: localStorage is not defined
```

---

### 原因3: Server ComponentとClient Componentの境界問題 ⚠️

**現状の問題**:

クライアントコンポーネント（`BasicPopulationRanking`）の中でサーバーコンポーネント（`EstatRankingServer`）を使用しています：

```tsx
// BasicPopulationRanking.tsx
"use client";  // ← クライアントコンポーネント

export const BasicPopulationRanking = ({ ... }) => {
  const [activeTab, setActiveTab] = useState("totalPopulation");

  return (
    <SubcategoryLayout>
      <EstatRankingServer  // ← サーバーコンポーネント
        params={{ ... }}
        searchParams={searchParams}
      />
    </SubcategoryLayout>
  );
};
```

**問題点**:
1. クライアントコンポーネントの中でサーバーコンポーネントを使用すると、サーバーコンポーネントが実際にはクライアント側で実行される
2. これにより、Jotai atomsの初期化タイミングが不安定になる
3. `localStorage`へのアクセスが予期しないタイミングで発生

---

### 原因4: useThemeのサーバーサイド実行 ⚠️

**現状の問題**:

`useTheme`フックがJotai atomsに依存しています：

```tsx
// hooks/useTheme.ts
"use client";

export function useTheme() {
  const [theme] = useAtom(effectiveThemeAtom);
  const [mounted] = useAtom(mountedAtom);
  const toggleTheme = useSetAtom(toggleThemeAtom);

  return { theme, mounted, toggleTheme };
}
```

**問題点**:
1. Jotai atomsはクライアント専用
2. サーバーコンポーネント化により、初期化タイミングが変わる
3. `mounted`が適切に管理されない

---

## 💡 解決策

### 解決策1: ThemeInitializerの重複を解消 ✅

**実装**:

`layout.tsx`からThemeInitializerを削除し、JotaiProviderの内部のみで管理します。

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="relative min-h-full">
      <body className="...">
        <JotaiProvider>
          {/* ThemeInitializerを削除 - JotaiProvider内部で管理 */}
          {children}
        </JotaiProvider>
      </body>
    </html>
  );
}
```

```tsx
// src/providers/JotaiProvider.tsx
function ThemeInitializer() {
  const initTheme = useSetAtom(initThemeAtom);
  const [mounted] = useAtom(mountedAtom);

  useEffect(() => {
    if (!mounted) {
      initTheme();
    }
  }, [initTheme, mounted]);

  return null;
}

export function JotaiProvider({ children }: JotaiProviderProps) {
  return (
    <Provider>
      <ThemeInitializer />  {/* ← ここだけに統一 */}
      {children}
    </Provider>
  );
}
```

**効果**:
- ✅ ThemeInitializerが1箇所のみになる
- ✅ 競合状態を回避
- ✅ `mounted`が確実に`true`になる

---

### 解決策2: atomWithStorageの修正 ✅

**実装**:

`getOnInit`オプションを削除し、完全にクライアント専用にします：

```tsx
// src/atoms/theme.ts
export const themeAtom = atomWithStorage<Theme>(
  "theme",
  "light",
  undefined
  // getOnInit: true を削除
);
```

または、サーバーサイドで安全に動作するようにカスタムストレージを実装：

```tsx
// src/atoms/theme.ts
const customStorage = {
  getItem: (key: string) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};

export const themeAtom = atomWithStorage<Theme>(
  "theme",
  "light",
  customStorage
);
```

**効果**:
- ✅ サーバーサイドでのエラーを回避
- ✅ クライアントサイドでのみ`localStorage`にアクセス

---

### 解決策3: Server/Client Componentの境界を明確化 ✅

**実装方法A: `BasicPopulationRanking`をサーバーコンポーネント化**

```tsx
// BasicPopulationRanking.tsx
// "use client" を削除

import React from "react";
import { EstatRankingServer } from "@/components/ranking/EstatRanking/EstatRankingServer";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";
import { TabSwitcher } from "./TabSwitcher";  // ← 新規作成

export const BasicPopulationRanking: React.FC<SubcategoryRankingPageProps> = async ({
  category,
  subcategory,
  searchParams,
}) => {
  const rankings = {
    totalPopulation: { statsDataId: "0000010101", cdCat01: "A1101", unit: "人", name: "総人口" },
    populationDensity: { statsDataId: "0000010201", cdCat01: "#A01201", unit: "人/km²", name: "人口密度" },
    didAreaRatio: { statsDataId: "0000010201", cdCat01: "#A01402", unit: "%", name: "人口集中地区面積比率" },
  };

  const activeTab = (searchParams?.tab as keyof typeof rankings) || "totalPopulation";
  const activeRanking = rankings[activeTab];

  return (
    <SubcategoryLayout category={category} subcategory={subcategory} viewType="ranking">
      {/* タブUIをクライアントコンポーネントに分離 */}
      <div className="px-4">
        <TabSwitcher activeTab={activeTab} />
      </div>

      {/* EstatRankingServerをサーバーコンポーネントとして使用 */}
      <EstatRankingServer
        params={{
          statsDataId: activeRanking.statsDataId,
          cdCat01: activeRanking.cdCat01,
        }}
        subcategory={{ ...subcategory, unit: activeRanking.unit, name: activeRanking.name }}
        title={`${activeRanking.name}ランキング`}
        options={{ colorScheme: subcategory.colorScheme || "interpolateBlues", divergingMidpoint: "zero" }}
        mapWidth={800}
        mapHeight={600}
        searchParams={searchParams}
      />
    </SubcategoryLayout>
  );
};
```

```tsx
// TabSwitcher.tsx（新規作成）
"use client";

import { useRouter, usePathname } from "next/navigation";

type RankingTab = "totalPopulation" | "populationDensity" | "didAreaRatio";

export function TabSwitcher({ activeTab }: { activeTab: RankingTab }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (tab: RankingTab) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => handleTabChange("totalPopulation")}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === "totalPopulation"
              ? "border-indigo-500 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          総人口
        </button>
        <button
          onClick={() => handleTabChange("populationDensity")}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === "populationDensity"
              ? "border-indigo-500 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          人口密度
        </button>
        <button
          onClick={() => handleTabChange("didAreaRatio")}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === "didAreaRatio"
              ? "border-indigo-500 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          人口集中地区面積比率
        </button>
      </nav>
    </div>
  );
}
```

**実装方法B: EstatRankingを完全にクライアントコンポーネントのままにする**

サーバーコンポーネント化を諦め、従来のクライアントコンポーネントアプローチを維持します。

```tsx
// BasicPopulationRanking.tsx
"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";  // ← クライアント版
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

export const BasicPopulationRanking = ({ category, subcategory }) => {
  const [activeTab, setActiveTab] = useState("totalPopulation");

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* タブUI */}
      <EstatRanking
        params={{ statsDataId: "...", cdCat01: "..." }}
        subcategory={subcategory}
      />
    </SubcategoryLayout>
  );
};
```

**効果**:
- ✅ Server/Client Componentの境界が明確
- ✅ Jotai atomsの初期化タイミングが安定
- ✅ `localStorage`へのアクセスが予測可能

---

### 解決策4: テーマ初期化の強化 ✅

**実装**:

テーマ初期化を堅牢にし、エラーハンドリングを追加：

```tsx
// src/atoms/theme.ts
export const initThemeAtom = atom(null, (get, set) => {
  // サーバーサイドでは何もしない
  if (typeof window === "undefined") {
    console.log("[Theme] Server-side, skipping initialization");
    return;
  }

  try {
    console.log("[Theme] Initializing theme...");

    // システム設定を取得
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const systemTheme: Theme = systemPrefersDark ? "dark" : "light";

    // localStorageから取得
    let savedTheme: Theme | null = null;
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") {
        savedTheme = stored;
      }
    } catch (err) {
      console.warn("[Theme] Failed to read from localStorage:", err);
    }

    // 初期テーマを決定
    const initialTheme = savedTheme || systemTheme;
    console.log("[Theme] Initial theme:", initialTheme);

    // DOMに適用
    applyThemeToDOM(initialTheme);

    // マウント完了
    set(mountedAtom, true);
    console.log("[Theme] Mounted successfully");
  } catch (error) {
    console.error("[Theme] Initialization failed:", error);
    // エラーでもマウント完了とする
    set(mountedAtom, true);
  }
});
```

**効果**:
- ✅ サーバーサイドで安全に動作
- ✅ エラーハンドリングの強化
- ✅ デバッグログで問題を追跡可能

---

## 📋 実装チェックリスト

### フェーズ1: 即座に修正すべきこと

- [ ] **layout.tsxからThemeInitializerを削除**
  - ファイル: `src/app/layout.tsx`
  - 行: 30行目の `<ThemeInitializer />` を削除

- [ ] **atomWithStorageの修正**
  - ファイル: `src/atoms/theme.ts`
  - 変更: `getOnInit: true` を削除、またはカスタムストレージを実装

- [ ] **initThemeAtomの強化**
  - ファイル: `src/atoms/theme.ts`
  - 変更: エラーハンドリングとログを追加

### フェーズ2: アーキテクチャの改善

- [ ] **Server/Client Componentの境界を明確化**
  - オプションA: `BasicPopulationRanking`をサーバーコンポーネント化
  - オプションB: EstatRankingをクライアントコンポーネントのまま維持

- [ ] **TabSwitcherコンポーネントの作成**（オプションA選択時）
  - ファイル: `src/components/subcategories/population/basic-population/TabSwitcher.tsx`

### フェーズ3: テストと検証

- [ ] **テーマの初期化が正常に動作するか確認**
  - `mounted`が`true`になるか
  - ThemeToggleButtonが正常に表示されるか
  - テーマの切り替えが機能するか

- [ ] **サーバーコンポーネント化が正常に動作するか確認**
  - データが正しく取得されるか
  - 年度切り替えが機能するか
  - URLパラメータが正しく反映されるか

---

## 🎯 推奨される実装順序

### ステップ1: 緊急対応（今すぐ）

1. **layout.tsxのThemeInitializerを削除**
2. **atomWithStorageの修正**
3. **動作確認**

これだけで**ローディング永続化の問題は解決**するはずです。

### ステップ2: サーバーコンポーネント化（計画的に）

1. **実装方法を選択**（オプションAまたはB）
2. **段階的に移行**
3. **テストと検証**

---

## 🔬 デバッグ方法

### 問題が解決しない場合

1. **ブラウザのコンソールを確認**
   ```
   [Theme] Initializing theme...
   [Theme] Initial theme: light
   [Theme] Mounted successfully
   ```
   これらのログが表示されるか確認

2. **mountedAtomの状態を確認**
   ```tsx
   // 一時的にデバッグ用コードを追加
   const [mounted] = useAtom(mountedAtom);
   console.log("Mounted state:", mounted);
   ```

3. **localStorageの状態を確認**
   ```
   localStorage.getItem("theme")
   ```

4. **Next.jsのビルドをクリーン**
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```

---

## 📚 参考資料

- [Jotai - Atom with Storage](https://jotai.org/docs/utilities/storage)
- [Next.js - Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Next.js - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React - useEffect](https://react.dev/reference/react/useEffect)

---

## まとめ

### 問題の本質

テーマローディング永続化エラーは、**サーバーコンポーネント化との相性問題**です：

1. ThemeInitializerの重複
2. atomWithStorageのサーバーサイド実行
3. Server/Client Componentの境界が不明確
4. Jotai atomsの初期化タイミングの不安定さ

### 解決の鍵

- ✅ **ThemeInitializerを1箇所に統一**
- ✅ **atomWithStorageをクライアント専用に**
- ✅ **Server/Client Componentの境界を明確化**
- ✅ **エラーハンドリングを強化**

### 次のステップ

1. **即座にフェーズ1を実装**（ローディング問題を解決）
2. **計画的にフェーズ2を実装**（サーバーコンポーネント化）
3. **十分にテスト**（両方の問題が解決したことを確認）

これにより、テーマ管理とサーバーコンポーネント化の両方が正常に機能するはずです。
