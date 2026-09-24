---
name: feedback-ga4-journey-referrer-over-navclick
description: サイト内回遊はnav_clickでなくreferrer集計(週次internal-transitions.csv)で読む。GSC 0でもBing流入はGA4に出る
metadata:
  node_type: memory
  type: feedback
  originSessionId: cfc716c2-3e72-4829-9d06-bc9944616b5a
  modified: 2026-09-24T10:51:52.642Z
---

サイト内の回遊 (blog→ranking、theme→ranking/blog) を nav_click の件数で判定しない。2026-09-24 の実測で、
テーマ→ランキングの実遷移 44 件 (page_view の pageReferrer) に対し `theme_ranking` の nav_click は 3 件だった。
計装されていないリンクの遷移は nav_click に出ない。

**Why:** BLOG-SRCLINK-01 / THEME-INTERNALNAV-01 / THEME-LOCALFINANCE-01 が「GA4 creds のある環境で再試行」のまま
期限を過ぎていた。必要な内訳が週次 snapshot に無く、都度のアドホック照会に依存していたため。
同日、週次 snapshot に `internal-transitions.csv` (参照元セクション→着地セクション) と `landing-context.csv`
(着地別の PC 比率・平日 9–18 時比率) を追加した (コミット 3ea0fece3)。

**How to apply:**
- 回遊の判定は `.claude/skills/analytics/ga4-improvement/reference/snapshots/<YYYY-Www>/internal-transitions.csv` を読む。
- 「GSC clicks 0 なのに流入が増えた」ページは Bing の自然検索を疑い、GA4 の `sessionSourceMedium` で確かめる
  (local-finance の W34 急増は bing/organic 189/204 PV で、「organic 起因ではない」という旧判断は誤りだった)。
- この Mac にはサービスアカウント鍵 `stats47-f6b5dae19196.json` があり、Data API も Admin API の読み取りも使える。
  Admin API 監査は `GA4_PROPERTY_ID=463218070 npm run google-admin:audit-api` (env を渡さないと property-id-missing で止まる)。

関連: [[feedback-ga4-history-unreliable-wow]] [[project_ga4_setup]]
