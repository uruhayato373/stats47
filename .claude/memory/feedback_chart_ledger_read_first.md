---
name: feedback_chart_ledger_read_first
description: 図の問題を語る前に台帳 svg-lineage-queue.json を読む。source.json の形の合格は値の正しさを保証しない。型の見た目は見本を見せてから全件へ
metadata:
  node_type: memory
  type: feedback
  originSessionId: eb4958fe-f37c-428f-bbfd-1dd7c7637ab6
  modified: 2026-11-04T05:40:52.045Z
---

図のデータが無い・年が分からないと言う前に、`data/blog/svg-lineage-queue.json` と `data/blog/chart-axes-LATEST.md` を読む。値は R2 にあるので、無いのは点の JSON だけのことが多い。

**Why:** 2026-11-04 に散布図の 5 枚を「元データが無い」、既存の復元の道具を「別の台帳向け」と説明したが、どちらも誤りだった。台帳は 5 枚を正しく記録していて、道具もこの 5 枚が対象だった。source.json の形の検査は合格でも、キーが別の指標を指す図があった。灰色の 133 枚を見本の確認なしに反映直前まで進め、オーナーに止められた。

**How to apply:** 図の軸は `axes` だけを読む。source.json の真偽は `audit-chart-axes.ts` の値の検査で判断する。型の見た目を変えるときは実データの見本を先に見せる。[[blog-svg-lineage-enforcement]]
