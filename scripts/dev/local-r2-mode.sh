#!/usr/bin/env bash
#
# local-r2-mode.sh — .local/r2 の SSD / cloud モード切替
#
# 背景 (2026-05-28 dual-mode 化):
#   - D1 (.local/d1) は Mac 内蔵に常駐 (cloud に無い唯一コピー)。SSD 接続有無に関わらず動く。
#   - R2 (.local/r2) は容量大 (19G) のため SSD 据え置き。
#     - SSD 接続時: .local/r2 → SSD への symlink (ローカル高速読み書き)
#     - SSD 非接続時 (読み取り): symlink が dangle → fetchFromR2 が S3 → 公開 R2 URL
#       (R2_PUBLIC_FETCH_URL / NEXT_PUBLIC_R2_PUBLIC_URL = storage.stats47.jp) に自動フォールバック。
#       S3 鍵失効後も公開 URL で読める (build スクリプトは R2_PUBLIC_FETCH_URL 設定で binding 試行を回避)
#     - SSD 非接続時 (書き込み): symlink dangle だと書込失敗 → 本スクリプトで Mac 内蔵の実 dir に切替。
#       cloud 反映は diff-push-r2 (S3) か push-r2-wrangler.ts (wrangler CLI, S3鍵不要)
#
# 使い方:
#   scripts/dev/local-r2-mode.sh status   # 現在のモード表示
#   scripts/dev/local-r2-mode.sh ssd      # SSD 接続時: symlink モード (推奨デフォルト)
#   scripts/dev/local-r2-mode.sh cloud    # SSD 非接続時: Mac 内蔵 stage dir (書込可、読みは cloud fallback)
#
# 注意:
#   - cloud モードで書いた .local/r2 のファイルは /push-r2 で cloud に上げること
#   - SSD に戻す前に cloud モードの stage 内容を push 済か確認 (戻すと参照されなくなる)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCAL_R2="$REPO_ROOT/.local/r2"
SSD_R2="/Volumes/SSD/stats47-local/r2"
STAGE_DIR="$REPO_ROOT/.local/r2-stage"  # cloud モード時の Mac 内蔵 stage

ssd_mounted() { [ -d "$SSD_R2" ]; }

current_mode() {
  if [ -L "$LOCAL_R2" ]; then
    echo "ssd (symlink -> $(readlink "$LOCAL_R2"))"
  elif [ -d "$LOCAL_R2" ]; then
    echo "cloud (Mac 内蔵 stage dir)"
  else
    echo "none (.local/r2 が存在しない)"
  fi
}

cmd="${1:-status}"

case "$cmd" in
  status)
    echo "SSD mounted: $(ssd_mounted && echo yes || echo no)"
    echo "current .local/r2 mode: $(current_mode)"
    ;;

  ssd)
    if ! ssd_mounted; then
      echo "ERROR: SSD ($SSD_R2) がマウントされていません。接続してから実行してください。" >&2
      exit 1
    fi
    # 既存が cloud stage dir なら、push 漏れ警告
    if [ -d "$LOCAL_R2" ] && [ ! -L "$LOCAL_R2" ]; then
      file_count=$(find "$LOCAL_R2" -type f 2>/dev/null | wc -l | tr -d ' ')
      if [ "$file_count" -gt 0 ]; then
        echo "WARNING: cloud stage に $file_count 件のファイルがあります。" >&2
        echo "  /push-r2 で cloud 反映済か確認してください。続行すると参照されなくなります。" >&2
        echo "  退避先: $STAGE_DIR.bak-$(date +%s)" >&2
        mv "$LOCAL_R2" "$STAGE_DIR.bak-$(date +%s)"
      else
        rm -rf "$LOCAL_R2"
      fi
    elif [ -L "$LOCAL_R2" ]; then
      rm "$LOCAL_R2"
    fi
    ln -s "$SSD_R2" "$LOCAL_R2"
    echo "OK: .local/r2 -> $SSD_R2 (ssd モード)"
    ;;

  cloud)
    # symlink を外し、Mac 内蔵の実 dir に (書込 stage 用)。読みは fetchFromR2 が cloud S3 へ自動フォールバック。
    if [ -L "$LOCAL_R2" ]; then
      rm "$LOCAL_R2"
    fi
    mkdir -p "$LOCAL_R2"
    echo "OK: .local/r2 = Mac 内蔵 stage dir (cloud モード)"
    echo "  読み取り: 未配置ファイルは cloud S3 から自動取得 (R2_S3_ENDPOINT 認証要)"
    echo "  書き込み: ここに stage → /push-r2 で cloud 反映"
    ;;

  *)
    echo "usage: $0 {status|ssd|cloud}" >&2
    exit 1
    ;;
esac
