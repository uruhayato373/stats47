---
name: feedback_periodic_progress_reports
description: 長時間のバックグラウンド作業 (subagent/workflow) 中は、ユーザーに聞かれる前に約4-5分間隔で自発的に進捗報告する (2026-07-17 指摘)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f106cf86-b6f6-48b5-bfbd-d9805e1c1eef
---

長時間のバックグラウンド作業 (subagent / Workflow / 常駐プロセス) 中、通知が来るまで黙って待つとユーザーには「進んでいるか止まっているか分からない」。2026-07-17 に「定期的に進捗報告してくれないと分からない」と明示指摘された (buzz-map Phase 1b の opus agent 実行中に 2 回「動いている?」と聞かれた後)。

**Why:** 完了通知ベースの報告だけだと 10-20 分の空白ができ、ユーザーは停止と区別できない。

**How to apply:**
- 重い subagent/workflow を起動したら、background の軽量タイマー (`run_in_background` の `for i in {1..N}; do sleep 30; done` 等・~4-5分) を並走させ、タイマー完了通知で目を覚ましたら**成果物の実体 (ファイル mtime/行数/件数) を 1 コマンドで確認して 1-3 行報告**し、作業が続いていればタイマーを再アーム。
- 報告は「何が何件まで進んだか」の実測ベース (agent の自己申告や推測ではなく mtime/grep -c)。
- 完了通知が来たら通常の独立検証 + 受入報告に切替。
