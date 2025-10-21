---
title: shadcn/ui統合ガイド
created: 2025-01-15
updated: 2025-01-15
tags:
  - shadcn/ui
  - UIコンポーネント
  - Atomic Design
  - 統合ガイド
---

# shadcn/ui統合ガイド

## 1. 概要

### 1.1 導入の背景と目的

shadcn/uiは、Radix UIとTailwind CSSをベースとした高品質なUIコンポーネントライブラリです。本プロジェクトでは、既存のTailwind CSS + Atomic Designアーキテクチャに最適な統合を実現するため、shadcn/uiの導入を決定しました。

**導入目的:**
- 対話的コンポーネント（Dialog、DropdownMenu等）の開発効率向上
- 既存のデザインシステムとの完全統合
- バンドルサイズの最適化（コピー&ペースト方式）
- Atomic Designの階層構造への自然な組み込み

### 1.2 NextUIとの比較

| 項目 | shadcn/ui | NextUI (HeroUI) | 選定理由 |
|------|-----------|-----------------|----------|
| **統合性** | Tailwind CSS完全統合 | React Aria + Tailwind | 既存Tailwind CSSとの完全統合 |
| **バンドルサイズ** | 使用分のみ | ライブラリ全体 | バンドルサイズの最小化 |
| **カスタマイズ** | 完全制御（コード所有） | テーマシステム | プロジェクトに最適化可能 |
| **Atomic Design** | 自然な階層構造 | コンポーネント分類 | 既存構造への自然な組み込み |
| **学習コスト** | 低（Tailwindベース） | 中（React Aria学習） | 既存スキルの活用 |

## 2. セットアップ手順

### 2.1 初期セットアップ

#### 1. shadcn/ui CLIのインストール

```bash
npx shadcn-ui@latest init
```

#### 2. 設定ファイルの確認

プロジェクトルートに`components.json`が作成されます：

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils"
  }
}
```

#### 3. 必要な依存関係のインストール

```bash
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot
```

### 2.2 ユーティリティ関数の設定

`src/lib/utils.ts`に以下の関数を追加：

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 2.3 グローバルCSSの設定

`src/app/globals.css`にshadcn/uiのCSS変数を追加：

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## 3. コンポーネント追加方法

### 3.1 基本的なコンポーネント追加

#### 1. コンポーネントの追加

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tooltip
```

#### 2. 追加されるファイル構造

```
src/components/ui/
├── button.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── popover.tsx
└── tooltip.tsx
```

### 3.2 Atomic Designとの統合

#### ディレクトリ構造

```
src/components/
├── atoms/
│   ├── ui/              # shadcn/ui Atoms
│   │   ├── button/
│   │   ├── switch/
│   │   ├── checkbox/
│   │   └── slider/
│   └── Button/          # 既存コンポーネント
├── molecules/
│   ├── ui/              # shadcn/ui Molecules
│   │   ├── dialog/
│   │   ├── dropdown-menu/
│   │   └── popover/
│   └── DataTable/       # 既存コンポーネント
└── organisms/
    ├── ui/              # shadcn/ui Organisms
    │   └── navigation-menu/
    └── layout/          # 既存コンポーネント
```

#### コンポーネントの移動

1. **Atoms**: `button`, `switch`, `checkbox`, `slider`, `input`, `label`
2. **Molecules**: `dialog`, `dropdown-menu`, `popover`, `tooltip`, `alert`
3. **Organisms**: `navigation-menu`, `command`, `sheet`

### 3.3 コンポーネントの使用例

#### Dialogの使用例

```typescript
// src/components/molecules/ui/dialog/ConfirmDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  title: string
  description: string
  onConfirm: () => void
  children: React.ReactNode
}

export function ConfirmDialog({ title, description, onConfirm, children }: ConfirmDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline">キャンセル</Button>
          <Button onClick={onConfirm}>確認</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### DropdownMenuの使用例

```typescript
// src/components/molecules/ui/dropdown-menu/UserMenu.tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { User, Settings, LogOut } from "lucide-react"

export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          設定
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## 4. スタイルカスタマイズ

### 4.1 既存デザインシステムとの統合

#### カラーパレットの統合

既存のカラーパレット（`docs/03_デザインシステム/01_スタイルガイド.md`）とshadcn/uiのCSS変数を統合：

```css
:root {
  /* 既存のプライマリカラー */
  --primary: 220 14% 96%;        /* 既存のprimary-50 */
  --primary-foreground: 220 9% 46%; /* 既存のprimary-600 */
  
  /* 既存のセカンダリカラー */
  --secondary: 210 40% 98%;       /* 既存のsecondary-50 */
  --secondary-foreground: 210 11% 15%; /* 既存のsecondary-900 */
  
  /* 既存のアクセントカラー */
  --accent: 47 96% 53%;           /* 既存のaccent-500 */
  --accent-foreground: 0 0% 100%; /* 白 */
}
```

#### テーマシステムの統合

既存のダークモードシステムと統合：

```typescript
// src/lib/theme.ts
export const themeConfig = {
  light: {
    background: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
    primary: "hsl(220 14% 96%)",
    primaryForeground: "hsl(220 9% 46%)",
  },
  dark: {
    background: "hsl(222.2 84% 4.9%)",
    foreground: "hsl(210 40% 98%)",
    primary: "hsl(220 9% 46%)",
    primaryForeground: "hsl(220 14% 96%)",
  }
}
```

### 4.2 コンポーネントのカスタマイズ

#### Buttonコンポーネントのカスタマイズ

```typescript
// src/components/atoms/ui/button/CustomButton.tsx
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CustomButtonProps extends ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary"
}

export function CustomButton({ className, variant = "default", ...props }: CustomButtonProps) {
  return (
    <Button
      className={cn(
        // 既存のカスタムクラスを追加
        "font-medium transition-all duration-200",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      variant={variant === "primary" ? "default" : variant}
      {...props}
    />
  )
}
```

## 5. Atomic Designとの統合

### 5.1 階層構造の設計

#### Atoms（原子）

```typescript
// src/components/atoms/ui/button/Button.tsx
export { Button } from "@/components/ui/button"

// src/components/atoms/ui/input/Input.tsx
export { Input } from "@/components/ui/input"

// src/components/atoms/ui/label/Label.tsx
export { Label } from "@/components/ui/label"
```

#### Molecules（分子）

```typescript
// src/components/molecules/ui/form/FormField.tsx
import { Input } from "@/components/atoms/ui/input/Input"
import { Label } from "@/components/atoms/ui/label/Label"

interface FormFieldProps {
  label: string
  placeholder?: string
  type?: string
}

export function FormField({ label, placeholder, type = "text" }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Input id={label} placeholder={placeholder} type={type} />
    </div>
  )
}
```

#### Organisms（有機体）

```typescript
// src/components/organisms/ui/navigation/NavigationMenu.tsx
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu"

export function NavigationMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>統計データ</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink>ランキング</NavigationMenuLink>
            <NavigationMenuLink>ダッシュボード</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

### 5.2 既存コンポーネントとの使い分け

#### 使い分けガイドライン

| 用途 | 使用するコンポーネント | 理由 |
|------|----------------------|------|
| **基本的なボタン** | 既存の`Button` | プロジェクト固有のスタイル |
| **対話的コンポーネント** | shadcn/ui `Dialog`, `DropdownMenu` | アクセシビリティとUX |
| **フォーム要素** | 既存の`Input`, `Select` | 既存のバリデーション統合 |
| **データ表示** | 既存の`DataTable` | プロジェクト固有の機能 |
| **レイアウト** | 既存の`Header`, `Sidebar` | プロジェクト固有の構造 |

#### 統合例

```typescript
// src/components/molecules/EstatDataForm.tsx
import { FormField } from "@/components/molecules/ui/form/FormField"
import { Button } from "@/components/atoms/Button" // 既存コンポーネント
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog" // shadcn/ui

export function EstatDataForm() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>統計データ検索</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FormField label="都道府県" placeholder="都道府県を選択" />
          <FormField label="統計項目" placeholder="統計項目を選択" />
          <div className="flex justify-end space-x-2">
            <Button variant="outline">キャンセル</Button>
            <Button>検索</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## 6. ベストプラクティス

### 6.1 コンポーネント設計

#### 1. 単一責務の原則

```typescript
// ✅ 良い例：単一の責務
export function ConfirmDialog({ onConfirm, children }: ConfirmDialogProps) {
  // 確認ダイアログの表示のみに集中
}

// ❌ 悪い例：複数の責務
export function DataTableWithDialog({ data, onEdit, onDelete }: DataTableWithDialogProps) {
  // データ表示とダイアログの両方の責務
}
```

#### 2. 型安全性の確保

```typescript
// ✅ 良い例：明確な型定義
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

// ❌ 悪い例：anyの使用
interface DialogProps {
  open?: any
  onOpenChange?: any
  children: any
}
```

#### 3. アクセシビリティの考慮

```typescript
// ✅ 良い例：アクセシビリティ属性の追加
<Dialog>
  <DialogTrigger asChild>
    <Button aria-label="設定を開く">
      <Settings className="h-4 w-4" />
    </Button>
  </DialogTrigger>
  <DialogContent aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle>設定</DialogTitle>
    </DialogHeader>
    <p id="dialog-description">アプリケーションの設定を変更できます。</p>
  </DialogContent>
</Dialog>
```

### 6.2 パフォーマンス最適化

#### 1. 動的インポートの活用

```typescript
// ✅ 良い例：重いコンポーネントの動的インポート
const HeavyChart = dynamic(() => import("@/components/organisms/HeavyChart"), {
  loading: () => <div>読み込み中...</div>,
  ssr: false
})

// ❌ 悪い例：すべてのコンポーネントを静的にインポート
import { HeavyChart } from "@/components/organisms/HeavyChart"
```

#### 2. メモ化の適切な使用

```typescript
// ✅ 良い例：適切なメモ化
const MemoizedDialog = memo(function Dialog({ children, ...props }: DialogProps) {
  return <Dialog {...props}>{children}</Dialog>
})

// ❌ 悪い例：不要なメモ化
const SimpleButton = memo(function Button({ children }: { children: React.ReactNode }) {
  return <button>{children}</button> // シンプルすぎてメモ化の効果なし
})
```

### 6.3 テスト戦略

#### 1. 単体テスト

```typescript
// src/components/molecules/ui/dialog/__tests__/ConfirmDialog.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { ConfirmDialog } from "../ConfirmDialog"

describe("ConfirmDialog", () => {
  it("確認ボタンクリック時にonConfirmが呼ばれる", () => {
    const mockOnConfirm = jest.fn()
    render(
      <ConfirmDialog title="テスト" description="説明" onConfirm={mockOnConfirm}>
        <button>開く</button>
      </ConfirmDialog>
    )
    
    fireEvent.click(screen.getByText("開く"))
    fireEvent.click(screen.getByText("確認"))
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })
})
```

#### 2. 統合テスト

```typescript
// src/components/organisms/ui/navigation/__tests__/NavigationMenu.test.tsx
import { render, screen } from "@testing-library/react"
import { NavigationMenu } from "../NavigationMenu"

describe("NavigationMenu", () => {
  it("統計データメニューが表示される", () => {
    render(<NavigationMenu />)
    expect(screen.getByText("統計データ")).toBeInTheDocument()
  })
})
```

## 7. トラブルシューティング

### 7.1 よくある問題と解決方法

#### 1. スタイルが適用されない

**問題**: shadcn/uiコンポーネントのスタイルが適用されない

**解決方法**:
```bash
# 1. Tailwind CSSの設定を確認
npx tailwindcss --init

# 2. globals.cssにCSS変数が正しく設定されているか確認
# 3. components.jsonの設定を確認
```

#### 2. TypeScriptエラー

**問題**: 型定義が見つからない

**解決方法**:
```typescript
// 1. 正しいインポートパスを確認
import { Button } from "@/components/ui/button"

// 2. tsconfig.jsonのpaths設定を確認
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 3. ダークモードの統合

**問題**: ダークモードが正しく動作しない

**解決方法**:
```typescript
// 1. 既存のテーマシステムとの統合
import { useTheme } from "@/hooks/useTheme"

export function ThemedComponent() {
  const { theme } = useTheme()
  
  return (
    <div className={cn(
      "bg-background text-foreground",
      theme === "dark" && "dark"
    )}>
      {/* コンテンツ */}
    </div>
  )
}
```

### 7.2 デバッグ方法

#### 1. コンポーネントの確認

```typescript
// デバッグ用のコンポーネント
export function DebugDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>デバッグ</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>デバッグ情報</DialogTitle>
        </DialogHeader>
        <pre className="text-xs">
          {JSON.stringify({
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            cssVars: getComputedStyle(document.documentElement)
          }, null, 2)}
        </pre>
      </DialogContent>
    </Dialog>
  )
}
```

#### 2. スタイルの確認

```typescript
// スタイルデバッグ用のフック
export function useStyleDebug() {
  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    console.log({
      background: style.getPropertyValue('--background'),
      foreground: style.getPropertyValue('--foreground'),
      primary: style.getPropertyValue('--primary'),
    })
  }, [])
}
```

## 8. 参考資料

### 8.1 公式ドキュメント

- [shadcn/ui公式サイト](https://ui.shadcn.com/)
- [Radix UI公式ドキュメント](https://www.radix-ui.com/)
- [Tailwind CSS公式ドキュメント](https://tailwindcss.com/)

### 8.2 プロジェクト内ドキュメント

- [技術選定評価_2025.md](技術選定評価_2025.md) - shadcn/ui選定理由
- [Atomic Design実装.md](./10_Atomic Design実装.md) - Atomic Designとの統合
- [スタイルガイド.md](../02_デザインシステム/01_スタイルガイド.md) - 既存デザインシステム
- [コンポーネント実装ガイド.md](./09_コンポーネント実装ガイド.md) - コンポーネント実装方針

### 8.3 関連ツール

- [shadcn/ui CLI](https://ui.shadcn.com/docs/cli)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Class Variance Authority](https://cva.style/)
- [Tailwind Merge](https://github.com/dcastil/tailwind-merge)

---

**最終更新**: 2025年1月15日  
**作成者**: 開発チーム  
**関連ドキュメント**: [技術選定評価_2025.md](技術選定評価_2025.md)
