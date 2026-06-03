---
slug: household-solo-vs-dualincome
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
今回は R2 mirror 済みの data/*.svg を完全な状態で確認した。data/ には `dual-income-household-ratio-prefecture-rankings.svg`・`household-solo-vs-dualincome-prefecture-rankings.svg` が存在するが、article.md からは参照されておらず、記事内チャートは `single-household-ranking.svg`（単独世帯割合ランキング）・`nuclear-family-households-ratio-prefecture-rankings.svg`（核家族世帯割合ランキング）・`average-persons-per-general-household-prefecture-rankings.svg`（平均世帯人員ランキング）・`dual-income-map.svg`（共働き世帯割合マップ）・`single-vs-dual-income-scatter.svg`（散布図）・`household-summary-findings.svg`（まとめ）の6本に限定されている。共働き世帯割合については `dual-income-map.svg`（地理分布）のみが使用されており、data/ にある `dual-income-household-ratio-prefecture-rankings.svg`（棒グラフランキング）は記事中で使用されていない。これは意図的であり、共働きのメインビジュアルをマップに絞ることで「日本海側への集中パターン」という地理的発見を優先している。散布図（相関係数-0.86）が単独世帯と共働きの二変量関係を担っており補完的。4指標すべてに独立した SVG が対応しており記事内でのチャート間重複は認められない。「東京と福井で共働き率2倍差・単独世帯率1.8倍逆転」という対比は curiosity gap として誠実で釣りなし。大都市型/大家族型/近郊型/高齢単独型という4類型の整理は読者価値が高い。

## 指摘
- 完全な状態で再確認し問題なし。data/ にある未参照の `*-prefecture-rankings.svg` 2本（dual-income・全体rankings）は記事では使用されておらず、記事内チャート重複は発生していない。

## 判定理由
R2 mirror 済みの全 data/*.svg を確認した結果、article.md で使用されている6本のチャートに重複はない。共働きマップのみ使用（ランキング棒グラフ未使用）は地理パターン優先の意図的選択であり問題なし。writer による重複追加の形跡はない。前回 PASS の評価は今回の完全確認後も維持できる。PASS。
