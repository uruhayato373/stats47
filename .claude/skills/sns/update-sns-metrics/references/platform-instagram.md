# Instagram メトリクス取得手順

> このファイルは `update-sns-metrics` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

**2つの取得方式がある。** セッション状態に応じて使い分ける。

### 方式A: Meta Business Suite（推奨）

`https://business.facebook.com/latest/insights/content` で投稿一覧 + メトリクスを一括取得できる。
IG プロフィールページのセッションが切れている場合はこちらを使う。

1. `browser-use --headed --profile 'Profile 5' open "https://business.facebook.com/latest/insights/content"`
2. `state` コマンドで DOM を確認し、投稿一覧テーブルからメトリクスを抽出
3. DOM 構造は変わりやすいので、`state` 出力を見て JS を都度調整する

### 方式B: プロフィールグリッド + OG description

プロフィールグリッドから投稿リンクを収集し、各投稿の OG description から likes/comments を抽出する。

**注意:** プロフィールグリッドの `a[href*="/p/"]` はスクロール先でおすすめ投稿（他アカウント）も拾う。`a[href*="/stats47jp/"]` で自アカウントに限定するか、`/reel/` も含めて取得すること。

**マッチング優先順位（IG 固有）:**
1. `post_url` の shortcode で完全一致
2. ranking_name in OG description/title
3. caption prefix 先頭80文字（backfill 後に有効化）

**OG description のフォーマット（実測値）:**
- 英語: `"<date>、<N> likes, <N> comments - <username>: \"<caption>\""`
- 日本語: `"「いいね！」<N>件、コメント<N>件 - <username>のInstagramの写真: \"<caption>\""`
- likes の数値はカンマ区切りの場合あり（例: `1,234 likes`）
- likes が 0 の投稿は OG description に likes 記述がないことがある

**メトリクス収集時に OG description のキャプション部分から caption を自動 backfill する。**

### IG-1. ブラウザを開く

```bash
browser-use --headed --profile 'Profile 5' close 2>/dev/null
sleep 1
browser-use --headed --profile 'Profile 5' open "https://www.instagram.com/stats47jp/"
sleep 5
```

### IG-2. 投稿リンクを収集

プロフィールグリッドをスクロールしながら投稿リンクを収集する。

**重要:** `a[href*="/p/"]` だけではおすすめ投稿（他アカウント）を拾う。リール（`/reel/`）も含め、`stats47jp` の投稿のみをフィルタする。

```bash
cat > /tmp/ig-collect.js << 'JSEOF'
var links = document.querySelectorAll('a[href*="/stats47jp/p/"], a[href*="/stats47jp/reel/"]');
var urls = [];
links.forEach(function(a) {
  var h = a.href;
  var m = h.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  if (m && urls.indexOf(m[1]) === -1) urls.push(m[1]);
});
if (urls.length === 0) {
  var allLinks = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
  allLinks.forEach(function(a) {
    var h = a.href;
    if (h.includes('stats47jp')) {
      var m = h.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
      if (m && urls.indexOf(m[1]) === -1) urls.push(m[1]);
    }
  });
}
JSON.stringify(urls)
JSEOF

echo "[]" > /tmp/ig-shortcodes.json
PREV_COUNT=0
NO_NEW=0

for i in $(seq 1 30); do
  browser-use --headed --profile 'Profile 5' eval "$(cat /tmp/ig-collect.js)" 2>&1 > /tmp/ig-raw-$i.txt

  COUNT=$(node -e "
    const fs = require('fs');
    const existing = JSON.parse(fs.readFileSync('/tmp/ig-shortcodes.json','utf8'));
    const s = new Set(existing);
    try {
      const raw = fs.readFileSync('/tmp/ig-raw-$i.txt','utf8').replace(/^result: /,'');
      const codes = JSON.parse(raw);
      for (const c of codes) { if (!s.has(c)) { existing.push(c); s.add(c); } }
      fs.writeFileSync('/tmp/ig-shortcodes.json', JSON.stringify(existing));
      console.log(existing.length);
    } catch(e) { console.log(existing.length); }
  ")

  echo "Scroll $i: shortcodes=$COUNT"

  if [ "$COUNT" = "$PREV_COUNT" ]; then
    NO_NEW=$((NO_NEW + 1))
    if [ "$NO_NEW" -ge 3 ]; then
      echo "No new posts for 3 scrolls, done"
      break
    fi
  else
    NO_NEW=0
  fi
  PREV_COUNT=$COUNT

  browser-use --headed --profile 'Profile 5' eval 'window.scrollBy(0, 1500);"ok"' 2>&1 > /dev/null
  sleep 3
done

rm -f /tmp/ig-raw-*.txt /tmp/ig-collect.js
echo "=== Collected ==="
node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/ig-shortcodes.json','utf8')).length + ' shortcodes')"
```

### IG-3. 各投稿の OG description から likes/comments を取得

各投稿ページを開いて OG description から数値を抽出する。

```bash
cat > /tmp/ig-fetch-og.js << 'JSEOF'
const fs = require('fs');
const shortcodes = JSON.parse(fs.readFileSync('/tmp/ig-shortcodes.json', 'utf8'));
const results = [];

// OG description をフェッチする関数を生成
// 各shortcodeに対して https://www.instagram.com/p/<shortcode>/ の OG を取得
for (const sc of shortcodes) {
  results.push({ shortcode: sc, url: 'https://www.instagram.com/p/' + sc + '/' });
}
fs.writeFileSync('/tmp/ig-urls.json', JSON.stringify(results));
console.log(results.length + ' URLs to fetch');
JSEOF

node /tmp/ig-fetch-og.js
```

各投稿を browser-use で開いて OG description を取得する:

```bash
cat > /tmp/ig-extract-og.js << 'JSEOF'
var meta = document.querySelector('meta[property="og:description"]');
var title = document.querySelector('meta[property="og:title"]');
JSON.stringify({
  desc: meta ? meta.content : '',
  title: title ? title.content : ''
})
JSEOF

echo "[]" > /tmp/ig-metrics.json

URLS=$(node -e "const d=JSON.parse(require('fs').readFileSync('/tmp/ig-urls.json','utf8'));d.forEach(u=>console.log(u.shortcode+'|'+u.url))")

echo "$URLS" | while IFS='|' read -r SC URL; do
  browser-use --headed --profile 'Profile 5' open "$URL" 2>&1 > /dev/null
  sleep 3
  browser-use --headed --profile 'Profile 5' eval "$(cat /tmp/ig-extract-og.js)" 2>&1 > /tmp/ig-og-raw.txt

  node -e "
    const fs = require('fs');
    const existing = JSON.parse(fs.readFileSync('/tmp/ig-metrics.json','utf8'));
    try {
      const raw = fs.readFileSync('/tmp/ig-og-raw.txt','utf8').replace(/^result: /,'');
      const og = JSON.parse(raw);
      // OG description format examples:
      //   English: '2026-03-15、1,234 likes, 56 comments - stats47jp: \"caption text\"'
      //   Japanese: '「いいね！」1,234件、コメント56件 - stats47jpのInstagramの写真: \"caption text\"'
      //   No likes: '0 likes, 3 comments - stats47jp: \"caption text\"'
      let likes = 0, comments = 0, caption = '';
      const mLikes = og.desc.match(/([\\d,]+)\\s*likes?/i) || og.desc.match(/「いいね！」([\\d,]+)件/);
      const mComments = og.desc.match(/([\\d,]+)\\s*comments?/i) || og.desc.match(/コメント([\\d,]+)件/);
      if (mLikes) likes = parseInt(mLikes[1].replace(/,/g, ''));
      if (mComments) comments = parseInt(mComments[1].replace(/,/g, ''));
      // Extract caption from OG description (after last colon + quote)
      const capM = og.desc.match(/:\\s*[\"\\u201c](.+?)[\"\\u201d]\\s*$/);
      if (capM) caption = capM[1].trim();
      existing.push({ shortcode: '$SC', likes, comments, desc: og.desc.slice(0, 300), title: og.title, caption });
      fs.writeFileSync('/tmp/ig-metrics.json', JSON.stringify(existing));
      console.log('$SC: likes=' + likes + ' comments=' + comments + ' cap=' + caption.slice(0,40));
    } catch(e) { console.log('$SC: parse error'); }
  "
done

rm -f /tmp/ig-og-raw.txt /tmp/ig-extract-og.js
echo "=== Fetched ==="
node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/ig-metrics.json','utf8')).length + ' posts with metrics')"
```

### IG-4. DB マッチング + メトリクス記録

```bash
cat > /tmp/ig-match-db.js << JSEOF
const Database = require("${PROJECT_ROOT}/node_modules/better-sqlite3");
const fs = require("fs");
const DB_PATH = "${PROJECT_ROOT}/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const db = new Database(DB_PATH);

const metrics = JSON.parse(fs.readFileSync("/tmp/ig-metrics.json", "utf8"));
const posts = db.prepare("SELECT id, content_key, caption, domain, post_type, post_url FROM sns_posts WHERE platform = ?").all("instagram");
const rankings = db.prepare("SELECT ranking_key, ranking_name FROM ranking_items").all();

const fetchedAt = new Date().toISOString();
const insMetric = db.prepare("INSERT OR REPLACE INTO sns_metrics (sns_post_id, likes, comments, fetched_at) VALUES (?, ?, ?, ?)");
const updCache = db.prepare("UPDATE sns_posts SET likes=?, replies=?, metrics_updated_at=? WHERE id=?");
const updUrl = db.prepare("UPDATE sns_posts SET post_url=? WHERE id=? AND (post_url IS NULL OR post_url = '')");
const updCaption = db.prepare("UPDATE sns_posts SET caption=? WHERE id=? AND (caption IS NULL OR caption = '')");

let matched = 0, urlUp = 0, capUp = 0, unmatched = 0;
const tx = db.transaction(() => {
  for (const m of metrics) {
    let post = null;
    const igUrl = "https://www.instagram.com/p/" + m.shortcode + "/";

    // Strategy 1: post_url の shortcode で完全一致
    post = posts.find(p => p.post_url && p.post_url.includes(m.shortcode));

    // Strategy 2: ranking_name in OG description/title（stats47 URL は IG に存在しない）
    if (!post) {
      for (const r of rankings) {
        if ((m.desc && m.desc.includes(r.ranking_name)) || (m.title && m.title.includes(r.ranking_name))) {
          post = posts.find(p => p.content_key === r.ranking_key);
          break;
        }
      }
    }

    // Strategy 3: caption prefix 先頭80文字（backfill 後に有効化）
    if (!post && m.caption && m.caption.length > 10) {
      const prefix = m.caption.slice(0, 80);
      post = posts.find(p => p.caption && p.caption.startsWith(prefix));
    }

    if (!post) { unmatched++; continue; }
    matched++;
    const r = updUrl.run(igUrl, post.id);
    if (r.changes > 0) urlUp++;

    // OG description から抽出した caption で自動 backfill（NULL の場合のみ）
    if (m.caption && m.caption.length > 10) {
      const cr = updCaption.run(m.caption, post.id);
      if (cr.changes > 0) capUp++;
    }

    insMetric.run(post.id, m.likes, m.comments, fetchedAt);
    updCache.run(m.likes, m.comments, fetchedAt, post.id);
  }
});
tx();

console.log("Matched: " + matched + ", URLs updated: " + urlUp + ", Captions backfilled: " + capUp + ", Unmatched: " + unmatched);
console.log("sns_metrics rows: " + db.prepare("SELECT COUNT(*) as c FROM sns_metrics").get().c);
db.close();
JSEOF

node /tmp/ig-match-db.js
```

### IG-5. ブラウザを閉じる

```bash
browser-use --headed --profile 'Profile 5' close 2>/dev/null
rm -f /tmp/ig-shortcodes.json /tmp/ig-urls.json /tmp/ig-metrics.json /tmp/ig-match-db.js
```
