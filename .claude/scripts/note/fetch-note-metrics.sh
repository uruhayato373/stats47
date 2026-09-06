#!/bin/bash
# fetch-note-metrics.sh
#
# note.com sitesettings/stats から記事別メトリクス (view/comment/like) を取得して
# .claude/state/metrics/note/note-YYYY-MM-DD.json に保存する。
#
# 前提:
# - Chrome の "Profile 5" に note.com/stats47 のログインセッションがあること
# - browser-use CLI が ~/.browser-use-env/bin に install されていること
#
# 使い方:
#   bash .claude/scripts/note/fetch-note-metrics.sh
#
# Exit code:
#   0 = 成功
#   2 = ログイン切れ（手動再ログインが必要）
#   3 = browser-use 実行エラー
#   4 = stats47 以外のアカウント / 記事を検出

set -euo pipefail

export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"

PROFILE="Profile 5"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SNAPSHOT_DIR="$ROOT/.claude/state/metrics/note"
DATE=$(date +%Y-%m-%d)
OUTPUT="$SNAPSHOT_DIR/note-$DATE.json"
RAW="/tmp/note-raw-$$.json"
ACCOUNT_STATE="/tmp/note-account-$$.txt"

mkdir -p "$SNAPSHOT_DIR"

cleanup() {
  rm -f "$RAW" "$ACCOUNT_STATE" 2>/dev/null
  browser-use --headed --profile "$PROFILE" close >/dev/null 2>&1 || true
  # browser-use close は page を閉じるが daemon を止めない → 累積防止のため明示停止
  pkill -KILL -f "browser_use.skill_cli.daemon" 2>/dev/null || true
  pkill -KILL -f "user-data-dir=.*ms-playwright/mcp-chrome" 2>/dev/null || true
  # named Chrome profile は一時 user-data-dir へ複製される。孤立プロセスと複製を残さない。
  pkill -KILL -f "browser-use-user-data-dir-" 2>/dev/null || true
  find "${TMPDIR:-/tmp}" -maxdepth 1 -type d -name 'browser-use-user-data-dir-*' \
    -exec rm -rf -- {} + 2>/dev/null || true
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
browser-use --headed --profile "$PROFILE" close >/dev/null 2>&1 || true

# publish-note / hashtag updater と同じ実機照合。API の current_user 形状に依存しない。
browser-use --headed --profile "$PROFILE" open "https://note.com/settings/account" >/dev/null
sleep 3
browser-use --headed --profile "$PROFILE" eval "JSON.stringify({ok:/note ID\\s*stats47\\b/.test(document.body.innerText)})" > "$ACCOUNT_STATE" 2>&1
if ! grep -q '"ok":true' "$ACCOUNT_STATE"; then
  echo "[fetch-note-metrics] ERROR: Profile 5 のnote IDを stats47 と照合できません"
  exit 4
fi
echo "[fetch-note-metrics] account assert OK: stats47"

browser-use --headed --profile "$PROFILE" open "https://note.com/sitesettings/stats" >/dev/null
sleep 3

# ログイン状態チェック
PATHNAME=$(browser-use --headed --profile "$PROFILE" eval "location.pathname" 2>&1 | grep "^result:" | sed "s/^result: '//;s/'$//")
if [[ "$PATHNAME" == "/login" || "$PATHNAME" == *"/login" ]]; then
  echo "[fetch-note-metrics] ERROR: not logged in (redirected to /login)"
  echo "[fetch-note-metrics] Manual action: open Chrome Profile 5 and log in to note.com/stats47"
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

# アカウント・カタログ照合後にだけ保存する。別アカウントの値を正典へ混入させない。
node --input-type=module - "$RAW" "$OUTPUT" "$ROOT/.claude/state/note-published-urls.json" <<'NODEEOF'
import { readFileSync, renameSync, writeFileSync } from 'node:fs';

const [rawPath, outputPath, catalogPath] = process.argv.slice(2);
const data = JSON.parse(readFileSync(rawPath, 'utf8'));
const articles = Array.isArray(data.articles) ? data.articles : [];
if (articles.length === 0) throw new Error('dashboard から記事を1件も取得できませんでした');

const foreign = articles.filter((article) => !/^https:\/\/note\.com\/stats47\/n\/n[0-9a-f]+$/i.test(article.url || ''));
if (foreign.length > 0) {
  throw new Error(`stats47 以外の記事を検出: ${foreign.slice(0, 3).map((article) => article.url).join(', ')}`);
}

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')).articles || {};
const catalogNoteIds = new Set(Object.values(catalog).map((article) => article.url?.split('/n/')[1]).filter(Boolean));
const unknown = articles.filter((article) => !catalogNoteIds.has(article.noteId));
if (unknown.length > 0) {
  throw new Error(`catalog 未登録の記事を検出: ${unknown.slice(0, 3).map((article) => article.url).join(', ')}`);
}

data.account = 'stats47';
data.period_label = '月 (直近 30 日)';
data.source = 'note.com/sitesettings/stats';
data.catalog_match_count = articles.length;
data.totals = {
  articles: articles.length,
  views: articles.reduce((sum, article) => sum + article.views, 0),
  comments: articles.reduce((sum, article) => sum + article.comments, 0),
  likes: articles.reduce((sum, article) => sum + article.likes, 0),
};

const temporaryPath = `${outputPath}.tmp`;
writeFileSync(temporaryPath, `${JSON.stringify(data, null, 2)}\n`);
renameSync(temporaryPath, outputPath);
console.log(`[fetch-note-metrics] saved ${data.totals.articles} articles`);
console.log(`[fetch-note-metrics] totals: views=${data.totals.views} likes=${data.totals.likes} comments=${data.totals.comments}`);
console.log(`[fetch-note-metrics] → ${outputPath}`);
NODEEOF
