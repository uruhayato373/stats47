---
name: project_ranking_download_onthefly
description: "ranking download (/api/ranking/[key]/download) はオンザフライ生成。事前 bake は全2169metric=23K files/1GB/45min timeout で不採用 (Phase6 削除理由と同じ)。iconv-lite SJIS は Workers 動作確認済 (2026-06-01)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4d930b3a-9dfc-4616-8afd-8dd5bbb85bc1
---

2026-06-01: `/api/ranking/[rankingKey]/download` (CSV/JSON ダウンロード) は **route でオンザフライ生成**する。

**Why:** 事前 bake (CI で全 metric の CSV/JSON を R2 に生成) を一度試したが、全 **2,169 metric × basis × format × encoding = 23K+ ファイル / 1GB超** になり、`sync-snapshots` が **45分でタイムアウト**して一切 push できなかった (run.sh は最後に一括 push する設計のため部分成果も残らない)。これは Phase 6 が download exporter を削除した理由 (R2 肥大化) そのもの。→ bake 不採用、都度生成に確定。

**How to apply:**
- 系列生成: `packages/ranking/src/services/get-ranking-download-series.ts` の `getRankingDownloadSeries(key, areaType, basis)` (R2 観測値 → 全年系列。original=listRankingValuesAllYears / per_*=readAllYearsNormalizedRankingValuesFromR2 / all-bases=横並び)。
- CSV 整形は `packages/ranking/src/utils/build-download-csv.ts` (buildSingleSeriesCsv / buildAllBasesCsv)。
- route: UTF-8/JSON は string をそのまま `NextResponse` に渡す。**SJIS のみ `iconv-lite` を動的 import で encode** し、失敗時は UTF-8 に graceful fallback。本番 Workers で SJIS encode は動作確認済 (Content-Type: Shift_JIS で配信)。
- `NextResponse` の body 型は `string | Uint8Array<ArrayBuffer>` (TS5.7 TypedArray generic。`Uint8Array<ArrayBufferLike>` は BodyInit 不可)。
- **ranking-download exporter は復活させない** (撤去済: exporter/script/sync-snapshots TASKS/SKILL)。bake を再導入しないこと。
- 結果は決定的なので `Cache-Control: s-maxage=2592000` で CDN キャッシュ。

関連: PR #391 (commit `bcaf567f`)。download UI は `apps/web/src/features/ranking/components/DataDownloadButton.tsx`。
