# クイックリファレンス

> melta-ui CLAUDE.md のクイックリファレンスを stats47 向けに記載。
> stats47 固有の例外は【stats47】で注記。
>
> **2026-06 更新（フラットデザイン / 正典: `docs/01_技術設計/04_デザインシステム.md`）**:
>
> - **角丸はサイト全体で 0**（`--radius:0`）。下記 `rounded-lg`/`rounded-md` 等は**すべて 0 に解決**される。
>   手動の `rounded-xl`/`rounded-2xl` は禁止。**円形のみ `rounded-full`**（アイコン背景・ピル・アバター）。
> - **本文フォントは system スタック**（游ゴシック/Hiragino、Web フォント非依存）。
> - **横幅は `PageShell` / `ArticleShell`（`@/components/layout`）経由**で統一。左レールは共有 `LeftRailLayout`（992px / 左264〜280px）、右レールは316px。

---

## レイアウト

```
ページ全体         : bg-background min-h-screen
ページコンテンツ   : <PageShell>...</PageShell>（@/components/layout、1280px・px-4 sm:px-6 lg:px-10・py-8）
2/3カラム          : <PageShell ...> / <ArticleShell ...>（左は共有 LeftRailLayout、右316px・併用不可）
セクション間隔     : space-y-8 〜 space-y-10
仕切り線           : border-t border-border
```

（PC 常設の**サイト全体ナビ**サイドバーは 2026-06 廃止。ナビはヘッダー＋モバイルドロワー。
例外: **そのページの内容を切り替えるページ内ナビ**は `leftRail` に置いてよい。
Theme のページ内ナビと home / ranking / category のカテゴリ探索が該当する。条件は
`.claude/design-system/prohibited.md` の例外節）

## テキスト

```
見出し（h1）       : text-2xl font-bold text-slate-900 【stats47: text-3xl ではなく text-2xl】
本文               : text-base text-body leading-relaxed（18px, line-height 2.0）
空状態メッセージ   : text-base text-slate-500 text-center py-16
```

**禁止**: `tracking-tight`（日本語の可読性低下）

## コンポーネント

```
カード             : bg-card border border-border p-6 shadow-sm（角丸なし=フラット）
                    【stats47: @stats47/components の Card を優先使用】
カード hover       : hover:shadow-md（shadow-lg 禁止）
カードグリッド     : grid grid-cols-2 md:grid-cols-3 gap-6
                    【stats47: ダッシュボードはコンテナクエリ @sm:/@md:/@lg: を使用】
CTAボタン（M）     : h-10 px-4 text-[1rem] font-medium bg-primary-500 text-white rounded-lg
CTAボタン（S）     : h-8 px-3 text-[0.875rem] font-medium rounded-lg
サブボタン         : h-10 px-4 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-gray-50
入力欄             : w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500/50
セレクト           : appearance-none + カスタムSVGシェブロン（ネイティブ矢印禁止）
バッジ             : bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium
Alert（全種）      : flex items-start gap-3 p-4 border rounded-lg（border-l-4 禁止）
テーブル外枠       : bg-card border border-border overflow-hidden（角丸なし=フラット）
テーブルヘッダ     : <th scope="col"> text-left py-3 px-4 text-xs font-medium text-slate-500
テーブルデータ行   : hover:bg-gray-50 transition-colors
ディバイダー       : border-t border-slate-200（<hr> or role="separator"）
```

## ナビゲーション

```
ヘッダー           : glass sticky top-0 h-16（ロゴ + ナビ + カテゴリメガメニュー + 検索 + テーマ切替）
カテゴリ（PC）      : ヘッダーのドロップダウン（メガメニュー、2列グリッド）
モバイルナビ        : MobileNavDrawer（Sheet, side=left, w-72）= ハンバーガーで開く
ナビ nav           : <nav aria-label="メインナビゲーション"> 必須
ナビ（Active）      : text-foreground bg-accent + aria-current="page"
ナビ（Default）     : text-muted-foreground hover:bg-accent/60 transition-colors
パンくずリスト      : text-sm + text-muted-foreground / 現在ページ text-foreground font-medium
```

（PC 常設のサイト全体ナビサイドバーは 2026-06 廃止。ページ内ナビの `leftRail` は例外）

## シャドウ（4段階のみ）

| レベル  | 用途                        | Tailwind    |
| ------- | --------------------------- | ----------- |
| none    | フラット要素                | —           |
| sm      | カード（デフォルト）・Toast | `shadow-sm` |
| md      | カード hover・Dropdown      | `shadow-md` |
| overlay | モーダル専用                | `shadow-xl` |

**禁止**: `shadow-lg` / `shadow-2xl` / `shadow-inner`

## データ・フィードバック

```
スケルトン         : bg-slate-200 rounded-md + aria-busy="true" role="status"
空状態             : text-center py-16 + アイコン + 見出し + 説明 + CTAボタン
ツールチップ       : bg-slate-600 text-white text-sm rounded-lg shadow-sm px-3 py-2
```
