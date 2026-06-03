---
slug: local-tax-revenue-gap
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
今回は R2 mirror 済みの data/*.svg を完全な状態で確認した。data/ には `general-revenue-ratio-pref-finance-prefecture-rankings.svg`・`local-allocation-tax-ratio-pref-finance-prefecture-rankings.svg`・`local-tax-revenue-gap-prefecture-rankings.svg` が存在するが、article.md からは参照されておらず、記事内チャートは `local-tax-ratio-ranking.svg`（地方税割合ランキング）・`allocation-tax-map.svg`（地方交付税マップ）・`tax-vs-allocation-scatter.svg`（散布図）・`taxpayer-ratio-per-pref-resident-prefecture-rankings.svg`（納税義務者割合ランキング）・`national-treasury-disbursement-ratio-pref-finance-prefecture-rankings.svg`（国庫支出金割合ランキング）・`tax-summary-findings.svg`（まとめ）の6本に限定されている。これら6本は「地方税割合（自立度）→交付税依存の地理分布→二指標の相関→根本原因→再分配の別経路」という論理積み上げの各段階に対応しており、チャート間での情報の重複は認められない。特に地方交付税マップ（地理パターン）と散布図（二変量相関）は同一データを異なる軸で見ており、マップが「どこが高いか」を、散布図が「自立型・依存型の構造」を担う役割分担が明確。[!WARNING] で奈良県の例外を取り上げる深掘りも読者価値を高めている。source-link は各図直下に分散配置されており末尾集約なし。

## 指摘
- 完全な状態で再確認し問題なし。data/ にある未参照の `*-prefecture-rankings.svg` 3本は記事では使用されておらず、記事内チャート重複は発生していない。

## 判定理由
R2 mirror 済みの全 data/*.svg を確認した結果、article.md で使用されている6本のチャートはそれぞれ異なる分析角度を担っており重複なし。地方交付税マップと散布図は同一データを別軸で補完するものであり、劣化した部分複製ではない。writer による重複追加の形跡はない。前回 PASS の評価は今回の完全確認後も維持できる。PASS。
