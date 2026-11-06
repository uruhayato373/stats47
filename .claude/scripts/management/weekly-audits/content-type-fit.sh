#!/usr/bin/env bash
# 全コンテンツの 4 型の検査と、型に合っていない記事の処置の案の週次の作り直し。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。公開ブログの本文と GSC を読むだけで、記事は変えない。
# 案は data/content/type-fit-review.json に書き、人が書いた decisions は残す。正典 .claude/rules/content-type-standards.md。
set -uo pipefail
cd "$(dirname "$0")/../../../.."
npm run --silent content-types:check || exit 1
npm run --silent content-types:fit
