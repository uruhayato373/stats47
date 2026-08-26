---
name: project_ranking_publish_pipeline_gap
description: ranking metric の本番公開は config isActive:true だけでは不十分 (KNOWN/SITEMAP/R2 values/OGP 整合が要る)。画像の件数制限は manifest-missing を旧manifest移行より優先する
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

> **2026-07-05 更新 (RANKING-KEYS-SYNC-01 で恒久機構化・feature/blog-seo-expansion)**: 下記 1-2 の「未配線」は
> 解消済み。`generate-ranking-items.ts` は元々 `.claude/skills/db/sync-snapshots/run.sh` の TASKS (line 37) に
> **配線済み**だった (この memory の旧記述が stale)。真のギャップは **R2 push 後に git 側派生キー (known/sitemap) が
> 再生成されない**こと。sync-snapshots.yml に `sync-ranking-keys` job を追加し、ranking-items push 後に
> known + sitemap を再生成 → develop→main PR を自動作成 (自動マージなし=デプロイ規律) するようにした。sitemap は
> 既に KNOWN 全キー掲載実装 (`build-sitemap-ranking-keys.cjs` の `knownRankingKeys()`) なので新キーは自動掲載
> (`--include-new-keys` 不要)。1コマンド公開は `/publish-ranking` (ranking-publisher agent 起動口)。

## config → 本番公開の依存順

1. R2 `app/ranking-items/all.json` + `app/ranking/<key>/item.json` → `packages/ranking/src/scripts/generate-ranking-items.ts` (✅ sync-snapshots run.sh TASKS に配線済。旧「未配線」は誤り)
1b. **R2 `app/ranking/<key>/values.json` → `packages/ranking/src/scripts/generate-ranking-values.ts`** (task `ranking-values`・ranking-items の後)。**2026-07-27 に復活**: Phase 6 (2026-05-27) で D1 export を廃止した際に代替 writer が作られず 2 ヶ月間凍結し、runtime の全描画値・OGP・blog が stale 配信、Phase 6 以降の 67 キーは空ページだった。**item.json だけ作っても値は出ない** — この 1b が必須。手動投入 metric (`fetcherKey:"manual"`) は page-data-batch を通らず正典 `app/stats` が rank を持たないため、writer 側で正典と同一規則 (値の降順・同値同順位) で導出する。整合性は週次 `ranking-integrity-audit-weekly.yml` が検査。実行規約は `.claude/rules/metric-config-standards.md`。
2. ✅ `packages/ranking/src/config/known-ranking-keys.ts` (SSOT・apps/web は re-export) → `apps/web/scripts/generate-known-ranking-keys.ts` (2026-07-05 から sync-ranking-keys job で自動再生成+PR)
3. `sitemap-ranking-keys.ts` → `node .claude/scripts/gsc/build-sitemap-ranking-keys.cjs` (KNOWN 全キー掲載。sync-ranking-keys job で自動)
4. `indexable-ranking-keys.ts` → legacy 安全弁 (専用生成器なし・sitemap builder が読むだけ)
5. 再デプロイ → `gh workflow run purge-cdn.yml` で全パージ (7日キャッシュ)

## 2026-08-26 OGP公開フックの優先順位修正

**問題**: 新規ranking 3件のページ本体・調査ハブ・内部リンクは本番200だったが、静的R2 OGPと
ranking cardが404で、デプロイ後のroute smokeが失敗した。

**原因**: `sync-snapshots.yml`の画像生成フック自体は実行されていたが、候補2,167件の内訳が
`manifest-invalid=2164 / manifest-missing=3`だった。生成器は候補順の先頭へ`--limit 50`を適用したため、
既存の旧manifest移行50件だけを処理し、新規3件を後回しにした。

**対策**: `prioritizeChangedImageCandidates`で`manifest-missing`→`asset-missing`→既存manifestの
移行・更新の順に決定的ソートし、その後でlimitを適用する。同一理由はentity id順。回帰テストは
`image-generation-manifest.test.ts`、公開後の最終gateは`.github/scripts/smoke-test-routes.sh`の
`og:image` HTTP 200検査とする。

**証拠**: GitHub Actions `32906240999`（画像フックの選択内訳）、`32912691655`
（3件のOGP 404）、`apps/web/scripts/lib/image-generation-manifest.ts`（優先順位実装）。

[[project_dbless_migration_2026_05_29]] [[feedback_check_why_removed_before_reviving]]
