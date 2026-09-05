---
slug: nara-food-culture
reviewer: blog-critic
mode: delta
verdict: PASS
date: 2026-09-06
---
## 評価サマリ

前回 BLOCK とした「図と本文の品目数が同一節内で矛盾」は解消を確認しました。`data/nara-quantity-price-findings.json` と生成物 `nara-quantity-price-findings.svg` の双方を実測したところ、「ほかN品目」が 12 / 14 / 7 に更新されており、代表列挙分を足すと 高く=4+12=16、多く=4+14=18、支出額大=4+7=11 となって本文の 16・18・11 と完全に一致します。「多く・高く」は代表 2 品目のみを列挙し「ほか」を持たない形で、本文の「2つ」と整合しています。`kakei-quantity-price.json` の rows を category 別に数え直すと 多く高く=2 / 高く=16 / 多く=18 / 支出額大=11 で、図・本文・生データの三者が同じ数を指す状態になりました。差分の内訳（高く=他の鮮魚、多く=他の柑きつ類、支出額大=他の茶葉・他の麺類）も残余品目を含める前提で説明がつきます。rows 総数 124 は本文の「食料124品目」と一致し、牛肉（数量131・価格124）・柿（数量238・価格98）の各指数も生データどおりです。読者が図の「代表4件＋ほかN件」を足して本文の数に到達できるようになり、節内の破綻は残っていません。

## 指摘

- [MINOR] `kakei-quantity-price.json` の `counts` フィールドが stale な旧値（多く高く=2 / 高く=15 / 多く=17 / 支出額大=9）のまま残っています。図・本文はいずれも rows 実測値に統一されたため現時点の記事に実害はありませんが、将来この JSON から図を再生成する際に同じ不一致が再発する導線になります。rows から導出するか、フィールドごと削除しておくのが安全です。
- [MINOR] 丸め方向が段落内で揃っていません。牛肉の数量指数130.6→131・価格指数123.7→124は四捨五入ですが、支出額指数161.5→161は切り捨てです。162に統一するか丸め規則を明示してください（読者の判断は変わらないため公開可否には影響しません）。
- [MINOR・前回から継続] `[!TIP]` callout（「支出額のランキングだけを見ると…見分けられます」）が直前段落の結論の言い換えのままです。callout は5個で適量（3-4個）を超えているため、削除するか牛肉・柿以外の品目に触れて新規性を足すことを引き続き推奨します。
- [MINOR・前回から継続] frontmatter の `archetype: E`（網羅ハブ）は未変更です。実内容は内訳分解＋生活への含意で型D寄りのため、記録の正確性として見直しの余地があります。
- [MINOR・前回から継続] 冒頭の「[家計調査（品目別）](/category/economy)」は未変更です。調査そのものへの言及なので `/survey/kakei-chousa` の方が主題に忠実ですが、リンク自体は実在するため必須ではありません。

## 判定理由

前回の BLOCK（図が旧 counts のままで本文と矛盾）は、findings JSON の「ほかN品目」を 12・14・7 へ修正し SVG を再生成したことで解消されました。図・本文・`kakei-quantity-price.json` の rows を三者突合して一致を実測しています。決定的ゲート（`quality-gate.mjs`）は blockers が「review.md 未通過」の1件のみ、warnings 0（parenNumbers 0 / internalLinksBroken 0 / markdownTables 0 / dearuEndings 0 / svgLineageMissing 0 / svgContentErrors 0 / svgSizeViolations 0 / prosePerChart 800 / charCount 3199 / h2Count 7）で、意味的にも公開を止める欠陥は残っていません。残る指摘はいずれも MINOR で読者の理解を妨げないため、PASS とします。
