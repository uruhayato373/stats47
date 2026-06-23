# @stats47/components

## 概要

プロジェクト全体の UI コンポーネント（Atoms / Molecules）とデザインシステムを管理するパッケージです。shadcn/ui をベースに構築されています。

## デザインシステム

詳細なデザインガイドラインは以下を参照してください。

### 1. カラーシステム
shadcn/ui Blue テーマを使用。CSS 変数（`--background`, `--primary` 等）でライト/ダークモードに対応しています。

### 2. タイポグラフィ
- **本文**: system フォントスタック（游ゴシック / Hiragino。Web フォント非依存）。Inter / Noto Sans JP は読み込まない。
- **コード**: Geist Mono のみ。
- **サイズ**: `text-xs` (12px) から `text-2xl` までを基準（ページ h1 は `text-2xl font-bold`）。
- 正典: `docs/01_技術設計/15_デザインシステムSSOT.md` / `.claude/rules/ui-components.md`。

### 3. アイコンシステム
`lucide-react` を使用。
- 標準サイズ: `w-5 h-5` (20px)
- 文脈に応じて `aria-hidden` や `aria-label` を適切に設定してください。

### 4. レスポンシブ設計
Tailwind CSS の標準ブレイクポイントを採用。
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## コンポーネントの追加・修正
- `src/atoms/ui/`: 基本的な UI 要素（Button, Input, Card 等）。shadcn/ui 由来。
- `src/molecules/`: 複数の Atom を組み合わせた複合コンポーネント。

## shadcn プリミティブの追加（★唯一の正規手順）

shadcn プリミティブの SSOT は **この package（`@stats47/components`）** のみ。`apps/web` 側には置かない
（`apps/web/src/components/atoms/ui` は空で、app の `components.json` は表示用に package を指すだけ）。

新しいプリミティブを追加するときは **この package ディレクトリで** 実行する:

```bash
cd packages/components
npx shadcn@latest add <component>     # → src/atoms/ui/<component>.tsx に生成
# 生成後: src/index.ts に re-export を 1 行追記する
#   export * from "./atoms/ui/<component>";
```

- 設定は `packages/components/components.json`（style=new-york / baseColor=blue / cssVariables）。
  tailwind / globals は app（`../../apps/web`）のものを参照する（CSS 変数は app の `globals.css` が SSOT）。
- `cn` は `src/lib/cn.ts`。生成コードの `utils` alias はここを指す。
- app からは `import { Button } from "@stats47/components"`（barrel）または
  `@stats47/components/atoms/ui/<name>`（個別）で使う。app-local に同名プリミティブを再定義しない。

詳細は `docs/01_技術設計/15_デザインシステムSSOT.md` を参照。
