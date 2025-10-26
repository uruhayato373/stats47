# shadcn/ui テーマシステム実装調査レポート

## 調査日
2025-10-26

## 調査目的
shadcn/uiを使用したテーマ切り替え機能の実装状況を調査し、設定の正確性、問題点、改善可能な部分を特定する。

## 調査範囲
- shadcn/ui設定ファイル
- Tailwind CSSテーマ設定
- next-themes統合
- ThemeProvider実装
- テーマ切り替えUI
- 既存コンポーネントのテーマ対応状況

---

## 1. 現状の実装状況

### 1.1 設定ファイル

#### components.json
```json
{
  "style": "new-york",
  "tailwind": {
    "baseColor": "blue",
    "cssVariables": true
  }
}
```
**状態**: ✅ 正常
- shadcn/uiの"new-york"スタイルを使用
- CSS変数ベースのテーマシステムを採用
- ブルーをベースカラーに設定

#### tailwind.config.ts
```typescript
darkMode: "class"
```
**状態**: ✅ 正常
- クラスベースのダークモード切り替えを使用（next-themesと互換性あり）
- CSS変数が正しくcolor設定にマッピングされている

#### globals.css
**状態**: ✅ 正常
- `:root`と`.dark`の両方で完全なテーマ変数セットを定義
- HSL形式で定義され、Tailwindと統合されている
- 全ての必須shadcn/ui変数が含まれている

### 1.2 next-themes統合

#### ThemeProvider設定
**ファイル**: `src/infrastructure/providers/theme-provider.tsx`

```typescript
<NextThemesProvider
  attribute="class"
  defaultTheme="light"
  enableSystem={false}
  disableTransitionOnChange={false}
  {...props}
>
```

**分析**:
- ✅ `attribute="class"`: Tailwindの`darkMode: "class"`と一致
- ✅ `defaultTheme="light"`: 明示的なデフォルト設定
- ⚠️ `enableSystem={false}`: システムテーマ検出が無効
- ⚠️ `disableTransitionOnChange={false}`: トランジションが有効
- ⚠️ `storageKey`未指定: デフォルトの"theme"を使用

#### layout.tsx統合
**ファイル**: `src/app/layout.tsx`

```tsx
<html lang="ja" suppressHydrationWarning>
  <body>
    <ThemeProvider>
      <SessionProvider>
        {/* content */}
      </SessionProvider>
    </ThemeProvider>
  </body>
</html>
```

**状態**: ✅ 正常
- `suppressHydrationWarning`によりFOUCを防止
- ThemeProviderが最上位に正しく配置
- Server/Client Componentの境界が適切

### 1.3 カスタムフック

#### useTheme.ts
**ファイル**: `src/hooks/useTheme.ts`

```typescript
export function useTheme() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme();

  const toggleTheme = () => {
    const currentTheme = resolvedTheme || theme;
    setTheme(currentTheme === "light" ? "dark" : "light");
  };

  return {
    theme: resolvedTheme || theme,
    setTheme,
    toggleTheme,
  };
}
```

**状態**: ✅ 正常
- next-themesの適切なラッパー
- `toggleTheme`関数で利便性向上
- `resolvedTheme`を使用して正確なテーマ取得

### 1.4 UI実装

#### Header.tsx
**ファイル**: `src/components/organisms/layout/Header/Header.tsx:70-78`

```tsx
<button onClick={toggleTheme}>
  <Sun className="size-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
  <Moon className="absolute size-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
</button>
```

**状態**: ✅ 正常
- CSSのみでアイコンアニメーション実装（ベストプラクティス）
- 条件分岐なしでテーマ変更に対応
- アクセシビリティ属性（`aria-label`, `sr-only`）を含む

#### コンポーネントのテーマ対応
**検証したファイル**:
- `src/components/atoms/ui/card.tsx`
- `src/components/atoms/ui/button.tsx`

**状態**: ✅ 正常
- 全てのコンポーネントでshadcn/uiのセマンティックカラーを使用
- `bg-card`, `text-card-foreground`, `bg-primary`などの変数ベースクラス
- ハードコードされた色指定なし

---

## 2. 問題点と改善提案

### 2.1 システムテーマ検出が無効

**現状**: `enableSystem={false}`

**問題**:
- ユーザーのOS設定（ダークモード/ライトモード）が無視される
- 初回訪問時に必ずライトモードで表示される
- ユーザーが手動でテーマを切り替える必要がある

**影響度**: 中
- UXの低下
- モダンなWebアプリの標準機能が欠如

**推奨**: `enableSystem={true}`に変更

```typescript
<NextThemesProvider
  attribute="class"
  defaultTheme="system"  // systemをデフォルトに
  enableSystem={true}    // システム検出を有効化
  disableTransitionOnChange={false}
>
```

**理由**:
- shadcn/uiの推奨設定
- ユーザーのプリファレンスを尊重
- 追加の手動操作不要

**影響範囲**:
- `src/infrastructure/providers/theme-provider.tsx`: 設定変更
- `src/components/organisms/layout/Header/Header.tsx`: UIは変更不要（既存のトグルボタンで対応可能）
- （オプション）テーマセレクター追加で3択対応（Light/Dark/System）

### 2.2 トランジション設定

**現状**: `disableTransitionOnChange={false}`

**問題**:
- テーマ切り替え時にページ全体のCSS transitionが発火
- 大規模なページで視覚的なチラツキが発生する可能性
- パフォーマンスへの影響

**影響度**: 低〜中
- 現在のページ規模では問題ない可能性
- 将来的に複雑なページが増えると顕在化

**推奨**: `disableTransitionOnChange={true}`に変更

```typescript
<NextThemesProvider
  attribute="class"
  defaultTheme="system"
  enableSystem={true}
  disableTransitionOnChange={true}  // トランジションを無効化
>
```

**理由**:
- shadcn/uiの公式推奨設定
- 即座のテーマ切り替えでUX向上
- 不要なアニメーション防止

**影響範囲**:
- `src/infrastructure/providers/theme-provider.tsx`: 設定変更のみ
- UIコンポーネント: 変更不要（テーマトグルボタンのアニメーションは独立）

### 2.3 localStorage Key未指定

**現状**: `storageKey`未指定（デフォルト: `"theme"`）

**問題**:
- 同じドメイン上の他のアプリとlocalStorageキーが競合する可能性
- 開発環境で複数プロジェクトを同時に扱う際の問題
- デバッグ時の識別困難

**影響度**: 低
- 現時点で問題は発生していない
- 将来的なリスク

**推奨**: プロジェクト固有のキー名を設定

```typescript
<NextThemesProvider
  attribute="class"
  defaultTheme="system"
  enableSystem={true}
  disableTransitionOnChange={true}
  storageKey="stats47-theme"  // プロジェクト固有のキー
>
```

**理由**:
- 名前空間の明確化
- 他のアプリケーションとの衝突回避
- デバッグの容易性向上

**影響範囲**:
- `src/infrastructure/providers/theme-provider.tsx`: 設定追加のみ
- 既存ユーザー: 初回訪問時にテーマがリセットされる（軽微な影響）

### 2.4 テーマ選択UIの不足

**現状**: ライト/ダークの2択トグルのみ

**問題**:
- `enableSystem={true}`に変更した場合、3つのオプション（Light/Dark/System）が必要
- 現在のトグルボタンではSystemモードを選択できない
- ユーザーがシステム設定に戻す方法がない

**影響度**: 中（システムテーマを有効化する場合）

**推奨**: ドロップダウン形式のテーマセレクターを追加

```tsx
// 新規コンポーネント: ThemeSelector.tsx
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/ui/dropdown-menu";
import { Button } from "@/components/atoms/ui/button";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">テーマを選択</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          ライト
          {theme === "light" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          ダーク
          {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          システム
          {theme === "system" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**理由**:
- 3つのテーマオプションを明示的に選択可能
- shadcn/uiの標準パターン
- アクセシビリティ対応

**影響範囲**:
- 新規ファイル: `src/components/molecules/ThemeSelector/ThemeSelector.tsx`
- `src/components/organisms/layout/Header/Header.tsx`: トグルボタンをセレクターに置き換え

### 2.5 ドキュメントの不整合

**現状**: `docs/03_デザインシステム/04_shadcn-uiテーマシステム.md`

**問題**:
- 278-290行目: 手動でのテーマ切り替えコードが記載されている
- next-themesが自動処理するため、このコードは不要
- 実装とドキュメントが乖離

**影響度**: 低
- ドキュメントの混乱を招く可能性
- 開発者が古い方法を採用するリスク

**推奨**: ドキュメントを更新

以下のセクションを削除または更新:
- 278-290行目: 手動テーマ切り替え実装
- 293-299行目: システムテーマ検出の手動実装

代わりに:
- next-themesが全て自動処理することを明記
- `useTheme` hookの使用方法を強調
- 手動実装は不要であることを明確化

**影響範囲**:
- `docs/03_デザインシステム/04_shadcn-uiテーマシステム.md`: ドキュメント更新

---

## 3. 実装推奨事項まとめ

### 3.1 優先度: 高

#### 1. システムテーマ検出の有効化
**ファイル**: `src/infrastructure/providers/theme-provider.tsx`

```typescript
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={true}
      storageKey="stats47-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

**効果**:
- UX向上（ユーザープリファレンスの尊重）
- モダンなWeb標準への準拠
- 初回訪問時の最適なテーマ自動選択

#### 2. テーマセレクターの追加
**新規ファイル**: `src/components/molecules/ThemeSelector/ThemeSelector.tsx`

**効果**:
- 3つのテーマオプション（Light/Dark/System）を明示的に選択可能
- より良いUX
- アクセシビリティ向上

### 3.2 優先度: 中

#### 3. ドキュメント更新
**ファイル**: `docs/03_デザインシステム/04_shadcn-uiテーマシステム.md`

**変更内容**:
- 手動テーマ切り替えコードの削除
- next-themesの自動処理を強調
- 最新の実装パターンに更新

**効果**:
- ドキュメントと実装の一貫性
- 開発者の混乱防止
- ベストプラクティスの明確化

### 3.3 優先度: 低（オプション）

#### 4. テーマ永続化のテスト追加
**新規ファイル**: `src/components/molecules/ThemeSelector/ThemeSelector.test.tsx`

```typescript
describe("Theme persistence", () => {
  it("should persist theme to localStorage", () => {
    // テスト実装
  });

  it("should restore theme from localStorage on mount", () => {
    // テスト実装
  });
});
```

**効果**:
- テーマ永続化の動作保証
- リグレッション防止
- CI/CDでの自動検証

---

## 4. 実装計画

### フェーズ1: 設定変更（即座に実施可能）

1. **ThemeProvider設定更新**
   - 推定時間: 5分
   - リスク: 低（既存ユーザーのテーマ設定がリセットされる可能性）
   - ファイル: `src/infrastructure/providers/theme-provider.tsx`

### フェーズ2: UI改善（推奨）

2. **ThemeSelector実装**
   - 推定時間: 30分
   - リスク: 低
   - 新規ファイル:
     - `src/components/molecules/ThemeSelector/ThemeSelector.tsx`
     - `src/components/molecules/ThemeSelector/index.ts`
   - 変更ファイル: `src/components/organisms/layout/Header/Header.tsx`

### フェーズ3: ドキュメント整備

3. **ドキュメント更新**
   - 推定時間: 20分
   - リスク: なし
   - ファイル: `docs/03_デザインシステム/04_shadcn-uiテーマシステム.md`

### フェーズ4: テスト追加（オプション）

4. **自動テスト実装**
   - 推定時間: 1時間
   - リスク: なし
   - 新規ファイル:
     - `src/components/molecules/ThemeSelector/ThemeSelector.test.tsx`
     - `src/infrastructure/providers/theme-provider.test.tsx`

---

## 5. 結論

### 現状の評価
全体として、shadcn/uiテーマシステムの実装は**良好**です：

✅ **正しく実装されている項目**:
- CSS変数ベースのテーマシステム
- next-themesの適切な統合
- FOUC防止
- コンポーネントのテーマ対応
- アクセシビリティ考慮

⚠️ **改善が推奨される項目**:
- システムテーマ検出の無効化
- トランジション設定
- storageKeyの未指定
- テーマ選択UIの不足
- ドキュメントの不整合

### 重大な問題
**なし** - 現在の実装で機能的な問題は発生していません。

### 推奨アクション
1. **今すぐ実施**: ThemeProvider設定の更新（5分）
2. **短期的に実施**: ThemeSelector実装（30分）
3. **時間があれば実施**: ドキュメント更新、テスト追加

### 期待される効果
- ✨ より良いユーザーエクスペリエンス
- 🎯 Web標準へのより良い準拠
- 📚 ドキュメントと実装の一貫性
- 🔧 将来的な保守性向上

---

## 6. 参考資料

- [shadcn/ui - Dark Mode](https://ui.shadcn.com/docs/dark-mode)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Next.js App Router + next-themes](https://nextjs.org/docs/app/building-your-application/styling/css-in-js)
- [WCAG 2.1 Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

**調査実施者**: Claude Code
**レビュー状態**: 未レビュー
**次回レビュー予定**: 実装完了後
