---
name: bypass-permissions
description: Agent起動時はbypassPermissionsモード、確認なしで最後まで処理を完了する
type: feedback
---

Agent tool でサブエージェントを起動する際は `mode: "bypassPermissions"` を指定する。

**Why:** セッション中に何度も yes 確認を求められるのがストレス。自分のプロジェクトなので全承認スキップで問題ない。

**How to apply:** Agent tool 呼び出し時に必ず `mode: "bypassPermissions"` を付与。メイン会話でも可能な限り確認を減らす。
