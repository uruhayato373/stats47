---
slug: nagasaki-food-culture
reviewer: blog-critic
mode: delta
verdict: PASS
date: 2026-09-06
---

## 評価サマリ

前回 (mode: full) の BLOCK 1件・MAJOR 1件がいずれも解消されたことを、変更箇所に限定して検証しました。ラーメン節には `data/ramen-ranking.svg` が見出し直下に挿入され、その直下に `/ranking/ramen-dining-consumption-expenditure` の source-link が1枚だけ置かれています。これでタイトルの2本柱（「刺身も日本一」「なぜラーメンは苦手?」）の双方に視覚的裏付けが揃い、他の3ランキング節と構成が対称になりました。数量×価格分解チャートの見出しは、矛盾していた「平均並み以下」表現が JSON・SVG の双方で閾値表現「〈120未満〉」へ是正され、例示数値（緑茶118・ぶり116・干ししいたけ価格119.3）と見出しの論理が一致しています。図が1枚増えたことで図あたり prose は704字となり、床350字・目標550字をいずれも上回っています。変更 hunk が新たな意味的破綻を生んでいないことも確認しました。

## 指摘

- [解消済] [BLOCK] ラーメン節の図・source-link 欠落 → `![中華そば消費支出額 上位5・下位5](data/ramen-ranking.svg)` が H2 直下に、source-link がその直下に1枚挿入済み。SVG 実在を確認（6,879 bytes・2026-09-06 09:08 生成）、3点セット（`.json` / `.source.json` / `.svg`）も揃い、source.json は `kind: "ranking"` + rankingKey + restore コマンドを持つ復元可能な系譜です。SVG 内の県名（山形・新潟・長崎・兵庫・愛媛）と data JSON の値（1位 山形22,389円 / 2位 新潟16,292円 / 45位 長崎4,868円 / 46位 兵庫4,192円 / 47位 愛媛3,935円）は本文の記述と完全一致し、順位・値の逆転はありません。決定的 lint も `dupRankingLinks: 0` / `adjacentClusters: 0` / `noFigureSectionLinks: 0` / `tailRankingLinks: 0` で配置規約を満たします。
- [解消済] [MAJOR] 分解チャートの見出しと表示数値の矛盾 → 「高く買う（数量は突出して多くない〈120未満〉のに単価が高い）」「多く買う（単価は突出して高くない〈120未満〉のに量が多い）」へ是正され、SVG も同文言で再生成済み（JSON・SVG 双方で「平均並み以下」の残存ゼロ、「120未満」が各2箇所で一致）。実際の分類ロジック（閾値120）と見出しが一致したため、図だけを見た読者が逆の理解をする恐れは解消しました。
- [MINOR・据置] カステラ節「2位以下がいずれも1,000円台〜2,000円台に収まる中」は、実データ上2位以下の最大が茨城1,723円で「2,000円台」の県が存在しません。次回 brushup で「1,000円台に収まる中」へ縮めると正確になります。公開を妨げる誤りではないため据え置きます。
- [MINOR・据置] frontmatter の `archetype: E`（網羅ハブ・目安1,800-2,400字）は実内容（4ランキング＋数量×価格分解・3,519字）と乖離し、D2（食品・家計消費）寄りです。天井ループ分析の型別集計精度のため、次回見直しを推奨します。

## 判定理由

BLOCK が0件、MAJOR が0件のため verdict は PASS とします。`quality-gate.mjs` の blockers は「critic レビュー未通過」の1件のみで、これは本 review.md を verdict: PASS で確定させることで解消する自己参照的なゲートです。他の決定的指標（callouts 5 / h2Count 7 / charCount 3,519 / prosePerChart 704 / internalLinksBroken 0 / parenNumbers 0 / dearuEndings 0 / markdownTables 0 / svgLineageMissing 0 / svgContentErrors 0 / svgSizeViolations 0 / missingSvgFiles 0）はすべて基準内で、warnings もゼロです。残る2件の MINOR は表現の精度と型宣言に関するもので、読者が誤った事実を受け取る性質のものではないため、公開を止めません。
