---
slug: yamagata-food-culture
reviewer: blog-critic
mode: full
verdict: PASS
date: 2026-09-05
---
## 評価サマリ

本記事は山形県の家計調査上位3品目（こんにゃく・ヨーグルト・たけのこ）の紹介に加え、新設の「数量×価格で分解する山形市の食卓」節で支出額ランキングを数量指数・価格指数へ分解しており、単なる支出額の言い換えに終わっていない。「多く買っているのか、高く買っているのか」という新しい読み方を提供し、特にたけのこの全国1位を「高級品ではなく大量消費の日常食材」と再解釈する記述は、冒頭の支出額ランキングだけでは見えない構造を明らかにしており読者価値が高い。

数値はkonnyaku-ranking.json（3,217円・1位、2,078円・2位）、yogurt-ranking.json（19,239円・1位、17,463円・2位）、bamboo-shoot-ranking.json（1,301円・1位、1,163円・2位）、kakei-quantity-price.json（さといも数量211.4・価格129.4、しょう油134.1・136.4、柿87.7・137.6、緑茶77.4・126.8、ワイン53.7・160.2、たけのこ261.9・78、塩さけ222.4・93.6、さんま180.8・92.5）のすべてと一致し、丸め方も一貫している。捏造・改変は確認されなかった。

図あたりprose字数はquality-gate.mjs実測で726字（床350字・目標550字を大きく上回る）で、各図の直後に「なぜこの分布か」の解釈段落が置かれている。callout 5個はいずれも記事固有の内容で、特に末尾NOTEは指定された3点の読み違い防止知識——①47県庁所在市平均=100であり全国値ではない、②価格指数は品種・ブランドの違いを含む、③対象は二人以上世帯・山形市の年間支出額と年間購入量——をすべて満たしている。ですます調は一貫しており（dearuEndings=0、機械gate確認済）、markdown表・chart-placeholder・記事内「関連」見出しもゼロ。quality-gate.mjsをdocs/21の本ファイルに対して実行し、blocker 0・warning 0（charCount 2902・prosePerChart 726・internalLinksBroken 0・rankClaimCount 14）を確認した。内部リンク（/ranking/konnyaku-consumption-expenditure、/ranking/yogurt-consumption-expenditure、/ranking/bamboo-shoot-consumption-expenditure、/ranking/taro-consumption-quantity、/blog/konnyaku-expenditure-ranking、/areas/06000、/category/economy）は全てHTTP 200で実在を確認した。

## 指摘

- [minor] 「まとめ」節で比較対象に挙げている富山県（海の幸の多冠型）・鳥取県（梨と日本海の海の幸）はいずれも公開済み記事（toyama-food-culture / tottori-food-culture、実測でHTTP 200・記事の特徴描写も一致）が存在するのに内部リンクが張られていない。次回改修時に `[富山の食卓](/blog/toyama-food-culture)` `[鳥取の食卓](/blog/tottori-food-culture)` を追加すると、比較文脈からの回遊が増える。
- [minor]（前回delta reviewから持ち越し・未解消）数量×価格の図（findings）が持つ4区分のうち「支出額が大きい」（生うどん・そば、チーズ、数量116・価格104）に本文が一度も言及していない。次回brushup時に1文追加を推奨する。
- [minor]（持ち越し・未解消）archetype宣言は`E`（網羅ハブ）だが、数量×価格の分解を含む実質的な内容の厚み（H2 7個・charCount 2902）はD2（食品・家計消費）寄り。次回の棚卸しでarchetype値の見直しを検討。
- [minor]（持ち越し・未解消）タイトル「山形の食卓｜こんにゃく・ヨーグルト・筍が日本一」はcuriosity gap要素（なぜ/意外/唯一/vs/倍/?等）を含まない事実列挙型。ただしリード文冒頭で「少し意外な顔ぶれです」とgapを提示しており実害は小さい。
- [minor]（持ち越し・未解消）「山形は『内陸の大地・山・乳製品型』。」など一部に体言止めの断片文が残る。完全な文への書き直しを推奨。

## 判定理由

機械フロア（quality-gate.mjs、docs/21の対象ファイルに対して実行）はblocker 0・warning 0で通過し、本文の全数値がdata/*.json・kakei-quantity-price.jsonと厳密に一致することを確認した。新設の「数量×価格」節は支出額ランキングの言い換えではなく数量×価格という新しい分析軸を提供しており、読者価値・callout品質（読み違い防止の3点セットを含む）・ですます調・内部リンクの実在いずれも問題ない。指摘した5件はすべてminor（回遊強化・体裁・任意の拡充）にとどまり、公開を妨げるBLOCK/MAJORは検出されなかったため verdict: PASS とする。
