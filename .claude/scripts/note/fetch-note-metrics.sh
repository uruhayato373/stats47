#!/bin/bash
# fetch-note-metrics.sh
#
# note.com sitesettings/stats から記事別メトリクス (view/comment/like) を取得して
# .claude/state/metrics/note/note-YYYY-MM-DD.json に保存する。
#
# 前提:
# - Chrome の "Profile 1" に note.com のログインセッションがあること
#   (publish-note は Default だが note dashboard は Profile 1 側のみ)
# - browser-use CLI が ~/.browser-use-env/bin に install されていること
#
# 使い方:
#   bash .claude/scripts/note/fetch-note-metrics.sh
#
# Exit code:
#   0 = 成功
#   2 = ログイン切れ（手動再ログインが必要）
#   3 = browser-use 実行エラー

set -euo pipefail

export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"

PROFILE="Profile 1"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SNAPSHOT_DIR="$ROOT/.claude/state/metrics/note"
DATE=$(date +%Y-%m-%d)
OUTPUT="$SNAPSHOT_DIR/note-$DATE.json"
RAW="/tmp/note-raw-$$.json"

mkdir -p "$SNAPSHOT_DIR"

cleanup() {
  rm -f "$RAW" 2>/dev/null
  browser-use close >/dev/null 2>&1 || true
  # browser-use close は page を閉じるが daemon を止めない → 累積防止のため明示停止
  pkill -KILL -f "browser_use.skill_cli.daemon" 2>/dev/null || true
  pkill -KILL -f "user-data-dir=.*ms-playwright/mcp-chrome" 2>/dev/null || true
  # ユーザーの実 Chrome に開いた note dashboard タブを閉じる（macOS 限定）
  osascript -e 'tell application "Google Chrome"
    repeat with w in windows
      repeat with t in tabs of w
        if URL of t contains "note.com/sitesettings" or URL of t contains "note.com/login" then
          close t
        end if
      end repeat
    end repeat
  end tell' 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[fetch-note-metrics] opening dashboard..."
browser-use close >/dev/null 2>&1 || true
browser-use --headed --profile "$PROFILE" open "https://note.com/sitesettings/stats" >/dev/null
sleep 3

# ログイン状態チェック
PATHNAME=$(browser-use --headed --profile "$PROFILE" eval "location.pathname" 2>&1 | grep "^result:" | sed "s/^result: '//;s/'$//")
if [[ "$PATHNAME" == "/login" || "$PATHNAME" == *"/login" ]]; then
  echo "[fetch-note-metrics] ERROR: not logged in (redirected to /login)"
  echo "[fetch-note-metrics] Manual action: open Chrome Profile 1 and log in to note.com"
  exit 2
fi

# もっとみる をすべて展開
echo "[fetch-note-metrics] expanding article list..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  R=$(browser-use --headed --profile "$PROFILE" eval "const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === 'もっとみる'); if (b) { b.click(); 'clicked'; } else 'done'" 2>&1 | grep "^result:" | sed "s/^result: '//;s/'$//")
  if [[ "$R" == "done" ]]; then
    echo "[fetch-note-metrics] exhausted after $((i-1)) click(s)"
    break
  fi
  sleep 2
done

# 抽出（URL で重複排除）
echo "[fetch-note-metrics] extracting articles..."
browser-use --headed --profile "$PROFILE" eval "JSON.stringify({fetched_at: new Date().toISOString(), articles: Array.from(new Map(Array.from(document.querySelectorAll('tr')).filter(tr => tr.querySelector('a[href*=\"/n/\"]')).map(tr => [tr.querySelector('a[href*=\"/n/\"]').href, tr])).values()).map(tr => { const a = tr.querySelector('a[href*=\"/n/\"]'); const tds = Array.from(tr.querySelectorAll('td')).map(c => c.textContent.replace(/\s+/g,' ').trim()); return {url: a.href, noteId: a.href.split('/n/')[1], title: tds[0], views: parseInt(tds[1]||'0',10), comments: parseInt(tds[2]||'0',10), likes: parseInt(tds[3]||'0',10)}; })})" 2>&1 | grep "^result:" | sed 's/^result: //' > "$RAW"

# totals 付与 + 保存
python3 <<PYEOF
import json, sys, pathlib
raw = open("$RAW").read()
data = json.loads(raw)
data["period_label"] = "月 (直近 30 日)"
data["source"] = "note.com/sitesettings/stats"
data["totals"] = {
  "articles": len(data["articles"]),
  "views": sum(a["views"] for a in data["articles"]),
  "comments": sum(a["comments"] for a in data["articles"]),
  "likes": sum(a["likes"] for a in data["articles"]),
}
pathlib.Path("$OUTPUT").write_text(json.dumps(data, ensure_ascii=False, indent=2))
print(f"[fetch-note-metrics] saved {data['totals']['articles']} articles")
print(f"[fetch-note-metrics] totals: views={data['totals']['views']} likes={data['totals']['likes']} comments={data['totals']['comments']}")
print(f"[fetch-note-metrics] → $OUTPUT")
PYEOF
