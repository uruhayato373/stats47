---
slug: wind-power-capacity-prefecture-gap
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
タイトル「風車304基の北海道がなぜ容量で青森に負けるのか」は data と完全整合する。wind-power-turbine-count JSON で北海道304基・青森253基が確認でき、wind-power-capacity JSON で青森417,463kW・北海道358,745kW（3位）が裏付く。curiosity gap（数 vs 容量の逆転）が本文の核心分析と一致しており、釣りではない。callout 3個（NOTE・TIP・WARNING）は各々実質的内容を持つ。2017年度データである旨のWARNINGは適切で誠実。1基あたり容量の派生計算（青森约1,650kW・北海道约1,180kW）も表と整合し論理が通っている。内部リンクは /areas/01000 のみで密度が薄いのが惜しい。2つのsource-linkが同一ランキング（/ranking/wind-power-capacity）を指しており、風車基数ランキングへの誘導が欠けている。ゼロ県7県の列挙も data と完全一致。読者価値は高く主要指摘はminor。

## 指摘
- [minor] source-link 2本が同一 href（/ranking/wind-power-capacity）。風車基数チャート直下に /ranking/wind-turbine-count への別 source-link を追加し、重複を解消すべき。
- [minor] 内部リンクが /areas/01000 と末尾カテゴリのみで密度不足。青森・秋田・鹿児島の areas リンクを本文上位表内に追加すると回遊性が向上する。
- [minor] タイトルと subtitle で「青森」への言及は正確だが、seoTitle が「最下位は0kW」と書いており本文の「7県がゼロ」と最下位（香川県）の記述と齟齬なし——確認済み問題なし。

## 判定理由
BLOCK・MAJOR 指摘なし。タイトルのファクト（北海道304基・容量で青森に負ける）がdataで完全裏付く。callout・prose・構造いずれも水準以上。minor 2件は改善推奨だが公開ゲートは通過する。
