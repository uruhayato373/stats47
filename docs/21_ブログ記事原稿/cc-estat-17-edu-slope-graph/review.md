---
slug: cc-estat-17-edu-slope-graph
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-21
---

## 評価サマリ

「Claude Code × e-Stat」連載 Part 17 のレシピ記事 (ランキング分析 archetype A-E ではなくチュートリアル型)。Slope Graph の作り方を「データ取得 → 順位化 → D3 描画 → 衝突回避」の手順に分解し、各段で動く実コード・落とし穴・しきい値の根拠を提示しており、読者が真似て再現できる実体がある。サンプル順位が架空である旨を NOTE callout・§11 冒頭・データ出典の 3 箇所で明示しており、「捏造ランキングを実データと偽る」失敗モードを正しく回避している。図 (要点カード + 構造イメージ) は本文の補助で、prose が主役 (図あたり 2,033 字)。冗長・図表重複・水増しは認められない。読者価値は十分で公開可。

## 指摘

- [MINOR] §11.1/§11.2 のサンプルグループ提示が ` ```text ` の擬似表 (県/始点→終点/delta) で、解釈というより順位の読み上げに寄っている。markdown 表禁止には抵触しない (fenced code block・gate markdownTables:0) が、レシピの「読み方」演習としては最も薄い箇所。各グループに「なぜそう動きうるか」の一文 (§11.2 の WARNING に近い注意) を 1 行添えると、読みのデモとして厚みが増す。現状でも本文 §11.2/11.3 + WARNING で読み方の本質 (順位≠絶対値・変化なしも雄弁) は語れているため MINOR 止まり。
- [MINOR] `slope-structure-timeseries.source.json` / `summary-findings.source.json` が `incomplete: true` (出自 rankingKey/derived 無し)。本記事の図は観測ランキングではなく作図用 authored チャートなので機能的には正常だが、source.json の note は汎用 backfill 警告のまま。レシピ記事の illustrative チャートである旨を note に残すと監査時の誤解が減る (任意)。

## 判定理由

curiosity gap タイトル (「順位データ整形を Claude Code に頼む」) は本文の中身 (fetch→rank→D3→collision のレシピ) と一致しており釣りではない。rank("min")/dense/average のトレードオフ、軸反転の罠、衝突回避アルゴリズムの実装、5 ランク≒10% のしきい値根拠、§11 WARNING の「順位 (相対値) と正答率 (絶対値) の取り違え」注意は、いずれも記事固有で独立した価値のある知識であり、callout も定型反復ではない。ですます調統一 (である調 0)・内部リンク 3 (連載 Part 1/15/16 への文脈リンク + /ranking インライン誘導)・図あたり字数も十分。BLOCK 級の指摘なし。MINOR 2 件は公開を妨げない改善余地のため verdict: PASS。
