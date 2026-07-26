#!/bin/bash
# 週次 A8 パイプライン (ローカル Mac 限定 — Playwright プロファイルが .local にあるため)。
# launchd から日曜 07:00 JST に発火。詳細: .claude/rules/affiliate-ads-standards.md §10
#
# ★設計 (2026-07-27 実測に基づく改訂):
#   この cron は **決定的スクリプトのみ** を回す。claude-code (LLM) を起動しないのでトークン消費ゼロ。
#   意味判断が要るのは pending-vertical の解決だけなので、それは「報告」に留めて人間/agent に渡す。
#
#   **scout / apply (新規申請) は意図的に含めない。** 実測で在庫は制約でないと確定したため:
#     - 提携済みで軸解決済みの 49 件のうち、配信中トップを確定EPC で上回るものは 0 件
#     - **そもそも affiliate の CTR が計測不能**: 自前の `ad_impression` が GA4/AdSense の同名
#       自動イベントと衝突しており、直近7日の 3,346 件は全件 AdSense 由来 (自前イベントは 0 件)。
#       分母が無いので「どの軸が換金するか」が全く分からない (詳細: analytics-event-standards.md)。
#   効果が測れない状態で在庫を週 10 件ずつ増やしても、A8 への申請リスクだけが増える。
#   再開条件: `affiliate_impression` への改名で分母を回復し、軸別 CTR が読めるようになってから。
#   再開するときは APPLY_NEW=1 にする。
#
#   SSOT (apps/web/scripts/affiliate-ads-data.ts) への実追記と develop push は **やらない**。
#   アプリコードの無人書き換えは並行セッションとの git 競合を招き、push は R2 公開 =
#   outward-facing になるため。cron は catalog (機械 state) を進めて報告するところで止める。
source "$(dirname "$0")/_common.sh"

APPLY_NEW=0
A8="$PROJECT_DIR/.claude/skills/ads/scout-asp/scripts/a8-browser.ts"
HARVEST_LIMIT=12

run_pipeline() {
  # (1) 審査待ち (applied) を再走査して approved へ昇格。
  #     セッション失効時は a8-browser.ts が catalog に error を記録して exit 0 で返す (cron を壊さない)。
  echo "--- [1/4] check-approval ---"
  npx tsx "$A8" check-approval || echo "!! check-approval 失敗 (継続)"

  if [ "$APPLY_NEW" = "1" ]; then
    echo "--- [opt] scout + apply (新規申請 有効) ---"
    npx tsx "$A8" scout || echo "!! scout 失敗 (継続)"
    if node "$PROJECT_DIR/.claude/scripts/ads/check-a8-apply-budget.cjs"; then
      npx tsx "$A8" apply || echo "!! apply 失敗 (継続)"
    else
      echo "週次申請上限に到達 — apply スキップ"
    fi
  else
    echo "--- [skip] scout/apply は無効 (在庫は制約でない。理由はこのファイル冒頭) ---"
  fi

  # (2) 確定EPC (=EPC×確定率) で軸別に上位 N を精選し selectedForRegister + priority を刻む。
  #     軸未解決で高価値の案件はここで警告として出る (盲点の自己申告)。
  echo "--- [2/4] select-for-register ---"
  node "$PROJECT_DIR/.claude/scripts/ads/select-for-register.mjs" --per-vertical 4 --apply \
    || echo "!! select-for-register 失敗 (継続)"

  # (3) 精選分の広告コードを取得 (canonical 300x250 優先・無ければ text)。件数を絞り A8 負荷を抑える。
  echo "--- [3/4] harvest (limit $HARVEST_LIMIT) ---"
  npx tsx "$A8" harvest --limit "$HARVEST_LIMIT" || echo "!! harvest 失敗 (継続)"

  # (4) SSOT 追記は **dry-run のみ**。何件登録できる状態かを報告し、実追記と push は人間/agent に委ねる。
  echo "--- [4/4] register 可能件数 (dry-run) ---"
  npx tsx "$PROJECT_DIR/.claude/scripts/ads/append-affiliate-ads.ts" \
    || echo "!! append dry-run 失敗 (継続)"

  echo "--- catalog サマリ ---"
  # パスは argv で渡す (process.env を使うと env registry guard の
  # ENV_UNREGISTERED に引っかかる。使い捨てのパス受け渡しに env は要らない)
  node -e '
    const c = require(process.argv[1] + "/.claude/state/ads/a8-catalog.json");
    const by = {};
    for (const e of Object.values(c.entries)) by[e.status] = (by[e.status] || 0) + 1;
    console.log("catalog:", JSON.stringify(by));
    const pv = Object.values(c.entries).filter((e) => e.status === "pending-vertical");
    if (pv.length) console.log("pending-vertical (agent の意味判断待ち):", pv.length, "件");
  ' "$PROJECT_DIR" || echo "!! catalog サマリ失敗"

  echo "次アクション: register 可能分があれば affiliate-manager が append --apply → develop push"
  echo "  (develop push = R2 公開 = outward-facing なので人間の承認が要る)"
}

log_run scout-asp-weekly run_pipeline
