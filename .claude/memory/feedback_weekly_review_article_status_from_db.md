---
name: feedback_weekly_review_article_status_from_db
description: 週次レビューで記事公開実績を判定するときは articles テーブルを見る。git/backlog だけだと誤判定する
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ccd7bb0c-e480-403f-b73e-2c9eed8623cd
---

週次レビュー（/weekly-review）の Agent B / D で「記事公開できたか」を判定するときは、必ず D1 `articles` テーブル（`SELECT slug, published, published_at FROM articles`）を真実源にする。git commit ログ・backlog ファイル・`docs/21_ブログ記事原稿/` の下書きフォルダ有無だけで判定しない。

**Why:** 2026-W21 レビューで ai-claude-code-pref-analysis 記事を「未達」と誤記録した。実際は 2026-05-17 公開済み（本番 200）。記事は publish-article スキル（下書きフォルダを削除し git に痕跡を残す）ではなく別経路（publish-bulk-articles 等が `.local/r2/app/blog/<slug>/` に直書き）で公開されたため、git ログにも下書きフォルダにも痕跡がなかった。backlog の frontmatter `status:` も `writing` のまま放置されており当てにならない。

**How to apply:** /weekly-review Agent B（コンテンツ実績）と Agent D（計画差分）で記事公開状況を出すときは `articles` テーブルの `published=1` / `published_at` を必ず照合する。published_at が当週内のものを「今週公開」とする。R2 は `.local/r2/blog/` と `.local/r2/app/blog/` の両方を確認（後者が現行の正キー）。関連: [[feedback_weekly_plan_content_over_sns]]。
