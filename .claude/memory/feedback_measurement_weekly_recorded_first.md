---
name: feedback_measurement_weekly_recorded_first
description: ログインが要る計測は週次(土曜の朝)に記録し、セッションではブラウザで取りに行かず記録から判断する (2026-10-20 オーナー指示)
metadata:
  type: feedback
---
ログインが要る取得元 (A8・楽天・note・KDP・GSC の画面) は週 1 回 (土曜 07:00 に Mac がその場でログインして取得する。2026-10-26 に木曜 17:30 から移した。ログインは Mac だけが持ち、CI へは渡さない。2026-10-20 に CI の取得を撤去) だけが取得して記録する。セッション中のエージェントは `data/authenticated/`・`data/affiliate/`・`data/nsm/` などの記録から判断し、Playwright / browser-use / Claude in Chrome で管理画面を開いて取りに行かない。記録が古ければ「判定不能 (最終観測日)」と書いて進める。

**Why:** 毎日の取得はログインの維持と入り直しで毎回オーナーの手が止まった。セッション中のエージェントがすぐブラウザで情報を取りに行き、記録があるのに取り直していた (「記録してある情報から判断したらよいのに」)。

**How to apply:** 判断に数字が要るときは、まず `.claude/rules/recorded-measurement-first.md` の表の記録を読む。足りない粒度はログイン不要の API (`gsc-query.mjs` / `ga4-query.mjs`) だけ使う。ブラウザはオーナーの明示依頼・外部への変更そのもの・失敗した取得元の復旧のときだけ。GSC の Chrome ログインは出張前でも必須ではない (API の検索実績は取れる。止まるのは除外理由の内訳だけ)。関連: [[project_measurement_cycle_ci]] [[project_monetization_contract]]
