---
name: feedback-ga4-history-unreliable-wow
description: GA4 history.csv の pageviews 列は週次ラベルだが中身は last28d/bot 混入値で WoW 比較に使えない
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 18c16bc4-6b2e-4625-9a86-02e4e580ce9e
---

`.claude/state/metrics/ga4/history.csv` および `LATEST.md` の `pageviews` 列は週次ラベルが付くが、実態は last28d ローリング値または bot 混入値が混在しており、週次ラベルと中身が一致しない。

実証 (2026-05-21): GA4 Data API を直接照会したカレンダー週 PV は W20=2,039 / W21=2,836 だが、history.csv は W20=9,028 / W21=2,830。W20 が 4.4 倍乖離。LATEST.md の「前週比 -68.7%」は実トラフィック減少ではなく計測アーティファクト。実際は Organic Search PV が W20→W21 で +44% と増加基調。

**Why:** weekly-review / weekly-plan が GA4 PV の前週比を判断材料にすると誤判定する。AdSense 収益判定の倍率計算も狂う。

**How to apply:** PV の WoW 監視は GA4 history ではなく `.claude/state/metrics/gsc/history.csv` の clicks/impressions（週次バケットで整合）と AdSense console PV を使う。GA4 を使う場合は API を直接照会し country=Japan + カレンダー週で集計する。恒久対処は GA4 history 生成スクリプトの修正（要 Issue 起票）。

関連: Git履歴上のGA4 bot混入監査・収益化レビュー、[[project_ga4_setup]]
