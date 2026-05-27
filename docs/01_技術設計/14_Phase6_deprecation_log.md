---
type: tech-design
status: active
tags: [phase6, deprecation, d1, r2, migration]
date: 2026-05-28
---

# Phase 6 (D1 → R2 移行) Deprecation Log

Phase 1-6 で D1 (15GB) を R2 へ全面移行し、Phase 6.7 で legacy 資産を整理した記録。

## Phase 6 全体サマリ

| 指標 | Before | After |
|---|---|---|
| D1 サイズ | 15GB (Cloudflare 上限 10GB 超) | 336MB (~2.2%) |
| 観測値ストア | D1 `stats_*` 4 テーブル + `correlations` | R2 `app/stats/<metric>/*.json` (2,207 metric) |
| metric メタ SSOT | D1 `metrics` テーブル直接編集 | `packages/data-configs/src/metrics/<key>.ts` (TS-config) |
| 値の SSOT | D1 stats_* テーブル | R2 `app/stats/<metric>/*.json` |
| D1 metrics テーブル | SSOT | TS-config からの cache (sync-metrics-cache で同期) |

## 2026-05-28 削除 (Phase 6.7)

### Skill (3 本)

| 旧 skill | 削除先 | 置換 |
|---|---|---|
| `/populate-all-rankings` | `.claude/skills/db/populate-all-rankings/` | `/page-data-batch` |
| `/populate-city-rankings` | `.claude/skills/db/populate-city-rankings/` | `/page-data-batch --kind city` |
| `/register-ranking` | `.claude/skills/db/register-ranking/` | TS-config 追加 (`packages/data-configs/src/metrics/<key>.ts`) + `/sync-metrics-cache --apply` + `/page-data-batch --metric <key>` |

関連スクリプト削除:
- `.claude/commands/{populate-all-rankings,populate-city-rankings,register-ranking}.md`
- `packages/ranking/src/scripts/{populate-all-rankings,populate-city-rankings}.ts`

### Agent (2 本)

| 旧 agent | 削除先 | 後継 agent |
|---|---|---|
| `data-pipeline` | `.claude/agents/data-pipeline.md` | `estat-researcher` + `data-ingester` |
| `db-manager` | `.claude/agents/db-manager.md` | `db-schema-manager` + `snapshot-exporter` + `r2-publisher` + `data-ingester` |

両 agent は既に分割先が独立稼働しており [移行ステータス] マーク済だった。

### Data Storage 規約 (新方針)

- D1 への書き込み skill 許可リスト: `/sync-metrics-cache` / `/sync-articles` / `/populate-component-data` / `/register-affiliate-banner` / area-profile・theme batch
- 上記以外で D1 `metrics` / 派生テーブルへ直接 INSERT する skill は新規追加 NG (PR レビューで reject)

詳細: `.claude/rules/data-d1-ssot.md`

## Phase 7 未対応 (本ログ作成時点)

以下は Phase 6.7 のスコープに収まらず、別タスクとして繰り越し:

### A. Drizzle schema 6 ファイル削除 + reader refactor

- 削除対象: `packages/database/src/schema/{stats-prefecture,stats-city,stats-port,stats-migration-flow,stats,correlations}.ts`
- 前提: `packages/ranking` / `packages/correlation` / `packages/area-profile` 配下 12 ファイルが `statsPrefecture` 等を JOIN で参照中 (実 D1 にテーブル無いため runtime 実行で失敗する可能性)
- 着手判断: production が壊れた reader を呼んでいるか確認後

詳細: `docs/50_Issues/feature-backlog.md` の "Phase 7: stats_* schema + correlations schema 削除" 項

### B. `/recompute-correlations` 実装

- 現状: SKILL.md は作成済、実装スクリプト未作成
- 既存の `app/correlation/*.json` snapshot は Phase 6 以前の D1 派生で運用継続中
- 着手判断: 新規 metric が大量に追加されて相関データが陳腐化したタイミング

詳細: `docs/50_Issues/feature-backlog.md` の "Phase 7: recompute-correlations 実装" 項

### C. 未投入 2 metric の source ID 確定 + R2 投入

- `population-migration-net-municipality` (e-Stat 住基移動報告 city 版): `statsDataId` 未確定
- `station-passengers-annual-total` (国交省 駅別乗降客数調査): MLIT `resourceId` 未確定
- 現状: TS-config 作成済 (placeholder source ID + TODO)、`apps/remotion/public/migration-flow/municipalities/`・`apps/remotion/public/station-passengers/` の 2026-05-25 snapshot を継続使用

確定方法: `/search-estat` / `/inspect-estat-meta` で e-Stat 検索 → TS-config の `source.statsDataId` / `source.resourceId` を更新 → `/page-data-batch --metric <key>` で投入。

### D. Orphan scripts 削除

- `packages/database/scripts/ingest-migration-flow.ts`
- `packages/database/scripts/populate-port-statistics.ts`
- `packages/ranking/src/scripts/seed-city-ranking-items.ts`

これらは `stats_*` テーブルに INSERT する scripts で、もはや active な呼び出し元なし。Phase 7 で schema 削除と同時に削除。

## 関連

- Phase 6 親 plan: `~/.claude/plans/synthetic-zooming-yeti.md`
- Phase 6.7 plan: `~/.claude/plans/drifting-cuddling-blossom.md`
- データ管理アーキテクチャ: `.claude/rules/data-d1-ssot.md`
- R2 namespace 設計: `.claude/rules/r2-storage-design.md`
- 動画データ SSOT: `docs/01_技術設計/13_動画データSSOT.md`
