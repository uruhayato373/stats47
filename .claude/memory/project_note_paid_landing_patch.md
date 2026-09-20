---
name: project_note_paid_landing_patch
description: 公開済み note 有料記事の無料部分は editor を使わず PUT パッチで直せる (所有者 API が全文を返す・separator は最後の無料要素 id・画像は presigned S3 post)。添付 1 日 10 回制限に掛からず 38 商品を同日に一括是正した
metadata: 
  node_type: memory
  type: project
  originSessionId: 904a259f-b16f-4036-a557-45937f796fee
  modified: 2026-09-20T04:40:45.271Z
---

**問題** (2026-09-20): 有料記事 38 本の無料部分に出典・導入・サンプル画像・流入導線が無かった。editor で本文を作り直す
経路は添付の再アップロードを伴い、note の添付 upload 1 日 10 回制限で 1 日 3 本しか直せない。

**判明した note API の性質** (すべて実測):
- 所有者セッションの `GET /api/v3/notes/<key>` は **有料本文と添付 figure を含む全文** `body` と `separator` を返す。
  公開 (非ログイン) 側の `body` は無料部分だけで、所有者 body を `separator` 要素 (`id="<separator>"`) の終端で切った
  前半と **完全一致**する (この一致を PUT 前のゲートにしている)。
- editor の PUT (`/api/v1/text_notes/<id>`) payload は `free_body` / `pay_body` / `separator` / `price` / `hashtags` …。
  Playwright の `page.route` で横取りし、`free_body` を組み直した HTML、`pay_body` を公開版の有料部分、`separator` を
  新しい末尾要素 id に差し替えて `route.continue` すると、そのまま公開版になる (下書きが壊れていても公開版基準で上書きできる)。
- 有料ラインが未設定の下書きだと設定画面に「更新する」が出ない。「有料エリア設定」→「ラインをこの場所に変更」を
  どこか 1 つ押せば出る (実際の境界は payload の separator で決まる)。
- 画像は `POST /api/v3/images/upload/presigned_post` (multipart `filename=`、`X-Requested-With: XMLHttpRequest`) →
  返る `action` (S3) へ `post` の全 field + `file` を multipart POST (204) → `url` (`assets.st-note.com/img/…`) を
  `<figure name id><img src width="620" height=…><figcaption></figure>` で本文に置く。添付とは別枠。
- 本文 HTML の型: `<p name=id id=id>` / `<h2 name id>` / `<ul name id><li><p name id>…</p></li></ul>` /
  カードは `externalCard()` (navigation-footer.mjs)。note は送った HTML をそのまま返す (bodySignature 一致で検証できる)。

**実装**: `.claude/scripts/note/patch-note-paid-landing.mjs` (spec = `catalog/data/paid-landing/<key>.json`)、
サンプル表画像は `build-csv-sample-image.mjs` (viewBox 幅 ≥1280 は PNG が等倍になるので止める)。
LLM に spec を書かせるときは `findUnsupportedNumbers` (spec の数値が本文に無いと止める) が事故を防ぐ
(実際に「237,810 人」を「23.8万人」に丸めた 1 件を弾いた)。

**How to apply**: 公開済み記事の**部分的な**本文変更は全部この経路にする (フッター追加 = update-published-navigation.mjs
も同じ機構)。editor 経路 (`publish-kakei-update.sh` / `publish-kakei-paid-update.sh`) は本文全体を作り直すときだけ。
サンプル画像は **現に添付されている ZIP** (SHA を記事本文と照合) から作る。ローカルの旧版パック (`.local/geo-products`)
は 9/5 訂正前で数値が違った。

**関連**: [[project_note_attachment_upload_limits]] [[project_note_update_mode_learnings]]
