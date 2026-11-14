#!/bin/sh
# pre-commit の段ごとの所要時間を記録し、終了時に重い順で出す (CI-SPEED-PRECOMMIT-TRIM-01)。
#
# なぜ要るか: 所要時間を出すのが `preflight-commit.mjs --commit-static` の中だけだと、
# 他の段 (型・docs・metric 契約・画像 pipeline・note の台帳) が重くても記録に残らず、
# pre-commit から何を外すかを実測で決められない。
#
# 使い方 (source する):
#   . apps/web/scripts/pre-commit-stage-timer.sh
#   trap stage_summary EXIT   # exit 1 で終わる経路でも内訳を出す
#   stage "段の名前"          # 前の段を閉じて次の段を始める
#
# pre-commit-checks.sh (bash) と .husky/pre-commit (sh) の両方から読むので、配列や local を使わない。

PRECOMMIT_STAGE_NAME=""
PRECOMMIT_STAGE_STARTED=0
PRECOMMIT_STAGE_ROWS=""

# 現在時刻 (ミリ秒) を PRECOMMIT_NOW_MS に入れる。
# $(...) で返す形にしない: Windows は fork が遅く、段の数だけ計測そのものが重くなる。
precommit_now_ms() {
  if [ -n "${EPOCHREALTIME:-}" ]; then
    # bash 5 以降 (Git for Windows)。プロセスを起動しない。小数点は locale により "," になる。
    # 小数部は 6 桁で先頭が 0 のことがあるので、1 を前置して 8 進数と解釈されるのを避ける。
    PRECOMMIT_NOW_MS=$(( ${EPOCHREALTIME%[.,]*} * 1000 + (1${EPOCHREALTIME#*[.,]} - 1000000) / 1000 ))
    return 0
  fi
  PRECOMMIT_NOW_MS=$(date +%s%N)
  case "$PRECOMMIT_NOW_MS" in
    # %N を持たない date は数字以外を返す。秒の精度へ落とす。
    *[!0-9]*) PRECOMMIT_NOW_MS=$(( $(date +%s) * 1000 )) ;;
    *) PRECOMMIT_NOW_MS=$(( PRECOMMIT_NOW_MS / 1000000 )) ;;
  esac
}

# 前の段を閉じて、次の段を始める。段と段の間に隙間を作らないので、全区間がどれかの段に入る。
stage() {
  precommit_now_ms
  if [ -n "$PRECOMMIT_STAGE_NAME" ]; then
    PRECOMMIT_STAGE_ROWS="${PRECOMMIT_STAGE_ROWS}$(( PRECOMMIT_NOW_MS - PRECOMMIT_STAGE_STARTED ))	${PRECOMMIT_STAGE_NAME}
"
  fi
  PRECOMMIT_STAGE_NAME="$1"
  PRECOMMIT_STAGE_STARTED=$PRECOMMIT_NOW_MS
}

# 最後の段を閉じて内訳を出す。0.1 秒未満の段は 1 行にまとめる (発火しなかった段で内訳が埋もれるため)。
# 終了コードには触らない (EXIT trap から呼ばれる)。
stage_summary() {
  stage ""
  [ -n "$PRECOMMIT_STAGE_ROWS" ] || return 0
  printf '\n⏱  %s\n' "${1:-pre-commit の段ごとの所要時間 (重い順)}"
  printf '%s' "$PRECOMMIT_STAGE_ROWS" | sort -rn | awk -F '\t' '
    { total += $1 }
    $1 >= 100 { printf "  %6.1fs  %s\n", $1 / 1000, $2; next }
    { light += 1; lightMs += $1 }
    END {
      if (light > 0) printf "  %6.1fs  他 %d 段は 0.1 秒未満\n", lightMs / 1000, light
      printf "  %6.1fs  合計\n", total / 1000
    }'
  PRECOMMIT_STAGE_ROWS=""
}
