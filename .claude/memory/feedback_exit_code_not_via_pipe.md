---
name: feedback-exit-code-not-via-pipe
description: "検証コマンドの exit code を `| tail` 等のパイプ越しに $? で測ると常に 0 になり「全 PASS」に見える。ガード検証は必ず直接実行 or PIPESTATUS で判定する"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 015940d2-3e3e-4b91-9b00-f7f1e0814230
---

検証コマンドを `cmd | tail -1; echo $?` の形で実行すると **$? は tail の exit (常に 0)** になり、
失敗が全て PASS に見える。2026-07-13〜14 の PR #569 デプロイで同じミスを 2 回やり、
「CI ガードのローカル先回り実行 14 件全 PASS」が全件無効 → CI で逐次失敗が 4 ラウンド続いた。

**Why:** パイプの exit code は最終段のもの。ループ内 `out=$(cmd | tail -1); code=$?` も同罪。

**How to apply:**
- ガード/checker の検証は `if cmd > /tmp/out.txt 2>&1; then PASS; else FAIL; fi` の直接実行形にする
  (このセッションで実際に使った run_gate() パターン)
- どうしてもパイプが要るなら `${PIPESTATUS[0]}` (bash) で先頭段を見る
- 「全 PASS」が出たら 1 件だけ意図的に壊して FAIL が出ることを確認する (検証器の検証)

関連: [[feedback-shared-working-copy-git-race]] (同セッションで並行作業と交錯した際、
「green なのに何もしない」silent no-op と組み合わさると誤診が連鎖する)
