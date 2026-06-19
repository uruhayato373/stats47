---
name: project_note_publish_flow_2026_06
description: note.com 公開フロー確立+R2 ephemeral化完了(2026-06-19)。docs/31 完全削除、全記事 R2 SSOT。cloud Claude Code でコンテンツ編集可能
metadata: 
  node_type: memory
  type: project
  originSessionId: ef684d43-f406-4716-bc0d-33b992b1ac9a
---

note.com 記事公開の現行像（2026-06-16 確立、2026-06-19 R2 ephemeral 化完了）。

**完全DBレス**: note に D1 `note_articles` テーブルは無い（廃止済）。

**ストレージ設計 (2026-06-19 完成: docs/31 完全削除)**:
- **全記事 (公開済み + ドラフト)** → R2 `note/<vertical>/<slug>/` が SSOT
  - 公開済み: `.claude/state/note-published-urls.json` (slug→url/r2_path/is_paid)
  - ドラフト: `.claude/state/note-draft-index.json` (slug→vertical/r2_path)
  - コンテナメタ (MAGAZINE.md / INDEX.md / カバー画像) → `.claude/skills/note/<vertical>/`
- **docs/31 は ephemeral outbox** (編集時のみ存在、push 後 CI 自動削除)
  - 同期 CI: `sync-note-r2.yml` が note-published-urls.json / note-draft-index.json の push で発火
- **編集フロー**: `restore-from-r2.sh <slug>` で docs/31 に復元 → 編集 → develop push → CI 再同期・削除
- **cloud Claude Code**: R2 公開 URL から draft.md 直接取得 → 編集 → docs/31 経由で push
- note.com への実際の投稿は browser-use (ローカルのみ)

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
