---
slug: population-migration-tokyo-concentration
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ

前回 REVISE の原因だった SVG 不在（`migration-ranking.svg` / `migration-map.svg` / `daytime-population-ranking.svg` / `social-vs-natural-scatter.svg` の 4 本）は、ローカル mirror 欠落に起因するものであり、今回 data/ への mirror 完了により全ファイルの実在を確認した。article-writer が「欠落」と誤認して追加した SVG は存在せず、チャートの重複は発生していない。data/ に存在する `population-migration-tokyo-concentration-prefecture-rankings.svg` 等は記事本文から参照されておらず、article.md が参照するのは 4 本のみで各セクションに一対一対応している。

記事の読者価値は高い。「転入超過 2 位の埼玉県が昼夜間人口比率では全国 47 位」というベッドタウン矛盾は、curiosity gap として強力であり、タイトル・description・本文が一致している。社会増減率・転入超過率・昼夜間人口比率の 3 指標を組み合わせた立体分析は、単一指標の羅列を超えた読者価値がある。前回 major 指摘だった「2019年→2023年の因果的断定」は WARNING callout で「両者は同一時点での直接比較はできず」と明記され解消済み。秋田県の「社会減 × 自然減の二重苦」を散布図で示す構成は、論理の示唆として有効。callout は NOTE（指標定義）・WARNING（年度差異 2 個）・TIP（スケール差異の説明）と 4 個配置されており、品質基準の 2〜4 個以上を満たす。内部リンク 3 個（埼玉・東京・秋田の area ページ）、source-link は各チャート直下または対応セクション内に配置されており末尾集約なし。prose 文字数 2180 字はやや短く warning 水準だが、ランキング表の補足と散布図の象限解説で情報密度は確保されている。

## 指摘

- [minor] prose charCount 2180 字は warning 閾値（2400 字）未満でやや短い。「全都道府県（沖縄除く）が自然減」という重要な発見について定量的な補足（沖縄の自然増減率の数値、または東京都の自然増減率の具体値）を加えると読者の理解度が上がる。必須ではないが余地あり。
- [minor] 昼夜間人口比率の図（`daytime-population-ranking.svg`）直下に `<data-source>` タグが欠落している（他の図には付与済み）。表示上の問題はないが一貫性の観点で追記が望ましい。

## 判定理由

前回 REVISE の blocker だった「SVG 参照パスと実在ファイルの不一致」は、ローカル mirror 欠落が原因であり、R2 上の実在 SVG が docs/data/ に反映された今回は完全に解消された。article-writer による誤認追加チャートの重複もなし。quality-gate は callout 4 個・内部リンク 3 個・チャート 4 本・NG パターンなし・truncated 表なし・chart-placeholder なし・in-article 関連セクションなし、すべてクリア。prose が 2180 字でやや短い warning は残るが、ベッドタウン矛盾の発見・年度差異への誠実な WARNING・散布図による二重苦の可視化、いずれも読者価値として十分であり PASS と判定する。
