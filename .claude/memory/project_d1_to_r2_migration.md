---
name: D1 to R2 Migration Phase Progress
description: D1→R2 撤廃 ALL Phase 0-10 完了 (2026-04-29)。production D1 削除済、月次 ~$50 圧縮達成。ローカル D1 が source of truth + R2 snapshot 経由配信
type: project
originSessionId: d40fc3d5-f02b-483e-9532-39758e00c099
---
D1→R2 完全撤廃マスタープラン (`/Users/minamidaisuke/.claude/plans/d1-r2-prancy-haven.md`) は **2026-04-29 に Phase 10 まで全完了**。本番 stats47_static (UUID `6cea2d7a-87c2-408b-9de3-72b1bc240478`) は削除済、Cloudflare アカウントの D1 残数 = 0。

**Why:** 2026-04 月次 \$26.62 の主犯が D1 full-scan。本サイトは読み取り専用 (apps/web に INSERT/UPDATE/DELETE 0 件) のため D1 不要。

**How to apply:**
- D1 read 計測: Cloudflare GraphQL `d1AnalyticsAdaptiveGroups` / `d1QueriesAdaptiveGroups`。Token は `.env.local` の `CLOUDFLARE_API_TOKEN`。
- 既存 reader pattern: ローカル D1 → exporter → R2 snapshot (`snapshots/<domain>/...`) → fetch + in-memory cache の reader (`read*FromR2`) → page.tsx 切替。
- Build 時は noop adapter + NEXT_PHASE=phase-production-build skip パターン (PR #164/#165/#166)。
- 退行防止: `.github/workflows/pr-quality-check.yml` の D1 Import Gate (直接 import + 間接 known-bad シンボル両方)。
- 緊急時の D1 復元手順: 1) wrangler でリモート DB を再作成 2) Drizzle migration 実行 3) /sync-remote-d1 でローカル D1 を push。**ローカル D1 (8.4GB SQLite) が source of truth として残置**。

## 完了済 (2026-04-29 時点 = ALL DONE)

| Phase | 内容 | PR | 効果 |
|---|---|---|---|
| 0 | /correlation の top-pairs / stats を R2 化 | #149 | -75% (D1 read の 96%) |
| 1 | /correlation 削除 + CorrelationSection R2 化 | (#149 統合) | 残 correlation D1 read = 0 |
| 2 | ranking_items / surveys / categories master R2 化 | #163 | -50% |
| 3 | ranking_values partition R2 化 (29,642 partitions / 788MB) | #170 | -95M rows/月 |
| 4 | articles / article_tags / tags R2 化 | #167 | blog 系 D1 = 0 |
| 5 (ai) | ranking_ai_content (1,943 行 / 11MB) | #168 | per-page lookup |
| 5b | page_components / page_component_assignments | #170 | dashboard 系 D1 = 0 |
| 5c | area_profile / affiliate_ads | #170 | areas 系 D1 = 0 |
| 6 | RankingChart / RadarChart / fishing_ports / port_statistics | #170 | apps/web runtime D1 import = 0 |
| 7 | CI gate: pr-quality-check.yml | #172 | 退行防止 |
| 7+ | 5 個の間接 D1 リーク修正 + ranking-items snapshot に tags 同梱 | #174 | rows read -99.51% |
| 7++ | getTagsForItem 残存 152 q/h を修正 | #175 | D1 read = 0 達成 |
| 8 | wrangler.toml prod D1 binding 削除 | #176 | binding なし |
| 9 | (実質 5 分観測で代替、Time Travel/復元手段は確認済) | — | — |
| 10 | リモート D1 (stats47_static) 解約 | (REST API DELETE) | D1 残数 0 |

## 計測比較 (Cloudflare GraphQL d1QueriesAdaptiveGroups, 1h sample)

| | Before (修正前) | Phase 7+ (PR #174 後) | Phase 7++ (PR #175 後) | Phase 8 後 | Phase 10 後 |
|---|---|---|---|---|---|
| Queries/h | 265 | 152 | 0 | 0 | (DB なし) |
| Rows read/h | 82,950 | 404 | 0 | 0 | (DB なし) |

## R2 snapshot inventory (canonical state, 2026-04-29)

```
snapshots/
├── ranking-items/all.json (3,050 件、tags 同梱、4.7MB)
├── surveys/all.json (41 件)
├── categories/all.json (17 件) + by-key/<key>.json
├── correlation/by-ranking-key/<rk>.json (1,830 files)
├── ranking-values/<rk>/<areaType>/<year>.json (29,642 partitions / 788MB)
├── blog/all.json (134 articles + 327 tags)
├── ai-content/all.json (1,943 rows)
├── page-components/all.json
├── area-profile/all.json
├── affiliate-ads/all.json
├── ranking-page-cards/all.json
├── fishing-ports/all.json (2,896 ports)
├── ports/all.json (699 ports)
└── port-statistics/{years.json, by-year/, by-port/}
```

更新コマンド: `bash .claude/skills/db/sync-snapshots/run.sh` (PR #173)

## 共通実装 pattern

- **R2 reader**: in-memory cache (`let cached: Snapshot | null = null`) + fetchFromR2AsJson + 30 日 stale 警告。
- **Exporter**: `apps/web/scripts/export-<domain>-snapshot.ts` または `packages/<domain>/src/scripts/`。`npx tsx -r ./packages/ranking/src/scripts/setup-cli.js <script>` で server-only バイパス + .env.local ロード。
- **D1 binding 不在 (build時)**: `getStaticDatabase()` で try/catch、build 時は createNoopAdapter() (PR #164)。
- **重い処理 (topology, per-key correlation, partition fetch)**: build 時は throw/skip → caller の null フォールバック → ISR で初回フェッチ (PR #165, #166)。
- **Partition 設計**: ranking_values は `snapshots/ranking-values/<rk>/<areaType>/<year>.json` (33K files)、port_statistics は by-year + by-port の 2 軸 (715 files)。
- **Exporter で OOM 回避**: 全件読込はメモリ爆発する → ranking_key 単位 chunk 処理 (Phase 3 で OOM、commit 19485ea5 で修正)。
- **Rate limit 対策**: CF REST API 一括書込で 429/504 → retry with exponential backoff、parallelism=1〜4 まで下げる (Phase 6 で port export が 504 で止まった)。

## Build hang 履歴 (再発防止)

build 時 2,023 ranking pages × 各々の fetch が直列化すると 30 分超で timeout。要因:
1. per-key correlation R2 fetch (1,920 個): NEXT_PHASE skip で解決 (PR #165)
2. fetchPrefectureTopology が 2,023× キャッシュ無し fetch: NEXT_PHASE throw で解決 (PR #166)

新しいページレンダラに重い fetch を追加するときは必ず NEXT_PHASE skip を入れる。

## R2 snapshot 一覧 (2026-04-29 時点)

```
snapshots/
├── ranking-items/all.json
├── surveys/all.json
├── categories/all.json + by-key/<categoryKey>.json
├── correlation/by-ranking-key/<rankingKey>.json (1,830 files)
├── ranking-values/<rankingKey>/<areaType>/<yearCode>.json (29,642 files / 788MB)
├── blog/all.json (134 articles + 327 tags)
├── ai-content/all.json (1,943 rows)
├── page-components/all.json
├── area-profile/all.json (47 areas)
├── affiliate-ads/all.json
├── ranking-page-cards/all.json
├── fishing-ports/all.json (2,896 ports)
├── ports/all.json (699 ports)
└── port-statistics/
    ├── years.json
    ├── by-year/<year>.json (14 files)
    └── by-port/<portCode>.json (699 files)
```

## /sync-snapshots スキル (未着手)

7+ 個のエクスポーターが個別実行されている。1 コマンドで全 snapshot 更新するスキル化が今後の運用負荷を下げる。
