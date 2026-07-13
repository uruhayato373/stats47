#!/usr/bin/env bash
# sync-snapshots: git TS / R2 観測値から R2 snapshot を順次 export する (完全DBレス doc12)
# 各 export は git TS (data/page-components, affiliate-ads-data 等) / article.md / R2 観測値を入力に
# .local/r2/app/ へ snapshot を生成し、末尾で diff-push-r2 が R2 に push する。永続 D1 は読まない。

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)/.."
cd "$PROJECT_ROOT"

# Args
ONLY=""
DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only) ONLY="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# Setup CLI で server-only バイパス + .env.local ロード
TSX="npx tsx -r ./packages/ranking/src/scripts/setup-cli.js"

# (label, script_path) のペアで定義
# remotion-static は Remotion 用 public/<feature>/*.json を D1 から再生成 (R2 push 対象外、ローカル file のみ更新)
#
# Phase 6 (2026-05-27): stats_* テーブル DROP に伴い、ranking-values / ranking-normalized-values /
# ranking-download の各 D1 export task は廃止。観測値は app/stats/<metric>/*.json として
# /page-data-batch (Phase 6.4) で R2 に直接書込まれる。
# correlation は 2026-06-14 に復活: D1 ではなく R2 観測値を入力に使い捨て :memory: SQLite で
# 集計するエフェメラル producer (build-correlation-snapshot.ts) として再実装 (DBレス Derived)。
declare -a TASKS=(
  "remotion-static|apps/remotion/scripts/export-d1-to-remotion-static.ts --feature all"
  "item-metadata-refresh|packages/ranking/src/scripts/refresh-item-metadata.ts --apply"
  "master|packages/ranking/src/scripts/export-master-snapshots.ts"
  "ranking-items|packages/ranking/src/scripts/generate-ranking-items.ts"
  "item-seo-refresh|packages/ranking/src/scripts/refresh-item-seo.ts --apply"
  "area-profile|packages/area-profile/src/scripts/export-snapshot.ts"
  "city-profile|packages/area-profile/src/scripts/export-city-snapshot.ts"
  "blog|apps/web/scripts/export-blog-snapshot.ts"
  "page-components|apps/web/scripts/export-page-components-snapshot.ts"
  "affiliate-ads|apps/web/scripts/export-affiliate-ads-snapshot.ts"
  "ranking-page-cards|apps/web/scripts/export-ranking-page-cards-snapshot.ts"
  "station-passengers|apps/web/scripts/export-station-passengers-snapshot.ts"
  "migration-flow|apps/web/scripts/export-migration-flow-r2.ts"
  "finance-flow|apps/web/scripts/generate-finance-flow.ts"
  "correlation|packages/correlation/src/scripts/build-correlation-snapshot.ts"
)

run_task() {
  local label="$1"
  local script="$2"

  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] $label → $TSX $script"
    return 0
  fi

  echo ""
  echo "═══ $label ═══"
  if eval "$TSX $script"; then
    echo "✅ $label 完了"
  else
    echo "❌ $label 失敗"
    return 1
  fi
}

FAILED=()
MATCHED=0
for task in "${TASKS[@]}"; do
  label="${task%|*}"
  script="${task##*|}"

  if [ -n "$ONLY" ] && [ "$ONLY" != "$label" ]; then
    continue
  fi
  MATCHED=$((MATCHED + 1))

  if ! run_task "$label" "$script"; then
    FAILED+=("$label")
  fi
done

# ★silent no-op ガード (2026-07-14): --only の typo / 未登録 task 名だと 0 件実行のまま
# 「✅ 完了」で exit 0 になり、呼び元 (CI dispatch) が成功と誤認する事故が実発生した。
# 1 件もマッチしなければ有効な task 名を提示して fail する。
if [ -n "$ONLY" ] && [ "$MATCHED" -eq 0 ]; then
  echo "❌ --only '$ONLY' に一致する task がありません。有効な task:"
  for task in "${TASKS[@]}"; do echo "  - ${task%|*}"; done
  exit 1
fi

echo ""
echo "════════════════════════════════════════"
if [ ${#FAILED[@]} -ne 0 ]; then
  echo "❌ 失敗: ${FAILED[*]}"
  exit 1
fi

if [ "$DRY_RUN" = "0" ]; then
  # R2 書き込みは CI / クラウド専用。ローカル実行では生成のみ行い push はスキップする
  # (snapshot は .local/r2 に出力済)。緊急時のみ ALLOW_LOCAL_R2_WRITE=1 で上書き可能。
  if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ] || [ "$ALLOW_LOCAL_R2_WRITE" = "1" ]; then
    echo ""
    echo "════ R2 push ════"
    if npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts; then
      echo "✅ 全 snapshot を R2 に push 完了"
    else
      echo "❌ R2 push 失敗"
      exit 1
    fi
  else
    echo ""
    echo "ℹ️  ローカル実行のため R2 push をスキップ (snapshot は .local/r2 に生成済)。"
    echo "    R2 反映は GitHub Actions 'Sync Snapshots → R2' (sync-snapshots.yml) を実行してください。"
    echo "    どうしてもローカルから push する場合のみ: ALLOW_LOCAL_R2_WRITE=1 bash .claude/skills/db/sync-snapshots/run.sh"
  fi
else
  echo "✅ 全 snapshot export 完了（dry-run のため R2 push はスキップ）"
fi
