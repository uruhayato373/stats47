---
name: project_blog_publish_cloud_first
description: ブログ公開は cloud-first パイプライン publish-blog.yml が正典。docs/21 ドラフト → CI が R2 反映。article-writer は公開R2URL+docs/21 で完全DBレス化済
metadata: 
  node_type: memory
  type: project
  originSessionId: 7521eef0-6e8c-4798-bf92-aeabd0b7910e
---

2026-05-30 確立。ブログ記事の新規公開は **完全DBレス / cloud-first** の固定フロー。

**フロー (publish-blog.yml = `.github/workflows/publish-blog.yml`):**
1. agent (article-writer) が `docs/21_ブログ記事原稿/<slug>/{article.md,data/*.json,ogp/ogp.json}` に**ドラフト**を書く (`.local/r2` には書かない)
2. `gh workflow run publish-blog.yml -f slug=<slug> -f dry_run=false` で公開 (dry_run=true が既定で安全)
3. CI が: factual gate (`ci-factual-gate.mjs`) → docs/21 を `.local/r2/app/blog/<slug>` に cp + `published:true`/`publishedAt` セット → thumbnail 生成 → **2-phase push** (記事本体を先に cloud push → `export-blog-snapshot.ts` で all.json union 再生成 → index push) → live 200 確認
4. 公開後 docs/21 ドラフトは削除 (`check-published-drafts.cjs` が残骸を検出して exit 1)

**非自明な制約 (踏んだ順):**
- **新規 workflow は default branch (main) に無いと `gh workflow run` でディスパッチ不可**。develop にしか無い間は `gh workflow run publish-blog.yml --ref develop` で起動する
- **publish-blog は直列ディスパッチ必須**。`concurrency: group=publish-blog, cancel-in-progress:false` のため、並行ディスパッチすると pending run が **CANCELLED** される。1 本ずつ完了を待つ
- export-blog-snapshot は cloud(S3 list) を読むため、新記事を all.json に含めるには**先に記事本体を push** してから all.json 再生成 (CI は 2-phase で対応済)
- 二重公開防止: `/usr/bin/curl -s https://storage.stats47.jp/app/blog/all.json` に slug が無いことを確認
- D1 articles テーブルは廃止。article.md frontmatter が SSOT (INSERT SQL は不要)

**article-writer agent (`.claude/agents/article-writer.md`) は 2026-05-30 に整合済:** データ取得=公開 R2 URL (`https://storage.stats47.jp/app/ranking/<key>/values.json`, SSD/認証不要)、metric メタ=git TS、出力=docs/21、タイトル=curiosity gap (`.claude/rules/blog-quality-standards.md`)。**再び `.local/r2` 直読 / sqlite3 / D1 INSERT SQL を書かせないこと。**

**残タスク (未実装・将来):** publish-article SKILL の cloud-first 化、quality-gate.mjs の draft モード対応。

関連: [[project_blog_brushup_risk_2026_05_25]] [[project_dbless_migration_2026_05_29]] [[feedback_bulk_blog_publish_isr_404]]
