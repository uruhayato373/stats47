---
name: feedback-workflow-arg-vector-quoted
description: CI workflow の可変引数列は bash 配列で組む。文字列連結 + "$VAR" 単一引数渡しは 1 トークン化して実行時に壊れる (SC2086 一括 quote で 6 workflow が実 regression、2026-07-14 検知)。ガード = ARG_VECTOR_QUOTED (audit-workflow-policy.cjs)
metadata:
  type: feedback
---

# workflow の引数列を "$VAR" で渡さない (ARG_VECTOR_QUOTED)

**事実**: 2026-07-13 の shellcheck 一括対応 (`a4c5d6eb`、SC2086=変数 quote) で、文字列連結で組んだ
引数列 (`ARGS="$ARGS --only x"` / `FLAGS="--type x --force"`) をコマンドへ `"$ARGS"` と quote 渡しに
変えた結果、**引数全体が 1 トークン化**し 6 workflow が実行時に壊れた (2026-07-14 検知・全修正済):
sync-snapshots (`Unknown arg` 即死) / data-refresh / cloudflare-monthly-snapshot /
cleanup-r2-sns-videos / generate-ogp-images / **blog-auto-publish + publish-ai-content の CDN purge**
(purge-cache.ts は `--urls` 後ろの複数引数を期待 → 1 トークンだと URL filter 0 件で fail)。

**Why**: shellcheck/actionlint は「quote を付けろ」までしか見ず、**引数契約 (1 引数か引数列か) の意味**
は検査しない。CI green のまま実行時だけ壊れ、cron 発火まで気づけない。

**How to apply**:
- 可変引数列は必ず bash 配列で組む: `ARGS=()` → `ARGS+=(--flag "value")` → `cmd "${ARGS[@]}"`
  (echo 表示は `${ARGS[*]}`)。文字列連結 + `"$VAR"` / unquoted `$VAR` のどちらも使わない。
- 機械ガード: `audit-workflow-policy.cjs` の **ARG_VECTOR_QUOTED** ルール (連結 build + runner への
  quote 単一渡しを検知)。CI = pr-quality-check.yml Static Gates (--strict) で新規混入をブロック。
- 横断一括修正 (lint sweep 等) の後は、**workflow_dispatch 系の代表 1 本を実 dispatch して smoke**
  する (静的 lint は意味破壊を保証しない)。[[feedback_check_why_removed_before_reviving]] と同族の
  「一括変更の意味検証」教訓。
