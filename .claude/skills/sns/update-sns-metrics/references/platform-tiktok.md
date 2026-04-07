# TikTok メトリクス取得手順

> このファイルは `update-sns-metrics` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

TikTok プロフィールページ（`https://www.tiktok.com/@stats47jp`）からメトリクスを取得する。

**2段階取得方式:**
1. **プロフィールグリッド**: views のみ（`<strong>` 要素に再生数）。全動画を高速にスキャン可能
2. **個別動画ページ**: likes/comments/shares を追加取得。確認済み `data-e2e` セレクタ: `like-count`, `comment-count`, `share-count`, `browse-video-desc`

TikTok Studio（`/tiktokstudio/content`）は DOM 構造が不安定なためフォールバックとして残す。

### TT-1. ブラウザを開く

```bash
browser-use --headed --profile 'Profile 5' close 2>/dev/null
sleep 1
browser-use --headed --profile 'Profile 5' open "https://www.tiktok.com/@stats47jp"
sleep 5
```

### TT-2. プロフィールグリッドから動画リンク + views を収集

```bash
cat > /tmp/tt-collect.js << 'JSEOF'
var items = document.querySelectorAll('[data-e2e="user-post-item"], [class*="DivItemContainer"]');
var results = [];
items.forEach(function(item) {
  var a = item.querySelector('a[href*="/video/"]');
  var strong = item.querySelector('strong');
  if (a) {
    var href = a.href;
    var views = 0;
    if (strong) {
      var txt = strong.textContent.trim().replace(/,/g, '');
      if (/^\d+(\.\d+)?[KMB]?$/.test(txt)) {
        if (txt.endsWith('K')) views = Math.round(parseFloat(txt) * 1000);
        else if (txt.endsWith('M')) views = Math.round(parseFloat(txt) * 1000000);
        else if (txt.endsWith('B')) views = Math.round(parseFloat(txt) * 1000000000);
        else views = parseInt(txt);
      }
    }
    results.push({ url: href, views: views });
  }
});
JSON.stringify(results)
JSEOF

echo "[]" > /tmp/tt-videos.json
PREV_COUNT=0
NO_NEW=0

for i in $(seq 1 30); do
  browser-use --headed --profile 'Profile 5' eval "$(cat /tmp/tt-collect.js)" 2>&1 > /tmp/tt-raw-$i.txt

  COUNT=$(node -e "
    const fs = require('fs');
    const existing = JSON.parse(fs.readFileSync('/tmp/tt-videos.json','utf8'));
    const urls = new Set(existing.map(v => v.url));
    try {
      const raw = fs.readFileSync('/tmp/tt-raw-$i.txt','utf8').replace(/^result: /,'');
      const vids = JSON.parse(raw);
      for (const v of vids) {
        if (!urls.has(v.url)) { existing.push(v); urls.add(v.url); }
      }
      fs.writeFileSync('/tmp/tt-videos.json', JSON.stringify(existing));
      console.log(existing.length);
    } catch(e) { console.log(existing.length); }
  ")

  echo "Scroll $i: videos=$COUNT"

  if [ "$COUNT" = "$PREV_COUNT" ]; then
    NO_NEW=$((NO_NEW + 1))
    if [ "$NO_NEW" -ge 3 ]; then
      echo "No new videos for 3 scrolls, done"
      break
    fi
  else
    NO_NEW=0
  fi
  PREV_COUNT=$COUNT

  browser-use --headed --profile 'Profile 5' eval 'window.scrollBy(0, 1500);"ok"' 2>&1 > /dev/null
  sleep 3
done

rm -f /tmp/tt-raw-*.txt /tmp/tt-collect.js
echo "=== Collected ==="
node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/tt-videos.json','utf8')).length + ' videos')"
```

### TT-2b. 個別動画ページから likes/comments/shares + description を取得

プロフィールグリッドでは views のみ取得できる。DB にマッチした動画に対して、個別ページから詳細メトリクスを取得する。

```bash
cat > /tmp/tt-detail-extract.js << 'JSEOF'
var likes = document.querySelector('[data-e2e="like-count"]');
var comments = document.querySelector('[data-e2e="comment-count"]');
var shares = document.querySelector('[data-e2e="share-count"]');
var desc = document.querySelector('[data-e2e="browse-video-desc"]');
JSON.stringify({
  likes: likes ? likes.textContent.trim() : '0',
  comments: comments ? comments.textContent.trim() : '0',
  shares: shares ? shares.textContent.trim() : '0',
  desc: desc ? desc.textContent.trim().slice(0, 300) : ''
})
JSEOF
```

各マッチ済み動画に対して個別ページを開く（TT-3 の DB マッチング後に実行。件数が多い場合は views のみで記録し、詳細取得はスキップ可能）:

```bash
# マッチ済み URL リストが /tmp/tt-matched-urls.txt にある場合
while IFS= read -r VIDEO_URL; do
  browser-use --headed --profile 'Profile 5' open "$VIDEO_URL" 2>&1 > /dev/null
  sleep 4
  browser-use --headed --profile 'Profile 5' eval "$(cat /tmp/tt-detail-extract.js)" 2>&1 > /tmp/tt-detail-raw.txt
  # Parse and update DB (see TT-3 script)
done < /tmp/tt-matched-urls.txt
```

**注意**: 個別動画ページ取得は時間がかかる（1動画4-5秒）。50件超の場合は views のみで記録し、次回以降に詳細取得することを推奨。

### TT-2c. フォールバック: TikTok Studio

プロフィールページで取得できない場合は TikTok Studio を使用する:

```bash
browser-use --headed --profile 'Profile 5' open "https://www.tiktok.com/tiktokstudio/content"
sleep 5
```

`state` コマンドでテーブル構造を確認し、セレクタを調整する。

```bash
STATE=$(browser-use --headed --profile 'Profile 5' state 2>&1)
echo "$STATE" > /tmp/tt-state.txt
```

**注意**: TikTok Studio の DOM 構造は頻繁に変わる。`state` の出力を見て、実際のセレクタに合わせて抽出 JS を調整すること。

### TT-3. DB マッチング + メトリクス記録

プロフィールグリッドから収集した動画データ（views のみ）を DB にマッチングする。マッチした動画 URL を `/tmp/tt-matched-urls.txt` に書き出し、TT-2b で詳細取得する。

```bash
cat > /tmp/tt-match-db.js << JSEOF
const Database = require("${PROJECT_ROOT}/node_modules/better-sqlite3");
const fs = require("fs");
const DB_PATH = "${PROJECT_ROOT}/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const db = new Database(DB_PATH);

let videos;
try {
  videos = JSON.parse(fs.readFileSync("/tmp/tt-videos.json", "utf8"));
} catch(e) {
  console.log("Failed to parse TikTok data.");
  process.exit(1);
}

const posts = db.prepare("SELECT id, content_key, caption, domain, post_type, post_url FROM sns_posts WHERE platform = ?").all("tiktok");
const rankings = db.prepare("SELECT ranking_key, ranking_name FROM ranking_items").all();

const fetchedAt = new Date().toISOString();
const insMetric = db.prepare("INSERT OR REPLACE INTO sns_metrics (sns_post_id, views, likes, comments, shares, fetched_at) VALUES (?, ?, ?, ?, ?, ?)");
const updCache = db.prepare("UPDATE sns_posts SET impressions=?, likes=?, replies=?, metrics_updated_at=? WHERE id=?");
const updUrl = db.prepare("UPDATE sns_posts SET post_url=? WHERE id=? AND (post_url IS NULL OR post_url = '')");
const updCaption = db.prepare("UPDATE sns_posts SET caption=? WHERE id=? AND (caption IS NULL OR caption = '')");

let matched = 0, urlUp = 0, capUp = 0, unmatched = 0;
const matchedUrls = [];

const tx = db.transaction(() => {
  for (const v of videos) {
    let post = null;

    // Strategy 1: post_url の videoId で完全一致
    const vidM = v.url.match(/\/video\/(\d+)/);
    if (vidM) {
      post = posts.find(p => p.post_url && p.post_url.includes(vidM[1]));
    }

    // Strategy 2: caption prefix 先頭80文字（backfill 後に有効化）
    if (!post) {
      post = posts.find(p => p.caption && p.caption.length > 10 &&
        (v.desc ? v.desc.startsWith(p.caption.slice(0, 80)) : false));
    }

    // Strategy 3: ranking_name in description
    if (!post && v.desc) {
      for (const r of rankings) {
        if (v.desc.includes(r.ranking_name)) {
          post = posts.find(p => p.content_key === r.ranking_key);
          break;
        }
      }
    }

    if (!post) { unmatched++; continue; }
    matched++;

    // プロフィールグリッドからは views のみ。likes/comments/shares は個別ページから取得
    const views = v.views || 0;
    const likes = v.likes || 0;
    const comments = v.comments || 0;
    const shares = v.shares || 0;

    if (v.url) {
      const r = updUrl.run(v.url, post.id);
      if (r.changes > 0) urlUp++;
      matchedUrls.push(v.url);
    }

    // description から caption を自動 backfill（NULL の場合のみ）
    if (v.desc && v.desc.length > 10) {
      const cr = updCaption.run(v.desc, post.id);
      if (cr.changes > 0) capUp++;
    }

    insMetric.run(post.id, views, likes, comments, shares, fetchedAt);
    updCache.run(views, likes, comments, fetchedAt, post.id);
  }
});
tx();

// マッチした URL を書き出し（TT-2b 個別詳細取得用）
fs.writeFileSync("/tmp/tt-matched-urls.txt", matchedUrls.join("\n"));

console.log("Matched: " + matched + ", URLs updated: " + urlUp + ", Captions backfilled: " + capUp + ", Unmatched: " + unmatched);
console.log("Matched URLs written to /tmp/tt-matched-urls.txt (" + matchedUrls.length + " URLs)");
console.log("sns_metrics rows: " + db.prepare("SELECT COUNT(*) as c FROM sns_metrics").get().c);
db.close();
JSEOF

node /tmp/tt-match-db.js
```

### TT-4. ブラウザを閉じる

```bash
browser-use --headed --profile 'Profile 5' close 2>/dev/null
rm -f /tmp/tt-videos.json /tmp/tt-state.txt /tmp/tt-collect.js /tmp/tt-detail-extract.js /tmp/tt-detail-raw.txt /tmp/tt-matched-urls.txt /tmp/tt-match-db.js
```
