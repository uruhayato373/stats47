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
# Phase 6 (2026-05-27): stats_* テーブル DROP に伴い、ranking-normalized-values /
# ranking-download の各 D1 export task は廃止。観測値は app/stats/<metric>/*.json として
# /page-data-batch (Phase 6.4) で R2 に直接書込まれる。
#
# ★ranking-values は 2026-07-27 に復活 (D1 版とは別実装)。Phase 6 で D1 export を廃止した際に
# 代替 writer が作られず、配信用 app/ranking/<key>/values.json が 2 ヶ月間凍結していた
# (runtime の全描画値・OGP・blog がこれを読むため stale 配信 + 新規 metric は空ページ化)。
# 新 writer は app/stats (正典) を入力に決定的変換する。ranking-items の後に置くこと。
#
# ★ranking-normalized-values は 2026-07-29 に新設 (values-per-population / values-per-area /
# national-trend)。Phase 6 で D1 版 exporter が廃止されたまま代替が作られず、R2 には
# 2026-05-21 生成の orphan が残り、しかも per-area は分母 (100km² 単位) の換算漏れで
# 100 倍過大だった。計算は runtime と同じ services/normalize-core.ts に委譲し、
# push 前に fixture 値域ゲートを通す (違反時 exit≠0 で R2 push されない)。
# correlation は 2026-06-14 に復活: D1 ではなく R2 観測値を入力に使い捨て :memory: SQLite で
# 集計するエフェメラル producer (build-correlation-snapshot.ts) として再実装 (DBレス Derived)。
declare -a TASKS=(
  "remotion-static|apps/remotion/scripts/export-d1-to-remotion-static.ts --feature all"
  "ranking-items|packages/ranking/src/scripts/generate-ranking-items.ts"
  "item-metadata-refresh|packages/ranking/src/scripts/refresh-item-metadata.ts --apply"
  "master|packages/ranking/src/scripts/export-master-snapshots.ts"
  # ★calculated-stats は ranking-values より前に置くこと。計算型 metric の正典
  #   app/stats/<key>/values.json を作る producer で、ranking-values はそれを配信用に
  #   射影するだけだから (逆順だと計算型が 1 年前のまま配信される)。
  "calculated-stats|packages/ranking/src/scripts/generate-calculated-stats.ts"
  "ranking-values|packages/ranking/src/scripts/generate-ranking-values.ts"
  "municipality-ranking|packages/ranking/src/scripts/generate-municipality-ranking.ts"
  "ranking-normalized-values|packages/ranking/src/scripts/generate-ranking-normalized-values.ts"
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

push_allowed() {
  [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ] || [ "$ALLOW_LOCAL_R2_WRITE" = "1" ]
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
    continue
  fi

  # ★ranking-items の per-key item.json は master が直後に remote から再読込する。
  # saveToR2 は .local/r2 への staging だけなので、末尾の一括 push まで待つと master が
  # 旧 item.json を読み、fresh な staging を同じ path へ上書きする (2026-08-27 実測)。
  # 生成直後に per-key を S3 へ反映し、後続 metadata/master の read-after-write を保証する。
  # この push が不完全なまま master を続けると旧値を再び焼き込むため、失敗時は即停止する。
  if [ "$label" = "ranking-items" ] && [ "$DRY_RUN" = "0" ] && push_allowed; then
    echo "── ranking-items の per-key item.json を先に push (後続 metadata/master が remote から読むため) ──"
    if ! npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/ranking; then
      echo "❌ ranking-items の中間 push に失敗。stale item の再取込を防ぐため後続 task を停止します"
      exit 1
    fi
  fi

  # ★calculated-stats だけは書いた直後に push する (2026-08-05 実測で必要と判明)。
  #
  # 各 task は .local/r2 に書き、push は末尾に 1 回 — が原則だが、**reader は
  # ローカルミラーを読まない** (fetch.ts: 「ローカル FS ミラー読み取りは廃止。remote が
  # 唯一の真実源」。R2_PUBLIC_FETCH_URL があれば公開 URL へ直行する)。
  # したがって後続の ranking-values が calculated-stats の出力を読むには、間に push が要る。
  # 初回はこれが無く、app/stats は 18 年に更新されたのに app/ranking は 1 年のまま
  # 旧値 (山形 545,206) を配信していた。
  # page-data-batch → 即 push → run.sh という data-refresh の構造と同じ理由。
  # diff-push は差分のみなので、末尾の全体 push と二重になっても無害。
  if [ "$label" = "calculated-stats" ] && [ "$DRY_RUN" = "0" ] && push_allowed; then
    echo "── calculated-stats の出力を先に push (後続 ranking-values が remote から読むため) ──"
    if ! npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/stats; then
      echo "❌ calculated-stats の中間 push に失敗"
      FAILED+=("calculated-stats-push")
    fi
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
  echo "   → 成功した task の出力は下の push で反映してから exit 1 する (下記の理由)"
fi

# ★1 task の失敗で「全 task の成果」を捨てない (2026-08-17 の障害対策)
#
# 以前はここで `exit 1` していたため、**失敗が 1 件でもあると末尾の push に到達せず、
# 成功した task が .local/r2 に書いた成果物がまるごと捨てられていた**。runner は破棄されるので
# 復旧手段も無い。
#
# 実害: `ranking-values` は 2,244 件を書き切った**後**の検証 (観測値 0 件の未登録キー) で
# exit 1 していた。生成は全件成功しているのに push されず、`app/ranking/<key>/values.json` は
# 2026-08-11 から 6 日間 site-wide で凍結していた (原因の 9 metric は R2 の年が config.years と
# 食い違う古い取り込み。再取り込みで解消)。
#
# 方針は ranking-content-standards.md §2026-08-07 と同じ「オールオアナッシングにしない」:
# 通過分は反映し、run は赤のままにする (Issue も従来どおり起票される)。
# 各 exporter はファイル単位で完結した内容を書くので、部分反映で壊れた JSON は生まれない。
if [ "$DRY_RUN" = "0" ]; then
  # R2 書き込みは CI / クラウド専用。ローカル実行では生成のみ行い push はスキップする
  # (snapshot は .local/r2 に出力済)。緊急時のみ ALLOW_LOCAL_R2_WRITE=1 で上書き可能。
  if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ] || [ "$ALLOW_LOCAL_R2_WRITE" = "1" ]; then
    echo ""
    echo "════ R2 push ════"
    PUSH_ARGS=()
    # 単独実行時に CI runner へ同梱された無関係な staging asset を巻き込まない。
    # municipality ranking は専用 URL namespace のため prefix を安全に限定できる。
    if [ "$ONLY" = "municipality-ranking" ]; then
      PUSH_ARGS+=(--prefix app/municipalities)
    fi
    if npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts "${PUSH_ARGS[@]}"; then
      echo "✅ snapshot を R2 に push 完了"
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

# 失敗した task があれば run は赤にする (push の後に判定するのが上記の要点)
if [ ${#FAILED[@]} -ne 0 ]; then
  echo ""
  echo "❌ 失敗した task: ${FAILED[*]}"
  exit 1
fi
