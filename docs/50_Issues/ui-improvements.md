---
type: backlog
category: ui-improvement
created: 2026-05-16
status: pending
---

# UI 改善バックログ

UX 調査ベースの低優先度 UI 改善案。実装は容量があるときに着手。

## #222 [UI] ランキングページに KPI サマリー行を追加する — ✅ 完了 (2026-06-06)

> **対応**: KPI は既に `RankingHeroCard` の暗色スタットカード（1位/最少(=47位)/全国平均）で実装済だった。
> 不足していた **格差倍率（1位÷最下位）を追加**（`RankingHeroCard.tsx`、commit `9cda8eca`）。最下位≤0 の
> metric は全国合計にフォールバック。既存 rankingValues から算出・年度セレクター連動・tsc clean。

## 背景

GSC との UX 比較調査（2026-05-06）で判明した改善ポイント。

GSC はページ最上部に「合計クリック数・表示回数・CTR・掲載順位」を大きな色付きカードで提示し、
ユーザーが数秒でデータの全体像を掴める。stats47 のランキングページはテーブルがいきなり始まるため、
最大値・最小値・格差倍率などのコンテキストが伝わりにくい。

## やること

ランキングページのテーブル上部に KPI サマリー行を追加する。

### 表示する KPI（案）

| KPI | 内容 | 例 |
|---|---|---|
| 1位 | 都道府県名＋値 | 東京都 14,178,000人 |
| 47位 | 都道府県名＋値 | 鳥取県 545,000人 |
| 格差倍率 | 1位÷47位 | 26.0倍 |
| 全国平均 | 平均値 | 2,699,000人 |

### UI 参考（GSC パターン）

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 1位: 東京都     │ │ 47位: 鳥取県    │ │ 格差            │
│ 14,178,000人    │ │ 545,000人       │ │ 26.0倍          │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

- カード背景に `primary/10` 程度の色を乗せ、数値は `text-2xl font-bold`
- 既存の `RankingPageHeader` の下、テーブルの上に配置
- データは既存の ranking values から計算（追加 API 不要）

## 実装の手がかり

- `apps/web/src/features/ranking/components/RankingPageHeader/`
- ranking values は `apps/web/src/app/ranking/[rankingKey]/page.tsx` で取得済み
- KPI 計算は `packages/ranking/` の既存ロジックを流用できるか確認

## 完了条件

- [ ] desktop・mobile 両方で KPI カードが表示される
- [ ] 値は年度セレクターに連動して更新される
- [ ] 型チェック通過（`npx tsc --noEmit`）

---

## #223 [UI] テーブル前にチャートを配置して「グラフ→データ」の読み順を作る — ✅ 完了 (2026-06-06)

> **対応 (案A)**: `RankingTop10Chart`（新規）を main 列の先頭・地図/テーブルの前に full-width 配置
> （commit `fd802b57`）。既存 `RankingAllPrefecturesChart` を top-10 subset で再利用、dynamic import
> (SSR不要)、年度セレクター連動。全レイアウト（モバイルタブ/lg縦/xl2列）で「グラフ→データ」の読み順。tsc clean。

## 背景

GSC との UX 比較調査（2026-05-06）で判明した改善ポイント。

GSC は「KPI カード → 折れ線グラフ → フィルタブルテーブル」という順序で情報を提示し、
ユーザーが傾向を把握してからデータを読む設計になっている。
stats47 は現在「地図 / テーブル」のタブ切り替えで、テーブルを開いた瞬間に数字の羅列が始まる。

## やること

ランキングページのテーブル上部（または地図・テーブルタブの間）に棒グラフを追加し、
上位〜下位の分布をひと目で把握できるようにする。

### 案

**案A（軽量）**: テーブルタブ内の上部に上位10件の横棒グラフを追加
- 既存の D3/`@stats47/visualization` の BarChart を流用
- テーブルと同じデータソースを使うため追加 fetch 不要

**案B（重め）**: 「グラフ」を独立タブとして追加（地図・グラフ・テーブル）
- より GSC に近い構造だが、タブ数が増えて UI が複雑になるリスクあり

→ 案A から着手して効果を検証する。

## 完了条件

- [ ] テーブルビューの上部に上位10件の横棒グラフが表示される
- [ ] モバイルで適切に折り返される（コンテナクエリ `@sm:` 対応）
- [ ] 年度セレクターと連動する
- [ ] パフォーマンス影響なし（グラフは SSR 不要・`dynamic import`）

---

## #224 [UI] サイト全体の余白・フォントサイズを底上げして可読性を改善する

## 背景

GSC との UX 比較調査（2026-05-06）で判明した改善ポイント。

P1/P2（Issue #221 相当）でテーブルの `text-xs`(9px)→`text-sm`(10.5px)、
h1 の `text-lg`→`text-2xl` を修正済み。
ただし以下のギャップが残っており、引き続き GSC と比較すると窮屈に見える。

## 残存ギャップ（P1/P2 実施後）

| 要素 | stats47（実施後） | GSC | 残差 |
|---|---|---|---|
| table cell font | 10.5px | 12-13px | -2px |
| table padding | 12px 左 | 24px 左 | -12px |
| body font | 12px | 14px | -2px |
| ページ全体の余白感 | 密 | spacious | 体感差大 |

## やること

### ① テーブル padding をさらに広げる — ✅ 完了 (2026-06-06)
- **対応済み**: 共有 DataTable のセル padding を `px-3 py-2` → 本文 `px-4 py-3` / ヘッダ `px-4 py-2` に。行高が ~35px → ~44px（モバイル ≥40px 基準達成）。全テーブル（ranking/city/category/theme）に反映。
- 該当: `packages/components/src/molecules/data-table/components/{data-table-row,data-table-header-cell,data-table-empty}.tsx`

### ② ページコンテンツエリアの余白を増やす — ✅ 解消済 (obsolete)
- 旧記述の `container mx-auto px-4 py-4` は PageShell 統一移行で消滅（line 292 の `container` は breadcrumb ラッパー）。ページ余白は PageShell + 17px 化（③）で底上げ済のため本項は不要。

### ③ body font-size の検討 — ✅ 完了 (2026-06-06)
- **対応済み**: `html { font-size: 17px }` へ引き上げ（globals.css）+ 記事 h2/h3 を Zenn 完全準拠化。サイト全体の文字・余白が 6% 比例拡大。本番デプロイ・モバイル375px回帰検証済 (はみ出しなし)。
- 詳細: `docs/04_レビュー/critical-review/2026-06-06-design-review.md`

## 完了条件

- [x] モバイルでテーブル行の縦スクロールが快適（行高 ≥ 40px） — px-4 py-3 で ~44px
- [x] desktop で「データが呼吸している」余白感がある — 17px 化 + table padding
- [x] 型チェック・ビルド通過

> **Issue #224 全体: ✅ 完了 (2026-06-06)**。①②③ すべて対応済み。
