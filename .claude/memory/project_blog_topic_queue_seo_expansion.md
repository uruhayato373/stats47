---
name: project_blog_topic_queue_seo_expansion
description: 新規ブログSEO拡充システム (2026-07-05)。「次に何を書くか」の真実源=topic-queue.json (build-topic-queue.mjs)。記事の型に D2/F/G 新設。ranking keys 自動同期。是正キューの姉妹
metadata:
  type: project
---

新規記事の SEO 拡充システム (feature/blog-seo-expansion, 2026-07-05, develop merge 済)。戦略正典 =
`docs/02_実装計画/15_ブログSEO拡充戦略.md`。既存記事の是正 (remediation-queue) とは別系統の**新規記事**版。

## 「次に何を書くか」の真実源
- **`.claude/state/blog/topic-queue.json`** (`build-topic-queue.mjs` が生成)。remediation-queue と同型の
  状態付きキュー (pending/in-progress/done を upsert 保持)。週次 cron (`fetch-metrics-weekly.yml` 後段) で自動再生成。
- スコア: `0.35*queryGap + 0.25*seasonality + 0.20*surprise + 0.20*competitionGap`。
  - queryGap = GSC pages.csv の /ranking imp (専用ブログ記事なし) を norm(log)。既記事化は R2 all.json で dedup。
  - surprise = B型の |r|×カテゴリ距離。人口交絡 (partialPop<0.45 or |r|>0.9) は大減点、同語幹ペア除外。
  - 型別 pending 上限 (B60/A40/D2 40/F15/G15) で B 一色を防ぎ型ミックスを保つ。
- 運用: `--next N` で候補払い出し、`--mark-in-progress/--mark-done --slug` で状態更新。skill `/plan-article-queue`。

## 記事の型 (blog-quality-standards.md §記事アーキタイプ、8型に拡張)
- 既存 A/B/C/D/E に **D2 (食品・家計消費・うどん等勝ちクラスタ) / F (市区町村内格差・決算カード) /
  G (移動フロー・migration-flow)** を新設。月次ミックス B5/D2 4/A3-4/F3/G1-2。
- タイトル実測補正: ~17字・curiosity gap は 1 要素まで (winning-patterns robust: winner gap 使用 28% vs loser 49%、
  BLOG-WAVE-2026-05-25-auto effect/none の教訓)。map/scatter 優先 (+15.4% robust)・550字/図目標。
- B型散布図データは `fetch-correlation-scatter.mjs` が R2 相関 snapshot の scatterData から生成 (手 join 不要)。
- `/draft-from-trend --from queue` でキュー先頭から生産。

## ranking 公開整流化 (RANKING-KEYS-SYNC-01)
- sync-snapshots.yml に `sync-ranking-keys` job: ranking-items R2 push 後に known+sitemap 再生成 →
  develop→main PR 自動作成 (自動マージなし=デプロイ規律)。詳細は [[project_ranking_publish_pipeline_gap]]。
- 1コマンド公開 `/publish-ranking` (ranking-publisher agent 起動口)。

## 未確定 / next
- 生産ペース月15-20本の実測 (BLOG-SEO-PACE-01, 2026-08-31 判定)。新型の 4週後 clicks 中央値で効果判定。
- 中期: correlation snapshot の incremental 化 (metric 3,000 到達前)、非e-Stat source adapter 規約。

[[project_blog_remediation_loop]] [[project_ranking_publish_pipeline_gap]] [[feedback_no_deploy_per_iteration]]
