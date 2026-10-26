#!/usr/bin/env bash
# ブログの是正キューの週次の作り直しと公開済み原稿の掃除 (2026-10-26 に blog-remediation-daily.yml から週次レビューへ移した)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。是正キュー・SVG の系譜・図の出典を作り直し、
# 公開済み (R2 と内容一致) の contents/blog の原稿を git rm する。縮小専用のラチェット 3 種 (元データ消失・本文と data の
# 数値の食い違い・再取得できない出典) のどれかが前回 (HEAD) より増えたら、その queue だけ HEAD に戻して exit 1。
# 散布図は JSON からの再生成と byte 一致も確かめる。今週直す記事の上位 10 件を最後に出す (レビューの「コンテンツ」が読む)。
set -uo pipefail
cd "$(dirname "$0")/../../../.."
export R2_PUBLIC_FETCH_URL="${R2_PUBLIC_FETCH_URL:-https://storage.stats47.jp}"
if [ -z "${NEXT_PUBLIC_ESTAT_APP_ID:-}" ]; then
  NEXT_PUBLIC_ESTAT_APP_ID=$(sed -n 's/^NEXT_PUBLIC_ESTAT_APP_ID=//p' apps/web/.env.development | head -1)
  export NEXT_PUBLIC_ESTAT_APP_ID
fi
failed=()
node .claude/scripts/blog/build-stale-data-years.mjs || echo "warning: 図の年の古さの一覧の作り直しに失敗"
node .claude/scripts/blog/build-remediation-queue.mjs || echo "warning: 是正キューの作り直しに失敗"
node .claude/scripts/blog/build-lineage-queue.mjs || echo "warning: SVG の系譜キューの作り直しに失敗"
node .claude/scripts/blog/audit-chart-provenance.mjs || echo "note: 再取得できない出典がある (ラチェットで判定する)"
shopt -s nullglob
reviews=(contents/blog/*/review.md)
[ ${#reviews[@]} -gt 0 ] && { node .claude/scripts/blog/record-critic-findings.mjs "${reviews[@]}" || echo "warning: critic の指摘の記録に失敗"; }
node .claude/scripts/blog/critic-findings-digest.mjs || echo "warning: critic の指摘の集計・起票に失敗"
node .claude/scripts/blog/prune-published-outbox.mjs --apply || echo "warning: 公開済み原稿の掃除に失敗"

# 縮小専用ラチェット: 今回の値が HEAD の値より増えたら、その queue を HEAD に戻す (増えた状態を次回の基準にしない)
ratchet() {
  local name="$1" expr="$2"; shift 2
  local queue="$1"
  [ -f "$queue" ] || { echo "$name: queue が無い → スキップ"; return 0; }
  local count="const q=require(process.argv[1]); const n=($expr); if (typeof n !== 'number') { console.error('集計が無い — スキーマ変更?'); process.exit(2) } console.log(n)"
  local new old prev="${TMPDIR:-/tmp}/ratchet-$name-prev.json"
  new=$(node -e "$count" "$PWD/$queue") || { echo "$name: queue のスキーマが想定と違う"; failed+=("$name"); return 0; }
  git show "HEAD:$queue" > "$prev" 2>/dev/null || { echo "$name: 前回の queue が無い → 基準を記録するだけ ($new)"; return 0; }
  old=$(node -e "$count" "$prev") || { echo "$name: 前回の queue のスキーマが古い → 比較をスキップ"; return 0; }
  echo "$name: 前回 $old → 今回 $new"
  if [ "$new" -gt "$old" ]; then
    echo "$name が増えた。$* を HEAD に戻して基準を据え置く"
    git checkout -- "$@" 2>/dev/null || true
    failed+=("$name")
  fi
}
ratchet lineage "q.byStatus && q.byStatus.neither" data/blog/svg-lineage-queue.json data/blog/svg-lineage-LATEST.md
ratchet value "q.summary && q.summary.valueMismatchArticles" data/blog/remediation-queue.json
ratchet provenance "q.defectCount" data/blog/chart-provenance-queue.json data/blog/chart-provenance-LATEST.md

npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts --probe-only --require-canonical --verify-sources || failed+=("scatter-integrity")
echo "=== 今週のリライト候補 ==="
node .claude/scripts/blog/compose-daily-rewrite-issue.mjs --next "${NEXT:-10}" || true
if [ "${#failed[@]}" -gt 0 ]; then echo "落ちた検査: ${failed[*]} (詳細は data/blog/*-LATEST.md)"; exit 1; fi
