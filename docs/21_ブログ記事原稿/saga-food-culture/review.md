---
slug: saga-food-culture
reviewer: blog-critic
mode: full
verdict: PASS
date: 2026-09-06
---

## 評価サマリ

和食(47,129円・全国1位)・干しのり(4,934円・全国2位)・スナック菓子(9,563円・全国1位)の3ランキングに加え、家計調査125品目を数量指数×価格指数で分解した独自集計(saga-quantity-price-findings.svg)を軸に、単なる順位紹介を超えて「量で稼ぐ品目」と「単価の高いものを選ぶ品目」という佐賀市の食卓の買い方の癖まで踏み込んでいる。地理(有明海・玄界灘の2漁場)と歴史(城下町の料亭文化)による構造解釈も各セクションに具体的に書かれており、図あたりprose(882字)は目標550字を大きく上回る。callout 5個はいずれも定型文ではなく、記事固有の読み違い防止知識(指数の分母定義・呼子のイカ等の非集計品目・数量×価格の読み方)になっている。数値は本文・SVGデータ(japanese-dining-ranking.json / nori-ranking.json / snack-ranking.json / kakei-quantity-price.json)・本番ranking/areaページの全てで完全に一致し、内部リンク7件もすべて実在・200を確認した。quality-gate.mjsのblockerはcritic未通過のみで、他は全項目pass(markdown表0・parenNumbers 0・である調0・SVG欠落0)。

## 指摘

- [MINOR] frontmatterの`archetype: E`(網羅ハブ)は宣言だが、本文は数量×価格分解による構造分析・品目別因果解釈を含み実態はD2(食品・家計消費)に近い。E宣言でも必須視点(代表指標を束ねハブ誘導)は満たしているため公開は妨げないが、次回改稿時にportfolio配分(typeMix)の精度のためarchetype表記の見直しを推奨する。
- [MINOR] スナック菓子節の「鳥取・大分など地方都市圏で菓子類の支出が高くなる傾向は他の家計調査品目でもしばしば見られます」は、この記事のデータで裏付けられていない一般化。断定調をやや弱める(「〜と考えられます」等のヘッジ)か、根拠となる別ランキングへの言及を足すとより厳密になる。

## 判定理由

BLOCK級の指摘は0件。quality-gate.mjsの機械フロアはcritic未通過を除き全てpass。数値照合(taiのquantityIndex 229.6→230、priceIndex 80.7→81等、たい・あじ・即席麺・乾うどん・そば・さしみ盛合わせ・かに・いわし・緑茶・焼酎の全ケース)、counts({多く高く:0, 高く:10, 多く:10, 支出額大:3})とcountsNote(「他の〜」残余品目除外の明記)、47県ranking全件(japanese-dining/nori/snack)の1位〜最下位・倍率(3.2倍/2.1倍/2.0倍)、本番ranking4ページ・areas/41000・category/economy・blog/kumamoto-food-culture(鶏肉全国1位、参照内容も一致)を実測で突合し、不一致は0件だった。読者価値・curiosity gapの真正性(タイトルの「なぜ」に本文が構造で回答)・callout品質・文体一貫性も基準を満たすため、PASSと判定する。指摘2件はいずれもMINORで次回改稿時の改善事項として残す。
