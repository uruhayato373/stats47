# note 旧形式無料記事の本文更新

**トリガー**: 公開APIで `price=0` かつ `separator` が非 null の記事を再編集し、「試し読みエリアを設定」を開かずに `更新する` を待つと timeout する。または既存境界を選んだだけでは更新APIが発火しない。
**対処**: 公開版の本文hash・separator・99タグ・`has_draft=false` を先に固定する。試し読み境界画面で隣接位置を一時選択して更新を有効化し、`PUT /api/v1/text_notes/{id}` の送信直前に `separator` を元の値、`free_body` を意図した公開本文へ戻す。公開APIで本文hash・separator・価格・タグ・下書き無しを再検証する。診断中に自動保存された差分draftは、所有者・対象key・公開版との差分を確認した場合だけ `DELETE /api/v1/text_notes/draft_delete?key=...` で除去する。
**根拠**: 旧記事 `n258277f96f88` では、無料記事でもseparatorが残り、境界画面を開く前は更新ボタンが存在せず、既存境界の再選択だけではPUTが発火しなかった。隣接境界の選択でPUTが生成され、送信payloadの境界と本文を公開版契約へ復元することで、公開後のseparator・99タグ・本文を保持したままリンクだけを修復できた。
**確信度**: 0.7
**発見日**: 2026-09-06
**関連**: `.claude/scripts/note/update-published-navigation.mjs`、`.claude/skills/note/publish-note/references/update-mode.md`
