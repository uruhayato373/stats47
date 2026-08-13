---
slug: retail-store-count-vs-nurses-per-100k-population
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-08-13
---
## 評価サマリ

型B（相関・真因解明）の構成（指標A→指標B→散布図→相関≠因果の順）が正しく踏襲されており、前回REVISEで指摘した2件のBLOCKが解消された。①「人口10万対看護師数」の指標ラベルと実値の矛盾は、`[!NOTE]`（35-36行目）で「正規化前の実数に近い水準と考えられる」と正直に開示する形で処理されており、読者を誤導しない誠実な扱いになっている。②archetype B必須の定量評価も、散布図データに計算済みの偏相関値（`partialRPopulation: 0.7049796433680529`）を本文59行目で正しく引用し（「0.7程度の相関がなお残ります」）、「人口規模だけが唯一の要因とは言い切れない」と[仮説]付きで踏み込んでいる。両ランキングの上位10県・下位10県の一致数（同一10県／9県共通・差分は奈良県と和歌山県）、店舗数18.5倍・看護師数15.9倍の倍率は実データ（`retail-store-count-vs-nurses-per-100k-population-prefecture-rankings.json` / `nurses-per-100k-population-prefecture-rankings.json`）と完全一致しており、捏造・誤読の兆候はない。

## 指摘

- なし（BLOCK・MAJORとも残存なし）

## 判定理由

前回REVISEの2件のBLOCK（指標ラベル矛盾の未開示／偏相関の未使用）がいずれも解消されたため`PASS`とする。人口10万対看護師数セクションに`<source-link>`カードが無い点は継続しているが、`article.prompt.txt`が「ランキングへの導線は1枚だけ・1つ目の図の直後」と明示的に制約しており、意図的な仕様上の設計であって記事の欠陥ではない（同一hrefカードの重複配置を避けるための制約であり、`blog-quality-standards.md`の一般原則より個別記事の明示仕様を優先する）。文体（ですます調）・markdown表の不使用・callout配置（NOTE/WARNING/TIP各1で記事固有の内容）・内部リンク5本・タイトルのcuriosity gap（疑問形1要素・17字）・数値の書き方（県名直後の括弧に値を書かない）も基準を満たしている。
