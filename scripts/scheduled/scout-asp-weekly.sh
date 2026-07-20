#!/bin/bash
# 週次 A8 scout パイプライン (ローカル Mac 限定 — Playwright プロファイルが .local にあるため)。
# launchd から日曜 07:00 JST に発火。scout → apply → check-approval → harvest → register を回す。
# 詳細: .claude/rules/affiliate-ads-standards.md §10 / .claude/skills/ads/scout-asp/SKILL.md
source "$(dirname "$0")/_common.sh"

log_run scout-asp-weekly \
  npx --yes @anthropic-ai/claude-code \
    -p "/scout-asp full" \
    --dangerously-skip-permissions
