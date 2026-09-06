---
slug: yamaguchi-food-culture
reviewer: blog-critic
mode: delta
verdict: PASS
date: 2026-09-06
---

## 評価サマリ

前回 (mode: full) の BLOCK 1 件と MINOR 1 件がいずれも解消されたことを、変更箇所と実データの突合で確認した。タイトルは「山口の食卓｜あじ日本一なのに米は下位、なぜ?」に修正され、data/rice-ranking.json の山口県 46 位・17,075 円という実データと整合する表現になった。実際の最下位は鳥取県 16,752 円で、本文 L57 の「最下位は鳥取県の16,752円で、山口はそのすぐ上」という記述とも矛盾しない。「下位」という語は 46 位という事実の範囲内に収まっており、かつ「あじ日本一」との対句としての curiosity gap も維持されている。順位を数値でタイトルに書かない選択も、事実羅列型アンチパターンを避けるうえで妥当である。frontmatter の archetype も E から D2 に訂正され、家計調査品目 3 つの深掘り＋食文化・産地との結びつきによる説明という実際の構成と型定義が一致した。変更 hunk が新たな意味的破綻を生んでいないことも確認しており、公開可能と判断する。

## 指摘

- [解消済] [BLOCK] タイトルの「米は最下位」が支出額 46 位と不整合だった件 → 「米は下位」に修正。subtitle「米だけ全国下位」・description「46位」・seoTitle「17,075円で46位」・本文 L23/L57/L82/L94 のいずれとも整合する。
- [解消済] [MINOR] archetype が E (網羅ハブ) だった件 → D2 (食品・家計消費) に訂正。食文化・気候・産地との結びつきによる説明と関連品目との対比という D2 の必須分析視点を、本文の「数量×価格で分解する山口市の食卓」節と各図直下の解釈段落が満たしている。

## 判定理由

前回の BLOCK が解消され、変更 hunk 由来の新規 BLOCK も無いため verdict を PASS とする。決定的ゲート (quality-gate.mjs) は review.md 未通過を除き blockers 0 / warnings 0 で、charCount 3257・図あたり 814 字・callout 5・内部リンク 8 (broken 0)・markdown 表 0・括弧内数値 0・SVG 系譜欠落 0 をいずれも満たす。数値の実データ突合も実施済みで、あじ 1 位 2,315 円・つくだ煮 1 位 747 円・米 46 位 17,075 円・鳥取 47 位 16,752 円は data/*.json および各 SVG の描画値と一致し、kakei-quantity-price.json の米 (quantityIndex 67.9→68・quantityRank 47・priceIndex 95.1→95) とあじ (quantityIndex 192.4→192・priceIndex 118.7→119・quantityRank 4) も本文の記述と齟齬がない。
