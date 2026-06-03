---
slug: unmarried-rate-40years-crisis
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
今回は R2 mirror 済みの data/*.svg を完全な状態で確認した。data/ には `unmarried-rate-40years-crisis-prefecture-rankings.svg` が存在するが、article.md からは参照されておらず、記事内チャートは `unmarried-trend.svg`（40年推移時系列）・`unmarried-ranking.svg`（未婚率ランキング）・`unmarried-map.svg`（マップ）・`marriage-rate-trend.svg`（婚姻率・初婚年齢推移）・`unmarried-tfr-scatter.svg`（未婚率×出生率散布図）・`unmarried-summary-findings.svg`（まとめ）の6本に限定されている。各チャートは「40年時系列でのトレンド変化→ランキングで都道府県格差→マップで地理パターン→背景となる婚姻率・初婚年齢推移→出生率との相関」という論理段階に対応しており、チャート間での情報の重複は認められない。未婚率ランキング（棒グラフ）とマップ（地理分布）は同一指標だが、前者が「秋田51.8% vs 大阪39.3%の具体値格差」を、後者が「東北・北関東に集中する地理的パターン」を担っており補完的。未婚率推移時系列と婚姻率・初婚年齢推移は異なる指標を扱っており重複なし。「30代前半男性の未婚率が2005年以降頭打ち」という反直感的発見と「東京が未婚率低いのに出生率全国最低」という例外的パターンは curiosity gap として誠実で釣りなし。

## 指摘
- 完全な状態で再確認し問題なし。data/ にある未参照の `unmarried-rate-40years-crisis-prefecture-rankings.svg` は記事では使用されておらず、記事内チャート重複は発生していない。
- [minor] 未婚率×出生率散布図の「緩やかな負の相関」に r 値等の定量的裏付けなし。前回から継続の minor で、観察的記述として留まっており断言ではないため許容範囲内。

## 判定理由
R2 mirror 済みの全 data/*.svg を確認した結果、article.md で使用されている6本のチャートに重複はない。ランキングとマップの2本使用は補完的役割分担（数値格差 vs 地理パターン）であり劣化複製ではない。writer による重複追加の形跡はない。前回 PASS の評価は今回の完全確認後も維持できる。PASS。
