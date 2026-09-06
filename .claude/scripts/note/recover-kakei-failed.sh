#!/usr/bin/env bash
# 失敗した記事を回収する。
#  - note.com の下書き一覧に同タイトルの下書きがあれば、それを再利用して公開する (二重作成しない)
#  - 無ければ通常フローで作り直す
ROOT=/Users/minamidaisuke/stats47
source "$ROOT/.claude/scripts/note/note-publish-lib.sh"

find_draft_key(){ # $1=title
  local title="$1" st=/tmp/np-drafts.txt idx
  np_ensure "https://note.com/notes?status=draft" || return 1
  sleep 2
  NBU state 2>&1 > "$st"
  idx=$(awk -v t="$title" 'index($0,t)>0 && /<button aria-label=/ {match($0,/\[[0-9]+\]/); print substr($0,RSTART+1,RLENGTH-2); exit}' "$st")
  [ -z "$idx" ] && return 1
  NBU click "$idx" >/dev/null 2>&1; sleep 7
  np_href | grep -oE 'n[0-9a-f]{8,}' | head -1
}

for SLUG in "$@"; do
  ADIR="$ROOT/docs/31_note記事原稿/$SLUG"
  grep -q '^note_url:' "$ADIR/draft.md" && { echo "== $SLUG already published"; continue; }
  TITLE=$(python3 -c "
import re
s=open('$ADIR/draft.md',encoding='utf-8').read()
m=re.search(r'^title:\s*\"(.+?)\"\s*\$',s,re.M)
print(m.group(1) if m else '')
")
  echo "================ recover $SLUG"
  KEY=$(find_draft_key "$TITLE")
  if [ -n "$KEY" ]; then
    echo "  found existing draft $KEY — reuse"
    OUT=$(bash "$ROOT/.claude/scripts/note/publish-kakei-one.sh" "$SLUG" stats47-note "$KEY" 2>&1)
  else
    echo "  no existing draft — create fresh"
    OUT=$(bash "$ROOT/.claude/scripts/note/publish-kakei-one.sh" "$SLUG" 2>&1)
  fi
  RC=$?; echo "$OUT" | tail -10
  URL=$(echo "$OUT" | grep -oE 'https://note\.com/stats47/n/n[0-9a-f]+' | tail -1)
  if [ "$RC" -eq 0 ] && [ -n "$URL" ]; then
    printf '%s\tOK\t%s\n' "$SLUG" "$URL" >> "$ROOT/.local/kakei-publish-log.tsv"
  else
    printf '%s\tFAIL2\t%s\n' "$SLUG" "$(echo "$OUT" | grep -E '^FAIL' | head -1)" >> "$ROOT/.local/kakei-publish-log.tsv"
  fi
  sleep $((20 + RANDOM % 21))
done
