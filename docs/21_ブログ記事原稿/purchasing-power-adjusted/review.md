---
slug: purchasing-power-adjusted
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
今回は R2 mirror 済みの data/*.svg を完全な状態で確認した。data/ には `consumer-price-difference-index-overall-prefecture-rankings.svg`・`purchasing-power-adjusted-prefecture-rankings.svg` が存在するが、article.md からは参照されておらず、記事内チャートは `income-ranking.svg`（名目県民所得ランキング）・`real-income-ranking.svg`（実質購買力ランキング）・`income-map.svg`（実質購買力マップ）・`income-trend.svg`（県民所得推移時系列）・`income-vs-price-scatter.svg`（所得×物価散布図）の5本に限定されている（まとめセクションに summary SVG なし、前回修正で削除済み）。`income-ranking.svg`（名目）と `real-income-ranking.svg`（実質）の2本は同一指標を物価補正前後で比較するものであり、「補正前→補正後での順位変動」という本記事の核心的価値を体現するペアチャートで、劣化複製ではなく前後比較として不可欠。記事内チャート間での不要な重複は認められない。費目別物価格差の表（住居1.56倍・教育1.59倍・光熱水道1.37倍・食料1.11倍・総合1.08倍）は本記事固有の分析で読者価値が高い。「大阪の物価指数99.3が全国平均以下」という反直感的発見、「神奈川が名目10位→実質16位へ6ランクダウン」という具体的な変動値も curiosity gap として誠実。source-link は各図直下に配置されており末尾集約なし。

## 指摘
- 完全な状態で再確認し問題なし。data/ にある未参照の `*-prefecture-rankings.svg` 2本は記事では使用されておらず、記事内チャート重複は発生していない。
- [minor] 実質購買力ランキング SVG 直下の source-link が名目所得ランキングを指している点は前回から継続。実質購買力専用ランキングページが存在しないため改善不可能であり許容範囲内。

## 判定理由
R2 mirror 済みの全 data/*.svg を確認した結果、article.md で使用されている5本のチャートに重複はない。名目・実質の2本ランキングは前後比較の核心であり意図的な対比チャートで劣化複製ではない。writer による余分な重複追加の形跡はない。前回 PASS の評価は今回の完全確認後も維持できる。PASS。
