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
#   - 410 skip の逃げ道 (2026-07-24 追加の STRICT_URLS):
#     通常の URLS は 301/410 を「意図的な gone」として skip するため、**200 を返すべき route が
#     丸ごと 410 になった障害を検知できない**。実際 /tag/* は約 3 ヶ月 410 のままで、公開記事の
#     タグリンク 1,988 本が死んでいた。STRICT_URLS に入れた route は 410 も失敗として扱う。
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
#
# ★実測 (2026-08-04): /sitemap.xml は <sitemapindex> で、その <loc> は子 sitemap
# (/sitemap/0.xml …) の URL しか持たない。よって pick は常に空 → 各行の
# `|| echo <既知 URL>` にフォールバックしている (set -o pipefail のおかげで grep の
# 非ゼロ終了が拾われ || が発火する)。壊れてはいないが「sitemap から拾う」は
# 効いていないので、代表 URL は実質この下のハードコード。子 sitemap まで辿るのは
# fetch が 8 本増えて遅くなるだけなので採らない。
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
# /areas/<code>/<themeSlug> は sitemap に載らない (pick できない) ので直接指定する。
# 47県 × 18テーマ = 846 ページを持つ独立した route テンプレートで、/areas/<code> とも
# /themes/<slug> とも別コンポーネント構成 (2026-08-04 に PageShell + 左レールを新設した
# のはこの route も含む)。代表 1 件が無いと、この面だけ丸ごと壊れても smoke が緑になる。
URLS+=( "${BASE_URL}/areas/13000/population-dynamics" )

# STRICT: 200 以外 (301/410 含む) を即 fail とする route。
#   通常の URLS は 301/410 を「意図的な gone/redirect」として skip するが、その逃げ道のせいで
#   「200 を返すべき route が丸ごと 410 になった」障害が素通りする。実際 /tag/* は
#   2026-04-26〜07-24 の約 3 ヶ月間ずっと 410 で、記事のタグリンク 1,988 本が死んでいたが
#   誰も気づかなかった。恒久対策は .claude/rules/blog-quality-standards.md
#   「内部リンクの実在」に統合済み。
#   sitemap に載らない route (tag / survey 詳細) は pick できないので既知の安定キーを直接指定する。
STRICT_URLS=(
  "${BASE_URL}/tag/%E5%AE%B6%E8%A8%88%E8%AA%BF%E6%9F%BB"  # /tag/家計調査 (記事 150+ 本の最大タグ)
  "${BASE_URL}/survey/census"                              # 国勢調査 (最も参照される調査ハブ)
)

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
for url in "${URLS[@]}" "${STRICT_URLS[@]}"; do
  [ -z "$url" ] && continue
  # STRICT_URLS に含まれる URL は 301/410 の skip を許さない
  strict=0
  for s in "${STRICT_URLS[@]}"; do [ "$url" = "$s" ] && strict=1; done
  checked=$((checked + 1))
  # ★接続できなかった (curl の code=000) ときは再試行する。
  #   デプロイ直後は Worker のロールアウトと warm-cache のバーストが重なり、数 URL が
  #   一過性で応答しない (2026-08-21 の run 32461722593 で smoke 1 件 + warm-cache 2 件が
  #   000。数分後に測り直すと全て 200 だった)。これを HTTP エラーと同じ扱いにすると
  #   deploy が理由なく赤くなり、**本物の失敗を見ても誰も驚かなくなる**。
  #   000 のときだけ間を置いて 2 回まで試す。
  body=""
  code="000"
  for attempt in 1 2 3; do
    body="$(curl -s -A "$UA" --max-time 30 -w '\n__HTTP__%{http_code}' "$url" 2>/dev/null)"
    code="$(echo "$body" | sed -n 's/.*__HTTP__//p' | tail -1)"
    [ "$code" != "000" ] && break
    [ "$attempt" -lt 3 ] && echo "  ⏳ [000] ${url} — 接続できず ${attempt}/2 回目の再試行" && sleep 5
  done
  title="$(echo "$body" | grep -o '<title>[^<]*</title>' | head -1 | sed 's/<[^>]*>//g')"

  if [ "$code" != "200" ]; then
    # /themes/<gone> 等の意図的 301/410 は対象外 (200 でないが title も空)。
    # ただし STRICT_URLS は「200 を返すべき route」なので 410 も失敗として扱う。
    if [ "$strict" = "0" ] && { [ "$code" = "301" ] || [ "$code" = "308" ] || [ "$code" = "410" ]; }; then
      echo "  ➖ [${code}] ${url} (redirect/gone — skip)"
      continue
    fi
    echo "  ❌ [${code}] ${url}$([ "$strict" = "1" ] && echo " (STRICT: 200 必須)")"
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

# home/featured.json の件数検査 (2026-07-27 障害の再発防止):
#   master export (exportRankingItemsPerUrl) が R2 item.json を部分列挙して「全件」と
#   誤認し、トップページの注目ランキングが count:0 で消えた。title/HTTPステータスは
#   home '/' で正常 (200・notFoundでもない) なため上の route smoke ではすり抜ける。
#   HOME_FEATURED_RANKINGS の定義数 (8件、packages/data-configs/src/home-featured-rankings.ts)
#   を下回ったら fail する。
echo ""
echo "🏠 home/featured.json count check"
FEATURED_URL="https://storage.stats47.jp/app/home/featured.json"
FEATURED_JSON="$(curl -s --max-time 20 "$FEATURED_URL" 2>/dev/null)"
FEATURED_COUNT="$(echo "$FEATURED_JSON" | grep -o '"count"[[:space:]]*:[[:space:]]*[0-9]*' | head -1 | grep -o '[0-9]*$')"
FEATURED_MIN=8
checked=$((checked + 1))
if [ -z "$FEATURED_COUNT" ] || [ "$FEATURED_COUNT" -lt "$FEATURED_MIN" ]; then
  echo "  ❌ [featured count] ${FEATURED_URL} → count=${FEATURED_COUNT:-<unreadable>} (expected >= ${FEATURED_MIN})"
  fail=$((fail + 1))
else
  echo "  ✅ home/featured.json count=${FEATURED_COUNT}"
fi

echo ""
if [ "$fail" -gt 0 ]; then
  echo "❌ Smoke test FAILED: ${fail}/${checked} route(s) returning notFound / og:image error / HTTP error."
  echo "   → notFound: generateStaticParams を R2 依存 route に付けていないか (.claude/rules/nextjs-ssg-preservation.md)"
  echo "   → og:image 非200: openGraph.images 未指定でランタイム opengraph-image に落ちていないか (.claude/rules/ogp-image-standards.md)"
  echo "   → featured count 不足: master export (sync-snapshots) が R2 item.json を部分列挙していないか (NODE_ENV=production を確認)"
  exit 1
fi
echo "✅ Smoke test passed: ${checked}/${checked} representative routes OK."
