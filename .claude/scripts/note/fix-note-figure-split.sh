#!/usr/bin/env bash
# 公開済み note 記事の「図が文章を分断している」状態を是正する。
#   * 文章・数値・画像は一切変えない。block の区切りだけを draft.md に合わせ直す。
#   * 本文は note API から取得したものを再構成し、公開 PUT を差し替えて送る
#     (エディタ上での画像挿し直しは Home キー由来の再分断リスクがあるため使わない)。
#   * hashtags は既存 guard と同じく hashtags.txt から 99 件で確定する。
# 使い方: fix-note-figure-split.sh <slug> [<slug> ...]     PROBE=1 で payload 調査のみ
set -uo pipefail
ROOT=/Users/minamidaisuke/stats47
source "$ROOT/.claude/scripts/note/note-publish-lib.sh"
LOG="$ROOT/.local/kakei-figfix-log.tsv"
mkdir -p "$(dirname "$LOG")"; touch "$LOG"

LOCK_DIR="${TMPDIR:-/tmp}/stats47-note-profile5.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  holder=""; [ -f "$LOCK_DIR/pid" ] && holder=$(sed -n '1p' "$LOCK_DIR/pid")
  if [[ "$holder" =~ ^[0-9]+$ ]] && kill -0 "$holder" 2>/dev/null; then
    echo "FAIL Profile 5 is already in use (pid=$holder)"; exit 75
  fi
  rm -rf -- "$LOCK_DIR"; mkdir "$LOCK_DIR" || { echo "FAIL cannot acquire lock"; exit 75; }
fi
printf '%s\n' "$$" > "$LOCK_DIR/pid"

cleanup(){
  trap - EXIT INT TERM
  NBU close >/dev/null 2>&1 || true
  pkill -TERM -f "browser_use.skill_cli.daemon" 2>/dev/null || true
  sleep 1
  pkill -KILL -f "browser_use.skill_cli.daemon" 2>/dev/null || true
  pkill -KILL -f "user-data-dir=.*ms-playwright/mcp-chrome" 2>/dev/null || true
  ps -Axo pid,command | grep "browser-use-user-data-dir" | grep -v grep \
    | awk '{print $1}' | xargs -n1 kill -9 2>/dev/null || true
  find "${TMPDIR:-/tmp}" -maxdepth 1 -type d -name 'browser-use-user-data-dir-*' \
    -exec rm -rf -- {} + 2>/dev/null || true
  osascript -e 'tell application "Google Chrome"
    repeat with w in windows
      repeat with t in tabs of w
        if URL of t contains "editor.note.com" then close t
      end repeat
    end repeat
  end tell' 2>/dev/null || true
  rm -rf -- "$LOCK_DIR"
}
trap cleanup EXIT INT TERM

NBU open "https://note.com/api/v2/current_user" >/dev/null 2>&1; sleep 4
ACC=$(NBU eval "(()=>{try{return JSON.parse(document.body.innerText).data.urlname}catch(e){return 'unknown'}})()" 2>&1 | sed -n 's/^result: //p' | head -1)
[ "$ACC" = "stats47" ] || { echo "FAIL account gate: got '$ACC' (expected stats47)"; exit 1; }
echo "account gate ok: $ACC"

FIRST=1
for SLUG in "$@"; do
  ADIR="$ROOT/docs/31_note記事原稿/$SLUG"
  if [ "$FIRST" -eq 0 ]; then W=$((20 + RANDOM % 21)); echo "-- wait ${W}s"; sleep "$W"; fi
  FIRST=0
  echo "================ $SLUG  $(date +%H:%M:%S)"

  # 1) 是正後の本文をローカルで作る (不変量チェック込み。失敗したら記事に触らない)
  PREP=$(node "$ROOT/.claude/scripts/note/build-figure-fix.mjs" "$SLUG" 2>&1) || {
    echo "$PREP"; printf '%s\tFAIL\tprepare\n' "$SLUG" >> "$LOG"; continue; }
  echo "$PREP" | sed 's/^/  /'
  KEY=$(sed -n '1p' "/tmp/notefix-$SLUG.key")
  B64=$(base64 < "/tmp/notefix-$SLUG.html" | tr -d '\n')
  TAGS64=$(base64 < "$ADIR/hashtags.txt" | tr -d '\n')

  # 2) エディタを開いて公開設定へ
  NBU open "https://editor.note.com/notes/$KEY/edit?draft_reedit=true" >/dev/null 2>&1; sleep 7
  NBU state 2>&1 > /tmp/nf-state.txt
  grep -q "contenteditable=true role=textbox" /tmp/nf-state.txt || {
    echo "  FAIL editor not loaded"; printf '%s\tFAIL\teditor\n' "$SLUG" >> "$LOG"; continue; }
  PUB=$(np_btn /tmp/nf-state.txt "公開に進む")
  [ -n "$PUB" ] || { echo "  FAIL 公開に進む not found"; printf '%s\tFAIL\tpublish-btn\n' "$SLUG" >> "$LOG"; continue; }
  NBU click "$PUB" >/dev/null 2>&1; sleep 3

  # 3) PUT を差し替える guard を仕込む (本文 + hashtags)。想定外の payload なら送信せず throw。
  INS=$(NBU eval "(()=>{
    const dec=(b)=>new TextDecoder().decode(Uint8Array.from(atob(b),c=>c.charCodeAt(0)));
    const fixed=dec('$B64');
    const tags=[...new Set(dec('$TAGS64').trim().split(/\\n+/).map(x=>x.trim()).filter(x=>/^#[^#\\s-]+\$/.test(x)&&!/^#\\d+\$/.test(x)))].slice(0,99);
    if(tags.length<95) return JSON.stringify({installed:false,reason:'tags',tags:tags.length});
    const norm=(h)=>h.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'\"').replace(/&#39;/g,\"'\").replace(/\\s+/g,'');
    const want=norm(fixed);
    const g={installed:true,tags:tags.length,status:null,keys:null,replaced:[],probe:${PROBE:-0}};
    window.__figFix=g;
    const orig=window.fetch.bind(window);
    window.fetch=(input,init)=>{
      const url=String(input);
      if(url.includes('/api/v1/text_notes/')&&String(init&&init.method).toUpperCase()==='PUT'){
        const body=JSON.parse(init.body);
        g.keys=Object.keys(body);
        g.lens={};
        for(const k of ['body','free_body','paid_body']) if(k in body) g.lens[k]=String(body[k]||'').length;
        if(g.probe){ g.status='probe-aborted'; throw new Error('probe'); }
        // 本文と同じテキストを持つフィールドだけを差し替える (別物には触らない)
        for(const k of ['body','free_body']){
          if(!(k in body)) continue;
          const cur=String(body[k]||'');
          if(cur.length===0) continue;
          if(norm(cur)!==want) throw new Error('body text mismatch on '+k+': '+norm(cur).length+' vs '+want.length);
          g.origLen=cur.length;
          body[k]=fixed; g.replaced.push(k);
        }
        if(g.replaced.length===0) throw new Error('no body field replaced: '+g.keys.join(','));
        if(String(body.pay_body||'').length>0) throw new Error('paid article — not supported');
        if(Number(body.price||0)>0) throw new Error('paid article — price>0');
        // body_length は HTML 長か本文テキスト長かが不明。HTML 長と一致するときだけ
        // 追随させ、それ以外 (テキスト長。本文テキストは不変) はそのまま残す。
        if('body_length' in body){
          g.bodyLengthBefore=body.body_length;
          if(Number(body.body_length)===g.origLen){ body.body_length=fixed.length; g.bodyLengthAfter=fixed.length; }
          else { g.bodyLengthAfter=body.body_length; }
        }
        body.hashtags=tags;
        init={...init,body:JSON.stringify(body)};
        g.status='sending';
        return orig(input,init).then(r=>{g.status=r.status;return r});
      }
      return orig(input,init);
    };
    return JSON.stringify({installed:true,tags:tags.length});
  })()" 2>&1)
  echo "$INS" | grep -q '"installed":true' || {
    echo "  FAIL guard install: $INS"; printf '%s\tFAIL\tguard\n' "$SLUG" >> "$LOG"; continue; }

  # 4) 更新する
  CLK=$(NBU eval "(()=>{const all=[];(function deep(r){r.querySelectorAll('*').forEach(e=>{if(e.tagName==='BUTTON')all.push(e);if(e.shadowRoot)deep(e.shadowRoot)})})(document);const b=all.find(e=>(e.textContent||'').trim()==='更新する');if(!b)return 'not-found';b.click();return 'clicked'})()" 2>&1)
  echo "$CLK" | grep -q clicked || { echo "  FAIL 更新する not found"; printf '%s\tFAIL\tupdate-btn\n' "$SLUG" >> "$LOG"; continue; }
  sleep 8
  G=$(NBU eval "JSON.stringify(window.__figFix||null)" 2>&1 | sed -n 's/^result: //p' | head -1)
  echo "  guard: $G"
  if [ "${PROBE:-0}" = "1" ]; then echo "  PROBE done"; continue; fi
  echo "$G" | grep -q '"status":200' || { echo "  FAIL put status"; printf '%s\tFAIL\tput\n' "$SLUG" >> "$LOG"; continue; }

  # 5) 公開ページで実測 (分断 0 / タグ / タイトル / 価格 / 本文一致)
  sleep 4
  V=$(node "$ROOT/.claude/scripts/note/verify-figure-fix.mjs" "$SLUG" 2>&1)
  echo "$V" | sed 's/^/  /'
  if echo "$V" | grep -q '^VERIFY_OK'; then printf '%s\tOK\t%s\n' "$SLUG" "$KEY" >> "$LOG"
  else printf '%s\tFAIL\tverify\n' "$SLUG" >> "$LOG"; fi
done
echo "=== done ==="
