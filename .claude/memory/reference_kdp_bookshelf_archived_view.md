---
name: reference_kdp_bookshelf_archived_view
description: KDP 本棚の既定表示と検索はアーカイブ済みの本を出さない。取り下げ・旧版の下書きは「アーカイブ済みの本」にあり、口座には台帳外の本もある
metadata:
  type: reference
---

KDP 本棚 (`kdp.amazon.co.jp/ja_JP/bookshelf`) の表示の切り替え `#podbookshelftable_view_input-option` は既定が「本」(値 `UNARCHIVED`) で、アーカイブ済みの本を出さない。本棚の検索もアーカイブ済みを結果に含めない (「検索結果に含めるには、すべてのタイトル ビューを使用します」と出る)。

2026-11-13 の実測: 既定の表示は Kindle 本 41 冊ですべて販売中 (stats47 の台帳の 13 冊 + 台帳外 28 冊)、下書き 0。「アーカイブ済みの本」は Kindle の下書き 42 冊 (stats47 の取り下げ 10 冊 + S1 の旧版 9 冊 + 台帳外 23 冊)。台帳外の本はこの口座のほかの出版物で、stats47 の本ではない。

**How to apply:** 既定の表示で下書きが見えないことを「下書きは無い・消えた」と読まない。取り下げ本や旧版を探すときは表示を「アーカイブ済みの本」か「すべての作品」に切り替え、読み終えたら「本」へ戻す。本棚の冊数を数えるときは台帳の draftId で stats47 の本だけを取り分ける。アーカイブ済みの下書きが作成数の制限に数えられるかは未確認。関連 [[project_kindle_publishing_factory]]
