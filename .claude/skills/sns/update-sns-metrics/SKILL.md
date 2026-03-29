---
description: browser-use CLI で各 SNS のメトリクスを一括取得し D1 に記録する
argument-hint: [--platform x|instagram|youtube|tiktok|all]
disable-model-invocation: true
---

browser-use CLI でプロフィール／管理画面のタイムラインをスクロールし、投稿ごとのメトリクスを DOM から一括抽出して D1 に記録する。

## 引数

```
/update-sns-metrics [--platform x|instagram|youtube|tiktok|all]
```

- `--platform`（任意）: 取得対象（デフォルト: `all`）

## 定数

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
BU_PROFILE="Profile 5"
DB_PATH=".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
```

**重要**: `browser-use` コマンドは毎回フルパスで呼ぶ。`BU=` 変数に代入して `$BU` で呼ぶと zsh が解釈に失敗する。

## 全体フロー

```
1. ブラウザを開く
2. タイムラインをスクロールしてツイート/投稿を DOM から一括抽出 → /tmp/sns-extract.json
3. Node.js で DB マッチング + メトリクス INSERT + post_url 更新
4. ブラウザを閉じる
5. 結果報告
```

**各プラットフォームを順に処理する。** 1 プラットフォーム完了ごとにブラウザを閉じ、次を開く。

---

## X (Twitter)

### X-1. ブラウザを開く

```bash
browser-use --headed --profile "$BU_PROFILE" close 2>/dev/null
sleep 1
browser-use --headed --profile "$BU_PROFILE" open "https://x.com/stats47jp373"
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
  JS=$(cat /tmp/x-extract.js)
  browser-use --headed --profile "$BU_PROFILE" eval "$JS" 2>&1 > /tmp/x-raw-$i.txt

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

  browser-use --headed --profile "$BU_PROFILE" eval 'window.scrollBy(0, 2000);"ok"' 2>&1 > /dev/null
  sleep 3
done

rm -f /tmp/x-raw-*.txt /tmp/x-extract.js
echo "=== Collected ==="
node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/x-tweets-all.json','utf8')).length + ' tweets')"
```

### X-4. DB マッチング + メトリクス記録

```bash
node -e '
const Database = require("better-sqlite3");
const fs = require("fs");
const db = new Database("DB_PATH_HERE");

const tweets = JSON.parse(fs.readFileSync("/tmp/x-tweets-all.json", "utf8"));
const posts = db.prepare("SELECT id, content_key, caption, domain, post_type FROM sns_posts WHERE platform = ?").all("x");

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
const updUrl = db.prepare("UPDATE sns_posts SET post_url=? WHERE id=? AND (post_url IS NULL OR post_url = \"\")");

let matched = 0, urlUp = 0, unmatched = 0;
const tx = db.transaction(() => {
  for (const tw of tweets) {
    // Strategy 1: stats47.jp URL in tweet text
    const urlM = tw.t.match(/stats47\.jp\/ranking\/([a-z0-9_-]+)/);
    let post = null;
    if (urlM) {
      post = posts.find(p => p.content_key === urlM[1]);
    }
    // Strategy 2: caption prefix match (first 80 chars)
    if (!post && tw.t.length > 20) {
      const prefix = tw.t.slice(0, 80);
      post = posts.find(p => p.caption && p.caption.startsWith(prefix));
    }
    if (!post) { unmatched++; continue; }
    matched++;
    const eng = parseEng(tw.e);
    const r = updUrl.run(tw.u, post.id);
    if (r.changes > 0) urlUp++;
    insMetric.run(post.id, eng.impressions, eng.likes, eng.replies, eng.reposts, eng.bookmarks, fetchedAt);
    updCache.run(eng.impressions, eng.likes, eng.reposts, eng.replies, eng.bookmarks, fetchedAt, post.id);
  }
});
tx();

console.log("Matched: " + matched + ", URLs updated: " + urlUp + ", Unmatched: " + unmatched);
console.log("sns_metrics rows: " + db.prepare("SELECT COUNT(*) as c FROM sns_metrics").get().c);
db.close();
'
```

**注意**: `DB_PATH_HERE` を実際のパス（`$DB_PATH` の値）に置換してから実行する。

### X-5. ブラウザを閉じる

```bash
browser-use --headed --profile "$BU_PROFILE" close 2>/dev/null
rm -f /tmp/x-tweets-all.json
```

---

## Instagram

### IG-1. ブラウザを開く

```bash
browser-use --headed --profile "$BU_PROFILE" open "https://www.instagram.com/stats47jp/"
sleep 5
```

### IG-2. 投稿グリッドから各投稿をクリックしてインサイトを読み取る

Instagram はタイムライン形式ではなくグリッド表示。各投稿をクリック → 「インサイトを見る」で取得。

1. `browser-use --headed --profile "$BU_PROFILE" state` でグリッドのリンク一覧を取得
2. 各投���リンク（`/p/<shortcode>/`）をクリック
3. モーダルで `browser-use --headed --profile "$BU_PROFILE" state` → いいね・コメント数を読み取る
4. 「インサイトを見る」ボタンがあればクリック → reach, impressions, shares, saves を取得
5. DB に記録

**マッチング**: Instagram の投稿 URL `/p/<shortcode>/` と `sns_posts.post_url` で照合。post_url が空の場合はキャプションテキスト照合。

### IG-3. DB 記録

X-4 と同じパターン。platform を `instagram` に変更し、メトリクスのマッピングを調整:
- reach → `sns_metrics.reach`
- views (Reels) → `sns_metrics.views`

---

## YouTube

### YT-1. YouTube Studio を開く

```bash
browser-use --headed --profile "$BU_PROFILE" open "https://studio.youtube.com"
sleep 5
```

### YT-2. コンテンツ一覧から動画メトリクスを取得

1. 「コンテンツ」タブに遷移（`state` でナビゲーション要素を確認）
2. 動画一覧テーブルから各動画の表示回数・いいね・コメント数を読み取る
3. 動画タイトルと `sns_posts.caption` を照合

### YT-3. DB 記録

```sql
INSERT OR REPLACE INTO sns_metrics (sns_post_id, views, likes, comments, fetched_at) VALUES (?, ?, ?, ?, ?);
UPDATE sns_posts SET impressions=<views>, likes=?, replies=<comments>, metrics_updated_at=? WHERE id=?;
```

---

## TikTok

### TT-1. TikTok Studio を開く

```bash
browser-use --headed --profile "$BU_PROFILE" open "https://www.tiktok.com/tiktokstudio/content"
sleep 5
```

### TT-2. コンテンツ一覧からメトリクスを取得

1. `state` でコンテンツテーブルの構造を確認
2. 各動画の views, likes, comments, shares を読み取る
3. 動画タイトル / キャプションで `sns_posts` を照合

### TT-3. DB 記録

X-4 と同じパターン。platform を `tiktok` に変更。

---

## 結果報告

処理完了後、以下のテーブルを出力:

```sql
SELECT platform, COUNT(*) as updated
FROM sns_posts
WHERE metrics_updated_at >= date('now', '-1 hour')
GROUP BY platform;

SELECT COUNT(*) as total_metrics FROM sns_metrics;
```

| 項目 | 内容 |
|---|---|
| プラットフォーム別更新件数 | 上記クエリ結果 |
| sns_metrics 総件数 | 累計行数 |
| post_url 新規設定件数 | 今回 URL を埋めた件数 |
| マッチ失敗 | 件数とスキップ理由（URL なし / キャプション不一致） |

## 参照

- `packages/database/src/schema/sns_metrics.ts` — テーブル定義
- `packages/database/src/schema/sns_posts.ts` — テーブル定義
- `.claude/skills/sns/find-quote-rt/SKILL.md` — X タイムライン DOM 抽出パターンの原典
- `.claude/agents/browser-publisher.md` — browser-use 共通設定・プロファイル情報
