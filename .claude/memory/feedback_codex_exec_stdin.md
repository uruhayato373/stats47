---
name: feedback-codex-exec-stdin
description: 背景実行の codex exec は標準入力を待って無言で止まる。</dev/null で閉じる
metadata:
  type: feedback
---

スクリプトから `codex exec` を動かすときは `</dev/null` を付ける。付けずに Bash のバックグラウンドで動かすと、記録 (`~/.codex/sessions`) を 1 行も残さず CPU も使わずに止まり続ける (2026-11-04 に 7 時間 23 分止まった)。

**Why:** 標準入力が端末でないと codex exec はそこから追加入力を読む。閉じれば同じコマンドが 45 秒で終わった。
**How to apply:** ブログ背景の一括生成は `request-article --article` → `codex exec ... </dev/null` → `ingest-article --article` の順。公開前の記事は `--article` を付けないと R2 を読みに行って 404 になる。止まって見えたら経過時間と CPU 時間を比べる。[[feedback-blog-background-codex-only]]
