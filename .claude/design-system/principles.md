# デザイン原則

> melta-ui の 5 設計原則を stats47 に適応。
> ブランドパーソナリティ: 「静謐・精緻・温もり」

---

## 1. Layered（レイヤー構造）

UI は 3 層で構成する:

| レイヤー | 役割 | Light | Dark |
|---------|------|-------|------|
| Background | 最下層・画面の地色 | `bg-gray-50` | `bg-slate-900` |
| Surface | Background の上に乗る表層 | `bg-white` | `bg-slate-800` |
| Text/Object | Surface 上のテキスト・アイコン | `text-slate-900` | `text-slate-100` |

**stats47 適用**: shadcn/ui の CSS 変数（`--background`, `--card`, `--foreground`）がこの 3 層に対応。

---

## 2. Contrast（コントラスト）

WCAG 2.1 AA 準拠:

| 対象 | 最低比率 |
|------|---------|
| 通常テキスト（16px未満） | 4.5:1 |
| 大きなテキスト（18px bold / 24px+） | 3:1 |
| UI 要素（アイコン、ボーダー） | 3:1 |

---

## 3. Semantic（セマンティック）

色は用途で命名する:

| 用途 | Light クラス | Dark クラス |
|------|-------------|------------|
| メインテキスト | `text-slate-900` | `text-slate-100` |
| 本文テキスト | `text-body`（#3d4b5f） | `text-slate-300` |
| 補助テキスト | `text-slate-500` | `text-slate-400` |
| ボーダー | `border-slate-200` | `border-slate-700` |
| 成功 | `text-emerald-600` | `text-emerald-300` |
| 警告 | `text-amber-600` | `text-amber-300` |
| エラー | `text-red-500` | `text-red-300` |

**stats47 適用**: `text-muted-foreground` / `text-foreground` 等の shadcn 変数を優先使用。直接の Tailwind カラーはアクセントや状態表現に限定。

---

## 4. Minimal（ミニマル）

- 1 画面に使う色は最大 3 色（背景、アクセント、テキスト）
- シャドウは 4 段階のみ: `none` / `shadow-sm` / `shadow-md` / `shadow-xl`（overlay 専用）
- カード hover は `shadow-sm` → `shadow-md` の遷移に限定

---

## 5. Grid（グリッド）

- スペーシングは 4px の倍数、8px 推奨
- カード内パディング: `p-5` 以上
- セクション間隔: `mt-10` 以上
- ページコンテンツ: `px-6 py-8` 以上

---

## stats47 固有の注意事項

1. **h1 は `text-2xl font-bold`** — melta-ui の `text-3xl` は採用しない（情報密度を優先）
2. **コンテナクエリ** — ダッシュボードカードグリッドは `@sm`/`@md`/`@lg` を使用（ビューポート `md:` ではない）
3. **shadcn/ui コンポーネント優先** — 素の HTML 要素ではなく `@stats47/components` を使用
4. **HSL CSS 変数** — melta-ui の直接 Tailwind クラスではなく、shadcn の `--primary`, `--border` 等を活用
