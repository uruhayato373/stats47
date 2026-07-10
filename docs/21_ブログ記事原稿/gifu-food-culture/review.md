---
slug: gifu-food-culture
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-07-11
---

## 評価サマリ

E型（県別まとめハブ）として、岐阜の食卓を「じゃがいも・えのきたけ・柿・羊羹」など4品目のランキングSVGで構成。タイトル「岐阜の食卓｜じゃがいも・えのき日本一、なぜ羊羹だけ最下位級?」は curiosity gap を1要素備え、岐阜が全国上位（または対照的に下位）の品目を prefecture-food-profile.mjs で全502品目から客観特定したうえで、名産・気候・産地・食文化の観点から「なぜ岐阜がこの分布か」を各図直下で2段落ずつ解釈している。数値はすべて記事dir内の data JSON（R2 app/ranking 由来・source.json 付き3点セット）と一致し、article-factual-check.mjs で 47 都道府県 ground truth と機械照合済み（blockers 0）。「岐阜の食卓を貫くもの」で3品目を一本の軸に束ね、既公開の他県との類型対比でシリーズの厚みに寄与している。ですます調徹底（である調 0）・callout 3種（NOTE 定義／WARNING 支出額≠消費量・個別集計されない名産／TIP 記事固有の分析視点）・markdown 内部リンク3本以上・各図直下の source-link・markdown 表 0 と、機械 gate（quality-gate.mjs）を全項目クリアしている。

## 指摘

- [minor] prose 字数が床（1600）を十分に超え図あたり解釈も 700字以上あり、図と重複する水増しは見られない。品目選定が客観的（全品目順位の実測）で、恣意的な「盛り」がない。
- [minor] WARNING で「家計調査は支出金額であり消費量ではない」「個別集計されない名産がある」ことに触れ、統計の限界を正直に示している。

## 判定理由

機械 gate・factual-check 双方の PASS を実測（main loop 再実行で確認）。E型の必須要素（複数指標の束ね・ハブ誘導・県固有の食文化分析）を満たし、数値の真正性も 3点セット＋ground truth 照合で担保されている。BLOCK/MAJOR 無し。PASS。
