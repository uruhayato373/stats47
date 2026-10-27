---
name: project-coconala-withdrawal
description: 2026-10-19 ココナラ撤退。14件は受付休止(非公開操作は無い)・計測と週次収益から除外。有料note13商品は公開済み。販売URLは記事台帳・商品対応表から解決する
metadata:
  node_type: memory
  type: project
  originSessionId: 33570748-84df-4673-8022-a3e0bbba12a3
  modified: 2026-10-26T04:00:00.000Z
---

2026-10-19 オーナー判断でココナラから撤退し、データ販売は note に集約する (10-17 の凍結から進めた)。出品 14 件は累計売上 0 円。

- ココナラの編集ページに「非公開」は無く、「受付中 / 受付休止中」の select を変えて「更新する」で保存する (select 変更だけでは保存されない)。14 件とも受付休止にし、公開ページで「購入画面に進む」0 件を確認した。
- 認証付き計測 (`sources.mjs`・CI matrix・`auth-credentials.json`) と週次収益 (`product-revenue.mjs` の REVENUE_CHANNELS) から外した。商品の生成コード (product-factory・build-coconala-product) は note 版が使うので残す。
- **現在の販売先**: 有料データパック13本は2026-10-24までに公開済み。2026-10-26に公開状態・価格・有料境界・添付を全13本で再確認し、記事台帳に `publicationVerifiedAt` を記録した。公開の正典は `data/note/articles.json`。旧出品台帳14行（データパック13＋Geo受託1）は `withdrawn` にし、note商品への対応は product-factory の mapping で解決する。
- **記事の配線**: `data/note/magazines.json` の `paidProductId` を通して、公開済み有料noteへ直接案内する。空白カード修復は `note:cards:repair-native`。サイト商品ページ13本も有料noteへ変更済み。公開面の価格・題名・購入先の実測は `data/note/evidence/note-product-storefront-live-2026-10-26.json`。

**問題**: 古いローカル台帳・メモは13本を下書きと誤認させ、受付休止済みのココナラへ誘導していた。

**原因**: 台帳同期前に過去の下書き状態を現在の販売状態として使い、派生販売カタログもローカル準備版しか見ていなかった。

**対策**: 最新の共有台帳を取得し、公開URLを直接確認する。販売カタログは記事台帳の公開情報を優先し、ローカル納品物の有無と公開状態を混同しない。

**証拠**: `data/note/evidence/note-paid-pack-publication-verification-2026-10-26.json`、`packages/product-factory/tests/sales-catalog.test.ts`。

過去の受付休止14件の内訳は有料パック13＋Geo受託1。Geoは旧 `geo-service-readiness-2026-09-06.json` にだけ公開記録が残っていたため、出品台帳へwithdrawnで統合した。販売カタログは旧readinessより現行の出品状態を優先する。無料見本を含む商品定義14件・有料note13本とサービス数を混同しない。
