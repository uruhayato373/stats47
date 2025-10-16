---
title: プロバイダーアーキテクチャ設計書
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/architecture
  - providers
  - state-management
  - jotai
  - swr
---

# プロバイダーアーキテクチャ設計書

## 概要

stats47 プロジェクトにおけるプロバイダーコンポーネントの設計と実装について説明します。アプリケーション全体の状態管理、データフェッチ、テーマ管理を統一的に提供するアーキテクチャです。

## 設計原則

### 1. 責務の分離

各プロバイダーは単一の責務を持ち、明確に分離されています：

- **JotaiProvider**: 状態管理の基盤提供
- **ThemeProvider**: テーマの初期化と管理
- **SWRConfig**: データフェッチの設定

### 2. レイヤー構造

```
アプリケーション
├── JotaiProvider (状態管理層)
│   ├── SWRConfig (データフェッチ層)
│   └── ThemeProvider (テーマ管理層)
└── アプリケーションコンポーネント
```

### 3. 統一エクスポート

すべてのプロバイダーは`src/lib/providers/index.ts`から統一してエクスポートされ、一箇所で管理されます。

## アーキテクチャ詳細

### ディレクトリ構造

```
src/lib/providers/
├── index.ts                    # 統一エクスポート
├── jotai-provider.tsx          # Jotai + SWR設定
└── theme-provider.tsx          # テーマ管理
```

### コンポーネント設計

#### 1. JotaiProvider

**責務**: アプリケーション全体の状態管理基盤を提供

```typescript
export function JotaiProvider({ children }: JotaiProviderProps) {
  return (
    <Provider>
      <SWRConfig value={swrConfig}>
        <ThemeProvider>{children}</ThemeProvider>
      </SWRConfig>
    </Provider>
  );
}
```

**機能**:

- Jotai Provider: 状態管理の基盤
- SWR 設定: データフェッチの統一設定
- テーマ初期化: テーマプロバイダーの統合

#### 2. ThemeProvider

**責務**: テーマの初期化と管理

```typescript
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initTheme = useSetAtom(initThemeAtom);
  const [mounted] = useAtom(mountedAtom);

  useEffect(() => {
    if (!mounted) {
      initTheme();
    }
  }, [initTheme, mounted]);

  return <>{children}</>;
}
```

**機能**:

- システム設定の検出
- localStorage からの復元
- マウント状態の管理

#### 3. SWR 設定

**責務**: データフェッチの統一設定

```typescript
const swrConfig = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 10000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  onError: (error, key) => {
    if (process.env.NODE_ENV === "development") {
      console.error("SWR Error:", { error, key });
    }
  },
};
```

## 使用方法

### 基本的な使用

```typescript
// src/app/layout.tsx
import { JotaiProvider } from "@/lib/providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <JotaiProvider>{children}</JotaiProvider>
      </body>
    </html>
  );
}
```

### 個別プロバイダーの使用

```typescript
// テーマのみが必要な場合
import { ThemeProvider } from "@/lib/providers";

function ThemeOnlyComponent() {
  return (
    <ThemeProvider>
      <YourComponent />
    </ThemeProvider>
  );
}
```

## 設定詳細

### SWR 設定

| 設定項目                | 値      | 説明                           |
| ----------------------- | ------- | ------------------------------ |
| `revalidateOnFocus`     | `true`  | ウィンドウフォーカス時に再検証 |
| `revalidateOnReconnect` | `true`  | ネットワーク再接続時に再検証   |
| `dedupingInterval`      | `10000` | 10 秒間の重複リクエスト排除    |
| `errorRetryCount`       | `3`     | エラー時の最大リトライ回数     |
| `errorRetryInterval`    | `5000`  | リトライ間隔（ミリ秒）         |

### テーマ設定

- **初期化タイミング**: アプリケーション起動時
- **永続化**: localStorage
- **フォールバック**: システム設定
- **SSR 対応**: マウント状態管理

## パフォーマンス考慮

### 1. レンダリング最適化

- プロバイダーは最小限の再レンダリング
- テーマ初期化は一度のみ実行
- SWR キャッシュによる重複リクエスト排除

### 2. メモリ効率

- 不要なプロバイダーの重複を避ける
- 適切な依存関係の管理
- クリーンアップ処理の実装

### 3. バンドルサイズ

- 必要なプロバイダーのみインポート
- 動的インポートの検討
- Tree-shaking の最適化

## 拡張性

### 将来追加予定のプロバイダー

```typescript
// src/lib/providers/index.ts
export { JotaiProvider } from "./jotai-provider";
export { ThemeProvider } from "./theme-provider";

// 将来的に追加予定
// export { AuthProvider } from "./auth-provider";
// export { QueryProvider } from "./query-provider";
// export { NotificationProvider } from "./notification-provider";
```

### 追加パターン

1. **認証プロバイダー**: ユーザー認証状態の管理
2. **クエリプロバイダー**: 高度なデータフェッチ設定
3. **通知プロバイダー**: グローバル通知の管理
4. **モーダルプロバイダー**: モーダル状態の管理

## テスト戦略

### 単体テスト

```typescript
// src/lib/providers/__tests__/jotai-provider.test.tsx
import { render } from "@testing-library/react";
import { JotaiProvider } from "../jotai-provider";

test("JotaiProvider renders children", () => {
  render(
    <JotaiProvider>
      <div>Test Content</div>
    </JotaiProvider>
  );

  expect(screen.getByText("Test Content")).toBeInTheDocument();
});
```

### 統合テスト

```typescript
// src/lib/providers/__tests__/integration.test.tsx
test("providers work together", () => {
  render(
    <JotaiProvider>
      <TestComponent />
    </JotaiProvider>
  );

  // 状態管理とテーマの連携をテスト
});
```

## トラブルシューティング

### よくある問題

1. **プロバイダーの重複**

   - 解決策: 統一エクスポートの使用
   - 確認方法: React DevTools でプロバイダー階層を確認

2. **テーマの初期化失敗**

   - 解決策: マウント状態の確認
   - 確認方法: コンソールログで初期化タイミングを確認

3. **SWR 設定の不具合**
   - 解決策: 設定値の再確認
   - 確認方法: ネットワークタブでリクエストパターンを確認

### デバッグ方法

```typescript
// 開発環境でのデバッグ
if (process.env.NODE_ENV === "development") {
  console.log("Provider Debug Info:", {
    theme: getTheme(),
    mounted: getMounted(),
    swrCache: getSWRCache(),
  });
}
```

## ベストプラクティス

### 1. プロバイダーの配置

- アプリケーションのルートレベルに配置
- 必要最小限のプロバイダーのみ使用
- プロバイダーの順序に注意

### 2. 状態管理

- グローバル状態は最小限に
- ローカル状態はコンポーネント内で管理
- 適切な状態の分離

### 3. パフォーマンス

- 不要な再レンダリングを避ける
- メモ化の適切な使用
- プロファイリングの定期実行

## 移行ガイド

### 旧プロバイダーからの移行

1. **import 文の更新**

   ```typescript
   // 旧
   import { JotaiProvider } from "@/providers/JotaiProvider";

   // 新
   import { JotaiProvider } from "@/lib/providers";
   ```

2. **ThemeInitializer の削除**

   ```typescript
   // 旧
   <JotaiProvider>
     <ThemeInitializer />
     {children}
   </JotaiProvider>

   // 新
   <JotaiProvider>
     {children}
   </JotaiProvider>
   ```

3. **不要な import の削除**
   ```typescript
   // 削除
   import ThemeInitializer from "@/components/ThemeInitializer";
   ```

## 参考資料

- [Jotai Documentation](https://jotai.org/)
- [SWR Documentation](https://swr.vercel.app/)
- [React Context API](https://react.dev/reference/react/createContext)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**最終更新**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
