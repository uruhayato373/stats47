# クイックリファレンス

> melta-ui CLAUDE.md のクイックリファレンスを stats47 向けに記載。
> stats47 固有の例外は【stats47】で注記。

---

## レイアウト

```
ページ全体         : bg-gray-50 min-h-screen
ページコンテンツ   : max-w-7xl mx-auto px-8 py-12
サイドバー＋メイン : flex h-screen（ボーダー分離、gap不要）
セクション間隔     : mt-10 〜 mt-14
仕切り線           : border-t border-slate-200
```

## テキスト

```
見出し（h1）       : text-2xl font-bold text-slate-900 【stats47: text-3xl ではなく text-2xl】
本文               : text-base text-body leading-relaxed（18px, line-height 2.0）
空状態メッセージ   : text-base text-slate-500 text-center py-16
```

**禁止**: `tracking-tight`（日本語の可読性低下）

## コンポーネント

```
カード             : bg-white rounded-xl border border-slate-200 p-6 shadow-sm
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
テーブル外枠       : bg-white rounded-xl border border-slate-200 overflow-hidden
テーブルヘッダ     : <th scope="col"> text-left py-3 px-4 text-xs font-medium text-slate-500
テーブルデータ行   : hover:bg-gray-50 transition-colors
ディバイダー       : border-t border-slate-200（<hr> or role="separator"）
```

## ナビゲーション

```
サイドバー（標準）  : w-64 bg-white border-r border-slate-200
サイドバー nav      : <nav aria-label="メインナビゲーション"> 必須
ナビ（Active）      : text-primary-500 bg-primary-50 rounded-lg + aria-current="page"
ナビ（Default）     : text-body hover:bg-gray-50 rounded-lg transition-colors
パンくずリスト      : text-sm + text-slate-500 / 現在ページ text-slate-900 font-medium
```

## シャドウ（4段階のみ）

| レベル | 用途 | Tailwind |
|--------|------|----------|
| none | フラット要素 | — |
| sm | カード（デフォルト）・Toast | `shadow-sm` |
| md | カード hover・Dropdown | `shadow-md` |
| overlay | モーダル専用 | `shadow-xl` |

**禁止**: `shadow-lg` / `shadow-2xl` / `shadow-inner`

## データ・フィードバック

```
スケルトン         : bg-slate-200 rounded-md + aria-busy="true" role="status"
空状態             : text-center py-16 + アイコン + 見出し + 説明 + CTAボタン
ツールチップ       : bg-slate-600 text-white text-sm rounded-lg shadow-sm px-3 py-2
```
