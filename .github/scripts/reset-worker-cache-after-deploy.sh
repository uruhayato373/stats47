#!/bin/bash
# デプロイ直後に、本番が新しいビルドを返し始めたのを確かめてから Workers Cache を全部消す。
#
# なぜ必要か (2026-10-06 障害・Issue #1089):
#   PR #1086 のデプロイ後、本番 / の HTML が、デプロイで消えた CSS (/_next/static/css/d69590e93db400ea.css、404)
#   を参照したまま Workers Cache に残り、ホームが CSS なしで表示された (375px で横スクロール 273px)。
#   HTML のキャッシュ時刻は warm-cache が / を叩いた時刻 (デプロイ完了の 15 秒後) と一致した。
#   zone の URL purge では消えず、purge-cdn.yml (Workers Cache の全パージを含む) で消えた。
#   Workers Cache は既定で Worker の版がキャッシュキーに含まれ、新しい版は空のキャッシュから始まる
#   (https://developers.cloudflare.com/workers/cache/configuration/ 、2026-10-06 確認) ので、
#   デプロイ直後の全パージで失うものはない。古い HTML がどの経路で残ったかは未確定なので、
#   経路によらず「新しい版が応答し始めてから消す」。
#
# 手順:
#   1. 毎回別のキーになる probe URL (?__deploy_probe=...) で / を取り (キャッシュに無いので必ず描画される)、参照する CSS がすべて
#      今回のビルド (ASSET_DIR) にあるまで待つ (最大 2 分。待っても揃わなければ警告して続ける)
#   2. Workers Cache を全パージする (purge-worker-cache.ts --all。要 WORKER_CACHE_PURGE_SECRET)
#
# Usage: bash .github/scripts/reset-worker-cache-after-deploy.sh [BASE_URL] [ASSET_DIR]
#   ASSET_DIR は OpenNext の静的資産 (既定 apps/web/.open-next/assets)
# Exit: purge に失敗したら 1。

set -uo pipefail
BASE_URL="${1:-https://stats47.jp}"
ASSET_DIR="${2:-apps/web/.open-next/assets}"
PROBE_ID="${GITHUB_RUN_ID:-local}-$(date +%s)"
MAX_ATTEMPTS=24
WAIT_SECONDS=5

if [ ! -d "${ASSET_DIR}/_next/static/css" ]; then
  echo "⚠️ ${ASSET_DIR}/_next/static/css が無い。新しい版の確認を飛ばして purge だけ行う"
else
  serving=0
  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    css="$(curl -s --max-time 20 "${BASE_URL}/?__deploy_probe=${PROBE_ID}-${attempt}" 2>/dev/null \
      | grep -o '/_next/static/css/[^"]*\.css' | sort -u)"
    missing=""
    for c in $css; do
      [ -f "${ASSET_DIR}${c}" ] || missing="${missing} ${c}"
    done
    if [ -n "$css" ] && [ -z "$missing" ]; then
      echo "✅ 本番が今回のビルドの CSS を返している (${attempt} 回目): $(echo "$css" | tr '\n' ' ')"
      serving=1
      break
    fi
    echo "  ⏳ ${attempt}/${MAX_ATTEMPTS}: 今回のビルドに無い CSS を参照している:${missing:- (CSS を取得できず)}"
    sleep "$WAIT_SECONDS"
  done
  if [ "$serving" = "0" ]; then
    echo "::warning::$((MAX_ATTEMPTS * WAIT_SECONDS)) 秒待っても本番が今回のビルドの CSS を返さなかった。purge は行い、smoke test の参照資産検査に判定を任せる"
  fi
fi

echo "🧹 Workers Cache を全パージする"
if ! npx tsx packages/r2-storage/src/scripts/purge-worker-cache.ts --all; then
  echo "::error::Workers Cache の全パージに失敗した。古い HTML が残っている可能性がある (purge-cdn.yml で再実行できる)"
  exit 1
fi
