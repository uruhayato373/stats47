#!/usr/bin/env bash
#
# note 記事の SVG → PNG 再生成スクリプト
#
# note 記事は R2 `note/<vertical>/<slug>/` が SSOT（ephemeral outbox 化済）。
# 更新時は restore-from-r2.sh <slug> で docs/31 に復元してから本スクリプトを使う。
# PNG が必要なとき (publish-note --update での再アップロード等) に再生成する。
#
# 各 .svg から、同じ basename の .png を同じディレクトリに生成する。
# 目標幅は viewBox 幅か 1200px の大きい方。viewBox のアスペクト比を維持。
#
# Usage:
#   .claude/scripts/note/regenerate-svg-png.sh <dir>
#     <dir> 配下を再帰的に走査し、見つかった *.svg すべてを変換する。
#   例: .claude/scripts/note/regenerate-svg-png.sh docs/31_note記事原稿/koumuin-claude-code
#
set -euo pipefail

TARGET="${1:?Usage: regenerate-svg-png.sh <dir>}"
[ -d "$TARGET" ] || { echo "ERROR: directory not found: $TARGET" >&2; exit 1; }
command -v qlmanage >/dev/null 2>&1 || { echo "ERROR: qlmanage not found (macOS 標準ツール)" >&2; exit 1; }
command -v sips >/dev/null 2>&1 || { echo "ERROR: sips not found (macOS 標準ツール)" >&2; exit 1; }

QL=$(mktemp -d)
trap 'rm -rf "$QL"' EXIT

count=0
fail=0
while IFS= read -r -d '' svg; do
  png="${svg%.svg}.png"
  # viewBox="0 0 W H" から W / H を取得
  vb=$(grep -oE 'viewBox="[0-9. ]+"' "$svg" | head -1 | grep -oE '[0-9.]+' | tr '\n' ' ')
  W=$(echo "$vb" | awk '{print $3}')
  H=$(echo "$vb" | awk '{print $4}')
  if [ -z "$W" ] || [ -z "$H" ]; then
    echo "SKIP (viewBox 不明): $svg" >&2
    continue
  fi
  # 目標寸法: 幅は max(viewBox幅, 1200)、高さはアスペクト比維持
  TW=$(awk -v w="$W" 'BEGIN{ printf "%d", (w>1200 ? w : 1200) }')
  TH=$(awk -v w="$W" -v h="$H" -v tw="$TW" 'BEGIN{ printf "%d", h*tw/w + 0.5 }')
  # <svg> タグの width/height 属性は qlmanage の誤スケール要因。一時コピーで除去
  tmp="$QL/$(basename "$svg")"
  sed -E 's/(<svg[^>]*) width="[0-9]+" height="[0-9]+"/\1/' "$svg" > "$tmp"
  rm -f "$QL"/*.svg.png 2>/dev/null || true
  qlmanage -t -s "$TW" -o "$QL" "$tmp" >/dev/null 2>&1 || true
  qlpng="$QL/$(basename "$tmp").png"
  if [ ! -f "$qlpng" ]; then
    echo "FAIL (qlmanage 変換失敗): $svg" >&2
    fail=$((fail + 1))
    continue
  fi
  # qlmanage は正方形キャンバスに中央配置するため、中央クロップで実寸を切り出す
  sips -c "$TH" "$TW" "$qlpng" -o "$png" >/dev/null 2>&1
  count=$((count + 1))
done < <(find "$TARGET" -name '*.svg' -print0)

echo "✓ 再生成: $count 枚 / 失敗: $fail 枚  (対象: $TARGET)"
[ "$fail" -eq 0 ]
