---
slug: refrigerator-expenditure-ranking
reviewer: blog-critic
mode: delta
verdict: PASS
articleSha256: d219dd715391cc4fb6328590337cf9d8170f6d9e20ce5759c2662a94fd4c0540
date: 2026-11-13
---
## 評価サマリ
前回の BLOCK 1 件は解消しました。地図節 (55行目) の「九州本土の7県はいずれも上位3分の1に収まり」は「いずれも18位以内に収まり」に直りました。data/refrigerator-ranking.json (2025年、単位 円) では九州本土 7 県の順位が大分 1・佐賀 4・鹿児島 7・福岡 9・宮崎 11・長崎 15・熊本 18 位で、最も低い熊本県が 18 位 (6,999円) なので記述と一致します。地図の data (refrigerator-expenditure-ranking-map.json、同じ rankingKey・2025年) でも熊本県 6,999円、大分県 17,590円で一致しました。記事内に「3分の1」の表現は残っておらず、description (6行目)・上位節 (36行目)・まとめ (68行目) の「18位以内」とも揃っています。

## 指摘
- [MINOR][型:region] description の「九州7県が18位以内に入る」は、本文の「九州本土の7県」と言い方が違います。沖縄県 (42位) を除いた 7 県であることは本文で分かるので誤りではありませんが、description も「九州本土の7県」にすると読み違いを防げます。

## 判定理由
前回の BLOCK [型:value]「上位3分の1」(47 県の 3 分の 1 は 16 位までで、熊本県 18 位と合わない) は「18位以内」に直り、data の順位と一致したので解消です。grep で「3分の1」が記事内に 0 件であること、description・本文・まとめの 3 か所が同じ「18位以内」で揃っていることを確かめました。前回の review の時点で MAJOR はすべて解消済みで、今回の変更は 55行目の 1 語句だけのため、新しい BLOCK・MAJOR はありません。残る指摘は MINOR 1 件のため PASS とします。本 delta 審査では記事全文の再読と quality-gate.mjs の再実行はしていないため、機械的な床は公開前の gate 実行に委ねます。
