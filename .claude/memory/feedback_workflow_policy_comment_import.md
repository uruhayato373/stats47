---
name: feedback_workflow_policy_comment_import
description: "audit-workflow-policy の依存判定はコメント内の `from \"x\"` も import と数え、SCRIPT_RUN_WITHOUT_INSTALL を誤検出する"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 4380d850-b42b-4a15-bef1-0d5108fef832
  modified: 2026-10-05T21:41:57.001Z
---

`.claude/scripts/lib/audit-workflow-policy.cjs` は、スクリプトが node_modules を要るかを正規表現 `(?:from|import)\s+["']...["']` と `require("...")` で
相対 import を再帰的にたどって判定する。コメントも区別しないので、共通モジュールの冒頭に使用例として
`import { SITE_ORIGIN } from "<相対>/lib/site-config.cjs"` と書いただけで、`<相対>/...` が bare specifier と判定され、
それを読む 3 workflow (internal-link-audit / post-instagram / post-threads) が「npm ci なしで依存のあるスクリプトを実行」と誤検出された (2026-10-06)。

**Why:** preflight:pr の workflow-policy ゲートと CI の --strict 実行が落ちる。原因が自分の書いたコメントだと気づくまで、監査ツール本体を読む必要があった。

**How to apply:** `.claude/scripts` 配下の .cjs/.mjs のコメントに使用例を書くときは、`from "..."` や `require("...")` の形を使わず散文で書く
(例:「SITE_ORIGIN を lib/site-config.cjs から取り出す」)。この誤検出を見たら、まず指摘対象スクリプトが読む相対モジュールのコメントを疑う。
なお `file` コマンドはこの監査ツール本体を "binary data" と誤判定し、素の grep が何も返さない。中を検索するときは `grep -a` を使う。
関連: [[feedback_help_flag_runs_script]]
