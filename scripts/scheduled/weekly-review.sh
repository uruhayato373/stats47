#!/bin/bash
source "$(dirname "$0")/_common.sh"

log_run weekly-review \
  npx --yes @anthropic-ai/claude-code \
    -p "/weekly-review" \
    --dangerously-skip-permissions
