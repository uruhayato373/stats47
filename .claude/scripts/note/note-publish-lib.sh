#!/usr/bin/env bash
# 実DOM検証済み (2026-09-06) の note 公開ヘルパー。
# 既知の落とし穴:
#   * browser-use の state 出力は <button id=:rd: /> と ラベルが別行 → 1行正規表現では取れない
#   * タブが about:blank に落ちることがある → 各段階で location.href を必ず確認する
#   * タグ候補(suggestion)と確定チップ(chip)は [aria-label=削除] の有無で区別する
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
NBU(){ browser-use --headed --profile "Profile 5" "$@"; }

# 現在 URL を返す
np_href(){ NBU eval "location.href" 2>&1 | sed -n 's/^result: //p' | head -1; }

# 期待 URL に居ることを保証する (blank タブ / 遷移失敗からの復帰)
np_ensure(){ # $1=url  $2=必須文字列(省略可)
  local want="$1" need="${2:-}" cur tries=0
  while [ "$tries" -lt 3 ]; do
    cur=$(np_href)
    case "$cur" in *"$want"*)
      if [ -z "$need" ]; then return 0; fi
      if NBU eval "document.body.innerText.indexOf('$need')>=0?'yes':'no'" 2>&1 | grep -q "yes"; then return 0; fi ;;
    esac
    NBU open "$want" >/dev/null 2>&1; sleep 7
    tries=$((tries+1))
  done
  cur=$(np_href)
  case "$cur" in *"$want"*) return 0;; *) echo "  [FAIL] cannot reach $want (now: $cur)"; return 1;; esac
}

# state からボタン index を取る (ラベルが次行にある形式に対応)
np_btn(){ # $1=state file  $2=ラベル
  awk -v L="$2" 'index($0,L)>0 && prev ~ /<button/ {print prev; exit} {prev=$0}' "$1" \
    | grep -oE '\[[0-9]+\]<button' | grep -oE '[0-9]+' | head -1
}

# 確定タグチップ数
np_chip_count(){
  NBU eval "String([...document.querySelectorAll('button')].filter(b=>b.querySelector('[aria-label=\"削除\"]')).length)" 2>&1 \
    | sed -n 's/^result: //p' | head -1
}

# 公開PUTの直前に、本文長とタグ数をfail-closedで保証する。
# noteの設定画面は表示チップ数を制限するため、95〜99件は送信payloadで確定する。
np_install_publish_guard(){ # $1=hashtags.txt  $2=本文最小文字数
  local file="$1" min_body="${2:-300}" encoded result
  [ -f "$file" ] || { echo "missing-tags"; return 1; }
  encoded=$(base64 < "$file" | tr -d '\n')
  result=$(NBU eval "(()=>{const raw=new TextDecoder().decode(Uint8Array.from(atob('$encoded'),c=>c.charCodeAt(0)));const tags=[...new Set(raw.trim().split(/\\n+/).map(x=>x.trim()).filter(x=>/^#[^#\\s-]+$/.test(x)&&!/^#\\d+$/.test(x)))].slice(0,99);if(tags.length<95)return JSON.stringify({installed:false,tags:tags.length});const original=window.fetch.bind(window);window.__stats47PublishGuard={installed:true,tags:tags.length,status:null};window.fetch=(input,init)=>{const url=String(input);if(url.includes('/api/v1/text_notes/')&&String(init?.method).toUpperCase()==='PUT'){const body=JSON.parse(init.body);const freeBody=String(body.free_body||'');if(freeBody.length<$min_body)throw new Error('free body too short: '+freeBody.length);body.hashtags=tags;init={...init,body:JSON.stringify(body)};window.__stats47PublishGuard={installed:true,tags:tags.length,status:'sending',freeBodyLength:freeBody.length,price:Number(body.price||0)};return original(input,init).then(response=>{window.__stats47PublishGuard.status=response.status;return response});}return original(input,init)};return JSON.stringify(window.__stats47PublishGuard)})()" 2>&1)
  echo "$result" | grep -q '"installed":true' || { echo "$result"; return 1; }
}

np_verify_publish_guard(){
  local result
  result=$(NBU eval "JSON.stringify(window.__stats47PublishGuard||null)" 2>&1)
  echo "$result" | grep -q '"status":200' || { echo "$result"; return 1; }
  echo "$result" | grep -Eq '"tags":9[5-9]' || { echo "$result"; return 1; }
}

# 新規公開ではnote側が表示用タグだけを採用する場合があるため、公開直後に
# 同じ本文を再送し、公開APIで95件以上になるまでを1トランザクションとして扱う。
np_update_published_hashtags(){ # $1=note key  $2=hashtags.txt  $3=本文最小文字数
  local key="$1" file="$2" min_body="${3:-300}" st=/tmp/np-hashtag-state.txt pub clicked ok
  NBU open "https://editor.note.com/notes/$key/edit?draft_reedit=true" >/dev/null 2>&1; sleep 6
  NBU state 2>&1 > "$st"
  grep -q "contenteditable=true role=textbox" "$st" || { echo "editor-not-loaded"; return 1; }
  pub=$(np_btn "$st" "公開に進む")
  [ -n "$pub" ] || { echo "publish-settings-not-found"; return 1; }
  NBU click "$pub" >/dev/null 2>&1; sleep 3
  np_install_publish_guard "$file" "$min_body" || return 1
  clicked=$(NBU eval "(()=>{const all=[];(function deep(r){r.querySelectorAll('*').forEach(e=>{if(e.tagName==='BUTTON')all.push(e);if(e.shadowRoot)deep(e.shadowRoot)})})(document);const b=all.find(e=>(e.textContent||'').trim()==='更新する');if(!b)return 'not-found';b.click();return 'clicked'})()" 2>&1)
  echo "$clicked" | grep -q "clicked" || { echo "update-button-not-found"; return 1; }
  sleep 6
  np_verify_publish_guard || return 1
  ok=$(NOTE_KEY="$key" MIN_BODY="$min_body" node - <<'NODE'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let note;
for (let attempt = 1; attempt <= 5; attempt += 1) {
  const response = await fetch(`https://note.com/api/v3/notes/${process.env.NOTE_KEY}?ts=${Date.now()}`);
  if (response.ok) note = (await response.json()).data;
  if ((note?.hashtag_notes?.length || 0) >= 95) break;
  await sleep(attempt * 700);
}
const valid = note?.user?.urlname === 'stats47'
  && note?.status === 'published'
  && (note?.hashtag_notes?.length || 0) >= 95
  && String(note?.body || '').length >= Number(process.env.MIN_BODY);
process.stdout.write(valid ? 'ok' : JSON.stringify({
  account: note?.user?.urlname,
  status: note?.status,
  hashtags: note?.hashtag_notes?.length || 0,
  bodyLength: String(note?.body || '').length,
}));
NODE
)
  [ "$ok" = "ok" ] || { echo "$ok"; return 1; }
}

# タグを1件追加 (追加できたら 0)
np_add_tag(){ # $1=tag
  local before after
  before=$(np_chip_count)
  NBU eval "(()=>{const i=document.querySelector('input[placeholder=\"ハッシュタグを追加する\"]');if(!i)return 'not-found';const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'$1');i.dispatchEvent(new Event('input',{bubbles:true}));i.focus();return 'ok'})()" >/dev/null 2>&1
  sleep 0.6
  NBU keys Enter >/dev/null 2>&1; sleep 1.4
  after=$(np_chip_count)
  # 入力欄に残った未確定値は消す (次のタグへ持ち越さない)
  NBU eval "(()=>{const i=document.querySelector('input[placeholder=\"ハッシュタグを追加する\"]');if(!i)return 'x';if(i.value){const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'');i.dispatchEvent(new Event('input',{bubbles:true}));}return 'x'})()" >/dev/null 2>&1
  [ "${after:-0}" -gt "${before:-0}" ]
}

# 公開確定 → 公開 URL を stdout に出す (失敗時は空 + 非0)
# $1 = note key (n...)  ※公開URLは https://note.com/stats47/n/<key>
np_commit(){
  local key="$1" st=/tmp/np-state.txt POST ok
  NBU state 2>&1 > "$st"
  POST=$(np_btn "$st" "投稿する"); [ -z "$POST" ] && POST=$(np_btn "$st" "今すぐ公開")
  if [ -z "$POST" ]; then echo ""; return 1; fi
  NBU click "$POST" >/dev/null 2>&1; sleep 9
  # 公開完了モーダルの文言を証拠にする (URL は key から決まる)
  ok=$(NBU eval "String(document.body.innerText.indexOf('記事が公開されました')>=0)" 2>&1 | sed -n 's/^result: //p' | head -1)
  if [ "$ok" != "true" ]; then
    sleep 6
    ok=$(NBU eval "String(document.body.innerText.indexOf('記事が公開されました')>=0)" 2>&1 | sed -n 's/^result: //p' | head -1)
  fi
  if [ "$ok" != "true" ]; then echo ""; return 1; fi
  echo "https://note.com/stats47/n/$key"
  return 0
}

# 公開完了モーダルを閉じる
np_close_modal(){
  NBU eval "(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='閉じる'||x.className&&/close/i.test(x.className));if(b){b.click();return 'closed'}return 'none'})()" >/dev/null 2>&1
  NBU keys Escape >/dev/null 2>&1; sleep 1
}

# 公開URLの実在確認 (200 + タイトル一致)
np_verify(){ # $1=url  $2=期待タイトル断片
  local code
  code=$(curl -s -o /tmp/np-live.html -w "%{http_code}" "$1")
  [ "$code" = "200" ] || { echo "http=$code"; return 1; }
  if [ -n "${2:-}" ] && ! grep -qF "$2" /tmp/np-live.html; then echo "title-mismatch"; return 1; fi
  echo "ok"; return 0
}
