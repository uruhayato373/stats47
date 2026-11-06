---
name: feedback_ci_speed_wait_time
description: CI 短縮は実行分数でなく人の待ち時間で測る。遅い工程に手を入れる前に、その工程を毎回実行している理由と過去の回の実績を読む
metadata:
  type: feedback
---

リポジトリは PUBLIC で Actions の分数は無料なので、短縮の価値は人が待つ時間で測る。並列に走る重複は待ち時間を増やさない。

**Why:** 2026-11-06 の分析で、1 回のログから「snapshot の送信が壊れている」「smoke が重複している」「cancel は bot が原因」と見立てたが、複数回の実績と workflow の本文を読むとどれも誤りだった。snapshot は中身が変わった回だけ多く、smoke は別物で、cancel はセッションの push だった。

**How to apply:** 工程を短縮する前に、workflow のコメントが書く理由と直近 8 回の実績を読む。cancel は head の commit の著者まで確かめる。正典 `.claude/rules/branch-workflow.md`「待ち時間を増やさない運用」。
