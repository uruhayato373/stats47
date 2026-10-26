#!/bin/bash
# 土曜ランナー (launchd 毎週土曜 07:00。2026-10-26 に Mac の土曜の 3 本と週次監査をこの 1 本にまとめた。doboku-note の
# weekly-review.sh と同じ形)。ログインが要る取得と週次監査を、土曜の週次レビューの前にこの Mac で順に回す。
#   1. 認証付き計測: measurement-session-refresh.sh (ログインを保ち、専用 clone で取得・記録して develop へ push)
#   2. note の計測: fetch-note-metrics.sh (表紙監査 + note のダッシュボード。作業フォルダに書く。従来どおり)
#   3. ASP の巡回: scout-asp-weekly.sh (A8 の審査確認・精選・コード取得。作業フォルダに書く。従来どおり)
#   4. 週次監査 11 本: 専用 clone で `npm run weekly:audits` を回し、監査が書いた記録を develop へ push する。
#      要約とログは作業フォルダの .local/weekly-audits/<日付>/ にも写す (レビューはそこを読む)
# API で取れる計測 (GSC・GA4・AdSense・PSI・Cloudflare・Instagram Graph) は CI のまま (Mac が眠っていても欠けないように)。
# 1 つが落ちても次へ進み、どれかが落ちたら最後に exit 1 (launchd のログと週次レビューの Phase 0b で拾う)。
#
# 導入: cp scripts/scheduled/com.stats47.weekly-saturday.plist ~/Library/LaunchAgents/ &&
#       launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.stats47.weekly-saturday.plist
# 即実行: launchctl kickstart gui/$(id -u)/com.stats47.weekly-saturday
# ログ: ~/Library/Logs/stats47/weekly-saturday.log (各段のログは同じフォルダの <段>.log)

source "$(dirname "$0")/_common.sh"
set +e

CLONE_DIR="${STATS47_MEASUREMENT_CLONE:-$HOME/stats47-measurement}"
SCRIPTS="$PROJECT_DIR/scripts/scheduled"
LOCK="$LOG_DIR/weekly-saturday.lock"
# 監査が書く記録 (旧 workflow が git add していたもの)。clone は毎回 origin/develop に戻すので、ここにある差分は監査の分だけ
AUDIT_RECORDS=(
  data/blog data/site data/provenance data/ranking data/data-quality data/estat data/metrics data/surveys data/note data/ci
  contents/blog .claude/todo/backlog.md .claude/config/survey-taxonomy-ratchet.json
  packages/data-configs/src/prominence/ranking-prominence.generated.ts
)

# 前の回が動いている間は始めない (二重に走ると clone の reset と push がぶつかる)
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -f "$LOCK/pid" ] && kill -0 "$(cat "$LOCK/pid")" 2>/dev/null; then
    echo "$(date -Iseconds) [weekly-saturday] already running pid=$(cat "$LOCK/pid")" >> "$LOG_DIR/weekly-saturday.log"
    exit 0
  fi
  rm -rf "$LOCK" && mkdir "$LOCK"
fi
echo "$$" > "$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT
# この回が動いている間だけ眠らせない
caffeinate -i -w "$$" &

failed=()
step() { # name command...
  local name="$1"
  shift
  log_run "$name" "$@" || failed+=("$name")
}

# clone へ cd するので subshell で走らせる (後の段の作業フォルダを変えない)
weekly_audits() (
  cd "$CLONE_DIR" || return 1
  git fetch --quiet origin develop || return 1
  git checkout --quiet develop || return 1
  git reset --quiet --hard origin/develop || return 1
  git clean --quiet -fd -- "${AUDIT_RECORDS[@]}" || return 1
  local lock_hash
  lock_hash=$(shasum package-lock.json | cut -d' ' -f1)
  if [ "$(cat .local/measurement-lock-hash 2>/dev/null)" != "$lock_hash" ]; then
    npm ci --no-audit --no-fund --loglevel=error || return 1
    mkdir -p .local && echo "$lock_hash" > .local/measurement-lock-hash
  fi
  local rc=0
  npm run --silent weekly:audits || rc=$?
  # 要約とログを作業フォルダへ写す (失敗した回も写す。レビューが原因を読む)
  local day
  day=$(TZ=Asia/Tokyo date +%F)
  if [ -d ".local/weekly-audits/$day" ]; then
    mkdir -p "$PROJECT_DIR/.local/weekly-audits"
    rm -rf "$PROJECT_DIR/.local/weekly-audits/$day"
    cp -R ".local/weekly-audits/$day" "$PROJECT_DIR/.local/weekly-audits/$day"
  fi
  git add -A -- "${AUDIT_RECORDS[@]}" 2>/dev/null
  if ! git diff --cached --quiet; then
    # データだけの記録なので pre-commit は通さない。1MB 超のファイルだけは同じ検査で止める (全員のコミットが止まるため)
    node .claude/scripts/lib/check-repo-hygiene.cjs --staged --baseline || return 1
    git -c core.hooksPath=/dev/null commit --quiet -m "chore(weekly-audits): Saturday audit records $day (Mac)" || return 1
    local attempt
    for attempt in 1 2 3; do
      if git pull --quiet --rebase origin develop && git push --quiet origin HEAD:develop; then break; fi
      if [ "$attempt" = 3 ]; then return 1; fi
      sleep 5
    done
  fi
  return "$rc"
)

{
  echo ""
  echo "=== $(date -Iseconds) [weekly-saturday] start ==="
} >> "$LOG_DIR/weekly-saturday.log"
step measurement bash "$SCRIPTS/measurement-session-refresh.sh"
step note-metrics bash "$SCRIPTS/fetch-note-metrics.sh"
step scout-asp bash "$SCRIPTS/scout-asp-weekly.sh"
step weekly-audits weekly_audits

if [ "${#failed[@]}" -gt 0 ]; then
  echo "=== $(date -Iseconds) [weekly-saturday] FAILED: ${failed[*]} ===" >> "$LOG_DIR/weekly-saturday.log"
  exit 1
fi
echo "=== $(date -Iseconds) [weekly-saturday] ok ===" >> "$LOG_DIR/weekly-saturday.log"
