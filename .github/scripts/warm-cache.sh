#!/bin/bash
# デプロイ後にキャッシュを事前ウォームするスクリプト
# GitHub Actions から呼び出し、または手動実行
#
# Usage: bash .github/scripts/warm-cache.sh [BASE_URL]

BASE_URL="https://stats47.jp"
FULL_MODE=false
for arg in "$@"; do
  if [ "$arg" = "--full" ]; then
    FULL_MODE=true
  elif [[ "$arg" != --* ]]; then
    BASE_URL="$arg"
  fi
done

# --full: sitemap.xml から全 URL をウォーム
if [ "$FULL_MODE" = true ]; then
  DELAY=0.5
  echo "🔥 Full cache warming: ${BASE_URL} (from sitemap.xml)"
  URLS=$(curl -s "${BASE_URL}/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g')
  TOTAL=$(echo "$URLS" | wc -l)
  echo "   URLs: ${TOTAL}"
  echo ""
  SUCCESS=0
  FAIL=0
  I=0
  for url in $URLS; do
    I=$((I + 1))
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$url" 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
      SUCCESS=$((SUCCESS + 1))
    else
      echo "  ✗ ${url} (${STATUS})"
      FAIL=$((FAIL + 1))
    fi
    if [ $((I % 100)) -eq 0 ]; then
      echo "  進捗: ${I}/${TOTAL} (${SUCCESS} success, ${FAIL} failed)"
    fi
    sleep "$DELAY"
  done
  echo ""
  echo "Done: ${SUCCESS} success, ${FAIL} failed (${TOTAL} total)"
  exit 0
fi

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
  # /compare は 2026-05-28 に /category/{key}/compare へ統合 (middleware.ts:393-403)。
  # categoryKey 無しは population が既定なので、リダイレクト先を直接ウォームする
  # (旧 "/compare" のままだと 301 が返り ✗ としてログに残り続ける)。
  "/category/population/compare"
  # "/correlation" は 2026-05-28 に廃止 (410)。探索 UI は各ランキングページの
  # 「相関が高い指標」セクションに統合済みで後継 URL が無いため、warm 対象から外す
  # (middleware.ts:204-207)。
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
