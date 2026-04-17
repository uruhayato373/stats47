#!/bin/bash
source "$(dirname "$0")/_common.sh"

log_run discover-trends \
  npx --yes @anthropic-ai/claude-code \
    -p "/discover-trends-all" \
    --dangerously-skip-permissions
