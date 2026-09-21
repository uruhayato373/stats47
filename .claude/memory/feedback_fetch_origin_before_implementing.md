---
name: feedback_fetch_origin_before_implementing
description: 実装着手前に git fetch + origin/main vs ローカルHEAD を必ず diff する。並行セッションが同日 push しており stale ローカルで既デプロイ作業を重複実装する事故が起きる
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 36d9b50f-c3c3-4328-a061-40b2d094d059
---

このリポジトリは**複数の Claude セッションが同日に develop/main へ push している**（例: 2026-06-14 時点で feature/blog-rewrite-batch-20260614・feature/data-layer-optimization-20260614 が並走、PR #479 が同日デプロイ済）。そのため**ローカル main が origin/main より遅れている**ことが頻繁にある。

**事故 (2026-06-14)**: 「回遊性 + AdSense 動線最適化」依頼で、ランキングのモバイル本文中広告を考察直下へ移設する変更を実装したが、**全く同じ変更が同日 PR #479 (commit 96635294) で既に本番デプロイ済み**だった。原因はローカル main (830b14de) が origin/main (96635294) より 1 commit 古く、stale な版に編集していたこと。バックログにも ADSENSE-MOBILE-INCONTENT-01 が既登録だった。

**How to apply**: 実装系タスク（特に改善バックログ/収益化戦略の施策）に着手する前に必ず:
1. `git fetch origin main develop`
2. `git rev-list --count HEAD..origin/main`（>0 ならローカルが古い → 先に ff 同期）
3. 着手予定の施策が `.claude/todo/improvements.md`（origin/develop 版）と `git log origin/develop -S "<施策ID/キーワード>"` に既存でないか検索
4. 触る予定のファイルが既に origin で変更済みでないか `git show origin/develop:<path>` で確認

**Why**: stale ローカル + 並行セッションの組合せで「既デプロイ済みの作業を重複実装→破棄」が起きる。fetch + diff を 1 分かけるだけで丸ごと回避できる。関連: [[feedback_shared_working_copy_git_race]]（2 セッションが同一 working copy を共有する別ケース）。

**2026-09-20 再発 (別形)**: 共有作業ツリーが origin/develop より 38 コミット遅れのまま note の footer を直し、cherry-pick で push した。前日の `ab20af08b` が同じ `navigation-footer.mjs` のサイトカード判定を `hasStats47Url`→`hasUrl(siteUrl)` に変えていたため、ローカル検証 (旧ルール) では 0 本、CI (新ルール) では 22 本 pending になり、原因特定に CI 5 往復かかった。**触るファイルは `git diff origin/develop -- <path>` で上流差分を先に読む**。ローカルで再現できない CI 差は「同じコードか」を最初に疑う。
