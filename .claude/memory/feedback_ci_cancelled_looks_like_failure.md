---
name: feedback_ci_cancelled_looks_like_failure
description: 後続 push が concurrency group で古い CI run を cancel すると全 job が cancelled になり、通知や PR 上では failure と区別がつかない。conclusion を見て superseded か判定する
metadata:
  node_type: memory
  type: feedback
---

同じブランチに後続の push が入ると、concurrency group が古い workflow run を **cancel** する。
このとき全 job の conclusion が `cancelled` になり、**PR の見た目・webhook 通知は failure と
区別がつかない**。

**Why:** 2026-08-04 の develop→main デプロイで 2 回誤読した。

- PR #722: 自分の run が別セッションの push に追い越されて cancelled → 「CI 失敗」と読んで原因調査を始めた
- PR #729: 同じことが commit `77a319bd` (別セッションの楽天 sync 修正) で起きた

どちらも実際には**何も壊れていない**。新しい run が緑になれば PR はマージできる。
job ログを読みに行っても「始まってすらいない」ので何も出てこない (ここで時間を使った)。

**How to apply:**
- CI が赤く見えたら、**まず conclusion が `failure` か `cancelled` か**を見る
  (`mcp__github__pull_request_read` / `actions_get`)。
- `cancelled` かつ同ブランチに自分の run より新しい run があれば **superseded**。対処は不要で、
  **新しい run の結果を待つ**。ログを読まない。
- 「全 job が一斉に cancelled」は superseded のサイン。本物の失敗なら特定 job だけが落ちる。
- 複数セッションが同じブランチへ push している時に起きやすい。
  同時実行の危険は [[feedback_shared_working_copy_git_race]] も参照。

正典: `.claude/skills/dev/deploy/SKILL.md`「CI が『失敗』に見えるが実は superseded」

関連: [[feedback_cloud_github_api_mcp_only]] / [[feedback_shared_working_copy_git_race]]

## 2026-09-13 最終CIの早期開始と未完了commit待ち

**問題**: 画面確認中の追加修正や記録を小刻みにpushし、合格済みの検査を含むCIが後続runに置き換わった。commitフックが実行中なのに次のpushへ進み、意図した最新commitより一つ前のHEADをpushする手戻りも発生した。

**原因**: ローカルの機能確認だけで最終CIを先行させ、背景画像までの視覚確認を完了条件に含めていなかった。非同期commandのsession IDを完了と取り違え、exit codeの確認を依存操作の前提にしなかった。

**対策**: ①独立するローカル確認で初期表示・操作・背景までの問題をまとめて回収。②必要な修正と公開前記録をまとめる。③commitの明示的なexit_code=0を待ち、HEAD・staged/unstaged・untrackedを確認してpush。④以後は最新HEADのCIと独立したread-only確認だけを進める。最終的な公開後記録は後段へまとめ、検証中のHEADを小さな記録だけで更新しない。追加不具合があれば必要な検査は再実行し、過去のPASSを現在版へ流用しない。根拠は`branch-workflow.md`のpreflight/まとめて公開と、2026-09-13全セッションrelease記録。

**待ち時間の区別**: run 34737942636では9検査job成功後に集約jobがrunner未割当でqueuedになった。検査時間とrunner待ちを混ぜず、全体conclusionが成功するまではCI完了としない。
