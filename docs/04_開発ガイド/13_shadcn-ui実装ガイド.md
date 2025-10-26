# shadcn/ui 実装ガイド

## 概要

stats47 プロジェクトでは、shadcn/ui を Atomic Design の階層構造に統合して使用しています。このガイドでは、コンポーネントの配置ルール、インポートパス、カスタマイズ方法について説明します。

## Atomic Design 統合方式

### ディレクトリ構造

```
src/components/
├── atoms/
│   ├── ui/              # shadcn/ui Atoms
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── checkbox.tsx
│   │   ├── radio-group.tsx
│   │   ├── switch.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── separator.tsx
│   │   └── skeleton.tsx
│   ├── Button/          # カスタムButton（必要時）
│   └── MetricsCard/     # カスタムコンポーネント
├── molecules/
│   ├── ui/              # shadcn/ui Molecules
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── alert.tsx
│   │   └── tabs.tsx
├── organisms/
│   ├── ui/              # shadcn/ui Organisms
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── table.tsx
│   ├── DataTable/       # shadcn/ui Data Table (@tanstack/react-table)
│   │   ├── data-table.tsx
│   │   ├── data-table-toolbar.tsx
│   │   ├── data-table-pagination.tsx
│   │   ├── types.ts
│   │   └── index.ts
│   └── Header/          # カスタムコンポーネント
└── templates/
```

### コンポーネント分類ガイドライン

#### Atoms（atoms/ui/）

単体で機能する最小単位のコンポーネント：

- **button**: ボタン要素
- **input**: 入力フィールド
- **label**: ラベル要素
- **checkbox**: チェックボックス
- **radio-group**: ラジオボタングループ
- **switch**: トグルスイッチ
- **badge**: バッジ表示
- **avatar**: アバター画像
- **separator**: 区切り線
- **skeleton**: ローディング用スケルトン

#### Molecules（molecules/ui/）

複数の Atoms を組み合わせた機能的なコンポーネント：

- **card**: カードレイアウト（CardHeader, CardContent, CardFooter）
- **select**: セレクトボックス（SelectTrigger, SelectContent, SelectItem）
- **dropdown-menu**: ドロップダウンメニュー
- **alert**: アラート表示（AlertTitle, AlertDescription）
- **tabs**: タブナビゲーション（TabsList, TabsTrigger, TabsContent）

#### Organisms（organisms/ui/）

複雑な機能を持つ高レベルコンポーネント：

- **dialog**: モーダルダイアログ（DialogContent, DialogHeader, DialogTitle）
- **form**: フォーム管理（FormField, FormItem, FormLabel, FormControl）
- **table**: テーブル表示（TableHeader, TableBody, TableRow, TableCell）

## インポートパスのガイドライン

### 基本パターン

```typescript
// Atomsレベル
import { Button } from "@/components/atoms/ui/button";
import { Input } from "@/components/atoms/ui/input";
import { Badge } from "@/components/atoms/ui/badge";

// Moleculesレベル
import { Card, CardContent, CardHeader } from "@/components/molecules/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
} from "@/components/molecules/ui/select";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/molecules/ui/alert";

// Organismsレベル
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/organisms/ui/dialog";
import { Form, FormField, FormItem } from "@/components/organisms/ui/form";
import { Table, TableBody, TableCell } from "@/components/organisms/ui/table";
```

### 複数コンポーネントのインポート

```typescript
// 複数のコンポーネントを一度にインポート
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/molecules/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/organisms/ui/dialog";
```

## カスタマイズ方法

### テーマ変数の使用

shadcn/ui のテーマ変数を使用してスタイリングします：

```typescript
// カスタムクラスでのテーマ変数使用
<div className="bg-card text-card-foreground border border-border">
  <h2 className="text-foreground">タイトル</h2>
  <p className="text-muted-foreground">説明文</p>
</div>
```

### コンポーネントの拡張

既存の shadcn/ui コンポーネントを拡張する場合：

```typescript
// src/components/atoms/ui/button.tsx を拡張
import {
  Button as BaseButton,
  ButtonProps,
} from "@/components/atoms/ui/button";
import { cn } from "@/lib/utils";

interface ExtendedButtonProps extends ButtonProps {
  loading?: boolean;
}

export const Button = ({
  loading,
  className,
  children,
  ...props
}: ExtendedButtonProps) => {
  return (
    <BaseButton
      className={cn("relative", className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          ...
        </div>
      )}
      {children}
    </BaseButton>
  );
};
```

### カスタムコンポーネントでの活用

カスタムコンポーネント内で shadcn/ui を使用：

```typescript
// src/components/atoms/MetricsCard/MetricsCard.tsx
import { Card, CardContent, CardHeader } from "@/components/molecules/ui/card";
import { Badge } from "@/components/atoms/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/molecules/ui/select";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricsCard() {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-wrap justify-between items-center gap-2">
        <h2 className="font-medium text-foreground">Analytics</h2>
        <Select defaultValue="30">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="期間を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="24">Last 24 hours</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="mt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="block font-medium text-xl text-foreground">
              22,900
            </span>
            <Badge variant="default" className="w-fit">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Blue テーマシステム

### カラーパレット

```css
:root {
  --primary: 221 83% 53%; /* Blue */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
}
```

### ダークモード対応

```css
.dark {
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 11%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --border: 217 33% 17%;
  --input: 217 33% 17%;
  --ring: 224 76% 48%;
}
```

## Data Table 実装例

### @tanstack/react-table を使用した Data Table

```typescript
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/organisms/DataTable";

const columns: ColumnDef<YourDataType>[] = [
  {
    accessorKey: "name",
    header: "名前",
    meta: { filterable: true, filterType: "text" },
  },
  {
    accessorKey: "status",
    header: "ステータス",
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
    meta: { filterable: true, filterType: "select" },
  },
];

export function YourTable({ data }: { data: YourDataType[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="データがありません"
      showIndex
    />
  );
}
```

### 機能

- **ソート**: カラムヘッダークリックでソート
- **フィルタリング**: テキスト/セレクトフィルター
- **ページネーション**: 表示件数制御とページング
- **インデックス列**: 行番号の自動表示
- **型安全性**: TypeScript の型推論を活用

## ベストプラクティス

### 1. 一貫性の維持

- 同じレベルのコンポーネントは同じディレクトリに配置
- インポートパスは階層に従って統一
- テーマ変数を活用してカラーを統一

### 2. パフォーマンスの考慮

- 必要なコンポーネントのみインポート
- バンドルサイズの監視
- Tree-shaking の活用

### 3. アクセシビリティ

- shadcn/ui のアクセシビリティ機能を活用
- ARIA 属性の適切な使用
- キーボードナビゲーションの対応

### 4. 型安全性

- TypeScript の型定義を活用
- カスタムプロパティの型定義
- エラーハンドリングの実装

## トラブルシューティング

### よくある問題

1. **インポートエラー**

   - パスが正しいか確認
   - コンポーネントが正しい階層に配置されているか確認

2. **スタイルが適用されない**

   - テーマ変数が正しく定義されているか確認
   - CSS 変数のスコープを確認

3. **ビルドエラー**
   - TypeScript の型定義を確認
   - 依存関係のバージョンを確認

### デバッグ方法

```typescript
// コンポーネントのクラス名を確認
console.log(className);

// テーマ変数の値を確認
const root = document.documentElement;
const primaryColor = getComputedStyle(root).getPropertyValue("--primary");
console.log("Primary color:", primaryColor);
```

## 参考資料

- [shadcn/ui 公式ドキュメント](https://ui.shadcn.com/)
- [Radix UI 公式ドキュメント](https://www.radix-ui.com/)
- [Tailwind CSS 公式ドキュメント](https://tailwindcss.com/)
- [Atomic Design Methodology](https://bradfrost.com/blog/post/atomic-web-design/)

---

**更新日**: 2025-01-20  
**バージョン**: 1.0.0  
**作成者**: stats47 開発チーム
