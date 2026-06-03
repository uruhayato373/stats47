---
slug: school-nonattendance-pattern
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
今回は R2 mirror 済みの data/*.svg を完全な状態で確認した。data/ には `elementary-school-long-absence-ratio-nonattendance-over-30days-per-1000-prefecture-rankings.svg`・`school-nonattendance-pattern-prefecture-rankings.svg` が存在するが、article.md からは参照されておらず、記事内チャートは `nonattendance-ranking.svg`（中学校不登校ランキング）・`nonattendance-map.svg`（地理マップ）・`elem-vs-junior-scatter.svg`（小中散布図）・`per-child-public-elementary-school-expenditure-pref-municipal-prefecture-rankings.svg`（公立小学校費ランキング）・`nonattendance-summary-findings.svg`（まとめ）の5本に限定されている。小学校不登校比率のセクション（48-58行）はチャートなしのテキストと source-link のみで構成されており、data/ に `elementary-school-long-absence-ratio-...-prefecture-rankings.svg` が存在するが記事中では使用されていない。この小学校セクションのチャート欠如は前回から継続する minor 課題だが、散布図（elem-vs-junior-scatter.svg）が小学校と中学校を両軸で比較するチャートとして機能しており、補完関係にある。チャート間での重複は認められない。「小中ともに福井が最低・東北北海道が高い→散布図で正相関確認→公立小学校費が不登校率と単純相関しない」という論理的積み上げは読者価値が高い。curiosity gap「大都市が突出していない意外な構造」は本文・マップで実証されており釣りなし。

## 指摘
- 完全な状態で再確認し問題なし。data/ にある未参照の `*-prefecture-rankings.svg` 2本は記事では使用されておらず、記事内チャート重複は発生していない。
- [minor] 小学校不登校比率セクション（48-58行）にチャートなし（テキスト+source-linkのみ）。data/ に対応 SVG が存在するが未参照。散布図が補完しているため blocker ではないが、次回修正時の候補。

## 判定理由
R2 mirror 済みの全 data/*.svg を確認した結果、article.md で使用されている5本のチャートに重複はなく、小学校セクションのチャート欠如は散布図で補完されている。writer による重複追加の形跡はない。前回 PASS の評価は今回の完全確認後も維持できる。PASS。
