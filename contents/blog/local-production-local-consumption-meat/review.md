---
slug: local-production-local-consumption-meat
reviewer: blog-critic
mode: expert
verdict: PASS
articleSha256: bb8c52654a8a79e26513831ae68142c9b3f301e10b1230d1b193bdccb72a6e35
date: 2026-11-09
---
## 評価サマリ
前回の BLOCK 2 件は解消した。鶏肉の節の冒頭は「牛肉と違って正の向きに並びますが、豚肉と並ぶ程度の弱い重なり」に直り、購入量の順位相関が豚肉0.21・鶏肉0.20であることと矛盾しない。豚肉の鹿児島市の単価は「安い方から37番目」に直り、pork-production-vs-price-scatter.json の47点を昇順に並べた結果 (鹿児島県148.6円が37番目) および analysis-summary.json の topProducerPriceRank と一致した。前回 MAJOR の牛肉の東西二分の言い切りも「地方の中での確認はしていません」と範囲を弱め、「約100世帯」の根拠のない数字は本文から消えた。題「肉の産地ほど肉を買うとは限らない」に、順位相関、産出上位3県、吸収率の目安、年違い、飼養頭数、1県除外で答えており、水増しは無い。gate の blocker は「4 型が決まらない」のみ (指示により無視)。
## 指摘
- [MINOR][型:definition] 節見出し「産出の1割ほどしか食べきれません」は、本文が「%の絶対的な大きさに意味があるわけではありません」と断る目安を絶対値の見出しにしている。「県内の購入は産出に比べて小さい」のような相対の言い方か、「全国の産出と購入が等しいと置くと」の条件を入れると誤読が減る。公開は妨げない。
- [MINOR][型:code] 全図の source.json の generatedBy が scratchpad のパスのまま。呼び元が公開前にリポジトリへ置く前提なので、置いた後にパスが実在することだけ確認する。
- [MINOR][型:structure] contentType が未登録で、問い K01-5 との issue-links も未登録 (指示により blocker は無視)。結ぶときは、本文の「支持は見えない」という限定が台帳の pitfall と一致している。
- [MINOR][型:related-link] gate の warning (offtopic-link): 各肉の source-link が指す購入量ランキングの指標名が、その節の本文にそのままは出てこない。節内で「購入量」をランキングへ誘導する一文に触れるか、そのままでも読者の誤解は小さい。
## 判定理由
BLOCK が無いため PASS。前回の BLOCK 2 件と MAJOR は解消し、改稿で追加された言い回し (豚肉の単価順位37、鹿児島市の牛肉単価3番目に高い=47市中45位、鶏肉の鹿児島市41番目) も analysis-summary.json と図 JSON に一致した。残りは見出しの言い回しと公開手順上の確認のみである。
