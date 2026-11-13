#!/usr/bin/env bash
# note の公開記事・タグ・導線・マガジン・カバー・カードの週次全量監査 (2026-10-26 に note-circulation-audit-weekly.yml から週次レビューへ移した)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。note への書き込みはしない (公開ページと公開 API の読み取りだけ)。
# どれかの検査が落ちる・circulation の gate (errors / warnings / タグ / マガジン / 有料記事の無料部分) を満たさないと exit 1。
# 台帳と R2 の照合 (private を含む) も run ledger-r2-verify で行う。
# 出力: data/note/evidence/note-circulation-audit-*.json・note-unverified-audit-latest.json・note-cover-audit-latest.json・data/note/card-visibility-latest.json・data/note/cover-assets.json
set -uo pipefail
cd "$(dirname "$0")/../../../.."
failed=()
run() { local name="$1"; shift; echo "=== $name ==="; "$@" || failed+=("$name"); }
run catalog npm run --silent note:catalog:validate
# 台帳と R2 (private を含む) の照合。S3 認証は Mac の .env.local (note-article.mjs が読む)。--deep と --record は付けない (全件の SHA 照合は控えの削除前に手で回す)
run ledger-r2-verify npm run --silent note:article -- verify
run circulation-tests npm run --silent note:circulation:test
run cover-tests npm run --silent note:covers:test
run asset-tests npm run --silent note:assets:test
run asset-validate npm run --silent note:assets:validate
run image-tests npm run --silent note:images:test
echo "=== image-assets ==="
node .claude/scripts/note/audit-note-image-assets.mjs --json --verify-r2 > "${TMPDIR:-/tmp}/note-image-assets.json" || failed+=("image-assets")
run covers npm run --silent note:covers:audit
run circulation npm run --silent note:circulation:audit
CARDS=data/note/card-visibility-latest.json
run cards npm run --silent note:cards:audit -- --browser-verify --previous "$CARDS" --output "$CARDS"
if node -e 'process.exit(require(process.argv[1]).summary.browserVerifyFailedArticles ? 0 : 1)' "$PWD/$CARDS" 2>/dev/null; then
  run cards-retry npm run --silent note:cards:audit -- --browser-verify --retry-unknown-from "$CARDS" --output "$CARDS"
fi
node -e 'const s=require(process.argv[1]).summary; process.exit(s.fetchFailed || s.browserVerifyFailedArticles || s.affectedArticles ? 1 : 0)' "$PWD/$CARDS" || failed+=("card-visibility")
run product-navigation npm run --silent note:navigation:products:check
run unverified npm run --silent note:unverified:audit -- --output data/note/evidence/note-unverified-audit-latest.json
REPORT=$(ls -t data/note/evidence/note-circulation-audit-*.json 2>/dev/null | head -1)
if [ -z "$REPORT" ]; then
  failed+=("circulation-report-missing")
else
  node - "$REPORT" <<'NODE' || failed+=("circulation-gate")
const report = JSON.parse(require("node:fs").readFileSync(process.argv[2], "utf8"));
const s = report.summary || {};
const failures = [
  s.errors !== 0 && `errors=${s.errors}`,
  s.warnings !== 0 && `warnings=${s.warnings}`,
  s.compliantHashtags !== s.total && `hashtags=${s.compliantHashtags}/${s.total}`,
  s.exactMagazineMemberships !== s.liveMagazines && `magazines=${s.exactMagazineMemberships}/${s.liveMagazines}`,
  s.defaultMagazineCovers !== 0 && `defaultCovers=${s.defaultMagazineCovers}`,
  s.magazineMetadataWarnings !== 0 && `magazineMetadata=${s.magazineMetadataWarnings}`,
  s.profileWarnings !== 0 && `profileWarnings=${s.profileWarnings}`,
  s.pinnedArticles !== 1 && `pinned=${s.pinnedArticles}`,
  s.profiledArticles !== 1 && `profiled=${s.profiledArticles}`,
  s.paidLandingErrors !== 0 && `paidLanding=${s.paidLandingCompliant}/${s.paidLandingApplicable} (errors=${s.paidLandingErrors})`,
].filter(Boolean);
for (const a of report.articles.filter((x) => x.errors.length || x.warnings.length).slice(0, 30)) {
  console.log(`- ${a.key}: ${[...a.errors, ...a.warnings].map((i) => i.code).join(", ")}`);
}
if (failures.length) { console.error(`note circulation gate failed: ${failures.join(", ")}`); process.exit(1); }
console.log(`note circulation gate passed: ${s.total} articles`);
NODE
fi
# 本文の図の台帳 (CI が土曜 04:00 に作る) から、直すべき記事を出す
run body-figures npm run --silent note:figures -- --check
if [ "${#failed[@]}" -gt 0 ]; then echo "落ちた検査: ${failed[*]}"; exit 1; fi
