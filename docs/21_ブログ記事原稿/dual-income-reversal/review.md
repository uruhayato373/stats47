---
slug: dual-income-reversal
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
前回 REVISE の blocker「山形県は世帯主収入だけなら41.5万円（全国38位）」「29ランクのジャンプアップ」が完全に解消された。article.md 72行目は「山形県は世帯主収入だけなら41.5万円（全国35位）ですが、共働き率34.4%（全国2位）のおかげで実収入は68.2万円（全国9位）。26ランクのジャンプアップです。」に修正されており、data/household-head-income-worker-households-per-month-prefecture-rankings.json（山形rank=35、value=415.2千円=41.5万円）およびdata/dual-income-reversal-prefecture-rankings.json（山形rank=9、value=681.7千円=68.2万円）と完全一致する。ジャンプ数も35-9=26ランクで正確。主要数値の全件照合: 東京79.4万円(rank1=794.2千円)・沖縄49.4万円(rank47=493.6千円)・1.6倍差、埼玉rank1=605.2千円・千葉rank2=585.3千円・東京rank3=584.3千円・愛知rank5=510.7千円・沖縄最下位rank47=344.7千円、すべてデータと一致。記事の核心コンセプト「共働き率で逆転する世帯月収」は山形の修正後も説得力を保っており、scatter plot（対角線上方に山形・富山・福井が位置する）という可視化も整合。50年推移の時系列分析（1975年24.3万→1997年ピーク61万→2024年62.9万）は読者価値を大きく追加している。callout 2本（[!TIP]名目値の注意・[!NOTE]家計調査サンプルサイズ）は実質的補足で水増しなし。source-linkはセクション内に配置。内部リンク（/areas/13000・/areas/11000・/areas/47000）で基準を満たす。
## 指摘
- [minor] 前回指摘「タイトルに逆転例（山形38位→9位の躍進）を出すとより直接的」は未適用だが、「38位」が「35位」に修正されたため、もしタイトルに数字を入れるなら「35位→9位」が正確。現状タイトルはcuriosity gap方式で問題なし。特に追加修正は不要。
## 判定理由
前回 REVISE の blocker「山形rank38・29ランクジャンプ」が「rank35・26ランクジャンプ」に修正され、data（household-head-income rank=35、actual-income rank=9）との整合をdata照合で確認した。blocker/major 指摘なし。verdict: PASS。
