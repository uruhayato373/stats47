---
slug: per-capita-income-gap
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
前回 REVISE の blocker であった「東京576万」が「東京521万（5,214千円）」に全面修正され、タイトル・seoTitle・subtitle・description・本文・まとめのすべてで521万に統一された。data/per-capita-income-gap-prefecture-rankings.json（東京5,214千円）との整合が取れた。ランキング順位も rank3=福井(318万)、rank4=栃木(313万)、rank5=富山(312万)、rank6=静岡(311万)、rank7=茨城(310万)、rank13=神奈川、rank22=大阪と全て data と一致しており、前回の「3位は茨城」誤記も「3位・福井県、7位・茨城県」に正しく修正された。沖縄217万（data: 2,167千円=216.7万）も整合。curiosity gap「なぜ工業県が大都市を上回るのか」は東京除外 r=0.68 という定量根拠で裏付けられており、読者価値は維持されている。前回指摘した愛知の位置づけ曖昧さも「愛知は大都市かつ製造業集積地で、両面の強さを持つ特殊なケース」と本文で明示された。

## 指摘
- [minor] 前回の blocker・major はすべて解消済み。残る軽微点として、成長率セクション（和歌山+10.5%・東京+10.4%・熊本+9.9%・山形-0.1%）を裏付ける data JSON が記事の data/ ディレクトリ内には存在しない（income-growth-ranking.svg のみ）。本文の数値はチャートから読み取った引用と思われ、チャート自体が正しく生成されているならば許容できるが、次回更新時にデータ整合性確認を推奨する。

## 判定理由
前回 REVISE の blocker2件（東京521/576乖離・ランキング順位誤記）と major1件（愛知の位置づけ曖昧）がいずれも解消された。本文・タイトル・data JSON が整合しており、curiosity gap の事実的根拠も保たれている。残る minor は次回更新時対応で許容できるレベル。PASS。
