---
name: shadcn-ui-design
description: shadcn/uiを原則としてページデザインとUIコンポーネントを作成します。MCPサーバーを活用してshadcn/uiの最新ドキュメントを参照し、アクセシビリティとデザインシステムの一貫性を保ちます。新規ページ作成、UIコンポーネント追加、デザインリファクタリング時に使用してください。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch
---

# shadcn/ui デザインシステム Skill

このskillは、shadcn/uiを原則としてページデザインとUIコンポーネントを作成・管理します。

## 使用タイミング

- 新規ページのデザイン・実装時
- 新しいUIコンポーネントが必要な時
- 既存UIのshadcn/ui移行時
- デザインシステムの一貫性確認時
- アクセシビリティ改善時

## 基本方針

### 1. shadcn/uiを最優先

このプロジェクトではshadcn/uiを採用しています：

**必読ドキュメント:**
- `/Users/minamidaisuke/stats47/docs/01_技術設計/02_ADR/UIコンポーネント/050_shadcn_ui.md`

**採用理由:**
- Tailwind CSS完全統合
- バンドルサイズ最適化（コピー&ペースト方式）
- 完全なコードコントロール
- Atomic Designとの親和性

### 2. MCPサーバーの活用

shadcn/ui MCPサーバーを使用して最新情報を取得します：

```bash
# MCPツールの使用（自動的に利用可能）
# - shadcn/uiの最新ドキュメント参照
# - コンポーネントの使用例取得
# - インストールコマンド確認
```

**注意:** MCPサーバーが利用できない場合は、WebFetchツールでshadcn/ui公式ドキュメント（https://ui.shadcn.com/）を参照してください。

### 3. デザインシステムの一貫性

プロジェクト全体で統一されたデザインを維持：

- カラーシステム: Tailwind CSSのカラーパレット
- タイポグラフィ: 統一されたフォントスケール
- スペーシング: Tailwindのスペーシングシステム
- ダークモード: 全コンポーネントで対応

## 実装フロー

### Step 1: 要件の確認

```markdown
1. どのようなUIが必要か？
   - ボタン、フォーム、モーダル、テーブル等

2. shadcn/uiに対応コンポーネントがあるか？
   - MCPサーバーまたは公式ドキュメントで確認

3. カスタマイズが必要か？
   - プロジェクト固有のスタイル調整
```

### Step 2: コンポーネントの確認

既存のshadcn/uiコンポーネントを確認：

```bash
# インストール済みコンポーネント一覧
ls src/components/ui/

# 使用状況を確認
grep -r "@/components/ui/" src/
```

### Step 3: 必要に応じてインストール

shadcn/uiコンポーネントが未インストールの場合：

```bash
# MCPサーバーでインストールコマンド確認 or
# 公式ドキュメントで確認

# 例: Buttonコンポーネント
npx shadcn@latest add button

# 例: Cardコンポーネント
npx shadcn@latest add card

# 例: Dialogコンポーネント
npx shadcn@latest add dialog
```

### Step 4: コンポーネント実装

Atomic Design原則に従って配置：

```typescript
// Atoms: shadcn/uiコンポーネントをそのまま使用
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Molecules: shadcn/uiを組み合わせ
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBox() {
  return (
    <div className="flex gap-2">
      <Input placeholder="検索..." />
      <Button>検索</Button>
    </div>
  );
}

// Organisms: ビジネスロジックを含む
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function RankingCard({ data }) {
  return (
    <Card>
      <CardHeader>ランキング</CardHeader>
      <CardContent>{/* ビジネスロジック */}</CardContent>
    </Card>
  );
}
```

### Step 5: スタイルのカスタマイズ

必要に応じてTailwindクラスでカスタマイズ：

```typescript
// ✅ Good: Tailwindクラスで拡張
<Button className="bg-teal-500 hover:bg-teal-600">
  カスタムボタン
</Button>

// ✅ Good: プロジェクト固有のvariantを追加
<Button variant="outline" size="lg">
  大きなボタン
</Button>

// ❌ Bad: インラインスタイル
<Button style={{ backgroundColor: '#14b8a6' }}>
  避けるべき
</Button>
```

## コンポーネント選択ガイド

### よく使うshadcn/uiコンポーネント

#### レイアウト
- `Card`: コンテンツのグループ化
- `Separator`: セクション区切り
- `Tabs`: タブナビゲーション
- `Accordion`: 折りたたみコンテンツ

#### フォーム
- `Button`: アクション実行
- `Input`: テキスト入力
- `Checkbox`: 複数選択
- `Radio Group`: 単一選択
- `Select`: ドロップダウン選択
- `Switch`: トグル

#### フィードバック
- `Alert`: 通知メッセージ
- `Toast`: 一時的な通知
- `Dialog`: モーダルダイアログ
- `Tooltip`: ヒント表示

#### データ表示
- `Table`: データテーブル
- `Badge`: ステータス表示
- `Avatar`: ユーザー画像

### コンポーネント選択フロー

```
必要なUI → shadcn/uiにある？
           ├─ Yes → そのまま使用 or カスタマイズ
           └─ No  → カスタムコンポーネント作成
                    （ただしshadcn/uiスタイルに準拠）
```

## MCPサーバー活用例

### 最新ドキュメントの参照

MCPサーバーを使用して、shadcn/uiの最新情報を取得：

```bash
# 例: Buttonコンポーネントの使用方法
MCP: shadcn/ui Buttonコンポーネントの使用例を教えて

# 例: 新しいコンポーネントの確認
MCP: shadcn/uiに最近追加されたコンポーネントは？

# 例: アクセシビリティ対応
MCP: shadcn/ui Dialogのアクセシビリティ対応方法は？
```

### インストール手順の確認

```bash
# MCPサーバーで確認
MCP: shadcn/ui Tableコンポーネントのインストール方法

# 出力例
npx shadcn@latest add table
```

## デザインシステム統合

### カラーシステム

プロジェクトのカラーシステムと統合：

```typescript
// tailwind.config.ts との連携
const colorClassMap = {
  teal: 'bg-teal-500 text-white',
  blue: 'bg-blue-500 text-white',
  // ...
};

// shadcn/uiコンポーネントに適用
<Button className={colorClassMap.teal}>
  統計を見る
</Button>
```

### ダークモード対応

すべてのコンポーネントでダークモード対応：

```typescript
// ✅ 自動的にダークモード対応
<Card className="bg-white dark:bg-neutral-800">
  <CardHeader className="text-gray-900 dark:text-white">
    タイトル
  </CardHeader>
</Card>
```

### レスポンシブ対応

Tailwindのレスポンシブクラスを活用：

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

## アクセシビリティ

shadcn/uiはアクセシビリティに対応していますが、追加で確認すべき点：

### チェックリスト

- [ ] キーボードナビゲーション可能
- [ ] スクリーンリーダー対応（ARIA属性）
- [ ] 適切なコントラスト比（4.5:1以上）
- [ ] フォーカス表示が明確
- [ ] エラーメッセージが分かりやすい

### 実装例

```typescript
// ✅ Good: アクセシビリティ対応
<Button
  aria-label="データをエクスポート"
  aria-describedby="export-description"
>
  エクスポート
</Button>
<span id="export-description" className="sr-only">
  CSVファイルとしてダウンロードします
</span>

// ✅ Good: フォームアクセシビリティ
<Label htmlFor="prefecture">都道府県</Label>
<Select id="prefecture" aria-required="true">
  {/* options */}
</Select>
```

## よくあるパターン

### パターン1: データ表示カード

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StatCard({ title, value, change }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <Badge variant={change > 0 ? "default" : "destructive"}>
          {change > 0 ? "+" : ""}{change}%
        </Badge>
      </CardContent>
    </Card>
  );
}
```

### パターン2: フォームダイアログ

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddItemDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規追加</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">名前</Label>
            <Input id="name" />
          </div>
          <Button type="submit">追加</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### パターン3: ナビゲーションタブ

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardTabs() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">概要</TabsTrigger>
        <TabsTrigger value="analytics">分析</TabsTrigger>
        <TabsTrigger value="reports">レポート</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{/* ... */}</TabsContent>
      <TabsContent value="analytics">{/* ... */}</TabsContent>
      <TabsContent value="reports">{/* ... */}</TabsContent>
    </Tabs>
  );
}
```

## トラブルシューティング

### コンポーネントが見つからない

```bash
# 1. インストール確認
ls src/components/ui/

# 2. 未インストールの場合
npx shadcn@latest add [component-name]

# 3. MCPサーバーで確認
MCP: shadcn/ui [component-name] のインストール方法
```

### スタイルが適用されない

```typescript
// 1. Tailwind設定確認
// tailwind.config.ts でshadcn/uiのパスが含まれているか

// 2. クラスの優先順位
import { cn } from "@/lib/utils";

<Button className={cn("default-classes", customClasses)}>
  ボタン
</Button>
```

### ダークモードが動作しない

```typescript
// 1. ThemeProviderの確認
// layout.tsx でThemeProviderがラップされているか

// 2. ダークモードクラスの追加
<div className="bg-white dark:bg-neutral-900">
  {/* content */}
</div>
```

## 参考リソース

### 公式ドキュメント
- https://ui.shadcn.com/ - shadcn/ui公式サイト
- https://ui.shadcn.com/docs/components - コンポーネント一覧
- https://ui.shadcn.com/themes - テーマカスタマイズ

### プロジェクト内ドキュメント
- `/Users/minamidaisuke/stats47/docs/01_技術設計/02_ADR/UIコンポーネント/050_shadcn_ui.md`
- `/Users/minamidaisuke/stats47/docs/01_技術設計/05_フロントエンド設計/コンポーネント設計.md`

### MCPサーバー
- shadcn/ui MCPサーバー（設定済みの場合）

## 注意事項

1. **常にshadcn/uiを優先検討**: カスタムコンポーネントを作る前に、shadcn/uiで実現できないか確認
2. **アクセシビリティを損なわない**: カスタマイズ時もアクセシビリティを維持
3. **デザインシステムの一貫性**: プロジェクト全体で統一されたスタイルを保つ
4. **MCPサーバーを活用**: 最新情報は常にMCPサーバーまたは公式ドキュメントで確認
