#!/bin/bash
# デプロイ後にキャッシュを事前ウォームするスクリプト
# GitHub Actions から呼び出し、または手動実行
#
# Usage: bash .github/scripts/warm-cache.sh [BASE_URL]

BASE_URL="${1:-https://stats47.jp}"
DELAY=2  # リクエスト間隔（秒）

# 主要ページ一覧（LCP 改善対象）
PAGES=(
  "/"
  "/ranking"
  "/themes/population-dynamics"
  "/themes/safety"
  "/themes/consumer-prices"
  "/themes/healthcare"
  "/themes/labor-wages"
  "/themes/education-culture"
  "/themes/living-housing"
  "/themes/local-economy"
  "/themes/manufacturing"
  "/themes/aging-society"
  "/themes/foreign-residents"
  "/themes/tourism"
  "/themes/real-income"
  "/themes/labor-mobility"
  "/themes/occupation-salary"
  "/areas/01000"
  "/areas/13000"
  "/areas/27000"
  "/areas/14000"
  "/areas/23000"
  "/areas/40000"
  "/areas/28000"
  "/compare"
  "/correlation"
  "/blog"
  "/sitemap.xml"
  "/robots.txt"
)

echo "🔥 Cache warming: ${BASE_URL}"
echo "   Pages: ${#PAGES[@]}"
echo ""

SUCCESS=0
FAIL=0

for page in "${PAGES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "${BASE_URL}${page}" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo "  ✓ ${page} (${STATUS})"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ✗ ${page} (${STATUS})"
    FAIL=$((FAIL + 1))
  fi
  sleep "$DELAY"
done

echo ""
echo "Done: ${SUCCESS} success, ${FAIL} failed (${#PAGES[@]} total)"
