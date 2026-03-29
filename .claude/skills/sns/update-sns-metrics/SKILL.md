---
description: browser-use CLI (X/IG/TT) + YouTube API でメトリクスを一括取得し D1 に記録する
argument-hint: [--platform x|instagram|youtube|tiktok|all]
disable-model-invocation: true
---

各 SNS プラットフォームからメトリクスを取得し D1 に記録する。X/Instagram/TikTok は browser-use CLI、YouTube は Data API v3 を使用する。

### 期待カバレッジ

| 状態 | マッチ率 | 理由 |
|---|---|---|
| caption NULL 多数（初期状態） | 20-40% | post_url + ranking_name のみでマッチ |
| Phase 0 caption backfill 実行後 | 70-90% | caption prefix 80文字前方一致が有効化 |

**caption backfill は必ず Phase 0 で先に実行すること。** マッチ率が大幅に改善する。

## 引数

```
/update-sns-metrics [--platform x|instagram|youtube|tiktok|all] [--skip-backfill]
```

- `--platform`（任意）: 取得対象（デフォルト: `all`）
- `--skip-backfill`（任意）: Phase 0 caption backfill をスキップ

## 定数

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
DB_PATH=".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
```

**重要ルール:**
- `browser-use` コマンドは毎回フルで記述する（`$BU` 変数展開しない。zsh が解釈に失敗する）
- JS はファイルに書き出してから `eval "$(cat /tmp/xxx.js)"` で渡す。インラインの複雑な JS はクォート問題で壊れる
- Node.js スクリプトも `/tmp/*.js` にファイル書き出してから `node /tmp/xxx.js` で実行する

## マッチング優先順位（全プラットフォーム共通）

1. `post_url` の videoId / tweetId / shortcode で完全一致
2. stats47.jp URL in text → `content_key` で照合
3. caption prefix 先頭80文字で前方一致
4. ranking_name in text（部分一致）

## 全体フロー

```
0. Phase 0: Caption Backfill（ローカル R2 の caption.txt → DB に一括反映）
1. プラットフォーム別にメトリクスを取得（順次処理）
2. DB マッチング + INSERT/UPDATE（マッチしたら即座に記録。途中停止に強い）
3. 結果報告
```

**各プラットフォームを順に処理する。** 1 プラットフォーム完了ごとにブラウザを閉じ、次を開く。

---

## Phase 0: Caption Backfill

**メトリクス収集の前に必ず実行する。** caption NULL のレコードに対して、ローカル R2 の caption.txt からキャプションを一括投入する。これにより「caption prefix 先頭80文字」マッチが有効化され、マッチ率が 20-40% → 70-90% に改善する。

`--skip-backfill` 指定時はスキップ。

```bash
cat > /tmp/caption-backfill.js << 'JSEOF'
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const DB_PATH = ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const db = new Database(DB_PATH);

// caption が NULL のレコードを取得
const nullCaptions = db.prepare(
  "SELECT id, platform, content_key, domain, post_type FROM sns_posts WHERE caption IS NULL OR caption = ''"
).all();
console.log("Caption NULL records: " + nullCaptions.length);

const updCaption = db.prepare("UPDATE sns_posts SET caption = ? WHERE id = ?");
let filled = 0;

const tx = db.transaction(() => {
  for (const row of nullCaptions) {
    // platform → ディレクトリ名のマッピング
    const platformDir = row.platform === "youtube" && row.post_type === "short"
      ? "youtube-short" : row.platform;

    // caption.txt のパス候補
    const candidates = [
      path.join(".local/r2/sns", row.domain, row.content_key, platformDir, "caption.txt"),
      path.join(".local/r2/sns", row.domain, row.content_key, platformDir, "shorts.txt"),
    ];

    for (const capPath of candidates) {
      if (fs.existsSync(capPath)) {
        const caption = fs.readFileSync(capPath, "utf8").trim();
        if (caption.length > 0) {
          updCaption.run(caption, row.id);
          filled++;
          break;
        }
      }
    }
  }
});
tx();

console.log("Backfilled: " + filled + " / " + nullCaptions.length);

// 更新後の充足率を表示
const capStats = db.prepare(
  "SELECT platform, COUNT(*) as total, SUM(CASE WHEN caption IS NOT NULL AND caption != '' THEN 1 ELSE 0 END) as with_cap FROM sns_posts GROUP BY platform"
).all();
console.log("\n=== Caption 充足率（backfill 後） ===");
for (const r of capStats) console.log(r.platform + ": " + r.with_cap + "/" + r.total);

db.close();
JSEOF

node /tmp/caption-backfill.js
rm -f /tmp/caption-backfill.js
```

---

## X (Twitter)

タイムラインスクロール + `article[role=article]` の `aria-label` から一括抽出する。

**マッチング注意点:**
- 古いツイート（browser-publisher 以前の手動投稿）は stats47 URL を含まないものが多い → ranking_name 部分一致のみでマッチ（精度低い）
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
cat > /tmp/x-match-db.js << 'JSEOF'
const Database = require("better-sqlite3");
const fs = require("fs");
const DB_PATH = ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
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

const fetchedAt = new Date().toISOString();
const insMetric = db.prepare("INSERT OR REPLACE INTO sns_metrics (sns_post_id, impressions, likes, comments, shares, saves, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
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

    insMetric.run(post.id, eng.impressions, eng.likes, eng.replies, eng.reposts, eng.bookmarks, fetchedAt);
    updCache.run(eng.impressions, eng.likes, eng.reposts, eng.replies, eng.bookmarks, fetchedAt, post.id);
  }
});
tx();

console.log("Matched: " + matched + ", URLs updated: " + urlUp + ", Captions backfilled: " + capUp + ", Unmatched: " + unmatched);
console.log("sns_metrics rows: " + db.prepare("SELECT COUNT(*) as c FROM sns_metrics").get().c);
db.close();
JSEOF

node /tmp/x-match-db.js
```

### X-5. ブラウザを閉じる

```bash
browser-use --headed --profile 'Profile 5' close 2>/dev/null
rm -f /tmp/x-tweets-all.json /tmp/x-match-db.js
```

---

## Instagram

プロフィールグリッドから投稿リンクを収集し、各投稿の OG description から likes/comments を抽出する。IG キャプションには stats47 URL がない（IG はリンク不可）ため、ranking_name でのマッチングに頼る。

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

```bash
cat > /tmp/ig-collect.js << 'JSEOF'
var links = document.querySelectorAll('a[href*="/p/"]');
var urls = [];
links.forEach(function(a) {
  var h = a.href;
  if (h.includes('/stats47jp/') || h.includes('/p/')) {
    var m = h.match(/\/p\/([A-Za-z0-9_-]+)/);
    if (m && urls.indexOf(m[1]) === -1) urls.push(m[1]);
  }
});
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
cat > /tmp/ig-match-db.js << 'JSEOF'
const Database = require("better-sqlite3");
const fs = require("fs");
const DB_PATH = ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
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

---

## YouTube

**API ベース（browser-use 不要）。** YouTube Data API v3 で全動画のメトリクスを効率的に取得する。`search.list` + `videos.list(statistics)` で views/likes/comments を一括取得。サービスアカウント認証で安定動作。

### YT-1. API で全動画メトリクスを取得 + DB マッチング

```bash
cat > /tmp/yt-metrics.js << 'JSEOF'
const { google } = require('googleapis');
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_PATH = ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const CHANNEL_ID = "UCdRiwDSX1aUd0dSd7Cs08Kg";
const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const keyFile = KEY_CANDIDATES.map(f => path.resolve(f)).find(f => fs.existsSync(f));
if (!keyFile) throw new Error('サービスアカウント鍵が見つかりません: ' + KEY_CANDIDATES.join(' / '));

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
  });
  const youtube = google.youtube({ version: 'v3', auth });

  // 1. Search API で動画ID一覧を取得（50件ずつページネーション）
  let allItems = [];
  let nextPageToken = undefined;
  do {
    const search = await youtube.search.list({
      channelId: CHANNEL_ID,
      part: 'snippet',
      order: 'date',
      maxResults: 50,
      type: 'video',
      pageToken: nextPageToken,
    });
    allItems = allItems.concat(search.data.items);
    nextPageToken = search.data.nextPageToken;
  } while (nextPageToken);
  console.log("Total videos found: " + allItems.length);

  // 2. Videos API で統計を取得（50件ずつバッチ）
  const allVideos = [];
  for (let i = 0; i < allItems.length; i += 50) {
    const ids = allItems.slice(i, i + 50).map(v => v.id.videoId).join(',');
    const videos = await youtube.videos.list({
      id: ids,
      part: 'snippet,statistics',
    });
    allVideos.push(...videos.data.items);
  }

  // 3. DB マッチング + 記録
  const db = new Database(DB_PATH);
  const posts = db.prepare("SELECT id, content_key, caption, domain, post_type, post_url FROM sns_posts WHERE platform = ?").all("youtube");
  const rankings = db.prepare("SELECT ranking_key, ranking_name FROM ranking_items").all();

  const fetchedAt = new Date().toISOString();
  const insMetric = db.prepare("INSERT OR REPLACE INTO sns_metrics (sns_post_id, views, likes, comments, fetched_at) VALUES (?, ?, ?, ?, ?)");
  const updCache = db.prepare("UPDATE sns_posts SET impressions=?, likes=?, replies=?, metrics_updated_at=? WHERE id=?");
  const updUrl = db.prepare("UPDATE sns_posts SET post_url=? WHERE id=? AND (post_url IS NULL OR post_url = '')");
  const updCaption = db.prepare("UPDATE sns_posts SET caption=? WHERE id=? AND (caption IS NULL OR caption = '')");

  let matched = 0, urlUp = 0, capUp = 0, unmatched = 0;
  const tx = db.transaction(() => {
    for (const v of allVideos) {
      const videoId = v.id;
      const title = v.snippet.title;
      const views = parseInt(v.statistics.viewCount || '0');
      const likes = parseInt(v.statistics.likeCount || '0');
      const comments = parseInt(v.statistics.commentCount || '0');
      const ytUrl = "https://www.youtube.com/watch?v=" + videoId;

      let post = null;

      // Strategy 1: post_url の videoId で完全一致
      post = posts.find(p => p.post_url && p.post_url.includes(videoId));

      // Strategy 2: ranking_name in title
      if (!post) {
        for (const r of rankings) {
          if (title.includes(r.ranking_name)) {
            // youtube にはショートと通常動画がある。content_key + post_type で絞る
            post = posts.find(p => p.content_key === r.ranking_key);
            break;
          }
        }
      }

      // Strategy 3: caption prefix 先頭80文字
      if (!post && title.length > 5) {
        post = posts.find(p => p.caption && p.caption.startsWith(title.slice(0, 80)));
      }

      if (!post) { unmatched++; continue; }
      matched++;
      const r = updUrl.run(ytUrl, post.id);
      if (r.changes > 0) urlUp++;

      // YouTube タイトルから caption を自動 backfill（NULL の場合のみ）
      if (title.length > 5) {
        const cr = updCaption.run(title, post.id);
        if (cr.changes > 0) capUp++;
      }

      insMetric.run(post.id, views, likes, comments, fetchedAt);
      updCache.run(views, likes, comments, fetchedAt, post.id);
    }
  });
  tx();

  console.log("Matched: " + matched + ", URLs updated: " + urlUp + ", Captions backfilled: " + capUp + ", Unmatched: " + unmatched);
  console.log("sns_metrics rows: " + db.prepare("SELECT COUNT(*) as c FROM sns_metrics").get().c);
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
JSEOF

node /tmp/yt-metrics.js
rm -f /tmp/yt-metrics.js
```

---

## TikTok

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
cat > /tmp/tt-match-db.js << 'JSEOF'
const Database = require("better-sqlite3");
const fs = require("fs");
const DB_PATH = ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
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

---

## 結果報告

処理完了後、以下のクエリで結果を出力:

```bash
cat > /tmp/sns-report.js << 'JSEOF'
const Database = require("better-sqlite3");
const DB_PATH = ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const db = new Database(DB_PATH);

console.log("\n=== プラットフォーム別更新件数（直近1時間） ===");
const updated = db.prepare("SELECT platform, COUNT(*) as cnt FROM sns_posts WHERE metrics_updated_at >= datetime('now', '-1 hour') GROUP BY platform").all();
for (const r of updated) console.log(r.platform + ": " + r.cnt);

console.log("\n=== sns_metrics 総件数 ===");
console.log(db.prepare("SELECT COUNT(*) as c FROM sns_metrics").get().c);

console.log("\n=== post_url 充足率 ===");
const urlStats = db.prepare("SELECT platform, COUNT(*) as total, SUM(CASE WHEN post_url IS NOT NULL AND post_url != '' THEN 1 ELSE 0 END) as with_url FROM sns_posts GROUP BY platform").all();
for (const r of urlStats) console.log(r.platform + ": " + r.with_url + "/" + r.total);

console.log("\n=== caption 充足率 ===");
const capStats = db.prepare("SELECT platform, COUNT(*) as total, SUM(CASE WHEN caption IS NOT NULL AND caption != '' THEN 1 ELSE 0 END) as with_cap FROM sns_posts GROUP BY platform").all();
for (const r of capStats) console.log(r.platform + ": " + r.with_cap + "/" + r.total);

db.close();
JSEOF

node /tmp/sns-report.js
rm -f /tmp/sns-report.js
```

| 項目 | 内容 |
|---|---|
| プラットフォーム別更新件数 | 上記クエリ結果 |
| sns_metrics 総件数 | 累計行数 |
| post_url 充足率 | プラットフォーム別 |
| caption 充足率 | プラットフォーム別 |
| マッチ失敗 | 件数（各プラットフォームの実行ログ参照） |

## 参照

- `packages/database/src/schema/sns_metrics.ts` — sns_metrics テーブル定義
- `packages/database/src/schema/sns_posts.ts` — sns_posts テーブル定義
- `.claude/skills/analytics/fetch-youtube-data/SKILL.md` — YouTube API パターンの原典
- `.claude/skills/sns/find-quote-rt/SKILL.md` — X タイムライン DOM 抽出パターンの原典
- `.claude/agents/browser-publisher.md` — browser-use 共通設定・プロファイル情報
