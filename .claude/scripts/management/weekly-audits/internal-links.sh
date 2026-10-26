#!/usr/bin/env bash
# サイト内リンクの週次監査 (2026-10-26 に internal-link-audit-weekly.yml から週次レビューへ移した)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。soft 404 を含むリンク切れがあれば exit 1。
# 出力: data/blog/internal-link-audit.json・data/site/link-audit.json (土曜ランナー weekly-saturday.sh がコミットする)
set -uo pipefail
cd "$(dirname "$0")/../../../.."
rc=0
mkdir -p data/blog data/site
node .claude/scripts/blog/audit-internal-links.mjs --json data/blog/internal-link-audit.json || rc=1
node .claude/scripts/site/audit-site-links.mjs --per-route 10 --json data/site/link-audit.json || rc=1
if [ "$rc" != 0 ]; then
  cat <<'HINT'
是正手順 (正典: .claude/rules/blog-quality-standards.md §内部リンクの実在):
- 記事本文: .claude/scripts/blog/data/broken-link-remap.json に置換先 (無ければ to: null) を足し、
  node .claude/scripts/blog/fix-broken-internal-links.mjs --apply → npx tsx .claude/scripts/blog/push-article-md-r2.ts --apply (改稿は再デプロイで反映)
- ページ側の生成リンク: 参照元 route から生成元を直す。/tag/* は cd apps/web && npx tsx scripts/generate-known-tag-keys.ts、
  県ページ由来は packages/data-configs/src/area-databook/template.ts、テーマ由来は data/themes/catalogs/*.json
HINT
fi
exit "$rc"
