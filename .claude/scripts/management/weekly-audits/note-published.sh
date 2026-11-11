#!/usr/bin/env bash
# note の公開記事を全件、公開ページの実物から採点する週次監査 (2026-11-11)。読み取りだけでログインも要らない。
# 型でない本文画像・画像の重複・旧文言のカードの本数が縮小専用の上限 (.claude/config/note-published-baseline.json) を超えたら exit 1。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。直す手順は .claude/skills/note/remediate-note-published/SKILL.md。
set -uo pipefail
cd "$(dirname "$0")/../../../.."
node .claude/scripts/note/audit-note-published.mjs --check
