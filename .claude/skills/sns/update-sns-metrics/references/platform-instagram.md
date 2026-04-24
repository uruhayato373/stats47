# Instagram メトリクス取得手順（Graph API 版）

> このファイルは `update-sns-metrics` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

**Instagram Graph API（Instagram Login 新フロー）で純 API 実装**。browser-use スクレイピングは廃止。API が使えない場合の fallback もなし（トークン切れ等は例外として処理）。

## 前提

- `.env.local` に以下:
  - `INSTAGRAM_ACCESS_TOKEN` — 長期トークン（60 日有効）
  - `INSTAGRAM_BUSINESS_ACCOUNT_ID` — IG User ID
- 権限: `instagram_business_manage_insights`, `instagram_business_basic` が有効
- Graph API ベース URL: `https://graph.instagram.com/v21.0/`

## API で取得できるメトリクス

browser-use 時代の `likes` / `comments` に加えて以下も取れる:

| メトリクス | 説明 | エンドポイント |
|---|---|---|
| `like_count` | いいね数 | `/media?fields=like_count` |
| `comments_count` | コメント数 | `/media?fields=comments_count` |
| `reach` | リーチ（ユニーク） | `/{media-id}/insights?metric=reach` |
| `views` | 閲覧数（VIDEO/REELS） | `/{media-id}/insights?metric=views` |
| `saves` | 保存数 | `/{media-id}/insights?metric=saves` |
| `shares` | シェア数 | `/{media-id}/insights?metric=shares` |
| `total_interactions` | 総インタラクション | `/{media-id}/insights?metric=total_interactions` |

## 手順

### IG-1. API 到達確認

```bash
set -a; source .env.local; set +a
curl -s "https://graph.instagram.com/v21.0/me?access_token=${INSTAGRAM_ACCESS_TOKEN}" | python3 -m json.tool
```

`{"id": "...", "username": "stats47jp", ...}` が返れば疎通 OK。トークン切れの場合は以下で延長:

```bash
curl -s "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${INSTAGRAM_ACCESS_TOKEN}"
```

### IG-2. media 一覧取得（ページネーション対応）

```bash
cat > /tmp/ig-fetch-media.cjs << 'JSEOF'
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
if (!TOKEN || !IG_USER_ID) { console.error("env missing"); process.exit(1); }

async function fetchAll() {
  const all = [];
  let url = `https://graph.instagram.com/v21.0/${IG_USER_ID}/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count&limit=100&access_token=${TOKEN}`;
  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) { console.error("API Error:", data.error.message); process.exit(1); }
    all.push(...(data.data || []));
    url = data.paging?.next ?? null;
  }
  return all;
}

fetchAll().then((media) => {
  fs.writeFileSync("/tmp/ig-media.json", JSON.stringify(media, null, 2));
  console.log(`Fetched ${media.length} media`);
});
JSEOF

node /tmp/ig-fetch-media.cjs
```

### IG-3. 各 media の insights 取得

`like_count` / `comments_count` は `/media` の list で取れているので、insights から `reach` / `views` / `saves` / `shares` を追加取得する。**過去 24 時間以内の投稿は insights が未確定なので NULL 許容**。

```bash
cat > /tmp/ig-fetch-insights.cjs << 'JSEOF'
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const media = JSON.parse(fs.readFileSync("/tmp/ig-media.json", "utf8"));

// media_product_type 別に利用可能なメトリクスが異なる
const METRICS_BY_TYPE = {
  FEED: "reach,saves,shares,total_interactions",
  REELS: "reach,views,saves,shares,total_interactions",
  STORY: "reach,replies",
  AD: "reach,saves,shares",
};

async function fetchOne(m) {
  const metrics = METRICS_BY_TYPE[m.media_product_type] ?? "reach,saves,shares";
  const url = `https://graph.instagram.com/v21.0/${m.id}/insights?metric=${metrics}&access_token=${TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
    // 取得不可（24h 未満 or 権限外）は空で返す
    return { id: m.id, error: data.error.message };
  }
  const out = { id: m.id };
  for (const item of data.data || []) {
    const v = item.values?.[0]?.value ?? 0;
    out[item.name] = typeof v === "number" ? v : 0;
  }
  return out;
}

(async () => {
  const results = [];
  for (let i = 0; i < media.length; i++) {
    const r = await fetchOne(media[i]);
    results.push(r);
    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${media.length} insights fetched`);
    // レート制限対策: 200 req/h なので 200ms 間隔で余裕を持つ
    await new Promise((r) => setTimeout(r, 200));
  }
  fs.writeFileSync("/tmp/ig-insights.json", JSON.stringify(results, null, 2));
  console.log(`Fetched insights for ${results.length} media`);
})();
JSEOF

node /tmp/ig-fetch-insights.cjs
```

### IG-4. DB マッチング + メトリクス記録

media の `permalink` から shortcode を抽出して `sns_posts.post_url` とマッチング。未マッチは `caption` 先頭一致 or `ranking_name` 含有でフォールバック。

```bash
cat > /tmp/ig-match-db.cjs << 'JSEOF'
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const PROJECT_ROOT = process.cwd();
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const db = new Database(DB_PATH);

const media = JSON.parse(fs.readFileSync("/tmp/ig-media.json", "utf8"));
const insights = JSON.parse(fs.readFileSync("/tmp/ig-insights.json", "utf8"));
const insightsById = Object.fromEntries(insights.map((i) => [i.id, i]));

const posts = db
  .prepare("SELECT id, content_key, caption, domain, post_type, post_url FROM sns_posts WHERE platform = ?")
  .all("instagram");
const rankings = db.prepare("SELECT ranking_key, ranking_name FROM ranking_items").all();

const snsStore = require(path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-metrics-store.cjs"));
const fetchedAt = new Date().toISOString();

// sns_posts のキャッシュ列マッピング（IG のメトリクス → 既存カラム）:
//   likes       ← like_count
//   replies     ← comments_count（X と同じ「返信」枠を流用）
//   bookmarks   ← saves（保存数）
//   reposts     ← shares（シェア数）
//   impressions ← reach（ユニーク到達数。IG には厳密な impressions はないので reach で代用）
const updCache = db.prepare(
  "UPDATE sns_posts SET likes=?, replies=?, bookmarks=?, reposts=?, impressions=?, metrics_updated_at=? WHERE id=?"
);
const updUrl = db.prepare("UPDATE sns_posts SET post_url=? WHERE id=? AND (post_url IS NULL OR post_url = '')");
const updCaption = db.prepare(
  "UPDATE sns_posts SET caption=? WHERE id=? AND (caption IS NULL OR caption = '')"
);

function shortcodeFromPermalink(url) {
  const m = url?.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

let matched = 0, urlUp = 0, capUp = 0, unmatched = 0;
const tx = db.transaction(() => {
  for (const m of media) {
    const sc = shortcodeFromPermalink(m.permalink);
    const ins = insightsById[m.id] ?? {};

    let post = null;

    // Strategy 1: post_url の shortcode 完全一致
    if (sc) post = posts.find((p) => p.post_url && p.post_url.includes(sc));

    // Strategy 2: ranking_name を caption に含む
    if (!post && m.caption) {
      for (const r of rankings) {
        if (r.ranking_name && m.caption.includes(r.ranking_name)) {
          post = posts.find((p) => p.content_key === r.ranking_key);
          if (post) break;
        }
      }
    }

    // Strategy 3: caption 先頭 80 字一致
    if (!post && m.caption && m.caption.length > 10) {
      const prefix = m.caption.slice(0, 80);
      post = posts.find((p) => p.caption && p.caption.startsWith(prefix));
    }

    if (!post) {
      unmatched++;
      continue;
    }
    matched++;

    if (sc) {
      const r = updUrl.run(m.permalink, post.id);
      if (r.changes > 0) urlUp++;
    }
    if (m.caption && m.caption.length > 10) {
      const cr = updCaption.run(m.caption, post.id);
      if (cr.changes > 0) capUp++;
    }

    snsStore.upsertMetric({
      sns_post_id: post.id,
      platform: "instagram",
      domain: post.domain,
      content_key: post.content_key,
      fetched_at: fetchedAt,
      likes: m.like_count ?? 0,
      comments: m.comments_count ?? 0,
      reach: ins.reach ?? null,
      views: ins.views ?? null,
      saves: ins.saves ?? null,
      shares: ins.shares ?? null,
    });

    updCache.run(
      m.like_count ?? 0,
      m.comments_count ?? 0,
      ins.saves ?? null,
      ins.shares ?? null,
      ins.reach ?? null,
      fetchedAt,
      post.id
    );
  }
});
tx();

console.log(
  `Matched: ${matched}, URLs updated: ${urlUp}, Captions backfilled: ${capUp}, Unmatched: ${unmatched}`
);
console.log(`sns-metrics snapshot rows: ${snsStore.countAll()}`);
db.close();
JSEOF

node /tmp/ig-match-db.cjs
```

### IG-5. クリーンアップ

```bash
rm -f /tmp/ig-media.json /tmp/ig-insights.json /tmp/ig-fetch-media.cjs /tmp/ig-fetch-insights.cjs /tmp/ig-match-db.cjs
```

## 制約

- **新フローでは `business_discovery` が使えない**。他アカウントの閲覧不可。自 `stats47jp` のみ取得対象
- **過去 24 時間未満の投稿は insights が未確定**。reach / views が 0 や未取得になることがある
- **トークン期限 60 日**。失効時は `refresh_access_token` で延長
- **`media_product_type` 別に利用可能メトリクスが異なる**。STORY は reach / replies のみ、FEED に views はない等
- **レート制限**: 200 req / 1h / user。media 150 件程度なら 1 回の取得で収まる

## マッチング優先順位（IG 固有）

1. `permalink` の shortcode → `post_url` 完全一致（最も確実）
2. `ranking_name` が caption に含まれる（`/post-instagram` で生成した caption は ranking_name を含む）
3. caption 先頭 80 字完全一致（caption backfill 後に有効）

## sns-metrics-store.cjs の使用

時系列履歴は `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` に蓄積される（CLAUDE.md §記録先の統一原則に従い `.claude/` 配下）。sns_posts のキャッシュ列（likes / replies / reach / views / metrics_updated_at）は D1 の運用データとして別途 UPDATE。
