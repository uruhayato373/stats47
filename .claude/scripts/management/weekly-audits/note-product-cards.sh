#!/usr/bin/env bash
# note の公開記事に埋めた商品カードが実商品 (storefront.generated.ts) の題名と一致するかの週次監査
# (2026-10-26 に note-product-card-audit-weekly.yml から週次レビューへ移した)。読み取りだけで、不一致があれば exit 1。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。カードの差し替えは note への外部変更なのでオーナー承認が要る。
set -uo pipefail
cd "$(dirname "$0")/../../../.."
node .claude/scripts/note/audit-note-product-cards.mjs --live
