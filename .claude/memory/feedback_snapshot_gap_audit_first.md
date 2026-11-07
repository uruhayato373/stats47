---
name: feedback-snapshot-gap-audit-first
description: 検査が「本番データの欠落」と言っても、再生成の前に生成側と検査側の比較の形をそろえて確かめる
metadata:
  type: feedback
---

CI の「snapshot の欠落」は、本番のデータではなく検査の比較が誤っていることがある。本番を書き換える前に、生成側の処理で 1 件を解決して検査の値と比べる。

**Why:** 2026-11-07 に監査が「surveyIds 欠落 20 記事」と報告し、本番 R2 の再生成が要ると判断して実行した。実際は snapshot が調査 ID をハブへ寄せて焼くのに、監査が寄せる前の ID で比べていただけで、再生成では何も変わらなかった。
**How to apply:** 再生成を頼む前に、欠落と言われた 1 件を `getSurveyTaxonomyEntries` など生成側の関数に通す。main と develop の差分も見る。
