# UI コンポーネント規約

## コンポーネント選択

- **`@stats47/components` の shadcn ベースコンポーネントを優先使用する。**
  Table / Card / Accordion / Select / Button 等が揃っている。素の HTML 要素（`<table>`, `<select>`, `<button>` 等）で実装せず、まず `packages/components/src/` に該当コンポーネントがないか確認すること。

- **ページ見出し（h1）は `text-2xl font-bold` に統一する。** `text-3xl` 以上は使わない。

## melta-ui デザインシステム準拠

詳細は `.claude/design-system/prohibited.md` を参照。以下は特に重要な禁止項目:

- `text-black` 禁止 → `text-slate-900` or `text-foreground`
- `shadow-lg` / `shadow-2xl` 禁止 → `shadow-sm`（デフォルト）/ `shadow-md`（hover）
- `tracking-tight` 禁止 → 日本語の可読性低下のため削除
- カラーバー（`border-t-4`, `border-l-4` + 色付き）禁止 → 全周 `border` で統一
- `text-gray-400` を本文に使用禁止 → `text-muted-foreground` or `text-slate-500`
- カード hover: `hover:shadow-md` まで（`hover:shadow-lg` 禁止）

デザインレビュー: `/design-review` スキルで違反チェック可能

## レスポンシブブレイクポイントの使い分け

| 対象 | 使うべきブレイクポイント | 理由 |
|---|---|---|
| ページレイアウト（2カラム/1カラム、サイドバー表示） | `lg:` (ビューポート 1024px) | サイドバーの有無はビューポート依存 |
| テキスト・ボタンのサイズ調整 | `sm:` / `md:` (ビューポート) | デバイスサイズで決まる |
| ダッシュボードカードグリッド | `@sm:` / `@md:` / `@lg:` (コンテナクエリ) | 親コンテナ幅が可変（サイドバー有無で変動）のため |

コンテナクエリのブレイクポイントは `tailwind.config.ts` でカスタム定義（`@sm: 480px`, `@md: 768px`, `@lg: 1024px`）。プラグインのデフォルト値とは異なるので注意。ビューポートブレイクポイントとコンテナクエリの混在は意図的な設計。カードグリッドをビューポートの `md:` に変えるとサイドバーあり画面で幅不足になるため、必ずコンテナクエリを使うこと。

## ダッシュボードコンポーネント

- **KPI・チャート等は `page_components` テーブルで管理する。** コード内にチャート定義をハードコードしない。新規追加は DB への INSERT のみ。
- 詳細は `.claude/design-system/page-components.md` を参照。
