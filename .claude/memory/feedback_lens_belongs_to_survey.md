---
name: feedback-lens-belongs-to-survey
description: 分析の切り口は資料(本)ではなく統計調査の持ち物。調査ごとの切り口台帳 data/surveys/lenses/<surveyId>.json に置き、本の問いは lensIds で結ぶ。「資料ごとに分類を作らない」を「切り口台帳を作らない」と読み違えない
metadata:
  node_type: memory
  type: feedback
  originSessionId: a011cd28-5286-4f8c-b46f-bbaf67fb76e8
  modified: 2026-11-02T02:28:28.197Z
---

切り口 (家計調査なら都市比較・数量と単価・年収階級・長期推移・季節など) は調査ごとの台帳 `data/surveys/lenses/<surveyId>.json` (担当 survey-curator、規約 `survey-content-standards.md`「調査の切り口台帳」) が正本。本・NotebookLM の問いは `analyses.json` の `lensIds`、分析単位は `kakei-analysis-catalog.ts` の `lensId` で参照する。展開の状況は台帳に書かず `npm run surveys:lenses:status` で展開記録から集計する。

**Why:** 2026-11-02、参考文献規約の「資料ごとに分類・保存層を作らない」を「切り口の台帳を作らない」と読み、切り口を本の企画に付ける札へ格下げしかけた。オーナーに「調査ごとに切り口を台帳管理した上で展開を考えるべき」と指摘された。それまで切り口は本の分析台帳・ブログ用論点カタログ (廃止)・分析単位台帳・参照文書に散っていた。

**How to apply:** コンテンツ (ブログ・note・Kindle・SNS) を企画する前に切り口台帳を読み、問いをどの切り口に結ぶか決める。資料ごとに論点カタログや切り口一覧を作らない。新しい切り口は survey-curator が台帳に足す。`surveys:lenses:check` (PR CI) が未接続の問いを止める。関連 [[project_kakei_marketing_book_pipeline]] [[feedback_authored_ledgers_in_data]]
