---
name: indexing-api-submit
description: Google Indexing API に URL_DELETED / URL_UPDATED を能動送信して GSC の再クロールを加速する。Use when user says "Indexing API", "再クロール要請", "410 URL 削除通知", "GSC index 削除". 410 化済み URL を URL_DELETED で一括通知、新規公開 URL を URL_UPDATED で通知。
---

Google Indexing API に URL 状態変更通知を能動送信するスキル。410 Gone 化した URL を `URL_DELETED` で通知すれば、Google の再クロール（通常 1-2 週間）を数日に短縮できる。

## 用途

- `/blog/tags/*`, `/dashboard/*`, `/ranking/{未知}`, `/stats/*` 等の 410 化済み URL をまとめて削除通知
- GSC drilldown CSV（`snapshots/YYYY-Www/drilldowns/404-urls.csv` 等）を一括処理
- `[T0-DECAY-01]` 収束観測と連動して効果測定

## 引数

```
$ARGUMENTS — [mode] [args...]
             mode:
               - delete <url> [url2] [...]              : 指定 URL を URL_DELETED で送信
               - update <url> [url2] [...]              : 指定 URL を URL_UPDATED で送信
               - batch-from-csv <csv> <type>            : CSV の 1 列目から URL 抽出、type で送信
               - batch-from-drilldown <category> [N]    : W17 drilldown の category-urls.csv から先頭 N 件（デフォルト 180）を URL_DELETED
               - status <url>                           : URL の最新通知状態を取得 (getMetadata)
               - quota                                  : 当日の送信済み件数を ログから集計
```

## 前提

- サービスアカウント鍵: リポジトリルートの `stats47-f6b5dae19196.json` or `stats47-31b18ee67144.json`
- サービスアカウント: 鍵ファイル内の `client_email` を参照（例: `ststs47-mac@stats47.iam.gserviceaccount.com`）
- **サービスアカウントが GSC プロパティ `sc-domain:stats47.jp` の「オーナー」として登録されていること**
  - 設定場所: Search Console → Settings → Users and permissions → Add user → サービスアカウントの email を Owner で追加
  - GSC の他の権限ユーザーとは別に、**オーナー権限必須**（Indexing API の仕様）
- Google Cloud Console で Indexing API を有効化（APIs & Services → Library → `Indexing API` → Enable）
- 日次クォータ: **200 URL/day/project**（超過時は quota エラー）
- npm パッケージ: `googleapis`（インストール済み）

## 初回セットアップ（サービスアカウント追加）

GSC の owner 権限がまだ付いていない場合:

1. `stats47-f6b5dae19196.json` の `client_email` を確認
   ```bash
   cat stats47-f6b5dae19196.json | grep client_email
   ```
2. Google Search Console (https://search.google.com/search-console) で `sc-domain:stats47.jp` を開く
3. **Settings** → **Users and permissions** → **Add user**
4. Email: 上記 `client_email` を貼り付け
5. Permission: **Owner**（重要：Owner 以外では Indexing API が 403 を返す）
6. **Add**

**確認**: スキルを `status <任意の既知 URL>` で呼ぶ。403 が返れば権限不足、200 が返れば設定 OK。

## 手順

### Step 1: 認証・クライアント初期化

```javascript
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const KEY_FILE = KEY_CANDIDATES.map(f => path.resolve(f)).find(f => fs.existsSync(f));
if (!KEY_FILE) throw new Error('サービスアカウント鍵が見つかりません');

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/indexing'],
});

const indexing = google.indexing({ version: 'v3', auth });
```

### Step 2: 各 mode の処理

#### mode = delete / update

```javascript
// 単一または複数 URL を URL_DELETED or URL_UPDATED で送信
async function submit(urls, notificationType) {
  const results = [];
  for (const url of urls) {
    try {
      const res = await indexing.urlNotifications.publish({
        requestBody: { url, type: notificationType }, // 'URL_UPDATED' or 'URL_DELETED'
      });
      results.push({ url, type: notificationType, ok: true, notifyTime: res.data.urlNotificationMetadata?.latestUpdate?.notifyTime });
    } catch (e) {
      results.push({ url, type: notificationType, ok: false, error: e.message, code: e.code });
    }
  }
  return results;
}
```

#### mode = batch-from-csv

```javascript
// CSV 1 列目から URL を抽出（ヘッダー行はスキップ）
const csvLines = fs.readFileSync(csvPath, 'utf-8').split('\n');
const urls = csvLines.slice(1)
  .map(line => line.split(',')[0].replace(/^"|"$/g, '').trim())
  .filter(url => url.startsWith('https://stats47.jp'))
  .slice(0, 180); // 日次 200 の余裕を 20 件残す
// type は引数 'URL_DELETED' or 'URL_UPDATED'
```

#### mode = batch-from-drilldown

GSC drilldown 用のショートカット:

```javascript
// category: 404 / soft-404 / crawled-not-indexed など
const weekDir = path.resolve('.claude/skills/analytics/gsc-improvement/reference/snapshots');
// 最新週を取得
const latestWeek = fs.readdirSync(weekDir).filter(d => /^\d{4}-W\d{2}$/.test(d)).sort().pop();
const csvPath = path.join(weekDir, latestWeek, 'drilldowns', `${category}-urls.csv`);
// あとは batch-from-csv と同じ、type は 'URL_DELETED' 固定
```

#### mode = status

```javascript
async function status(url) {
  const res = await indexing.urlNotifications.getMetadata({ url });
  return res.data;
  // { latestUpdate: { url, type, notifyTime }, latestRemove: {...} }
}
```

#### mode = quota

```javascript
// 当日の JSONL ログから集計
const today = new Date().toISOString().slice(0, 10);
const logPath = path.resolve(`.claude/skills/analytics/indexing-api-submit/reference/indexing-api-log/${today}.jsonl`);
if (!fs.existsSync(logPath)) return { submitted: 0, remaining: 200 };
const lines = fs.readFileSync(logPath, 'utf-8').split('\n').filter(Boolean);
return { submitted: lines.length, remaining: 200 - lines.length };
```

### Step 3: ログ記録（全 mode 共通）

送信ごとに `reference/indexing-api-log/YYYY-MM-DD.jsonl` に append:

```javascript
function appendLog(entry) {
  const today = new Date().toISOString().slice(0, 10);
  const logPath = path.resolve(`.claude/skills/analytics/indexing-api-submit/reference/indexing-api-log/${today}.jsonl`);
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, JSON.stringify({
    ts: new Date().toISOString(),
    ...entry,
  }) + '\n');
}
```

entry 例:
```json
{"ts":"2026-04-21T13:00:00.000Z","url":"https://stats47.jp/blog/tags/foo","type":"URL_DELETED","ok":true,"notifyTime":"2026-04-21T13:00:01Z"}
```

### Step 4: 報告

以下を stdout に出力:

```
[indexing-api] mode=batch-from-drilldown category=404
[indexing-api] processed: 180 URL (limit 180)
[indexing-api] ok: 178 / failed: 2
[indexing-api] failed URLs:
  - https://stats47.jp/foo → 429 (quota exceeded)
  - https://stats47.jp/bar → 403 (permission)
[indexing-api] today quota: 178/200 used, 22 remaining
[indexing-api] log: .claude/skills/analytics/indexing-api-submit/reference/indexing-api-log/2026-04-21.jsonl
```

## 共通ルール

- **日次クォータ 200 を超えない**。超過時は quota エラー (429) → 翌日に再実行
- **URL_DELETED は「完全削除」のシグナル**。noindex でインデックスに残したい URL には使わない
- **URL_UPDATED は「再クロール促進」**。新規公開や更新時に使う（同じ URL を複数回送っても追加クォータを食うだけで害はないが、意味もない）
- **ログは append-only**。過去ログは編集しない
- **batch-from-drilldown は safelist**: 404-urls, 5xx-urls, soft-404-urls, crawled-not-indexed-urls, redirect-urls のみ（alt-canonical / noindex / robots-blocked は正常扱いなので対象外）
- **失敗時の再試行**: 5xx エラーは最大 3 回まで指数バックオフ（1s, 2s, 4s）。4xx は再試行しない
- **収束観測との連動**: `[T0-DECAY-01]` Issue に週次コメントで「今週の送信件数」を記録

## よく使うパターン

```bash
# 直近 drilldown の 404 上位 180 件を一括削除通知
/indexing-api-submit batch-from-drilldown 404

# 5xx も同じく通知
/indexing-api-submit batch-from-drilldown 5xx

# 特定 URL のみテスト送信
/indexing-api-submit delete https://stats47.jp/blog/tags/平均体重

# 新規公開記事の再クロール促進
/indexing-api-submit update https://stats47.jp/blog/new-article-slug

# 当日の使用量確認
/indexing-api-submit quota

# 最新状態確認
/indexing-api-submit status https://stats47.jp/blog/tags/平均体重
```

## 運用戦略（404 5,919 件の収束計画）

| 週 | 送信対象 | 件数 | 累計 | 期待効果 |
|---|---|---|---|---|
| W17 (初回) | 404 の上位 180 | 180 | 180 | -3% |
| W18 | 404 の次 180 + soft-404 20 | 180 | 360 | -6% |
| W19 | 404 残り 180 + 5xx 180 | 360 | 720 | -12% |
| W20-W24 | 残余全て + 自然収束分 | 180 × 7 | 約 1,980 | -40% 以上 |

自然クロールで減る分と合わせて W24 時点で -80% を目標。

## 関連スキル

- `/gsc-improvement` — 観測ログ（本スキルの送信結果を `[T0-DECAY-01]` で計測）
- `/fetch-gsc-data` — drilldown CSV の元データ取得
- `/knowledge` — 運用上の学びを記録

## API レート制限

- Indexing API: **200 URL/day/project**（ハード制限）
- `urlNotifications.getMetadata`: 600/minute（status mode）
- 429 (RESOURCE_EXHAUSTED) 検出時は翌日送信、送信済み件数はログで冪等性を確保

## 参照

- [Indexing API v3](https://developers.google.com/search/apis/indexing-api/v3/using-api)
- [Indexing API Quickstart](https://developers.google.com/search/apis/indexing-api/v3/quickstart)
- メソッド: `indexing.urlNotifications.publish` with `type: URL_DELETED` or `URL_UPDATED`
- サービスアカウント認証: `https://www.googleapis.com/auth/indexing` スコープ
