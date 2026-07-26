---
slug: heating-cost-vs-disposable-income
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-07-20
---

## 評価サマリ

delta 再レビュー。前回 BLOCK（秋田の電気代を「全国有数の高さ」と誤って因果説明していた点）は解消を確認した。第2章は「逆転の決め手は電気代ではありません。秋田県の電気代は148,851円で、青森県の155,718円よりむしろ低く、47都道府県の中では20位、全国平均（146,301円）をわずかに上回る程度」「逆転の決め手は都市ガス代でした（秋田42,083円[17位] vs 青森7,335円[47位・最下位]、差34,748円）」に書き直されており、data/electricity-consumption-expenditure-prefecture-rankings.json（秋田148,851円・20位、青森155,718円・14位）と data/city-gas-consumption-expenditure-prefecture-rankings.json（秋田42,083円・17位、京都68,413円・3位）の実値と完全に一致する。まとめ箇条書きも「都市ガス代の差」に訂正済みで整合している。タイトルは28字→15字（「秋田の手取りはなぜ目減りする？」）に短縮され、curiosity gap要素（なぜ）1個・~17字目標に近づいた。他の指摘（相関言及の重複）は軽微な MINOR に留まり、archetype D の必須視点（内訳分解＋生活への含意）・callout の固有性・source-link 配置・ですます調は前回同様に良好。quality-gate は pass:true/blockers:0/warnings:0 と報告されている。

## 指摘

- [解消済み・旧BLOCK] 秋田の電気代を「全国有数の高さ」とする因果説明は、実測（20位・平均並み）に即した記述（都市ガス代の差が逆転の決め手）に訂正済み。再検証で新たな数値誤りは検出せず。
- [MINOR] 相関係数-0.3への言及が本文中盤と末尾WARNINGの2箇所でほぼ同内容を反復（前回指摘のまま残存。軽微、公開の妨げにはならない）。

## 判定理由

前回の BLOCK 指摘（電気代の因果誤認）が data 実値と一致する記述に是正され、変更 hunk 内に新たな blocker 級の問題は見つからなかった。残る指摘は MINOR のみのため verdict は PASS。
