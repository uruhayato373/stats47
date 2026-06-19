#!/usr/bin/env bash
# 公開済み note 記事を R2 から docs/31 に復元する (更新作業用)
#
# 使い方:
#   bash .claude/scripts/note/restore-from-r2.sh <slug>
#
# 例:
#   bash .claude/scripts/note/restore-from-r2.sh 00-claude-code-intro-for-public-servants
#
# R2 公開 URL 経由で取得するため、認証不要 (read-only)。

set -euo pipefail

SLUG="${1:?使い方: $0 <slug>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
URLS_FILE="$PROJECT_ROOT/.claude/state/note-published-urls.json"
R2_BASE="https://storage.stats47.jp"

# note-published-urls.json から vertical と r2_path を取得
VERTICAL=$(node -e "
const d=JSON.parse(require('fs').readFileSync('$URLS_FILE','utf8'));
const a=d.articles['$SLUG'];
if(!a){console.error('slug not found: $SLUG');process.exit(1);}
console.log(a.vertical);
")

R2_PATH=$(node -e "
const d=JSON.parse(require('fs').readFileSync('$URLS_FILE','utf8'));
const a=d.articles['$SLUG'];
console.log(a.r2_path || 'note/$VERTICAL/$SLUG');
")

echo "▶ 復元: $SLUG"
echo "  vertical: $VERTICAL"
echo "  r2_path:  $R2_PATH"

MANIFEST_URL="$R2_BASE/$R2_PATH/manifest.json"

# manifest.json を取得してファイル一覧を取得
echo "  manifest 取得中..."
MANIFEST=$(curl -sf "$MANIFEST_URL") || {
  echo "❌ manifest.json が取得できません: $MANIFEST_URL"
  echo "   R2 に未同期の可能性があります。sync-note-r2.yml を先に実行してください。"
  exit 1
}

FILES=$(echo "$MANIFEST" | node -e "
const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
d.files.forEach(f=>console.log(f));
" 2>/dev/null || echo "$MANIFEST" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for f in d['files']: print(f)
")

# docs/31 の出力先ディレクトリを決定
# コンテナ vertical と同名ディレクトリが存在すれば nested、なければ top-level
DOCS31="$PROJECT_ROOT/docs/31_note記事原稿"
if [ -d "$DOCS31/$VERTICAL" ]; then
  DEST_DIR="$DOCS31/$VERTICAL/$SLUG"
else
  DEST_DIR="$DOCS31/$SLUG"
fi

echo "  出力先: $DEST_DIR"

if [ -d "$DEST_DIR" ]; then
  echo "⚠️  既に存在します: $DEST_DIR"
  read -r -p "上書きしますか? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "中止"; exit 0; }
fi

# 各ファイルをダウンロード
echo "  ファイルをダウンロード中..."
while IFS= read -r file; do
  url="$R2_BASE/$R2_PATH/$file"
  dest="$DEST_DIR/$file"
  mkdir -p "$(dirname "$dest")"
  if curl -sf -o "$dest" "$url"; then
    echo "    ✅ $file"
  else
    echo "    ⚠️  取得失敗: $file ($url)"
  fi
done <<< "$FILES"

echo ""
echo "✅ 復元完了: $DEST_DIR"
echo "   更新後は publish-note スキル (update モード) で note.com に反映してください。"
