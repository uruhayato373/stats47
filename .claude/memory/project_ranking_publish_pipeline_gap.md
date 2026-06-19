---
name: project_ranking_publish_pipeline_gap
description: ranking metric の本番公開は config isActive:true だけでは不十分 (KNOWN/SITEMAP/INDEXABLE/R2 整合が要る)。未登録キーは 2026-06-06 5d9afb24 以降 middleware 410 でなく page notFound=404 (GONE のみ 410)。残: all.json/item.json の isActive sync + SITEMAP 追加
metadata: 
  node_type: memory
  type: project
  originSessionId: 44019ce1-7f37-431b-89aa-b05fa5a2fc2d
---

ranking を本番公開するための派生物パイプライン (DBレス移行 Phase F の積み残し)。新規 metric を `isActive:true` にしただけでは本番に出ない。

**本番 ranking の応答判定** (現行コード verify 済 2026-06-13): `apps/web/src/middleware.ts:146-154` は `/ranking/{key}` で `UrlPolicy.ranking.isGone(key)` のみ `gone()` (410)。**未登録キー (GONE に無いが KNOWN にも無い) は middleware を素通りし、page `ranking/[rankingKey]/page.tsx` の `notFound()` で 404 になる** (2026-06-06 `5d9afb24` で notFound 委譲に変更。それ以前は `isGone||!isKnown→410` だった)。tag/theme は今も `!isKnown→410` だが ranking は異なる。いずれにせよ **GONE から外すだけでは 200 にならず KNOWN_RANKING_KEYS 等への登録が必要**。GONE の 410 応答は `s-maxage=604800` で 7 日エッジキャッシュ。

## 2026-06-06 修正完了 (PR #446)

- **`generate-known-ranking-keys.ts` 修復**: `.local/r2` 依存を廃止 → `listAllMetrics()` + R2 公開 URL HEAD チェックに変更。SSD 不要で再生成可能。
- **`known-ranking-keys.ts` 更新**: 1992 → 2120 keys (+128)。PR #446 でデプロイ済み。
- **2 metric が R2 未存在** (除外): `population-migration-inter-prefecture` (migration-flow 型) / `prefectural-income-per-capita` (kind:external ソース未定義)。R2 item.json があれば自動追加される。
- **item.json の isActive が stale (false)**: R2 item.json は旧状態 (isActive:false) のまま。ただし ranking page は isActive チェックしないため描画に影響なし。

## 残課題

1. **`generate-ranking-items.ts` を sync-snapshots.yml に配線** → all.json + item.json の isActive を data-configs と同期 (P0-RANKING-INDEX)
2. **SITEMAP_RANKING_KEYS への追加** → `build-sitemap-ranking-keys.cjs` は GSC 実績ベースのため、新規 128 metric は自然追加されるまで sitemap 未掲載。Indexing API で submit するか、INDEXABLE_RANKING_KEYS に手動追加する手もある。

## config → 本番公開の依存順

1. R2 `app/ranking-items/all.json` + `app/ranking/<key>/item.json` → `packages/ranking/src/scripts/generate-ranking-items.ts` (**sync-snapshots 未配線**)
2. ✅ `apps/web/src/config/known-ranking-keys.ts` → `apps/web/scripts/generate-known-ranking-keys.ts` (2026-06-06 修復済)
3. `sitemap-ranking-keys.ts` → `node .claude/scripts/gsc/build-sitemap-ranking-keys.cjs`
4. `indexable-ranking-keys.ts` → GSC pages.csv 依存
5. 再デプロイ → `gh workflow run purge-cdn.yml` で全パージ (7日キャッシュ)

[[project_dbless_migration_2026_05_29]] [[feedback_check_why_removed_before_reviving]]
