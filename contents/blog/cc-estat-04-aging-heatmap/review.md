---
slug: cc-estat-04-aging-heatmap
reviewer: blog-critic
mode: delta
verdict: PASS
date: 2026-11-14
---

## 評価サマリ

2026-10-07 の PASS 以降に入った変更 4 点だけを審査しました。結論として、どの変更も記事の主張・数値・図の値を壊しておらず、BLOCK も MAJOR もありません。公開版 (storage.stats47.jp の article.md) と手元の article.md の差分は、101 行目のリンク文言と、281・467・496 行目の `<svg {...rootProps}>` の空白の 4 行だけで、本文の散文には他の変更がないことを diff で確かめました。

変更 1 (描画スクリプト化) は、スクリプト `.claude/scripts/blog/article-renderers/cc-estat-04-aging-heatmap/aging-heatmap.ts` を記事の Step 3・Step 5 のコードブロックと突き合わせました。INTERPOLATORS の 4 種、cellW 64・cellH 18・padL 80・padT 32、width と height の式、欠損用の斜線パターン (`missing-cell`)、年ラベル・県名ラベル・セルの座標、`<title>` の文言、凡例の 11 個の stop と両端ラベルは、すべて記事のコードと同じです。違いは useMemo を外したことと、外側の SVG に図のタイトル・配色名・出典行を添えた部分だけで、これは `blog-svg-chart-standards.md` §6-5 の想定どおりです。図の値は、SVG の 235 セル × 2 枚を data JSON の areaCode 昇順・年順の位置に対応させ、塗り色 (`d3.scaleSequential` で domain 22.6〜39.5) と `<title>` の文言を再計算して文字列で比べ、不一致は 0 件でした。source.json の `restore` と `generatedBy` は実在するスクリプトのコマンドを指しており、§6-5 の「描画スクリプトを repo に置く」を満たし、前回の MINOR (系譜の穴 a) も解消しています。

変更 2 (`<svg {...rootProps}>`) は §6-5 の「不自然な書き方をしない」に沿った直しで、前回の MINOR が解消しました。変更 3 のリンク文言は、リンク先の現在のタイトル (R2 の cc-estat-03-population-bar の title「都道府県別人口ランキングを Claude Code で最短で作る｜D3 バーチャート完全レシピ」) と語を共有し、リンク先も変わっていません。変更 4 の `aging-rate-top-bottom-dark.svg` は、明るい版と 1080×1350 で同寸、テキストの内容と順序 (秋田県 1 位から東京都 47 位、範囲 22.8–40.1) が同一で、`data-theme="dark"`・`data-image-template="bar"` の印と地色 #262626 が付いており、規約の明暗 1 組を満たします。

## 指摘

- [MINOR][型:related-link] 206 行目のリンク文言「Part 3: 都道府県別人口を Claude Code × D3 で棒グラフに」は、リンク先の現在のタイトルとは言い回しが違います (「ランキングを」「最短で作る」「完全レシピ」が無い)。101 行目と同じく、タイトルと語を共有する形 (例: 「Part 3: 都道府県別人口ランキングを Claude Code で作る」) にそろえると、リンクテキストの一貫性が上がります。語の大半は共有しているので公開は止めません。
- [MINOR][型:source] 描画スクリプトの `STYLE` は `packages/svg-builder/src/shared/theme.ts` の `svgThemeStyle()` を呼ばずに手で複製したままで、`text{fill:...}` の 2 行は本物のテーマにはありません (前回の系譜の穴 b と同じ)。図はいまの出力で正しく読めるため、テーマ側が変わったときの再生成で見た目がずれる可能性として残します。

## 判定理由

4 つの変更はいずれも、図の値と data JSON の一致、記事コードと描画スクリプトの一致、規約 (§6-5) への適合を確認でき、新たな BLOCK・MAJOR を生んでいません。前回 PASS の指摘のうち残っていた MINOR 2 件 (`<svg{...}` の書き方、描画スクリプトの不在) も解消しました。残る MINOR 2 件は公開を止める性質ではないため、PASS とします。
