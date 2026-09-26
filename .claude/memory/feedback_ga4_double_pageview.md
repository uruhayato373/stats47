---
name: feedback_ga4_double_pageview
description: SPA で手動 page_view を送るなら GA4 拡張計測の「履歴変更でのページ変更」を OFF に。ON だとサイト内遷移 1 回 = 2 件 (2026-09-26 に実測・是正)
metadata:
  type: feedback
---
GA4 の拡張計測「ブラウザの履歴イベントに基づくページの変更」(pageChangesEnabled) が ON のまま、アプリも
`PageViewTracker` で page_view を手動送信していたため、サイト内遷移 1 回で page_view が 2 件送られていた。
しかも手動分は `page_referrer = document.referrer` (SPA では着地時の値のまま) で、回遊の参照元が空だった。

**Why:** `send_page_view: false` は初回の自動 page_view を止めるだけで、拡張計測の履歴変更 page_view は止めない。
本番の `/g/collect` 送信を観測して初めて判明した (設定画面やコードを読むだけでは分からない)。

**How to apply:** GA4 の計測を変えるときは本番で `/g/collect` を傍受して件数と参照元を実測する。
監査 `npm run google-admin:audit-api` は拡張計測を読み、ON なら `page-changes-double-count` を警告する
(週次 measurement-cycle の `ga4Settings`)。2026-09-26 は PV・回遊の不連続点
(`.claude/state/metrics/releases/2026-09-26-ga4-measurement-v2.json`)。関連: [[project_ga4_setup]]
