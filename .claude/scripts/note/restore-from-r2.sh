#!/usr/bin/env bash
# note 記事を R2 から docs/31 に復元する (更新/リライト作業用)
# 公開済み (note-published-urls.json) / ドラフト (note-draft-index.json) 両対応。
#
# 使い方:
#   bash .claude/scripts/note/restore-from-r2.sh <slug>
#
# 例:
#   bash .claude/scripts/note/restore-from-r2.sh 00-claude-code-intro-for-public-servants
#   bash .claude/scripts/note/restore-from-r2.sh A-laborwage-commute-time-prefecture
#
# 更新後: develop に push → sync-note-r2.yml が R2 に再同期 + docs/31 削除

set -euo pipefail

SLUG="${1:?使い方: $0 <slug>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PUB_FILE="$PROJECT_ROOT/.claude/state/note-published-urls.json"
DRAFT_FILE="$PROJECT_ROOT/.claude/state/note-draft-index.json"
R2_BASE="https://storage.stats47.jp"

# note-published-urls.json または note-draft-index.json から情報取得
LOOKUP=$(node -e "
const fs=require('fs');
const pub=JSON.parse(fs.readFileSync('$PUB_FILE','utf8'));
const dft=JSON.parse(fs.readFileSync('$DRAFT_FILE','utf8'));
const slug='$SLUG';

if(pub.articles[slug]){
  const a=pub.articles[slug];
  if(a.is_paid===true && a.r2_access==='private'){
    console.log(JSON.stringify({vertical:a.vertical, r2_path:a.r2_path, status:'published', access:'private'}));
    process.exit(0);
  }
  const r2=a.r2_path||('note/'+a.vertical+'/'+slug);
  console.log(JSON.stringify({vertical:a.vertical, r2_path:r2, status:'published', access:'public'}));
} else if(dft.drafts[slug]){
  const d=dft.drafts[slug];
  const r2=d.r2_path||('note/'+d.vertical+'/'+slug);
  console.log(JSON.stringify({vertical:d.vertical, r2_path:r2, status:'draft'}));
} else {
  console.error('slug not found in published or draft index: '+slug);
  process.exit(1);
}
") || exit 1

VERTICAL=$(echo "$LOOKUP" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.vertical)")
R2_PATH=$(echo "$LOOKUP" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.r2_path)")
STATUS=$(echo "$LOOKUP" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.status)")
ACCESS=$(echo "$LOOKUP" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.access||'public')")

if [ "$ACCESS" = "private" ]; then
  exec npx tsx "$SCRIPT_DIR/restore-paid-note-private-r2.ts" "$SLUG"
fi

echo "▶ 復元: $SLUG"
echo "  status:   $STATUS"
echo "  vertical: $VERTICAL"
echo "  r2_path:  $R2_PATH"

MANIFEST_URL="$R2_BASE/$R2_PATH/manifest.json"

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
DOCS31="$PROJECT_ROOT/docs/31_note記事原稿"
if [ "$VERTICAL" = "stats47-note" ]; then
  DEST_DIR="$DOCS31/$SLUG"
else
  DEST_DIR="$DOCS31/$VERTICAL/$SLUG"
fi

echo "  出力先: $DEST_DIR"

if [ -d "$DEST_DIR" ]; then
  echo "⚠️  既に存在します: $DEST_DIR"
  read -r -p "上書きしますか? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "中止"; exit 0; }
fi

echo "  ファイルをダウンロード中..."
while IFS= read -r file; do
  [ "$file" = "manifest.json" ] && continue  # manifest は不要
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
if [ "$STATUS" = "published" ]; then
  echo "   更新後: develop push → CI が R2 再同期 + docs/31 自動削除 + note.com は browser-use で update"
else
  echo "   更新後: develop push → CI が R2 再同期 + docs/31 自動削除"
fi
