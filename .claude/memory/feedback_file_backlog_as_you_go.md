---
name: feedback-file-backlog-as-you-go
description: 長い作業では範囲外の課題を見つけた時点でバックログへ起票しながら進める。最後にまとめて報告するだけにしない
metadata:
  node_type: memory
  type: feedback
  originSessionId: 66a8d1fe-b472-4ddc-ad25-de57e0826f49
  modified: 2026-10-08T06:22:28.151Z
---

長い作業 (複数 subagent・CI 待ちを含む展開作業など) の途中で見つけた範囲外の課題は、見つけた時点で `.claude/todo/backlog.md` にカードとして起票しながら進める。最終報告の「残課題」に書くだけで終えない。

**Why:** 2026-10-08、参考文献由来の指標展開で subagent の起票候補・CI の失敗・規約の食い違いが十数件たまり、報告の文中にしか残っていなかった。オーナーから「バックログに起票しながらすすめたらどうか」と指摘された。報告の文は次のセッションから見えない。

**How to apply:**
- 起票前に backlog と Issue を ID・キーワードで検索し、既存カードがあれば観測日と症状を追記する (新規カードを作らない)。
- その場で直せる小さな修正 (数行・決定的) は起票せず直す。判断が要るものは 🟣 (`[種類:意思決定]`)、trigger 待ちは 🟢 に trigger を書く。
- PR の CI 待ちの最中は、push すると必須検査がやり直しになるので、起票のコミットはローカルに留めてマージ後に push する。
- 関連: [[feedback_agent_output_contract]] (subagent の起票候補は呼び元が記録する)。
