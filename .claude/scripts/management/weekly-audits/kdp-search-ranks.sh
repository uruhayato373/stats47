#!/usr/bin/env bash
# KDP の本の Kindle 検索順位の週次記録 (2026-11-06)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。公開ページだけを読むのでログインは要らない。
# 検索語は data/products/kdp-listing-copy.json の targetQueries。規約: .claude/rules/coconala-product-standards.md §8
set -uo pipefail
cd "$(dirname "$0")/../../../.."
node .claude/scripts/kdp/kdp-search-ranks.mjs --write || exit 1
