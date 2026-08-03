---
slug: dual-income-household-ratio-vs-floor-area-per-dwelling-owner
reviewer: blog-critic
mode: full
verdict: PASS
date: 2026-08-03
---

## 評価サマリ

archetype B (相関・真因解明) の必須3視点 (散布図での可視化・見かけの相関vs真因・相関≠因果の明示) はすべて満たしている。数値は data/*.json (2つのランキング47件・散布図47点) と全件突合し、順位・値・areaCode に不一致なし。文体はですます調で統一され (である調0件)、図あたり prose は1,014字/図 (床350字・目標550字を大きく上回る) と解釈の厚みも十分。タイトルは疑問形1要素のみで釣りではなく、本文の因果留保 (「〜と考えられます」「整合的です」) と一致している。中程度の改善余地として、真因分析が「人口密度・地価」という定性的説明に留まり、実際に算出済みの人口統制偏相関 (partialRPopulation=0.837、生の相関0.901からほぼ低下せず) を本文で使っていない点、および TIP callout が言及する人口密度・地価ランキングへの内部リンクが欠けている点を指摘する。いずれも公開を妨げる欠陥ではないため verdict は PASS とするが、次回 brushup での改善を推奨する。

## 指摘

- [MAJOR] 「見かけの相関の裏にある本当の理由」節: 真因を「人口密度や地価、世帯構成」と結論づけるが、data/dual-income-household-ratio--floor-area-per-dwelling-owner-scatter.source.json に既に算出済みの `partialRPopulation: 0.8374` (人口を統制した偏相関、生の pearsonR 0.9014 からほぼ低下しない) を本文で一切引用していない。この数値はむしろ「人口だけでは相関を説明しきれない」ことを示しており、記事の定性的な真因主張(上位/下位の顔ぶれの重なりのみに依拠)を実証的に補強・検証する好機を逃している。次回改訂でこの偏相関値を明示し、「人口を統制してもなお相関が強く残る」という事実を踏まえた記述に修正することを推奨する。
- [MINOR] 「見かけの相関の裏にある本当の理由」節 + `[!TIP]` callout: 地価・人口密度が真因だと繰り返し述べる一方、`/ranking/residential-land-price` や `/ranking/population-density-per-km2-total-area` 等の実在する関連ランキングへの内部リンクが1つもない。TIP callout は読者に「人口密度や地価のランキングとあわせて見る」ことを推奨しているのに、そのランキングへの導線がなく回遊機会を逃している。
- [MINOR] `[!WARNING]` callout: 相関≠因果 (archetype B必須・良い) と「調査年が異なる (2020年 vs 2023年)」という全記事共通になりがちな定型注記が1つのcalloutに混在している。後者はまとめの最終箇条書きでもほぼ同文で反復されており (「調査年が異なる点と、相関イコール因果ではない点に注意」)、callout の情報密度をやや下げている。分離するか、まとめ側の反復を圧縮するとよい。
- [MINOR] 全体: 上記を除き機械ゲート (quality-gate.mjs) は blockers 0 / warnings 0 で通過 (charCount 3043・prosePerChart 1014・h2Count 6・callouts 3・internalLinks unique 5・brokenLinks 0・dearuEndings 0・markdownTables 0)。順位・数値は2ランキングJSON (各47件) と散布図JSON (47点) に全件一致し捏造なし。

## 判定理由

BLOCK 級の指摘はない: 数値・順位はすべて実データと一致し、archetype B の必須分析視点 (散布図可視化・見かけの相関vs真因・相関≠因果) を満たし、文体・構造・内部リンク配置・callout配置の機械フロアもすべて通過している。指摘した MAJOR/MINOR は「より説得力を持たせるための改善」であり、現状でも読者に誤った結論を与えるものではない (因果断定を避けた慎重な言い回しが一貫している) ため、verdict は PASS とする。次回 brushup で偏相関値の引用と関連ランキングへの内部リンク追加を行うことを推奨する。
