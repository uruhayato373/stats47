---
name: skill-schema-drift-ddd-migration
description: SKILL.md が DDD migration 後の現行 schema に追従していないケースが頻発。新規スキル実行前に必ず DB schema との整合チェックを行う
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 69ea2f2c-4744-4552-b09e-e35323e5abc5
---

2026-04 の DDD migration (sources/indicators/observations → 3 層化) で、複数の SKILL.md が古い schema を前提のまま放置されている。

**Why**: 2026-05-17 セッションで `publish-youtube-normal` / `plan-youtube-normal` が `indicators`/`observations` テーブル参照のまま放置されていることが発覚。実行すると `no such table: indicators` で即死。同様に `push-r2` SKILL.md は廃止された `sync-upload.ts` を参照 (実体は `diff-push-r2.ts` のみ)。

**How to apply**:
- DDD 関連 skill (publish-*, render-*, fetch-estat-data 経由でデータを書く skill) を新規実行する前に、必ず `.schema metrics; .schema stats_prefecture` で現行 schema を確認
- 失敗が見えたら SKILL.md 本体を `metrics` + `stats_prefecture` ベースに書き換えてから実行
- 旧 → 新 マッピング:
  - `indicators` → `metrics` (列: `key`, `title`, `subtitle`, `unit`, `normalization_basis`, `tags` (JSON 文字列), `category_key`, `is_active`, `is_featured`)
  - `observations` → Phase 6 で D1 から削除済、R2 `app/stats/<metric>/values.json` 等に移行
  - `indicators.ranking_key` → `metrics.key`
  - `observations.category_code` → R2 `app/stats/<metric>/` の path に格納
  - 旧 `indicator_tags` / `tags` テーブルは存在しない (tags は `metrics.tags` JSON 文字列内)
  - 旧 `latest_year` カラムは存在しない (`year_code` のみ)
  - 旧 `area_type` も metrics には無い (prefecture デフォルト想定; 市区町村は `city_indicators` 別テーブル)
- R2 操作系: `sync-upload.ts` 廃止 → `diff-push-r2.ts` (`npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix <p>`) を使う
- 修正済 skill: `.claude/skills/sns/{publish,plan}-youtube-normal/SKILL.md` (commit `e3e46b06`)
- **未修正 (2026-05-28 検出)**: `.claude/skills/blog/discover-trends/SKILL.md` Phase 3 のクエリ (indicators / indicator_tags / tags JOIN / latest_year / area_type 参照) — trend-scout 実行時に schema correction を prompt で渡せば動作するが、SKILL.md 本体も書き換え推奨

**DBレス移行による追加 drift (2026-06-06 検出)**: 完全DBレス移行で local SQLite (`.local/d1/.../*.sqlite`) は不在になったが、`weekly-review` SKILL.md の Phase 1 Agent B/C/2.5 が `sqlite3 <miniflare path>` で `sns_posts` / `articles` / `metrics` を直接 query する手順のまま放置。実行すると DB 不在で全 query スキップになる。
- **回避策 (今回採用)**: Agent B/C を git TS / R2 公開URL / `.claude/state/metrics/*/LATEST.md` / `docs/` 参照に置換。articles published は `grep -rl 'published: true' docs/21_ブログ記事原稿/*/article.md`、metrics は git TS config、SNS は `sns-metrics-improvement/snapshots/` (DB cache は無い)。
- **未修正**: `weekly-review` SKILL.md 本体 (Phase 1 Agent B/C, Phase 2.5 ロードマップ更新) は DB query 前提のまま。書き換え推奨。
- Phase 2.5 のロードマップ実測値更新も DB 依存で動かない。docs/21 article.md 数 (162) と旧ロードマップ値 (182本) は計測法が違うため安易に上書きしない。

**関連**: [[project_observations_migration]] / [[project_dbless_migration_2026_05_29]]
