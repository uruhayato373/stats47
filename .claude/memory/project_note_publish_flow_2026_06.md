---
name: project_note_publish_flow_2026_06
description: note.comエディタの公開手順(editor-helpers.sh)とgotchas。保存場所は2026-10-13から台帳+R2 (project_note_article_ledger)
metadata: 
  node_type: memory
  type: project
  originSessionId: ef684d43-f406-4716-bc0d-33b992b1ac9a
---

note.com 記事公開の現行像（2026-06-16 確立、2026-06-19 R2 ephemeral 化完了）。

**保存場所 (2026-10-13 改訂)**: 記事の台帳は `data/note/articles.json`、本文と画像は R2 だけ (無料=公開・有料=private)。
docs/31 は gitignore された作業場で、`npm run note:article -- checkout <key>` で取り出し、公開・編集後に `save <key>` で戻す。
旧方式 (docs/31 を git に置く・`sync-note-r2.yml` が push で R2 へ移す・`restore-from-r2.sh`) は廃止した。詳細は [[project_note_article_ledger]]。

**実体は `.claude/scripts/note/editor-helpers.sh`**（手書きしない。`source` して使う）:
- Phase0: `prepare-article.cjs <slug>` → `/tmp/note-data-<slug>.json`、`build-body.cjs <slug>` → 本文txt
- update: `process_article <slug> <noteId> <vertical>` → **screenshot を Read で目視** → `do_update <slug>`
- 新規無料: `new_post_cover_title` → 本文paste → `ins_img`×N → `new_post_tags` → `new_post_magazine` → 試し読みライン**末尾**(全文無料) → 投稿する
- 新規有料: 上記 + 記事タイプ「有料」**span を click**(div では選択されない・価格は既定¥300) → `有料エリア設定` → `paid_setline`(paidHead直前) → screenshot目視 → 投稿する

**今回ハマった gotchas（再発防止）**:
1. 有料マーカーは「ここから先は有料部分:」と「…部分**です**:」が混在 → `PAID_MARK` は行全体許容（修正済）
2. 有料見出しの突合は **空白・バッククォート(インラインコード)・先頭`#` を全除去**して比較（エディタ textContent と stateプレビューでバッククォート有無が食い違う）。`### `除去は **BSD sed `\+` 非対応**で `sed 's/^#* *//'`
3. 画像アンカーは **eval-scroll**(TOC非依存)。コード行アンカー(`Subagent: X`)は直後段落が無く失敗 → 近接 Step 見出しに寄せる
4. 画像参照 `.svg` は note 非対応 → 同名 `.png` に置換
5. ハッシュタグは **1個ずつ click→type→Enter→sleep**（まとめ type で combobox value に連結され失敗）。本文の `#31` 等が誤チップ化するので投稿前に削除
6. **markdown 表は note でリテラルパイプ表示**になり崩れる → `images/table-N.png` 画像化（`pipeTable:true` が残存警告）。新規 cc#22+ は対応済
7. **ハザード**: browser-use の `$TMPDIR/browser-use-user-data-dir-*`(各数百MB)でディスク満杯→ハーネス出力不能。5-10本ごとに `rm -rf`。daemon ハング後は再ログイン要 → **アカウント照合ゲート(settings/account=stats47)** 必須

関連: [[feedback_note_publish_automation]]（paste方式）/ [[project_note_internal_link_breaks_on_publish]]。手順正典 `.claude/skills/note/publish-note/references/editor-operations.md`「実機検証済 update バッチ運用メモ」。

**カード修復 (2026-10-26 実測)**: URL付きfigureの保存だけでは埋め込みは登録されない。note標準の外部カードは `GET /api/v2/embed_by_external_api`、note記事カードは `POST /api/v1/embed` で登録し、サーバーが返すキーを使う。共通実装とgateは `lib/native-cards.mjs`。既存下書きを保つ `draft_save` は `is_temp_saved=true` とbooleanの `index` が必要。`publish-card-body.mjs` が公開本文のカードだけを変更し下書きを復元する。検査は `native-cards.test.mjs` と `product-cards.test.mjs`。

**表示検証の境界**: note記事カードは遅延読み込みiframe。figureの高さとiframeの存在だけで完了にせず、`iframe.note-embed[data-ready="true"]` とiframe本文の表示を待つ。初期1秒では空白でも約8秒後に正常表示する実測がある。
