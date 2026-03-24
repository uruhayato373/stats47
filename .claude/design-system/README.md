# melta-ui デザインシステム リファレンス（stats47 適応版）

stats47 の UI 品質を担保するための melta-ui デザインシステム方針リファレンス。
melta-ui をそのまま導入するのではなく、方針・禁止パターン・レビュースキルを取り込んで既存 UI を改善する。

## ファイル構成

| ファイル | 内容 |
|---|---|
| `prohibited.md` | 76 項目の禁止パターン（melta-ui SSOT） |
| `principles.md` | 5 設計原則 + stats47 固有の注意事項 |
| `quick-reference.md` | コンポーネント・レイアウト・カラーのクイックリファレンス |

## 読み込みガイド

| 状況 | 読むファイル |
|---|---|
| UI コンポーネントを新規作成 | `quick-reference.md` → `prohibited.md` |
| 既存 UI をレビュー | `prohibited.md`（違反チェック） |
| 設計判断に迷う | `principles.md` |

## stats47 固有の例外

| 項目 | melta-ui 標準 | stats47 の決定 | 理由 |
|---|---|---|---|
| h1 サイズ | `text-3xl font-bold` | `text-2xl font-bold` | 情報密度を優先、既存規約を維持 |
| カラーシステム | Tailwind direct classes | HSL CSS 変数（shadcn/ui） | 既存テーマシステムとの互換性 |
| コンテナクエリ | 未定義 | `@sm`/`@md`/`@lg` カスタム定義 | サイドバー有無でカード幅が変動するため |

## 関連スキル

- `/design-review` — melta-ui 準拠のデザインレビュー（`.claude/skills/ui/design-review/SKILL.md`）
- `/ui-panel-review` — 10人パネリストによる UI/UX 評価
