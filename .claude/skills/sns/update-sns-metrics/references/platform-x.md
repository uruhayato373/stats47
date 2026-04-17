# X (Twitter) メトリクス取得手順

> このファイルは `update-sns-metrics` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

タイムラインスクロール + `article[role=article]` の `aria-label` から一括抽出する。

**マッチング注意点:**
- 古いツイート（自動投稿導入以前の手動投稿）は stats47 URL を含まないものが多い → ranking_name 部分一致のみでマッチ（精度低い）
- caption backfill 後は caption prefix 先頭80文字マッチが有効化され、カバレッジが大幅に改善する
- メトリクス収集時にツイートテキストを取得するので、caption が NULL のレコードはここで自動 backfill する

### X-1. ブラウザを開く

```bash
browser-use --headed --profile 'Profile 5' close 2>/dev/null
sleep 1
browser-use --headed --profile 'Profile 5' open "https://x.com/stats47jp373"
sleep 5
```

### X-2. JS 抽出コードをファイルに書き出す

```bash
cat > /tmp/x-extract.js << 'JSEOF'
var a=document.querySelectorAll('article[role=article]');var r=[];a.forEach(function(x){var t=x.querySelector('[data-testid="tweetText"]');var g=x.querySelector('[role=group]');var ls=[].slice.call(x.querySelectorAll('a[href*="/status/"]'));var s=ls.find(function(l){return l.href.indexOf('/stats47jp373/status/')>-1});if(!s)return;r.push({t:t?t.textContent.trim().slice(0,300):'',e:g?g.getAttribute('aria-label'):'',u:s.href})});JSON.stringify(r)
JSEOF
```

### X-3. スクロールしながら全ツイートを収集

```bash
echo "[]" > /tmp/x-tweets-all.json
PREV_COUNT=0
NO_NEW=0

for i in $(seq 1 60); do
  browser-use --headed --profile 'Profile 5' eval "$(cat /tmp/x-extract.js)" 2>&1 > /tmp/x-raw-$i.txt

  COUNT=$(node -e "
    const fs = require('fs');
    const existing = JSON.parse(fs.readFileSync('/tmp/x-tweets-all.json','utf8'));
    const urls = new Set(existing.map(t => t.u));
    try {
      const raw = fs.readFileSync('/tmp/x-raw-$i.txt','utf8');
      const jsonStr = raw.replace(/^result: /,'');
      const newTweets = JSON.parse(jsonStr);
      for (const tw of newTweets) {
        if (!urls.has(tw.u)) { existing.push(tw); urls.add(tw.u); }
      }
      fs.writeFileSync('/tmp/x-tweets-all.json', JSON.stringify(existing));
      console.log(existing.length);
    } catch(e) { console.log(existing.length); }
  ")

  echo "Scroll $i: total=$COUNT"

  if [ "$COUNT" = "$PREV_COUNT" ]; then
    NO_NEW=$((NO_NEW + 1))
    if [ "$NO_NEW" -ge 4 ]; then
      echo "No new tweets for 4 scrolls, done"
      break
    fi
  else
    NO_NEW=0
  fi
  PREV_COUNT=$COUNT

  browser-use --headed --profile 'Profile 5' eval 'window.scrollBy(0, 2000);"ok"' 2>&1 > /dev/null
  sleep 3
done

rm -f /tmp/x-raw-*.txt /tmp/x-extract.js
echo "=== Collected ==="
node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/x-tweets-all.json','utf8')).length + ' tweets')"
```

### X-4. DB マッチング + メトリクス記録

Node.js スクリプトをファイルに書き出して実行する。

```bash
cat > /tmp/x-match-db.js << JSEOF
const Database = require("${PROJECT_ROOT}/node_modules/better-sqlite3");
const fs = require("fs");
const DB_PATH = "${PROJECT_ROOT}/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const db = new Database(DB_PATH);

const tweets = JSON.parse(fs.readFileSync("/tmp/x-tweets-all.json", "utf8"));
const posts = db.prepare("SELECT id, content_key, caption, domain, post_type, post_url FROM sns_posts WHERE platform = ?").all("x");
const rankings = db.prepare("SELECT ranking_key, ranking_name FROM ranking_items").all();

function parseEng(label) {
  const m = { impressions: 0, replies: 0, reposts: 0, likes: 0, bookmarks: 0 };
  const re = [
    [/(\d+)\s*件の返信/, "replies"],
    [/(\d+)\s*件のリポスト/, "reposts"],
    [/(\d+)\s*件のいいね/, "likes"],
    [/(\d+)\s*件のブックマーク/, "bookmarks"],
    [/(\d+)\s*件の表示/, "impressions"],
  ];
  for (const [r, k] of re) { const m2 = label.match(r); if (m2) m[k] = parseInt(m2[1]); }
  return m;
}

// 時系列履歴は .claude/ 配下のファイルに蓄積（CLAUDE.md §記録先の統一原則）
const snsStore = require("${PROJECT_ROOT}/.claude/scripts/lib/sns-metrics-store.cjs");

const fetchedAt = new Date().toISOString();
// sns_posts のキャッシュカラムは運用データとして D1 に残す
const updCache = db.prepare("UPDATE sns_posts SET impressions=?, likes=?, reposts=?, replies=?, bookmarks=?, metrics_updated_at=? WHERE id=?");
const updUrl = db.prepare("UPDATE sns_posts SET post_url=? WHERE id=? AND (post_url IS NULL OR post_url = '')");
const updCaption = db.prepare("UPDATE sns_posts SET caption=? WHERE id=? AND (caption IS NULL OR caption = '')");

let matched = 0, urlUp = 0, capUp = 0, unmatched = 0;
const tx = db.transaction(() => {
  for (const tw of tweets) {
    let post = null;

    // Strategy 1: post_url の tweetId で完全一致
    const statusM = tw.u.match(/\/status\/(\d+)/);
    if (statusM) {
      post = posts.find(p => p.post_url && p.post_url.includes(statusM[1]));
    }

    // Strategy 2: stats47.jp URL in tweet text → content_key
    if (!post) {
      const urlM = tw.t.match(/stats47\.jp\/ranking\/([a-z0-9_-]+)/);
      if (urlM) {
        post = posts.find(p => p.content_key === urlM[1]);
      }
    }

    // Strategy 3: caption prefix 先頭80文字
    if (!post && tw.t.length > 20) {
      const prefix = tw.t.slice(0, 80);
      post = posts.find(p => p.caption && p.caption.startsWith(prefix));
    }

    // Strategy 4: ranking_name in tweet text
    if (!post && tw.t.length > 10) {
      for (const r of rankings) {
        if (tw.t.includes(r.ranking_name)) {
          post = posts.find(p => p.content_key === r.ranking_key);
          break;
        }
      }
    }

    if (!post) { unmatched++; continue; }
    matched++;
    const eng = parseEng(tw.e);
    const r = updUrl.run(tw.u, post.id);
    if (r.changes > 0) urlUp++;

    // ツイートテキストから caption を自動 backfill（NULL の場合のみ）
    if (tw.t.length > 10) {
      const cr = updCaption.run(tw.t, post.id);
      if (cr.changes > 0) capUp++;
    }

    // X は likes / replies / reposts / bookmarks を計測。comments=replies, shares=reposts, saves=bookmarks にマップ
    snsStore.upsertMetric({
      sns_post_id: post.id,
      platform: "x",
      domain: post.domain,
      content_key: post.content_key,
      fetched_at: fetchedAt,
      impressions: eng.impressions,
      likes: eng.likes,
      comments: eng.replies,
      shares: eng.reposts,
      saves: eng.bookmarks,
    });
    updCache.run(eng.impressions, eng.likes, eng.reposts, eng.replies, eng.bookmarks, fetchedAt, post.id);
  }
});
tx();

console.log("Matched: " + matched + ", URLs updated: " + urlUp + ", Captions backfilled: " + capUp + ", Unmatched: " + unmatched);
console.log("sns-metrics snapshot rows: " + snsStore.countAll());
db.close();
JSEOF

node /tmp/x-match-db.js
```

### X-5. ブラウザを閉じる

```bash
browser-use --headed --profile 'Profile 5' close 2>/dev/null
rm -f /tmp/x-tweets-all.json /tmp/x-match-db.js
```
