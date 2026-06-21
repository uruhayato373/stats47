---
slug: pachinko-participation-prefecture-gap
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-21
---
## 評価サマリ
アーキタイプA（単一指標深掘り）として完成度が高い記事です。curiosity gap タイトル（なぜ東京は下位?）は本文の核心（東京46位・大阪6位の逆転、ホール数と参加率の乖離）と一致し釣りではありません。SVG 1枚に対し prose 3,504字と図あたりの解釈が厚く、九州・北陸・東北の3クラスター分類、代替レジャー仮説、沖縄の例外性まで踏み込んでおり「順位の読み上げ」を脱しています。callout 4個は記事固有（行動者率の定義／九州の集計補足／地方≠高い WARNING／代替レジャー TIP）で独立した価値があり、ですます調も一貫。相関≠因果の規律（[仮説]タグ・「本調査は理由を尋ねていない」）も適切です。前回 REVISE の MAJOR（NOTE callout の集計矛盾）が是正され、PASS とします。

## 指摘
- [解消済 MAJOR] L50-51 NOTE callout は「九州**7県**のうち**6県**（福岡のみ27位）が20位以内」に訂正済。データ（九州7県・20位以内は佐賀1/鹿児島1/宮崎3/熊本4/大分17/長崎19の6県、福岡27位）と一致を確認。
- [解消済 MINOR] L79 の「東京は多くの娯楽で高い」主張は [仮説] タグ付き＋「本調査はパチンコ単一指標であり他の娯楽との比較は含みません」と明示し、教育・スポーツカテゴリへの検証導線も追加され、データ範囲外の断定が解消。
- [MINOR] 『上位』の母数（上位5枠／上位10県／20位以内）が段落ごとに揺れる箇所が残る（L46・L48）。各クラスターで母数を明示済の箇所もあり読解可能なため公開は妨げない。次回 brushup で母数表現を統一すると精度が上がる。

## 判定理由
data/pachinko-ranking.json と本文の rank/value claim 30 件を突合し mismatch 0。2.4倍差(8.6/3.6=2.39)、大阪vs東京1.8倍(8.0/4.4=1.82)、九州7県中6県が20位以内・福岡27位、すべてデータと一致。前回 REVISE の唯一の blocker だった L51 callout の集計矛盾（九州9県=誤、7県が20位以内=誤）は修正案どおり是正済。機械 gate は callouts4／internalLinks4／charts1／charCount3504／dearuEndings0／markdownTables0／svgLineageMissing0 で critic 以外全 pass、SVG 3点セット（json+source.json+svg+ig.svg）も揃う。図表重複・水増し・薄い解釈はなく読者価値は十分高い。残る MINOR は読解を妨げないため PASS とする。
