#!/bin/bash
# デプロイ前ゲート: next build が prerender した HTML の <title> を走査し、
# notFound が焼き込まれた SSG ページを検知する。
#
# なぜこれが「最も汎用的で精密な機械チェック」か (2026-06-22 障害):
#   - 障害の本質は「● SSG ページが build 時に R2 を読めず notFound として prerender される」こと。
#     → build 産物の <title> を見れば、原因・route 種別を問わず症状そのものを直接捕捉できる。
#   - 静的解析 (lint) では区別不能: blog/survey も generateStaticParams + R2 読みを持つが、build 時に
#     R2 を読めて GOOD title で prerender されるため安全。「generateStaticParams + R2 import」では
#     安全/危険を区別できない。<title> ベースなら GOOD title は素通り、notFound title だけ弾ける (誤検知ゼロ)。
#   - CI build (R2 不可) でこそ顕在化する。deploy workflow の build 直後・deploy 前に走らせるのが要。
#
# 検知精度の根拠 (実証):
#   - body に「関連〜見つかりません」を含む GOOD ページ → <title> は正常 → 弾かない ✅
#   - notFound ページ → <title> が「〜が見つかりません」→ 弾く ✅
#   - 正規の /_not-found ページは除外する。
#
# Usage: bash .github/scripts/check-prerender-notfound.sh [APP_DIR]
#   APP_DIR 省略時は apps/web。
# Exit: prerender に notFound title が混入していれば 1 (deploy をブロック)。
#
# 正典: .claude/rules/nextjs-ssg-preservation.md §generateStaticParams 固着

set -uo pipefail
APP_DIR="${1:-apps/web}"
PRERENDER_DIR="${APP_DIR}/.next/server/app"
# notFound を示す <title> 断片 (各 route の generateMetadata fallback)
NOTFOUND_RE='見つかりません|ページが見つかりません|Not Found'

if [ ! -d "$PRERENDER_DIR" ]; then
  echo "⚠️  ${PRERENDER_DIR} が無い (build 未実行?)。スキップ。"
  exit 0
fi

echo "🔎 Prerender notFound scan: ${PRERENDER_DIR}"

violations=0
scanned=0
# prerender された .html を走査 (_not-found / not-found は正規404なので除外)
while IFS= read -r -d '' f; do
  case "$f" in
    *_not-found*|*/not-found.html) continue;;
  esac
  scanned=$((scanned + 1))
  title="$(grep -o '<title>[^<]*</title>' "$f" 2>/dev/null | head -1 | sed 's/<[^>]*>//g')"
  if echo "$title" | grep -qE "$NOTFOUND_RE"; then
    route="${f#"$PRERENDER_DIR"}"
    route="${route%.html}"
    echo "  ❌ ${route}"
    echo "        <title>: ${title}"
    violations=$((violations + 1))
  fi
done < <(find "$PRERENDER_DIR" -type f -name "*.html" -print0)

echo ""
echo "  scanned: ${scanned} prerendered pages"
if [ "$violations" -gt 0 ]; then
  echo ""
  echo "❌ ${violations} 件の SSG ページが notFound として prerender されています。"
  echo "   原因: R2 依存 route に generateStaticParams が付き ● SSG 化 → build 時 R2 不可 → notFound 固着。"
  echo "   修正: 該当 route の generateStaticParams を撤去し revalidate のみ残して ƒ 化する。"
  echo "   正典: .claude/rules/nextjs-ssg-preservation.md §generateStaticParams 固着"
  exit 1
fi
echo "✅ notFound prerender なし (${scanned} pages)"
