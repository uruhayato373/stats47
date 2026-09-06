---
name: project_ai_content_headless_claude_batch
description: "ranking ai-content ローカル量産は headless `claude -p` (Sonnet author+critic, Opus は quarantine 例外のみ)。1 件 ≈$0.55、Agent tool 経路 ($17/件) の 1/30。中断・再開・rebase 競合・スロットリングの運用上の罠"
metadata:
  node_type: memory
  type: project
  originSessionId: 33048715-f478-4fce-88e5-a2612912bc1f
  modified: 2026-09-05T15:48:41.363Z
---

2026-09-05〜06 に ranking ai-content 残 1,445 件を `run-claude-batch.sh` (headless `claude -p`) で量産開始。
分業: author/critic = Sonnet 5 (effort low・concurrency 2)、quarantine (3 連続 REJECT) の key だけ Opus 5 headless
(`--model claude-opus --cli-effort medium --keys ...`)。Agent tool (`ranking-content-author`) は使わない。
実測: 35 件バッチ ≈50 分、通過率 65-77%、≈$0.55/key・≈$0.8/公開件。

**Why (運用の罠、実測で踏んだもの):**
- **Claude セッション利用枠の枯渇** (5h 窓) で preflight が落ちると driver は「report が無い」で停止する。CLI の欠陥ではない。リセット時刻を待って再起動。
- **リセット直後はサーバー側スロットリング** ("temporarily limiting requests (not your usage limit)") が 5-10 分続く。author が通った直後の critic が落ちると author 出力ごと FAIL (Opus 2 件 $0.49 が無駄になった)。対策: バッチ開始前に小さな Sonnet probe で待つ (`run100-v2.sh` の `wait_for_capacity`) + 再試行を 60s×5 (計 15 分) に延長。
- **中断時に outbox の残骸を別 commit で先行公開すると、次バッチが同じ key を再選定して rebase が modify/delete 競合する**。キューは R2 から再導出するので publish が R2 に届く前に始めると再選定される。順序: 残骸 push → publish run 完了 → 90 秒待つ → driver 起動。競合したら `git rm` で重複分を落として `rebase --continue`。
- driver 実行中に `generate-parallel.ts` や prompt を直したら **すぐ commit する**。未コミットの tracked 変更があるとバッチ末尾の `git rebase` が止まる (別ファイルでも)。
- バッチログは `grep -vE` で濾すため `--line-buffered` が無いと数分遅れる。
- `paren-number` の最頻は「受療率（人口10万対）」のような単位注記。ゲートは緩めず prompt に NG/OK 例を足した (2026-09-06)。

**How to apply:** 再開手順は worktree `/Users/minamidaisuke/stats47-ai-content-lean` (branch develop) で
`.local/ci/run100-v2.sh` (PREFIX/TARGET/MAX_BATCHES env) を python `os.setsid()` で detached 起動し、ログ `.local/ci/*.log` を Monitor する。
正典は `.claude/rules/ranking-content-standards.md` §2026-09-05。関連 [[project_ai_content_remediation_queue]]。
