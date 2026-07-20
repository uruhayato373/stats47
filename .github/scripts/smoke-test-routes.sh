#!/bin/bash
# ルート別スモークテスト — 各 route テンプレートの代表 URL を 1 件ずつ叩き、
# 「ページ内容が notFound になっていないか」を検査する。
#
# なぜ必要か (2026-06-22 障害):
#   - 障害は per-page ではなく per-route-template で発生する (ある route の全ページが同時に死ぬ)。
#     → 全 ~5000 ページを叩く必要はなく、route ごとに 1 件叩けば全インシデントを捕捉できる。
#   - notFound ページは HTTP 200 を返す。status だけ見る warm-cache.sh はすり抜ける。
#     → <title> が「〜が見つかりません」かどうかを content で判定する。
#   - generateStaticParams を持つ R2 依存ページは CI build (R2 不可) で notFound prerender 化し、
#     ISR 再生成が効かず固着する (.claude/rules/nextjs-ssg-preservation.md)。
#     これを deploy 後にこのスクリプトで検知する (deploy-workers.yml の gate)。
#   - og:image 切れ (2026-07-20 障害): openGraph.images 未指定のページは Next が
#     ランタイム opengraph-image route を自動注入し Cloudflare Worker で 500 になる
#     (next/og の例外 / font-loader の Google Fonts ランタイム fetch 失敗)。SNS/検索カードが
#     無画像になる。ページ HTTP は 200 なので title 検査ではすり抜ける。
#     → 各 route の og:image meta URL を実際に叩いて 200 か検査する (.claude/rules/ogp-image-standards.md)。
#
# Usage: bash .github/scripts/smoke-test-routes.sh [BASE_URL]
#   BASE_URL 省略時は https://stats47.jp。preview URL を渡せばデプロイ前検証も可能。
# Exit: 1 件でも notFound / og:image 非200 / 非200 があれば exit 1。

set -uo pipefail
BASE_URL="${1:-https://stats47.jp}"
UA="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
# notFound を示すタイトル断片 (各 route の generateMetadata fallback)
NOTFOUND_RE='見つかりません|ページが見つかりません|Not Found|404'

fail=0
checked=0

# sitemap.xml から「最初に出現する <prefix> URL」を 1 件取得 (データ変動に強い動的代表 URL)
SITEMAP="$(curl -s --max-time 30 "${BASE_URL}/sitemap.xml" 2>/dev/null)"
pick() { echo "$SITEMAP" | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' | grep -E "$1" | head -1; }

# 静的/索引ページ (常に存在すべき) + sitemap 由来の各テンプレ代表 1 件
URLS=(
  "${BASE_URL}/"
  "${BASE_URL}/ranking"
  "${BASE_URL}/areas"
  "${BASE_URL}/blog"
  "${BASE_URL}/themes"
  "${BASE_URL}/survey"
  "${BASE_URL}/category/population"
)
# 動的 route 代表 (sitemap から拾う。無ければ既知の安定 URL にフォールバック)
URLS+=( "$(pick '/ranking/[a-z]' || echo "${BASE_URL}/ranking/annual-sunshine-duration")" )
URLS+=( "$(pick '/areas/[0-9]+$' || echo "${BASE_URL}/areas/13000")" )
URLS+=( "$(pick '/areas/[0-9]+/cities/' || echo "${BASE_URL}/areas/14000/cities/14130")" )
URLS+=( "$(pick '/blog/[a-z]' || echo "${BASE_URL}/blog/banana-consumption-quantity")" )
URLS+=( "$(pick '/themes/[a-z]' || echo "${BASE_URL}/themes/aging-society")" )

# G6 (2026-07-11): 直近 push (≒ merge された PR) で追加された ranking キーを smoke 対象に追加。
# 新規公開キーは代表 1 件方式では検査されないため、deploy-workers.yml が DIFF_BASE
# (= github.event.before) を渡したときだけ known-ranking-keys.ts の追加行から抽出する。
# force-push / 初回 push で before が zero-SHA の場合は git cat-file guard で従来動作に degrade。
KNOWN_KEYS_FILE="packages/ranking/src/config/known-ranking-keys.ts"
if [ -n "${DIFF_BASE:-}" ] && git cat-file -e "${DIFF_BASE}^{commit}" 2>/dev/null; then
  NEW_KEYS="$(git diff "${DIFF_BASE}..HEAD" -- "$KNOWN_KEYS_FILE" 2>/dev/null \
    | grep -E '^\+[[:space:]]*"[a-z0-9-]+",?[[:space:]]*$' | sed -E 's/^\+[[:space:]]*"([a-z0-9-]+)".*$/\1/' | head -10)"
  if [ -n "$NEW_KEYS" ]; then
    echo "➕ diff 由来の新規 ranking キーを smoke 対象に追加: $(echo "$NEW_KEYS" | tr '\n' ' ')"
    while IFS= read -r k; do
      [ -n "$k" ] && URLS+=( "${BASE_URL}/ranking/${k}" )
    done <<< "$NEW_KEYS"
  fi
fi

echo "🔎 Route smoke test against ${BASE_URL}"
echo ""
for url in "${URLS[@]}"; do
  [ -z "$url" ] && continue
  checked=$((checked + 1))
  body="$(curl -s -A "$UA" --max-time 30 -w '\n__HTTP__%{http_code}' "$url" 2>/dev/null)"
  code="$(echo "$body" | sed -n 's/.*__HTTP__//p' | tail -1)"
  title="$(echo "$body" | grep -o '<title>[^<]*</title>' | head -1 | sed 's/<[^>]*>//g')"

  if [ "$code" != "200" ]; then
    # /themes/<gone> 等の意図的 301/410 は対象外 (200 でないが title も空)
    if [ "$code" = "301" ] || [ "$code" = "308" ] || [ "$code" = "410" ]; then
      echo "  ➖ [${code}] ${url} (redirect/gone — skip)"
      continue
    fi
    echo "  ❌ [${code}] ${url}"
    fail=$((fail + 1))
    continue
  fi

  if echo "$title" | grep -qE "$NOTFOUND_RE"; then
    echo "  ❌ [200 notFound] ${url}"
    echo "        title: ${title}"
    fail=$((fail + 1))
    continue
  fi

  # og:image が実際に 200 を返すか (ランタイム opengraph-image route の Worker 500 等を捕捉)。
  # ページは 200・title も正常なのに og:image だけ壊れているケースを検知する。
  ogimg="$(echo "$body" | grep -o '<meta[^>]*property="og:image"[^>]*content="[^"]*"' | head -1 | sed -E 's/.*content="([^"]*)".*/\1/')"
  if [ -n "$ogimg" ]; then
    ogcode="$(curl -s -o /dev/null -A "$UA" --max-time 20 -w '%{http_code}' "$ogimg" 2>/dev/null)"
    if [ "$ogcode" != "200" ]; then
      echo "  ❌ [og:image ${ogcode}] ${url}"
      echo "        og:image: ${ogimg}"
      fail=$((fail + 1))
      continue
    fi
  fi

  echo "  ✅ ${title:0:60}"
done

echo ""
if [ "$fail" -gt 0 ]; then
  echo "❌ Smoke test FAILED: ${fail}/${checked} route(s) returning notFound / og:image error / HTTP error."
  echo "   → notFound: generateStaticParams を R2 依存 route に付けていないか (.claude/rules/nextjs-ssg-preservation.md)"
  echo "   → og:image 非200: openGraph.images 未指定でランタイム opengraph-image に落ちていないか (.claude/rules/ogp-image-standards.md)"
  exit 1
fi
echo "✅ Smoke test passed: ${checked}/${checked} representative routes OK."
