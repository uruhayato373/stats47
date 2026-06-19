---
name: project-note-internal-link-breaks-on-publish
description: note 記事の draft.md 内部リンク (../slug/draft.md) は note.com 公開後に機能しない。回遊リンクは note URL 化が必要
metadata: 
  node_type: memory
  type: project
  originSessionId: d5451eae-f205-4264-987f-e1fefaa28a0a
---

note 記事ドラフト (`docs/31_note記事原稿/.../draft.md`) で使う内部リンクは
`[#04 ...](../04-meeting-minutes-30min-to-5min/draft.md)` という**ローカル docs ツリー相対パス**形式。
これは note.com に公開するとリンク切れになる (note は相対パスを解決できない)。

**Why:** koumuin-claude-code シリーズで回遊フッタ・#00 本文の内部リンクを `../slug/draft.md` で作り、
無料 3 本 (#00/#02/#29) を 2026-05-20 に公開したところ本文は正常だが回遊リンクが全て死んでいた。
note で回遊させるには note.com の記事 URL を貼る必要がある (裸 URL は note が自動カード化) が、
URL は公開後にしか分からない (鶏卵問題)。
※この 2026-05-20 の公開は誤った note アカウント (dobokunote) への公開だったため同日ロールバック済み。
3 本のディレクトリは `docs/31_note記事原稿/koumuin-claude-code/` に戻し、対応表 json は空にした。

**How to apply:** note 記事を公開する作業では、
(1) 公開済み記事の slug→URL 対応表 `.claude/state/note-published-urls.json` を参照・更新する。
(2) 回遊フッタ・本文内部リンクは、公開済み記事は note URL に、未公開記事はリンクなしタイトルに書き換える。
(3) 全記事公開後に一括でリンク修正パスを入れるのが再編集回数最小。
(4) 公開前に投稿先 note アカウントが正しいか必ず確認する (過去に誤アカウント公開の事故あり)。
