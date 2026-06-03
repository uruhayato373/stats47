---
type: session-handoff
date: 2026-06-04
status: completed
branch: develop
tags: [git-cleanup, deploy, ranking-activate, dbless-migration, gone-ranking-keys, known-ranking-keys, pipeline-gap, handoff]
---

# セッションハンドオフ 2026-06-04｜git クリーン化 + デプロイ + 122 metric 公開の積み残し発見

ローカル git の整理依頼から始まり、未反映の feature を develop→main にデプロイ。その過程で
**「122 metric を本番公開するパイプラインが DBレス移行 Phase F で未配線/破損のまま」**であることを実測で発見し、
オーナー判断で別プロジェクト化した。**結論: git クリーン化 + コードデプロイは完了。122 metric の本番公開は未達（別タスク）。**

## 完了したこと（本番反映済）

- **git クリーン化**: 4 ブランチ (develop/main/feature×2) → **main/develop だけ**に整理。両者 origin 最新同期。
  - 未 push 作業は退避→develop に統合→feature 削除の順で無損失処理。
- **PR #430** (merge `1391228c`): 122 metric `isActive:false→true` + ranking ビルダー
  (`build-ranking-item-from-metric.ts` / `generate-ranking-items.ts`) + remotion `render-migration-flow.ts`。
  - 混入していた型エラー修正: `generate-ranking-items.ts` が r2-storage の src を相対パス直接 import し
    ranking の `rootDir` 制約違反 (TS6059) → `assertR2WriteAllowed` を `@stats47/r2-storage/server` から
    re-export してパッケージ経由 import に統一 (`server.ts`)。
- **PR #431** (merge `5c35d0c3`): `GONE_RANKING_KEYS` から 122 key 除去 (Set 489→367)。
- 検証: turbo type-check 14/14・lint・vitest (web 341 / ranking 173) 全 green。validate:config/years クリーン。
- CDN: `purge-cdn.yml` 全パージ dispatch 済み。

## 重要な発見（次セッション必読）

**122 metric は上記デプロイ後も本番 410 のまま = 公開未達。** gone 除去だけでは不十分だった。

- 本番 ranking の 410 判定: `apps/web/src/middleware.ts:61` が
  `UrlPolicy.ranking.isGone(key) || !UrlPolicy.ranking.isKnown(key)` で `gone()` を返す。
  → **GONE から外しても `KNOWN_RANKING_KEYS` に無ければ `!isKnown` で 410**。
- 122 key は `KNOWN_RANKING_KEYS` / `SITEMAP_RANKING_KEYS` / `INDEXABLE_RANKING_KEYS` の
  いずれにも未反映。R2 `app/ranking-items/all.json` も `isActive:false`（2026-05-22 生成・古い）。
- これら派生物の生成器が **DBレス移行 Phase F の積み残しで未配線/破損**:
  - `generate-ranking-items.ts`（all.json/item.json 生成）は実装済だが `sync-snapshots/run.sh` に**未配線**
  - `generate-known-ranking-keys.ts`（KNOWN 生成）は**破損済**（既存 memory に記録）
- 観測値 `app/stats/<key>/values.json` は R2 に存在（HTTP 200）。**データは揃っている**ので、
  パイプライン修復さえ済めば公開可能。

## 次にやること（別プロジェクト）

- **122 metric 本番公開**: 手順・依存・122 key の commit 参照は
  `docs/50_Issues/feature-backlog.md`「122 metric (完全データ) の本番公開 — 生成パイプライン修復」。
  - 着手判断: GSC「クロール済み・インデックス未登録」再発リスク（過去 1,453 件）があるため
    known 生成修復と SEO 影響評価をセットにした独立 PR。
- **中途半端状態の注意**: 122 は GONE から外れたが KNOWN にも無いため挙動は 410 のまま（実害なし）。
  着手まで維持。完全に戻すなら PR #431 を revert。
- `develop` は `main` より先行（今回の変更 + docs）。本番反映は次回 `/deploy`（develop→main PR）の対象。

## 関連

- memory: `project_ranking_publish_pipeline_gap`（新規）/ `project_dbless_migration_2026_05_29`
- 改善ログ: `docs/05_改善ログ/gsc.md`（KNOWN_RANKING_KEYS / ranking インデックス文脈）
- 正典: `docs/01_技術設計/19_完全DBレス設計.md`
