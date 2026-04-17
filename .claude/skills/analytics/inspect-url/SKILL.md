---
name: inspect-url
description: Google Search Console の URL Inspection API で URL のインデックス状態を取得する。Use when user says "URL Inspection", "インデックス状態", "inspect-url". 特定 URL が登録済みか・なぜ未登録かを API で確認.
disable-model-invocation: true
argument-hint: <url>
---

Google Search Console `urlInspection.index.inspect` API を叩いて特定 URL のインデックス状態を取得する。

## 用途

- Fix 7/8 / GONE_*_KEYS 追加後、特定 URL が 410 で認識されているか確認
- 「クロール済み - インデックス未登録」の URL が実際どのステータスか診断
- 新規公開記事 / ランキングが Google に認識されているか確認
- GSC UI の「URL 検査」機能を自動化

## 前提

- サービスアカウント鍵: `stats47-f6b5dae19196.json`
- サイト: `sc-domain:stats47.jp`
- npm パッケージ: `googleapis`
- API 制限: **日次 2,000 URL / 分次 600 URL**（Google 側クォータ）

## 引数

```
/inspect-url <url>
```

- `<url>`（必須）: 完全 URL（例: `https://stats47.jp/ranking/healthy-life-expectancy-male`）

## 手順

### Step 1: パッケージ確認

```bash
node -e "require('googleapis')" 2>/dev/null && echo OK || npm install -D googleapis
```

### Step 2: URL を検査

```bash
node -e "$(cat <<'JS'
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const KEY_FILE = KEY_CANDIDATES.map(f => path.resolve(process.cwd(), f)).find(f => fs.existsSync(f));
if (!KEY_FILE) throw new Error('サービスアカウント鍵が見つかりません');
const SITE_URL = 'sc-domain:stats47.jp';
const TARGET = process.argv[1];
if (!TARGET) throw new Error('URL 引数が必須: /inspect-url <url>');

(async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const { data } = await searchconsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: TARGET,
      siteUrl: SITE_URL,
    },
  });

  const result = data.inspectionResult;
  const index = result.indexStatusResult;
  console.log('=== URL Inspection: ' + TARGET + ' ===');
  console.log('inspectionResultLink: ' + result.inspectionResultLink);
  console.log('');
  console.log('[Index Status]');
  console.log('  verdict: ' + index.verdict);                  // PASS / PARTIAL / FAIL / NEUTRAL
  console.log('  coverageState: ' + index.coverageState);      // インデックス登録状況（人間可読）
  console.log('  robotsTxtState: ' + index.robotsTxtState);
  console.log('  indexingState: ' + index.indexingState);
  console.log('  lastCrawlTime: ' + index.lastCrawlTime);
  console.log('  pageFetchState: ' + index.pageFetchState);
  console.log('  googleCanonical: ' + index.googleCanonical);
  console.log('  userCanonical: ' + index.userCanonical);
  if (index.sitemap && index.sitemap.length) console.log('  sitemap: ' + index.sitemap.join(', '));
  if (index.referringUrls && index.referringUrls.length) console.log('  referringUrls count: ' + index.referringUrls.length);
  if (index.crawledAs) console.log('  crawledAs: ' + index.crawledAs);

  // モバイル / AMP / リッチリザルト
  if (result.mobileUsabilityResult) console.log('mobile verdict: ' + result.mobileUsabilityResult.verdict);
  if (result.richResultsResult) console.log('richResults verdict: ' + result.richResultsResult.verdict);
})().catch(e => { console.error(e.message || e); process.exit(1); });
JS
)" "$1"
```

### Step 3: 結果の読み方

| verdict | 意味 |
|---|---|
| `PASS` | インデックス登録済み |
| `PARTIAL` | 部分的に問題あり（警告付きで登録 or 一部リソース取得失敗） |
| `FAIL` | インデックス未登録 |
| `NEUTRAL` | 判定不能（通常は情報取得中） |

| coverageState の代表値 |
|---|
| `URL is on Google` — 登録済み |
| `URL is unknown to Google` — 未クロール |
| `Duplicate, Google chose different canonical than user` — 重複判定 |
| `Page with redirect` — リダイレクト先判定 |
| `Not found (404)` / `Blocked due to access forbidden (403)` / `Soft 404` |
| `Crawled - currently not indexed` — クロール済みだが未登録（品質評価 or クロール予算） |
| `Discovered - currently not indexed` — 検出済み未クロール |

## 使い方の例

### Fix 7/8 の効果確認

```bash
/inspect-url https://stats47.jp/themes/nonexistent-theme-xxx
# → verdict=FAIL, coverageState=Not found (410) or similar が期待される
```

### 健康寿命ランキングのインデックス状態

```bash
/inspect-url https://stats47.jp/ranking/healthy-life-expectancy-male
# → verdict=PASS 目標。NEUTRAL なら数日待って再確認
```

## エラー時の対処

| エラー | 対処 |
|---|---|
| `quotaExceeded` | 日次 2,000 or 分次 600 を超えた。次回クォータリセットまで待機（日次は UTC 0 時リセット） |
| `Invalid URL. Must be fully-qualified` | URL に `https://` が付いていない |
| `URL is not owned by this site` | 指定 URL が `sc-domain:stats47.jp` のドメイン外 |

## 関連

- `/fetch-gsc-data` — 集計データ取得（こちらはクエリ単位）
- `/submit-sitemap` — sitemap 再送信
- `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` — 施策観測ログ（個別 URL 検査結果を貼り付けて証拠化）
