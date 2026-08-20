---
name: feedback-exit-code-not-via-pipe
description: "検証コマンドの exit code を `| tail` 等のパイプ越しに $? で測ると常に 0 になり「全 PASS」に見える。ガード検証は必ず直接実行 or PIPESTATUS で判定する"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 015940d2-3e3e-4b91-9b00-f7f1e0814230
  modified: 2026-08-20T11:01:09.844Z
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

## ★2026-08-20: 1 セッションで 3 回踏んだ。適用範囲が狭すぎた

上の記述は「ガード/checker の検証」に限定して読んでいたため、**同じ形の他のコマンドで
繰り返し踏んだ**。実際に踏んだ 3 つはどれも checker の検証ではない:

| 形 | 何が隠れたか |
|---|---|
| `node preflight.mjs \| head -30; echo $?` | 2 ゲート失敗が `PREFLIGHT_EXIT=0` に見えた |
| `git commit ... 2>&1 \| tail -3` | **pre-commit がコミットを中止したのに成功に見え**、後続の push 手順まで書いた |
| `npm run build \| tail` | build 失敗が exit 0 に見えた (別セッション) |

**適用範囲は「exit code を見るすべてのコマンド」。** とくに `git commit` は危険で、
失敗しても標準出力に赤いメッセージが出るだけなので、tail で切ると成功と区別がつかない。

**How to apply (追補):**
- **`cmd > /tmp/x.log 2>&1; echo "EXIT=$?"` を既定形にする**。出力は後から Read/grep すればよい。
  「見やすくするための ` | tail`」と「成否判定」を同じコマンドに混ぜない。
- `git commit` / `git push` / `npm run build` は**必ず**この形。
- 長い出力を切りたいときは、判定を先に済ませてから別コマンドで整形する。
- 引数ミス (`--no-verify=false` → exit 129) もこの形なら即座に見える。実際 2026-08-20 に
  この追補を書いた直後、同じコマンドで exit 129 を捕まえられた。

関連: [[feedback-shared-working-copy-git-race]] (同セッションで並行作業と交錯した際、
「green なのに何もしない」silent no-op と組み合わさると誤診が連鎖する)
