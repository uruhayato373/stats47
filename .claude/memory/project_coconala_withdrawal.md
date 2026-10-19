---
name: project-coconala-withdrawal
description: 2026-10-19 ココナラ撤退。14件は受付休止(非公開操作は無い)・計測と週次収益から除外。note版公開までサイトの商品ページはココナラを指したまま
metadata:
  node_type: memory
  type: project
  originSessionId: 33570748-84df-4673-8022-a3e0bbba12a3
  modified: 2026-10-19T12:01:03.420Z
---

2026-10-19 オーナー判断でココナラから撤退し、データ販売は note に集約する (10-17 の凍結から進めた)。出品 14 件は累計売上 0 円。

- ココナラの編集ページに「非公開」は無く、「受付中 / 受付休止中」の select を変えて「更新する」で保存する (select 変更だけでは保存されない)。14 件とも受付休止にし、公開ページで「購入画面に進む」0 件を確認した。
- 認証付き計測 (`sources.mjs`・CI matrix・`auth-credentials.json`) と週次収益 (`product-revenue.mjs` の REVENUE_CHANNELS) から外した。商品の生成コード (product-factory・build-coconala-product) は note 版が使うので残す。
- **出品台帳を `withdrawn` にするのは note 版の公開後**。先に変えると `generate-product-storefront.ts` が `/products/data-p-XX` を消し、公開済み note 記事のカードのリンクが切れる。続きは `NOTE-PACKS-REPLACE-COCONALA-01`。

**Why:** 「データ販売は note で十分」が理由だが、10-19 時点で有料の note 版 13 本は下書きで、note でもデータパックはまだ買えない。
**How to apply:** ココナラ関連の作業を提案しない。note 版の公開は Windows PC (納品版のハッシュが一致する PC、[[feedback_coconala_edit_needs_v2_delivery]]) で記事ごとの確認を経て行う。[[feedback_portfolio_keep_decision_2026_10]] の「商品は継続」は、販売先を note に寄せる形で続く。
