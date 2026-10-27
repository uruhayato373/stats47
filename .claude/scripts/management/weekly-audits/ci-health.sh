#!/usr/bin/env bash
# CI の健全性の週次確認 (2026-10-26 に workflow-health-daily.yml から週次レビューへ移した)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。gh の認証で Actions の run 履歴を読むだけ。
# 連続失敗している cron・配信データ (R2) の陳腐化・アフィリエイト portfolio state の鮮度・待機中に取り消された
# R2 書き込みの手動起動・認証付き計測の停止・Next.js のサポート期限 (残り 60 日未満か回避フラグ残存) のどれかがあれば exit 1。出力: data/ci/ (LATEST.md・workflow-health.json)
# cron でなくなったので、自分自身の失敗を連続失敗に数えて緑に戻れない問題 (2026-08-13〜10-25 に成功 0 回) は起きない。
set -uo pipefail
cd "$(dirname "$0")/../../../.."
export R2_PUBLIC_FETCH_URL="${R2_PUBLIC_FETCH_URL:-https://storage.stats47.jp}"
failed=()
run() { local name="$1"; shift; echo "=== $name ==="; "$@" || failed+=("$name"); }
run workflow-health node .claude/scripts/ci/audit-workflow-health.mjs --min-streak "${MIN_STREAK:-2}"
run r2-freshness node .claude/scripts/ci/audit-r2-freshness.mjs
echo "=== affiliate-portfolio ==="
ART="${TMPDIR:-/tmp}/affiliate-portfolio-artifact"
rm -rf "$ART" && mkdir -p "$ART"
RUN_ID=$(gh run list --workflow affiliate-ga4-weekly.yml --event schedule --status success --limit 1 --json databaseId --jq '.[0].databaseId // empty')
[ -n "$RUN_ID" ] && gh run download "$RUN_ID" --name affiliate-portfolio-state --dir "$ART" 2>/dev/null
STATE_PATH=$(find "$ART" -name affiliate-portfolio-latest.json -print -quit)
if [ -n "$STATE_PATH" ]; then
  node .claude/scripts/ads/check-affiliate-portfolio-freshness.mjs --path "$STATE_PATH" || failed+=("affiliate-portfolio")
else
  echo "判定不能: アフィリエイト portfolio の成果物が無い (最後の成功 run の成果物は 30 日で消える)"
  failed+=("affiliate-portfolio-missing")
fi
run superseded-dispatches node .claude/scripts/ci/audit-superseded-dispatches.mjs
run authenticated-measurement node .claude/scripts/measurement/health.mjs --check
run next-support-window node .claude/scripts/lib/check-next-support-window.cjs
if [ "${#failed[@]}" -gt 0 ]; then echo "異常: ${failed[*]}"; exit 1; fi
