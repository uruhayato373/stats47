---
slug: mie-food-culture
reviewer: blog-critic
mode: delta
verdict: PASS
articleSha256: 7c9e374f592642908aa4f95dcfe59da81c869da4d3e7ee0253636d4dfb5613de
date: 2026-11-13
---
## 評価サマリ
delta 再審査です。前回 REVISE の理由だった 75 行目の鳥取の順位の誤りは、「梨とかれいが全国1位、かにも2位」に直り、鳥取の記事の data とすべて一致しました。梨は pear-ranking.json で鳥取県 6,856 円の 1 位、かれいは flounder-ranking.json で 2,381 円の 1 位、かには crab-ranking.json で 4,316 円の 2 位 (1 位は和歌山県 7,546 円) で、3 ファイルとも year は 2025 です。鳥取の記事本文 (21 行目の「梨とかれいの2品目で鳥取が全国1位、かには全国2位」) とも同じ表現になりました。同じ段落の小麦粉の記事の引用 (長野 1 位・香川 3 位・年ごとの入れ替わり) と「三重の小麦粉の6位も、単年の位置として読むのが安全です」は、前回審査で確かめた内容から変わっていません。新しい BLOCK・MAJOR はありません。

## 指摘
- [MINOR][型:structure] data/ に、本文が参照しない mie-quantity-price-findings-findings.{json,source.json,svg} が今も残っています (前回の MINOR が未対応)。中身は mie-quantity-price-findings と同じ図です。熊本の記事では同じ二重出力のファイルを削除済みなので、三重でも片方にそろえることを勧めます。公開は止めません。

## 判定理由
前回の BLOCK (75 行目で鳥取のかにを「全国1位」とした誤り) は解消しました。直した文の 3 つの順位はいずれも contents/blog/tottori-food-culture/data/{pear,flounder,crab}-ranking.json と一致し、対象年 (2025 年) と指標 (消費支出額) も三重の記事の比較と合っています。前回までに解消を確かめた BLOCK 1 件 (閾値 120 の定義の不整合) と MAJOR 3 件 (題と分解節のずれ・牛肉のリンク・読者への含意の薄さ) は、今回の変更で崩れていません。残るのは公開を妨げない MINOR 1 件だけなので PASS とします。リンク先 /blog/tottori-food-culture の公開状態は、この審査の判定に含めていません。
