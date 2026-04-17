#!/bin/bash
source "$(dirname "$0")/_common.sh"

log_run backup-d1 \
  npm run backup:d1 --workspace=packages/database -- --env production
