#!/usr/bin/env bash
# CI の無人 Claude 実行 1 回分のトークン実績を history.csv に追記し、develop へ push する。
#
#   bash .claude/scripts/lib/record-claude-usage-ci.sh <execution-file> <workflow> <limit> <items> <effort>
#
# ★job の作業ツリーとブランチには触れない。origin/develop から使い捨て worktree を作り、そこだけに書いて push する。
#   job が PR 用ブランチへ切り替えていても (seo-keyword-cycle 等)、その commit を develop へ流さないため。
#   旧来の「作業ツリーで stash → pull → push」は job の最後でしか使えず、途中の生成物を stash に置き去りにする。
# 計測のみ。記録や push に失敗しても本体の成否を変えないよう、常に exit 0 で終え、失敗は ::warning:: で残す。
# model は execution log の init 行から record-claude-usage.mjs が取る。effort は log に載らないので引数で渡す
# (workflow 側は claude_args と同じ env を渡し、値を 1 か所に保つ)。
set -u

FILE="${1:-/home/runner/work/_temp/claude-execution-output.json}"
WORKFLOW="$2"
LIMIT="${3:-0}"
ITEMS="${4:-0}"
EFFORT="${5:-}"
REL=".claude/state/metrics/claude-usage/history.csv"
WT="$(mktemp -d)/usage-record"

warn() {
  echo "::warning::$1 (計測のみ・本体には影響しない)"
  git worktree remove --force "$WT" >/dev/null 2>&1 || true
  exit 0
}

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git fetch --quiet origin develop || warn "origin/develop を取得できなかった"
git worktree add --quiet --detach "$WT" origin/develop || warn "記録用 worktree を作れなかった"

for attempt in 1 2 3; do
  if [ "$attempt" -gt 1 ]; then
    sleep 5
    git -C "$WT" fetch --quiet origin develop && git -C "$WT" checkout --quiet --detach --force origin/develop || continue
  fi
  node .claude/scripts/lib/record-claude-usage.mjs "$FILE" \
    --out "$WT/$REL" \
    --workflow "$WORKFLOW" \
    --run-id "${GITHUB_RUN_ID:-}" \
    --limit "$LIMIT" \
    --items "$ITEMS" \
    --effort "$EFFORT" || warn "トークン実績を記録できなかった"
  git -C "$WT" add "$REL"
  if git -C "$WT" diff --cached --quiet; then
    echo "記録する変更なし"
    git worktree remove --force "$WT" >/dev/null 2>&1 || true
    exit 0
  fi
  git -C "$WT" commit -q -m "chore(metrics): record Claude token usage [skip ci]"
  if git -C "$WT" push --quiet origin HEAD:develop; then
    echo "✅ トークン実績を記録した"
    git worktree remove --force "$WT" >/dev/null 2>&1 || true
    exit 0
  fi
done
warn "トークン実績の push に失敗した"
