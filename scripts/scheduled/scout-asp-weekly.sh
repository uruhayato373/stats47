#!/bin/bash
# 週次 A8 パイプライン (ローカル Mac 限定 — Playwright プロファイルが .local にあるため)。
# launchd から日曜 07:00 JST に発火。詳細: .claude/rules/affiliate-ads-standards.md §10
#
# ★設計 (2026-07-27 実測に基づく改訂 + 2026-07-29 doc 42 Phase 1 truthful 化):
#   この cron は **決定的スクリプトのみ** を回す。claude-code (LLM) を起動しないのでトークン消費ゼロ。
#   意味判断が要るのは pending-vertical の解決だけなので、それは「報告」に留めて人間/agent に渡す。
#
#   **scout / apply (新規申請) は意図的に含めない。** 実測で在庫は制約でないと確定したため:
#     - 提携済みで軸解決済みの 49 件のうち、配信中トップを確定EPC で上回るものは 0 件
#     - affiliate の CTR は measurement gate v2 (affiliate_impression 移行) の ready 回復待ち。
#       分母が無い間は「どの軸が換金するか」が分からない (詳細: analytics-event-standards.md)。
#   効果が測れない状態で在庫を増やしても A8 への申請リスクだけが増える。
#   再開条件: measurement gate v2 が ready になってから。再開するときは APPLY_NEW=1 にする。
#
#   SSOT (apps/web/scripts/affiliate-ads-data.ts) への実追記と develop push は **やらない**。
#   アプリコードの無人書き換えは並行セッションとの git 競合を招き、push は R2 公開 =
#   outward-facing になるため。cron は catalog (機械 state) を進めて報告するところで止める。
#
#   ★truthful exit (doc 42 §11.2): 各 step の成否を集約し、全 step 成功のときだけ exit 0。
#   `|| echo` で失敗を握り潰さない。結果は .local/affiliate-ops/health.json に記録する
#   (端末固有なので git を dirty にしない)。A8 profile lock を取得し、人間の headed run が
#   使用中なら skipped/profile-in-use として失敗扱いにしない (§11.3)。
source "$(dirname "$0")/_common.sh"

APPLY_NEW=0
A8="$PROJECT_DIR/.claude/skills/ads/scout-asp/scripts/a8-browser.ts"
OPS="$PROJECT_DIR/.claude/scripts/ads/affiliate-ops.mjs"
HARVEST_LIMIT=12

RUN_ID="scout-asp-$(date -u +%Y%m%dT%H%M%SZ)"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
STEPS_JSON="[]"

# step 結果を JSON 配列へ追記する (集約判定は asp-operation-core が行う)
add_step() { # name status reason
  STEPS_JSON=$(node -e '
    const [steps, name, status, reason] = process.argv.slice(1);
    const arr = JSON.parse(steps);
    arr.push({ name, status, reason: reason || null });
    console.log(JSON.stringify(arr));
  ' "$STEPS_JSON" "$1" "$2" "${3:-}")
}

# コマンドを実行し exit code を step 結果へ変換する (set -e で落ちないよう if で受ける)
run_step() { # name cmd...
  local name="$1"
  shift
  echo "--- [$name] ---"
  if "$@"; then
    add_step "$name" ok
  else
    local rc=$?
    add_step "$name" failed "exit $rc"
  fi
}

run_pipeline() {
  # ── A8 profile lock (§11.3)。人間の headed run が使用中なら全 step を skip して正常終了 ──
  if node "$OPS" lock acquire --asp a8 --operation-id "$RUN_ID"; then
    :
  else
    add_step lock skipped "profile-in-use"
    node "$OPS" health record --run-id "$RUN_ID" --started-at "$STARTED_AT" --steps "$STEPS_JSON"
    return $?
  fi

  # (1) 審査待ち (applied) を再走査して approved へ昇格。
  run_step check-approval npx tsx "$A8" check-approval

  if [ "$APPLY_NEW" = "1" ]; then
    run_step scout npx tsx "$A8" scout
    if node "$PROJECT_DIR/.claude/scripts/ads/check-a8-apply-budget.cjs"; then
      run_step apply npx tsx "$A8" apply
    else
      add_step apply skipped "週次申請上限に到達"
    fi
  else
    add_step scout-apply skipped "APPLY_NEW=0 (measurement gate ready まで新規申請を止める)"
  fi

  # (2) 確定EPC (=EPC×確定率) で軸別に上位 N を精選し selectedForRegister + priority を刻む。
  run_step select-for-register node "$PROJECT_DIR/.claude/scripts/ads/select-for-register.mjs" --per-vertical 4 --apply

  # (3) 精選分の広告コードを取得 (canonical 300x250 優先・無ければ text)。件数を絞り A8 負荷を抑える。
  run_step harvest npx tsx "$A8" harvest --limit "$HARVEST_LIMIT"

  # (4) SSOT 追記は **dry-run のみ**。実追記と push は人間/agent に委ねる (§11.1)。
  run_step append-dry-run npx tsx "$PROJECT_DIR/.claude/scripts/ads/append-affiliate-ads.ts"

  echo "--- catalog サマリ ---"
  # パスは argv で渡す (process.env を使うと env registry guard に引っかかる)
  if node -e '
    const c = require(process.argv[1] + "/.claude/state/ads/a8-catalog.json");
    const by = {};
    for (const e of Object.values(c.entries)) by[e.status] = (by[e.status] || 0) + 1;
    console.log("catalog:", JSON.stringify(by));
    const pv = Object.values(c.entries).filter((e) => e.status === "pending-vertical");
    if (pv.length) console.log("pending-vertical (agent の意味判断待ち):", pv.length, "件");
  ' "$PROJECT_DIR"; then
    add_step catalog-summary ok
  else
    add_step catalog-summary failed "summary error"
  fi

  node "$OPS" lock release --asp a8 --operation-id "$RUN_ID" || true

  echo "次アクション: register 可能分があれば affiliate-manager が append --apply → develop push"
  echo "  (develop push = R2 公開 = outward-facing なので人間の承認が要る)"

  # ── 集約: 全 step 成功のときだけ exit 0 (health.json に記録・lastSuccessfulRunAt は成功時のみ前進) ──
  node "$OPS" health record --run-id "$RUN_ID" --started-at "$STARTED_AT" --steps "$STEPS_JSON"
}

log_run scout-asp-weekly run_pipeline
