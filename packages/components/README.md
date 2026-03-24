# @stats47/components

## 概要

プロジェクト全体の UI コンポーネント（Atoms / Molecules）とデザインシステムを管理するパッケージです。shadcn/ui をベースに構築されています。

## デザインシステム

詳細なデザインガイドラインは以下を参照してください。

### 1. カラーシステム
shadcn/ui Blue テーマを使用。CSS 変数（`--background`, `--primary` 等）でライト/ダークモードに対応しています。

### 2. タイポグラフィ
- **欧文**: Inter / Geist Mono
- **和文**: Noto Sans JP
- **サイズ**: `text-xs` (12px) から `text-3xl` (30px) までを定義。

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

詳細は、この README のガイドラインを参照してください。
