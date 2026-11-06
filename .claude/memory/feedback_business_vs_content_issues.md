---
name: feedback_business_vs_content_issues
description: 事業の収益化の問い (事業イシューマップ) とコンテンツの問い (問いの台帳) は台帳・画面・語彙を混ぜない
metadata:
  type: feedback
---

事業イシューマップ (`data/business/issue-map.json`、画面 `/strategy/issue-map`) と問いの台帳 (`data/content/issues.json`、画面 `/content/questions`) は別物として保つ。片方の項目をもう片方の画面へ持ち込まず、問いの `revenue` とマップの列も対応づけない。

**Why:** 2026-11-06 にオーナーが「事業収益化のためのイシューとコンテンツのためのイシューは混在しないように」と指示した。

**How to apply:** コンテンツ側の画面と文書では「問い」と呼び、収益の判断は事業イシューマップへ置く。商品は問いの配信先として繋ぐ (カード `ISSUE-PRODUCT-LINK-01`)。`apps/admin/tests/unit/question-progress.test.ts` が混入を止める。
