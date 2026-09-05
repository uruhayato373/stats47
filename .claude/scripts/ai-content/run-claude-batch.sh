#!/usr/bin/env bash
# run-claude-batch.sh — ranking ai-content を headless claude CLI でローカル量産し、outbox を develop へ push する。
#
# ★ユーザー端末 (Claude Code 外) で実行する。Claude Code セッション内では claude CLI への大きい stdin が
#   サンドボックスでブロックされる (generate-parallel.ts 冒頭コメント)。セッションからは --dry-run だけ。
#
# 何をするか (ai-content-gemini-daily.yml のステップをローカルで再現する):
#   1. build-ai-content-queue.mjs --scope all で R2 からキューを再導出
#   2. --next N で needs-regen 上位 N (quarantine / not-eligible は除外済み) を選ぶ (--keys で明示指定も可)
#   3. generate-parallel.ts --model claude-sonnet --critic claude-sonnet --outbox で生成 → 決定的監査 → 意味レビュー
#   4. record-gemini-run.mjs で history.csv / LATEST.md に run を記録 (トークン・費用換算・通過率)
#   5. record-generation-outcome.mjs で key 別の成否を記録 (★failed は rejected = ゲート/critic 落ちだけ。
#      skip や CLI 障害・429 を failed にすると 3 run 目で大量 quarantine が起きる)
#   6. 1 commit にまとめて develop へ push → publish-ai-content.yml が push トリガーで発火
#      (publish は HEAD~1..HEAD の差分だけを見て MAX_PUBLISH=40 で切るので、1 push = 1 commit ≤ 35 件)
#   7. gh があれば publish run の完了を待つ
#
# 使い方:
#   bash .claude/scripts/ai-content/run-claude-batch.sh                      # 既定 35 件 / sonnet / concurrency 1
#   bash .claude/scripts/ai-content/run-claude-batch.sh --limit 10 --model claude-haiku --retries 2   # パイロット
#   bash .claude/scripts/ai-content/run-claude-batch.sh --keys total-population --no-push          # 1 件だけ試す
#   bash .claude/scripts/ai-content/run-claude-batch.sh --dry-run                                  # LLM を呼ばない
#
# 正典: .claude/rules/ranking-content-standards.md §生成パイプライン / skill /generate-ai-content
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

LIMIT=35
MODEL=claude-sonnet
CRITIC=claude-sonnet
CONCURRENCY=1
RETRIES=1
DRY_RUN=0
NO_PUSH=0
KEYS=""
RUN_ID=""
EXTRA_GEN=()

usage() {
  sed -n '2,24p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}
die() { printf '[run-claude-batch] ERROR: %s\n' "$*" >&2; exit 1; }
log() { printf '[run-claude-batch] %s\n' "$*"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --limit) LIMIT="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --critic) CRITIC="$2"; shift 2 ;;
    --concurrency) CONCURRENCY="$2"; shift 2 ;;
    --retries) RETRIES="$2"; shift 2 ;;
    --keys) KEYS="$2"; shift 2 ;;
    --run-id) RUN_ID="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --no-push) NO_PUSH=1; shift ;;
    --no-json-schema) EXTRA_GEN+=(--no-json-schema); shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown arg: $1 (--help で使い方)" ;;
  esac
done

# ---- guards ------------------------------------------------------------------
[[ "$LIMIT" =~ ^[0-9]+$ ]] && [ "$LIMIT" -ge 1 ] && [ "$LIMIT" -le 35 ] \
  || die "--limit は 1〜35 (publish の MAX_PUBLISH=40 未満で 1 push = 1 commit に収める)"
[[ "$CONCURRENCY" =~ ^[1-3]$ ]] || die "--concurrency は 1〜3 (claude CLI プロセスを並列 spawn するため上限を置く)"
[[ "$RETRIES" =~ ^[0-3]$ ]] || die "--retries は 0〜3"
case "$MODEL" in claude-haiku|claude-sonnet|claude-opus) ;; *) die "--model は claude-haiku|claude-sonnet|claude-opus" ;; esac
case "$CRITIC" in claude-haiku|claude-sonnet|claude-opus|none) ;; *) die "--critic は claude-haiku|claude-sonnet|claude-opus|none" ;; esac
[ "$CRITIC" = none ] && log "WARN: --critic none は意味レビューを飛ばす。パイロット以外では使わない"

CLAUDE_BIN="${CLAUDE_CLI_BIN:-claude}"
if [ "$DRY_RUN" = 0 ]; then
  command -v "$CLAUDE_BIN" >/dev/null 2>&1 || die "claude CLI が見つからない ($CLAUDE_BIN)。CLAUDE_CLI_BIN で指定可"
  log "claude CLI: $(command -v "$CLAUDE_BIN") ($("$CLAUDE_BIN" --version 2>/dev/null | head -1))"
  if [ -n "${CLAUDECODE:-}" ]; then
    log "WARN: Claude Code セッション内で実行している。claude CLI への stdin がサンドボックスでブロックされる場合はユーザー端末で実行する"
  fi
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$NO_PUSH" = 0 ] && [ "$DRY_RUN" = 0 ] && [ "$BRANCH" != develop ]; then
  die "publish-ai-content.yml は develop への push でしか発火しない。develop に切り替えるか --no-push を付ける (現在: $BRANCH)"
fi
if [ -n "$(git status --porcelain -- data/ai-content-staging)" ]; then
  die "data/ai-content-staging に未コミットの変更がある。先に片付ける (前 run の残骸を今回の commit に混ぜない)"
fi

# ---- 0. preflight: 最小プロンプト 1 call で認証と lean flag の受理を確かめる ----------------------
#   実測 (2026-09-05): Claude Code セッションのサンドボックス内では Keychain が読めず、wrapper が
#   `is_error: true` + result "Not logged in" で返る (exit 1)。キューを再導出して 35 件分落ちる前にここで止める。
if [ "$DRY_RUN" = 0 ]; then
  PREFLIGHT_OUT="$(mktemp)"
  # 親 Claude Code セッションの CLAUDE_* を子に継がせない (継ぐと Keychain を読まず「Not logged in」・generate-parallel と同じ規律)
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

RUN_ID="${RUN_ID:-local-$(date +%Y%m%d-%H%M%S)}"
CI_DIR=.local/ci
mkdir -p "$CI_DIR"
# ★絶対パス: `npm run --workspace` は cwd を packages/ai-content にするため、相対だとそちらに書かれる
REPORT="$PROJECT_ROOT/$CI_DIR/claude-run-$RUN_ID.json"
STATE=.claude/state/ai-content/generation-failures.json

# ---- 1-2. 対象選定 -------------------------------------------------------------
if [ -z "$KEYS" ]; then
  log "キューを R2 から再導出 (--scope all)"
  node .claude/scripts/ai-content/build-ai-content-queue.mjs --scope all
  node .claude/scripts/ai-content/build-ai-content-queue.mjs --no-build --next "$LIMIT" \
    | sed '/^$/d' > "$CI_DIR/targets-$RUN_ID.txt"
  KEYS="$(paste -sd, "$CI_DIR/targets-$RUN_ID.txt")"
fi
COUNT="$(printf '%s' "$KEYS" | tr ',' '\n' | sed '/^$/d' | wc -l | tr -d ' ')"
[ "$COUNT" -gt 0 ] || { log "対象なし (キューが空か全件 quarantine)"; exit 0; }
[ "$COUNT" -le 40 ] || die "対象 $COUNT 件 > publish MAX_PUBLISH=40。--limit か --keys を減らす"
log "対象 $COUNT 件: $(printf '%s' "$KEYS" | tr ',' ' ')"

# ---- 3. 生成 → 決定的監査 → 意味レビュー ------------------------------------------
GEN=(--model "$MODEL" --critic "$CRITIC" --concurrency "$CONCURRENCY" --retries "$RETRIES"
     --keys "$KEYS" --outbox --report "$REPORT")
[ "$DRY_RUN" = 1 ] && GEN+=(--dry-run)
GEN_STATUS=success
NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npm run ai:gen --workspace @stats47/ai-content -- "${GEN[@]}" ${EXTRA_GEN[@]+"${EXTRA_GEN[@]}"} \
  || GEN_STATUS=failure
[ -f "$REPORT" ] || die "run report が無い ($REPORT)。生成が起動前に落ちている"

if [ "$DRY_RUN" = 1 ]; then
  log "dry-run 完了。report: $REPORT"
  exit 0
fi

# ---- 4. metrics (history.csv / LATEST.md) ----------------------------------------
node .claude/scripts/ai-content/record-gemini-run.mjs --report "$REPORT" --run-id "$RUN_ID"

# ---- 5. key 別の成否 (failed = rejected のみ) ---------------------------------------
PASSED="$(node -e "const r=require('$REPORT');console.log(r.results.filter(x=>x.status==='ok').map(x=>x.rankingKey).join(','))")"
REJECTED="$(node -e "const r=require('$REPORT');console.log(r.results.filter(x=>x.status==='rejected').map(x=>x.rankingKey).join(','))")"
node .claude/scripts/ai-content/record-generation-outcome.mjs \
  --state "$STATE" --passed "$PASSED" --failed "$REJECTED" --reason claude-local

# ---- summary (パイロットの実測値をここで読む) ------------------------------------------
node -e '
const r = require(process.argv[1]);
const rows = r.results;
const n = rows.length || 1;
const sum = (f) => rows.reduce((a, x) => a + f(x), 0);
console.log(`\n=== run ${process.argv[2]} (${r.resolvedModel} / critic ${r.resolvedCritic ?? r.critic}) ===`);
console.log(`ok ${r.counters.ok} / rejected ${r.counters.rejected} / fail ${r.counters.fail} / skip ${r.counters.skip} (targets ${r.targets})`);
console.log(`author req ${r.requests.author} / critic req ${r.requests.critic}`);
console.log(`tokens: input ${r.usage.inputTokens} / output ${r.usage.outputTokens} / total ${r.usage.totalTokens}`);
console.log(`per key: input ${Math.round(r.usage.inputTokens / n)} / output ${Math.round(r.usage.outputTokens / n)} / cost(API換算) $${(r.usage.costUsd / n).toFixed(3)} / run total $${(r.usage.costUsd ?? 0).toFixed(3)}`);
const reasons = {};
for (const x of rows) if (x.status !== "ok") reasons[x.reason] = (reasons[x.reason] ?? 0) + 1;
if (Object.keys(reasons).length) console.log("non-ok reasons:", JSON.stringify(reasons));
if (r.usage.inputTokens / Math.max(1, r.requests.author + r.requests.critic) > 40000) {
  console.log("!! 1 request あたり input が 40K 超。CLAUDE.md / rules が漏れ込んでいる疑い (cwd / --setting-sources を確認)");
}
' "$REPORT" "$RUN_ID"

OK_COUNT="$(node -e "console.log(require('$REPORT').counters.ok)")"

# ---- 6. commit → rebase → push ---------------------------------------------------
if [ "$NO_PUSH" = 1 ]; then
  log "--no-push: commit/push しない。outbox: data/ai-content-staging ($OK_COUNT 件) / state・metrics は working tree に残る"
  exit 0
fi

git add -- data/ai-content-staging .claude/state/ai-content .claude/state/metrics/ai-content
if git diff --cached --quiet; then
  log "commit 対象なし"
  exit 0
fi
# ★commit 件名に skip-ci 系トークンを入れない: publish-ai-content.yml は push トリガーで発火させる必要がある
git commit -m "chore(ai-content): local claude batch $RUN_ID — publish $OK_COUNT keys" \
  -m "model $MODEL / critic $CRITIC / targets $COUNT / ok $OK_COUNT. report: ${REPORT#"$PROJECT_ROOT"/} (untracked)"
git fetch origin develop
git rebase origin/develop || die "rebase が競合した。解消して 'git push origin HEAD:develop' を手で実行する"
git push origin HEAD:develop
HEAD_SHA="$(git rev-parse HEAD)"
log "pushed $HEAD_SHA → develop"

if [ "$OK_COUNT" = 0 ]; then
  log "公開対象 0 件 (state/metrics だけ push)。publish は発火しない"
  [ "$GEN_STATUS" = success ] || exit 1
  exit 0
fi

# ---- 7. publish run を待つ (gh があれば) --------------------------------------------
if command -v gh >/dev/null 2>&1; then
  RUN_DB_ID=""
  for _ in 1 2 3 4 5 6; do
    sleep 10
    RUN_DB_ID="$(gh run list --workflow publish-ai-content.yml --branch develop --limit 5 \
      --json databaseId,headSha --jq ".[] | select(.headSha==\"$HEAD_SHA\") | .databaseId" | head -1 || true)"
    [ -n "$RUN_DB_ID" ] && break
  done
  if [ -n "$RUN_DB_ID" ]; then
    log "publish-ai-content run $RUN_DB_ID を待つ"
    gh run watch "$RUN_DB_ID" --exit-status || die "publish run が失敗した。gh run view $RUN_DB_ID --log-failed"
    log "publish 完了。公開確認: node .claude/scripts/ai-content/audit-ai-content.mjs <key> (R2 の内容が生成物と一致するか)"
  else
    log "publish run を特定できなかった。gh run list --workflow publish-ai-content.yml で確認する"
  fi
else
  log "gh が無いので publish run は GitHub Actions で確認する (publish-ai-content.yml)"
fi

[ "$GEN_STATUS" = success ] || { log "一部 key が失敗した (report 参照)"; exit 1; }
