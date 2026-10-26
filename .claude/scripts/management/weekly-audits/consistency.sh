#!/usr/bin/env bash
# agent / skill / 文書 / 公開 snapshot の週次の整合監査 (2026-10-26 に agent-consistency-weekly.yml から週次レビューへ移した)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。どれかの検査が落ちると exit 1。state の容量超過と
# Instagram 台帳のずれは警告だけ (CI でも Issue を立てるだけで run は落とさなかった)。
set -uo pipefail
cd "$(dirname "$0")/../../../.."
failed=()
run() { local name="$1"; shift; echo "=== $name ==="; "$@" || failed+=("$name"); }
run consistency-tests node --test .claude/scripts/lib/__tests__/check-agent-skill-consistency.test.cjs
run consistency node .claude/scripts/lib/check-agent-skill-consistency.cjs
run business-plan npm run --silent business-plan:check
run checker-wiring node .claude/scripts/lib/check-checker-wiring.cjs --baseline
run docs-tests node --test .claude/scripts/lib/__tests__/check-docs-governance.test.cjs .claude/scripts/lib/__tests__/strategy-lanes.test.cjs \
  .claude/scripts/lib/__tests__/check-docs-links.test.cjs .claude/scripts/lib/__tests__/check-docs-code-refs.test.cjs
run docs-governance node .claude/scripts/lib/check-docs-governance.cjs --fail-on-warn
run docs-links node .claude/scripts/lib/check-docs-links.cjs --baseline --orphans
run docs-code-refs node .claude/scripts/lib/check-docs-code-refs.cjs
run page-components-snapshot npx tsx apps/web/scripts/verify-page-components-snapshot.ts
run affiliate-ads-snapshot npx tsx apps/web/scripts/verify-affiliate-ads-snapshot.ts
run active-ranking-r2-coverage node .claude/scripts/ranking/check-active-r2-coverage.mjs
# git 追跡下の .claude/state の容量 (予算 15MB)。git 管理外のロックやキャッシュは数えない
STATE_KB=$(git ls-files -z .claude/state | xargs -0 du -ck 2>/dev/null | tail -1 | cut -f1)
STATE_MB=$(( ${STATE_KB:-0} / 1024 ))
echo "=== state-size === ${STATE_MB}MB (予算 15MB)"
[ "$STATE_MB" -le 15 ] || echo "warning: .claude/state が予算超過。npm run state:snapshots:prune で安全対象だけを間引く"
echo "=== ig-ledger-drift ==="
node .claude/scripts/instagram/record-posted.cjs --check || echo "warning: Instagram の投稿台帳がずれている (node .claude/scripts/instagram/record-posted.cjs --from-log で回収)"
if [ "${#failed[@]}" -gt 0 ]; then echo "落ちた検査: ${failed[*]}"; exit 1; fi
