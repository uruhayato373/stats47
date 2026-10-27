---
name: feedback-note-product-card-ssot
description: note記事の商品カードtitle/descriptionはマガジンレコードでなく実商品SSOTから解決する。生成と修正訂正で同じ解決関数を共有し、regenerate-card repairはカード不在時にthrowせずno-opにする
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 902b7af2-f468-4f78-a3e6-254dd9831f7e
  modified: 2026-10-26T04:00:00.000Z
---

note記事の販売カードは `data/note/magazines.json` の `paidProductId`、product-factory の `NOTE_PRODUCT_MAPPINGS`、`data/note/articles.json` の公開状態から `resolvePaidProduct()` で解決する。公開済み有料noteへ直接案内し、価格・題名は記事台帳に従う。旧ココナラ出品台帳やローカル下書き版を販売先の根拠にしない。サイト商品ページはこの情報からの派生であり、noteの販売状態の正典ではない。

2026-10-26追記: figureの独自キーやHTMLだけではnote側のカード登録にならない。`native-cards.mjs` で登録してから公開し、キーと匿名ブラウザの表示を確認する。回遊更新はこの処理を組み込んだ `update-published-navigation.mjs`、既存空欄の復旧は `repair-note-cards-native.mjs` を使う。

**Why**: 2026-09-16、`update-published-navigation.mjs`のbuildPlansが
`${magazineRecord.name}の商品・書籍`という固定文言でカードtitleを生成しており、
189本の公開記事**全て**(100%)で実商品と異なるタイトルが表示されていた。原因は
「同じマガジンに属する記事は同じ商品を指す」という前提のもと、手近にあった
マガジンデータをそのまま使い回したこと。実商品データへの参照が最初から存在しなかった。

**How to apply**:
- カード生成(新規追加)とカード訂正(既存の間違ったカードを直す)は**同じ解決関数**
  (note販売は `resolvePaidProduct()`、サイトカード文言は `resolveProductCardText(productTarget)`)を共有する設計にする。生成専用と修正専用で
  別ロジックを持つと今回のような二重管理ドリフトが起きる。
- 「URLは変えず表示文言だけ直す」修正(regenerate-card相当)を設計するときは、
  対象カードが**まだ存在しない**場合(本文差し替え直後など)にthrowしない設計にする。
  新規追加は別の「hasUrl判定で無ければ追加する」ロジックに委ねる。修正専用ロジックが
  「見つからなければエラー」だと、新規追加すべきケースで詰まる。
- 本文の一部を丸ごと差し替えるスクリプト(publish-kakei-update.sh等)を使った後は、
  差し替えで消えたフッタ(次に読む/マガジン/商品カード)を`update-published-navigation.mjs
  --products --commit`で必ず再適用する。
- ライブ本文の検証は「URLが消えた/現れた」という汎用チェックだと、URLを維持したまま
  文言だけ直す修正では逆の成立条件になり誤検知する。本文全体のbodySignature完全一致
  チェックがある場合はそちらを正とし、per-repairの部分チェックは該当modeを除外する。

**関連**: [[project_note_ins_img_heading_placement_bug]] (画像挿入位置の別バグ、こちらは未解決)

## OGP画像のURLキャッシュ（2026-10-26実測）

**問題**: カバーを公開更新しても、カードの新規登録キーが古いOGP画像を参照した。

**原因**: 同一マガジンURLのnative GETは旧画像を返し、同じページに画像版クエリを付けたnative GETは採用済みの新画像を返した。登録キーの新規発行だけでは画像の鮮度を保証できない。

**対策**: 全画像の公開SHAと本番metadataを確認後、`card-image-refresh.mjs`で所有する外部カードURLの`s47_ogp`だけを版更新する。native応答の画像URLが採用版と一致することを公開前・公開後に検査する。本文・有料境界・既存UTM・リンク先ページは保持する。正典は`.claude/rules/ogp-image-standards.md`。

**証拠**: `data/note/evidence/note-card-image-cache-probe.json`（同一URL/画像版URLの比較）。回帰検査は`.claude/scripts/note/__tests__/card-image-refresh.test.mjs`。

## 公開OGPの小さな補足文（2026-10-27）

- 問題: 配信済みの学力ブログOGPで、24pxの補足文の最後の「由」だけが改行した。主題の配置検査だけでは見逃した。
- 原因: ブログのsubtitleを外部向けの小さなカード画像へ引き継いでいた。
- 対策: ブログ専用の`buildBlogExternalOgp`に通常生成と外部のみ更新を集約し、画像は主見出しとブランドに絞る。小さな数値説明・タイトルの補足を含めない回帰テストと、公開画像の目視を併用する。内部サムネイル/背景のSHA保持と他種別のrendererを維持する。旧公開receiptは`data/ogp/link-card-blog-caption-before.json`。
