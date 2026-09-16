---
name: feedback-note-product-card-ssot
description: note記事の商品カードtitle/descriptionはマガジンレコードでなく実商品SSOTから解決する。生成と修正訂正で同じ解決関数を共有し、regenerate-card repairはカード不在時にthrowせずno-opにする
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 902b7af2-f468-4f78-a3e6-254dd9831f7e
  modified: 2026-09-16T00:28:43.350Z
---

note.com記事の商品カード(embedded-service="external-article"でproductを指すfigure)は、
表示title/descriptionを必ず実商品SSOT(`apps/web/src/features/products/storefront.generated.ts`
のSTOREFRONT_PRODUCTS)から解決する。マガジンのname/descriptionを流用しない。

**Why**: 2026-09-16、`update-published-navigation.mjs`のbuildPlansが
`${magazineRecord.name}の商品・書籍`という固定文言でカードtitleを生成しており、
189本の公開記事**全て**(100%)で実商品と異なるタイトルが表示されていた。原因は
「同じマガジンに属する記事は同じ商品を指す」という前提のもと、手近にあった
マガジンデータをそのまま使い回したこと。実商品データへの参照が最初から存在しなかった。

**How to apply**:
- カード生成(新規追加)とカード訂正(既存の間違ったカードを直す)は**同じ解決関数**
  (`resolveProductCardText(productTarget)`)を共有する設計にする。生成専用と修正専用で
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
