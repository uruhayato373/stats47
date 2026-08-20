#!/usr/bin/env bash
# check-sitemap-index — sitemap index が全 shard を列挙しているかを本番で検査する。
#
# ★なぜ要るか (2026-08-20 実測):
#   index (`/sitemap.xml`) が shard 0〜7 しか列挙せず、cities (1,080 URL) が 2 か月、
#   japan (19 URL) が新設直後から Google に提出されていなかった。
#   **各 shard 自体は 200 で正しい内容を返す**ため、ページを叩く smoke test では
#   原理的に発見できない。欠落は index を経由して初めて分かる。
#
# ★検査方法: index が列挙する shard 数と、実際に 200 で応答する shard 数を突き合わせる。
#   index に載っていない id が 200 を返したら「提出漏れ」として落とす。
#   期待値をこのスクリプトに書かない (書くと 3 つ目の手動同期先になる)。
set -uo pipefail

BASE_URL="${1:-https://stats47.jp}"
UA="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
MAX_PROBE=20   # 実在しない id まで探索する上限 (segment がこれを超えたら定数を上げる)

index_xml="$(curl -s --max-time 30 -A "$UA" "${BASE_URL}/sitemap.xml")"
listed="$(echo "$index_xml" | grep -oE 'sitemap/[0-9]+\.xml' | grep -oE '[0-9]+' | sort -n | uniq)"
listed_count="$(echo "$listed" | grep -c . || true)"

if [ "$listed_count" -eq 0 ]; then
  echo "❌ sitemap index が 1 件も shard を列挙していない (${BASE_URL}/sitemap.xml)"
  exit 1
fi

echo "index が列挙する shard: ${listed_count} 件 ($(echo "$listed" | tr '\n' ' '))"

# index に載っていない id が実在しないことを確認する (載っていないのに 200 = 提出漏れ)
missing=""
for id in $(seq 0 $((MAX_PROBE - 1))); do
  if echo "$listed" | grep -qx "$id"; then continue; fi
  # ★存在しない id も 200 + 空 sitemap を返す (Next.js の動的 route)。
  #   よって status では判定できない。**URL を 1 件以上持つか**で実在を判定する
  #   (2026-08-20: status だけで判定して id 10-19 を誤検知した)。
  body="$(curl -s --max-time 20 -A "$UA" "${BASE_URL}/sitemap/${id}.xml")"
  urls="$(echo "$body" | grep -c '<url>' || true)"
  if [ "$urls" -gt 0 ]; then
    echo "❌ shard ${id} は ${urls} URL を持つが index に載っていない → Google へ提出されない"
    missing="${missing} ${id}"
  fi
done

# 逆向き: index が載せている shard が実際に生きているか
dead=""
for id in $listed; do
  code="$(curl -s --max-time 20 -o /dev/null -w '%{http_code}' -A "$UA" "${BASE_URL}/sitemap/${id}.xml")"
  [ "$code" = "200" ] || { echo "❌ index が載せる shard ${id} が HTTP ${code}"; dead="${dead} ${id}"; }
done

if [ -n "$missing" ] || [ -n "$dead" ]; then
  echo "✗ sitemap index の整合性 NG (未提出:${missing:-なし} / 死shard:${dead:-なし})"
  exit 1
fi

echo "✓ sitemap index OK — 列挙 ${listed_count} 件すべて生存、未提出 shard なし"
