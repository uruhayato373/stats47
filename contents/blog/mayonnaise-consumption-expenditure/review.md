---
slug: mayonnaise-consumption-expenditure
reviewer: blog-critic
mode: delta
verdict: PASS
articleSha256: 75c7a2ff631738464505483a28973ff2fd38b1c2a1cc709cd209fc46c941585f
date: 2026-11-13
---
## 評価サマリ
前回の唯一の BLOCK だった未公開記事 /blog/natto-consumption-expenditure へのリンクは、記事から消えました。納豆への導線は71行目の「[納豆消費支出ランキング](/ranking/natto-consumption-expenditure)」の1本だけになり、行き先は `packages/data-configs/src/registry.ts` の 5101 行目に登録された実在の metric です。quality-gate も internalLinksBroken 0、blockers 0 でした。本文に残る内部リンクは /areas/41000、/ranking/mayonnaise-consumption-quantity、/ranking/natto-consumption-expenditure、source-link の /ranking/mayonnaise-consumption-expenditure の4本で、/blog/ へのリンクは frontmatter の ogImage 以外にありません。したがって未公開記事へのリンクは残っていません。読者価値は前回の審査で十分と判断した内容から変わっていません。

## 指摘
- [MINOR][型:causal] 前回からの持ち越しです。63行目の「下位の県は、少なめにしか買わない上に、少量・小容量のぶん単価が高くなっている可能性」には反例があります。100gあたりの単価が全国で最も高いのは、支出額6位の石川県（約92円）です。「沖縄県・千葉県など下位の一部では単価も高め」程度に範囲を絞るか、石川県を例外として一言添えると正確になります。
- [MINOR][型:title-promise] 前回からの持ち越しです。title と description は「下半分」に直りましたが、4行目の subtitle は「関東は下位」のままです。「関東は下半分」に揃えてください。
- [MINOR][型:other] quality-gate の警告は前回と同じ5件です。[offtopic-link] 1件は source-link の指標名と本文の表記の揺れ、VALUE_MISMATCH 4件は235円の幅、1,506円の下位境界、68円と67円の単価を拾った誤検知で、実害はありません。

## 判定理由
前回 BLOCK とした未公開記事へのリンクは、まとめの末尾にあった `/blog/natto-consumption-expenditure` が削除され、本文中の納豆への導線が実在のランキング `/ranking/natto-consumption-expenditure` だけになったことで解消しました。前回の MAJOR はこの1件だけで、ほかの MAJOR（地方内訳の言い直し、D2 視点の不足）は前々回の再審査で解消済みです。今回の変更で新しい BLOCK や MAJOR は生じていません。残る指摘は MINOR 3件で、どれも読者がリンク切れや誤った数値に当たるものではないため、PASS とします。MINOR の2件（単価の範囲の書き方と subtitle）は公開後の微修正で足ります。
