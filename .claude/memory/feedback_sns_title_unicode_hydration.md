---
name: sns_title_unicode_hydration
description: SNS本文を見本名に短縮するときはUTF-16の途中で切らない。絵文字の分断がSSRとブラウザの文字差を起こす。
type: feedback
---

**問題**: 画像の見本一覧で、Reactのhydration不一致が発生した（2026-10-19）。

**原因**: `sourceItems()`がSNS本文を`.slice(0, 100)`で短縮し、絵文字のサロゲートペアを分断していた。SSR HTMLでは置換文字、ブラウザのデータでは孤立サロゲートとなり、見本名・title・aria-labelが一致しなかった。ブラウザ診断が文字差を示した。

**対策**: 企画の明示的な題名を優先し、本文を短縮する場合は`Array.from(text).slice(0, 100).join('')`でコードポイント単位に切る。投稿本文そのものは変えない。`.claude/scripts/media/__tests__/workspace.test.mjs`の99文字＋絵文字のケースで回帰を防ぐ。

**証拠**: `.claude/scripts/media/lib/workspace.mjs`の`sourceItems()`。修正後の画像見本ページを再読込・媒体別見本選択・390px・darkで確認し、pageerror 0。
