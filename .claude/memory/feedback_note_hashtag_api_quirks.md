---
name: feedback_note_hashtag_api_quirks
description: note のタグとAPIの癖 — 同一秒タグは順不同・大文字小文字は既存タグに書換・ギリシャ文字は黙って削除・限定公開の無料記事はPUT本文に全文が入る
metadata:
  node_type: memory
  type: feedback
  originSessionId: 5aef3630-04ca-410f-ae16-251961577a49
  modified: 2026-10-03T04:12:04.278Z
---

note の公開記事のタグ・本文を機械で照合するときの癖 (2026-10-03 実測)。

- `hashtag_notes` は同じ秒に登録されたタグの並び順が固定されない。指紋はタグ名の集合 (ソート) で取る。順序込みのハッシュで「記事が変わった」と誤判定し、県別家計 46 件が検証不合格になった。
- 反映後、note は既存タグの表記に合わせて大文字小文字を書き換える (#CLI→#cli, #VSCode→#VScode)。照合は NFKC+小文字で行う。
- ギリシャ文字などを含むタグ (#αモデル) は更新が 200 でも黙って落ちる。かな・漢字・英数字・ー・・・_ 以外は投稿前に弾く。
- 無料記事でも `separator` を持つもの (限定公開の試し読みライン、2026-10 時点で 15 件) は、PUT の `free_body` に全文が入り公開範囲はラインで決まる。ラインを末尾へ動かすと非公開部分が公開される。ラインは動かさず、公開部分 (先頭から公開本文の長さ) だけ照合する。
- 編集画面の「更新する」から PUT が飛ぶまで数秒かかることがある。4.5 秒固定の待ちでは取りこぼす。

**Why:** どれも「送信は成功したのに照合が合わない」「安全な更新に見えて公開範囲が変わる」形で現れ、原因を誤認しやすい。

**How to apply:** note 記事のタグ・本文を一括更新・検証するスクリプトを書く/直すときに適用する。実装は `.claude/scripts/note/update-published-hashtags.mjs` と `lib/note-hashtags.mjs`、`lib/cover-update.mjs` の `contentFingerprint`。関連 [[project_note_update_mode_learnings]]。
