#!/usr/bin/env bash
# run-selection-backfill.sh — ThemeCatalog の選定根拠 (selection) を夜間の無人バッチで一次資料から裏付ける driver。
#
# ★ユーザー端末 (Claude Code 外) で実行する。セッション内では claude CLI が Keychain を読めず
#   「Not logged in」になる (ai-content の run-claude-batch.sh と同じ制約)。セッションからは --dry-run だけ。
#
# 何をするか (THEME-SELECTION-BACKFILL-01 の手順 3):
#   1. 専用 worktree (../stats47-selection-backfill, branch selection-backfill/<日付>) を origin/develop から作る
#      (既存なら fetch + reset --hard origin/develop)。--in-place なら今の作業ツリーで走る (catalog が clean なこと)
#   2. node_modules が無い / package-lock が変わっていれば npm ci
#   3. e-Stat カタログを pull (分類コードの照合用。--skip-pull で省略)
#   4. claude CLI の preflight (認証・lean flag の受理を最小 1 call で確認)
#   5. selection-backfill.mjs run — 残件の多いテーマから並列 2 で headless claude を回し、
#      決定的 gate (定型文 / https 到達 / 引用の実在 / コード一致 / 基準語彙) を通った selection だけ書く。
#      gate 不合格率 > 30% (10 件以上評価後) と利用枠エラー 3 連続で停止
#   6. validate:catalog / generate:catalog --check、warning ratchet の baseline を縮小 (減少専用)
#   7. 夜 1 コミット (pre-commit が走る。Windows PC は 12 分/回)。--push-develop で develop へ rebase push
#   8. report: .claude/skills/theme/manage-theme-portfolio/reference/audits/<日付>-selection-backfill.md
#
# 翌朝: report の「gate 不合格」「資料なし」「role の推奨」を人が処理する (role は夜間に書かない)。
#
# 使い方:
#   bash .claude/scripts/themes/run-selection-backfill.sh                       # 全残件 / sonnet / 並列 2
#   bash .claude/scripts/themes/run-selection-backfill.sh --limit 3              # 3 テーマだけ (パイロット)
#   bash .claude/scripts/themes/run-selection-backfill.sh --themes tsunami-exposure,ports --in-place
#   bash .claude/scripts/themes/run-selection-backfill.sh --dry-run              # LLM を呼ばない (配線確認)
#   bash .claude/scripts/themes/run-selection-backfill.sh --push-develop         # 終了後 develop へ push
#   bash .claude/scripts/themes/run-selection-backfill.sh --resume --skip-pull   # 中断した run の続き (worktree を reset しない)
#
# セッションから切り離して回す (ハーネスの timeout に殺されない):
#   nohup setsid bash .claude/scripts/themes/run-selection-backfill.sh > .local/selection-backfill/full-run.log 2>&1 &
#
# 正典: .claude/todo/backlog.md THEME-SELECTION-BACKFILL-01 / skill /backfill-theme-selection
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

LIMIT=""
THEMES=""
MODEL=claude-sonnet
EFFORT=medium
CONCURRENCY=2
BUDGET_USD=5
DRY_RUN=0
IN_PLACE=0
SKIP_PULL=0
PUSH_DEVELOP=0
NO_COMMIT=0
RESUME=0
WORKTREE="${SELECTION_BACKFILL_WORKTREE:-$MAIN_ROOT/../stats47-selection-backfill}"
EXTRA_RUN=()

usage() { sed -n '2,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }
die() { printf '[run-selection-backfill] ERROR: %s\n' "$*" >&2; exit 1; }
log() { printf '[run-selection-backfill] %s\n' "$*"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --limit) LIMIT="$2"; shift 2 ;;
    --themes) THEMES="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --effort) EFFORT="$2"; shift 2 ;;
    --concurrency) CONCURRENCY="$2"; shift 2 ;;
    --budget-usd) BUDGET_USD="$2"; shift 2 ;;
    --chunk-size|--capacity-wait-min|--capacity-retries|--max-fail-rate|--min-entries-for-rate) EXTRA_RUN+=("$1" "$2"); shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --in-place) IN_PLACE=1; shift ;;
    --skip-pull) SKIP_PULL=1; shift ;;
    --push-develop) PUSH_DEVELOP=1; shift ;;
    --no-commit) NO_COMMIT=1; shift ;;
    --resume) RESUME=1; shift ;;
    --worktree) WORKTREE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown arg: $1 (--help で使い方)" ;;
  esac
done

[[ "$CONCURRENCY" =~ ^[12]$ ]] || die "--concurrency は 1〜2 (claude CLI を並列 spawn するため上限を置く)"
case "$MODEL" in claude-haiku|claude-sonnet|claude-opus) ;; *) die "--model は claude-haiku|claude-sonnet|claude-opus" ;; esac
case "$EFFORT" in low|medium|high) ;; *) die "--effort は low|medium|high" ;; esac

# ---- 1. 作業ツリー ---------------------------------------------------------------
DATE_TAG="$(date +%Y-%m-%d)"
if [ "$IN_PLACE" = 1 ]; then
  ROOT="$MAIN_ROOT"
  cd "$ROOT"
  if [ "$DRY_RUN" = 0 ] && [ -n "$(git status --porcelain -- packages/data-configs/src/theme-catalog .claude/config/quality-warning-baseline.json)" ]; then
    die "--in-place: theme-catalog / baseline に未コミットの変更がある。先に片付ける (前 run の残骸を今回の commit に混ぜない)"
  fi
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  log "in-place: $ROOT (branch $BRANCH)"
else
  BRANCH="selection-backfill/$DATE_TAG"
  git -C "$MAIN_ROOT" fetch -q origin develop
  if [ "$RESUME" = 1 ]; then
    # 中断した run の続き: worktree の通過済み書き込み (未コミット) を reset で消さない。
    # 対象は listTargets が現在のカタログから再導出するので、書き込み済みの指標は自然に外れる
    [ -d "$WORKTREE/.git" ] || [ -f "$WORKTREE/.git" ] || die "--resume: worktree が無い ($WORKTREE)"
    BRANCH="$(git -C "$WORKTREE" rev-parse --abbrev-ref HEAD)"
    log "worktree 再開 (reset なし): $WORKTREE (branch $BRANCH)"
  elif [ -d "$WORKTREE/.git" ] || [ -f "$WORKTREE/.git" ]; then
    log "worktree 再利用: $WORKTREE → origin/develop へ reset"
    git -C "$WORKTREE" checkout -q -B "$BRANCH" origin/develop
    git -C "$WORKTREE" reset -q --hard origin/develop
  else
    log "worktree 作成: $WORKTREE (branch $BRANCH from origin/develop)"
    git -C "$MAIN_ROOT" worktree add -q -B "$BRANCH" "$WORKTREE" origin/develop
  fi
  ROOT="$(cd "$WORKTREE" && pwd)"
  cd "$ROOT"
fi

# ---- 2. 依存 ---------------------------------------------------------------------
LOCK_HASH_FILE="$ROOT/.local/selection-backfill/package-lock.sha"
mkdir -p "$ROOT/.local/selection-backfill"
LOCK_HASH="$(node -e "console.log(require('crypto').createHash('sha256').update(require('fs').readFileSync('package-lock.json')).digest('hex'))")"
if [ ! -d "$ROOT/node_modules" ] || [ "$(cat "$LOCK_HASH_FILE" 2>/dev/null || true)" != "$LOCK_HASH" ]; then
  log "npm ci (node_modules 不在 or package-lock 変更)"
  npm ci --no-audit --no-fund
  printf '%s' "$LOCK_HASH" > "$LOCK_HASH_FILE"
fi

# ---- 3. e-Stat カタログ (分類コード照合) --------------------------------------------
if [ "$SKIP_PULL" = 0 ] && [ "$DRY_RUN" = 0 ]; then
  log "e-Stat カタログ pull"
  node --import tsx .claude/scripts/estat/catalog.mjs pull || log "WARN: pull 失敗。コードのカタログ照合は skip される"
fi

# ---- 4. preflight ----------------------------------------------------------------
CLAUDE_BIN="${CLAUDE_CLI_BIN:-claude}"
if [ "$DRY_RUN" = 0 ]; then
  command -v "$CLAUDE_BIN" >/dev/null 2>&1 || die "claude CLI が見つからない ($CLAUDE_BIN)。CLAUDE_CLI_BIN で指定可"
  log "claude CLI: $(command -v "$CLAUDE_BIN") ($("$CLAUDE_BIN" --version 2>/dev/null | head -1))"
  [ -n "${CLAUDECODE:-}" ] && log "WARN: Claude Code セッション内。claude CLI が Keychain を読めない場合はユーザー端末で実行する"
  PREFLIGHT_OUT="$(mktemp)"
  # shellcheck disable=SC2046
  if printf 'JSON {"ok":true} だけを返してください。' | env $(env | awk -F= '/^(CLAUDE_|CLAUDECODE=)/{printf "-u %s ", $1}') -u NODE_OPTIONS "$CLAUDE_BIN" -p "" \
      --output-format json --model claude-haiku-4-5-20251001 --tools "" --strict-mcp-config \
      --no-session-persistence --setting-sources local --system-prompt "要求された JSON だけを出力する。" \
      > "$PREFLIGHT_OUT" 2>/dev/null \
    && node -e "const r=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));if(r.is_error){console.error(String(r.result).slice(0,200));process.exit(1)}" "$PREFLIGHT_OUT"; then
    log "preflight ok (claude CLI 認証・lean flag 受理)"
  else
    rm -f "$PREFLIGHT_OUT"
    die "claude CLI preflight 失敗 (未ログインかサンドボックス)。ユーザー端末で 'claude /login' 済みの状態で実行する"
  fi
  rm -f "$PREFLIGHT_OUT"
fi

# ---- 5. run ----------------------------------------------------------------------
RUN=(run --model "$MODEL" --effort "$EFFORT" --concurrency "$CONCURRENCY" --budget-usd "$BUDGET_USD" --surveyed-at "$DATE_TAG")
[ -n "$LIMIT" ] && RUN+=(--limit "$LIMIT")
[ -n "$THEMES" ] && RUN+=(--themes "$THEMES")
[ "$DRY_RUN" = 1 ] && RUN+=(--dry-run)
RUN_STATUS=0
node --import tsx .claude/scripts/themes/selection-backfill.mjs "${RUN[@]}" ${EXTRA_RUN[@]+"${EXTRA_RUN[@]}"} || RUN_STATUS=$?
# exit 3 = 停止条件 (gate 不合格率 / 枠エラー) で途中終了。通過分は既に書かれているので commit まで進める
[ "$RUN_STATUS" = 0 ] || [ "$RUN_STATUS" = 3 ] || die "run が失敗した (exit $RUN_STATUS)"

if [ "$DRY_RUN" = 1 ]; then
  log "dry-run 完了 (書き込み・commit なし)"
  exit 0
fi

# ---- 6. 検証 + ratchet baseline 縮小 ------------------------------------------------
npm run validate:catalog --workspace=@stats47/data-configs
npm run generate:catalog --workspace=@stats47/data-configs -- --check
node - <<'EOF'
// no-adoption-criteria の baseline を実測へ縮める (減少専用。増えていたら触らず CI の ratchet に判定させる)
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const out = execFileSync("npm", ["run", "validate:catalog", "--workspace=@stats47/data-configs"], { encoding: "utf8" });
const m = /no-adoption-criteria=(\d+)/.exec(out);
const actual = m ? Number(m[1]) : 0;
const file = ".claude/config/quality-warning-baseline.json";
const json = JSON.parse(fs.readFileSync(file, "utf8"));
const entry = json.warnings.find((w) => w.source === "theme-catalog" && w.code === "no-adoption-criteria");
if (entry && actual < entry.count) {
  console.log(`[run-selection-backfill] ratchet baseline no-adoption-criteria ${entry.count} → ${actual}`);
  entry.count = actual;
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
} else {
  console.log(`[run-selection-backfill] ratchet baseline 据え置き (baseline ${entry?.count} / 実測 ${actual})`);
}
EOF

# ---- 7. commit -------------------------------------------------------------------
if [ "$NO_COMMIT" = 1 ]; then
  log "--no-commit: 変更は作業ツリーに残す ($ROOT)"
  exit "$RUN_STATUS"
fi
git add -- packages/data-configs/src/theme-catalog .claude/config/quality-warning-baseline.json \
  .claude/skills/theme/manage-theme-portfolio/reference/audits
if git diff --cached --quiet; then
  log "commit 対象なし (通過 0 件)"
  exit "$RUN_STATUS"
fi
ACCEPTED="$(node -e "
const fs=require('fs');const dir='.local/selection-backfill';
const f=fs.readdirSync(dir).filter(x=>x.startsWith('run-')&&x.endsWith('.json')).sort().pop();
const r=JSON.parse(fs.readFileSync(dir+'/'+f,'utf8'));
console.log(r.totals.accepted+' selections / '+r.themes.length+' themes'+(r.stopReason?' / stop: '+r.stopReason:''));")"
git commit -q -m "chore(theme): selection backfill $DATE_TAG — $ACCEPTED" \
  -m "一次資料で裏付けた selection を書き込み (gate: 定型文 / https 到達 / 引用実在 / コード一致)。role は変更しない。report: .claude/skills/theme/manage-theme-portfolio/reference/audits/$DATE_TAG-selection-backfill.md" \
  -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
log "committed on $BRANCH: $(git rev-parse --short HEAD) ($ACCEPTED)"

if [ "$PUSH_DEVELOP" = 1 ]; then
  git fetch -q origin develop
  git rebase -q origin/develop || die "rebase が競合した。$ROOT で解消して 'git push origin HEAD:develop' を手で実行する"
  git push -q origin HEAD:develop
  log "pushed $(git rev-parse --short HEAD) → develop"
elif [ "$IN_PLACE" = 0 ]; then
  log "翌朝の取り込み: report を読んでから"
  log "  git -C \"$MAIN_ROOT\" fetch \"$ROOT\" $BRANCH && git -C \"$MAIN_ROOT\" merge --ff-only FETCH_HEAD   # develop 上で"
  log "  (または再実行時に --push-develop)"
fi
exit "$RUN_STATUS"
