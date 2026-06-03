---
slug: workplace-accident-regional-map
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
今回は R2 mirror 済みの data/*.svg を完全な状態で確認した。data/ には `average-payment-amount-of-workers-compensation-insurance-benefits-prefecture-rankings.svg`・`work-accident-severity-prefecture-rankings.svg`・`workplace-accident-regional-map-prefecture-rankings.svg` が存在するが、article.md からは参照されておらず、記事内チャートは `frequency-map.svg`（度数率マップ）・`frequency-ranking.svg`（度数率ランキング）・`severity-ranking.svg`（強度率ランキング）・`avg-payment-bar.svg`（平均支給額）・`freq-severity-scatter.svg`（散布図）・`workers-compensation-insurance-benefits-rate-prefecture-rankings.svg`（給付率ランキング）・`summary-findings.svg`（まとめ）の7本に限定されている。度数率については `frequency-map.svg`（地理パターン把握）と `frequency-ranking.svg`（具体的上位下位確認）の2本が存在するが、前者が「どの地域が高いか」という地理的概観を、後者が「高知3.70・徳島0.97という具体値と3.8倍格差」という数値の精緻化を担っており、役割分担が明確で劣化複製ではない。`avg-payment-bar.svg` と data/ 未参照の `average-payment-amount-of-workers-compensation-insurance-benefits-prefecture-rankings.svg` は同一データの可能性があるが、記事内では前者のみが使用されており記事内の重複は発生していない。香川の強度率突出（1.08、2位0.25の4倍以上）という異常値への着目は読者価値が高く、散布図4象限分析も産業構造と労災リスクの関係を明確に可視化している。

## 指摘
- 完全な状態で再確認し問題なし。data/ にある未参照の `*-prefecture-rankings.svg` 3本は記事では使用されておらず、記事内チャート重複は発生していない。
- [minor] 度数率についてマップとランキングの2本使用は正当な役割分担（地理パターン vs 具体値）であり重複ではない。

## 判定理由
R2 mirror 済みの全 data/*.svg を確認した結果、article.md で使用されている7本のチャートに重複はない。degree of frequency のマップ+ランキング2本使用は補完的役割分担であり劣化複製ではない。writer による重複追加の形跡はない。前回 PASS の評価は今回の完全確認後も維持できる。PASS。
