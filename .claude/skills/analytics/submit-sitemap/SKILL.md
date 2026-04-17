---
name: submit-sitemap
description: Google Search Console に sitemap.xml を API 経由で再送信する。Use when user says "sitemap 再送信", "サイトマップ更新", "submit-sitemap". /deploy 後のインデックス化促進や middleware ルール変更後に使用.
disable-model-invocation: true
argument-hint: [sitemap-path]
---

Google Search Console `webmasters.sitemaps.submit` API を叩いて sitemap.xml の再クロールを要求する。

## 用途

- middleware の 410 / noindex ルール追加後、Google に最新 URL 一覧を早く再認識させたい
- 新規ランキング / 記事の追加後、インデックス化を加速したい
- 従来 GSC UI で手動実行していた「sitemap を送信」を Claude から自動化

## 前提

- サービスアカウント鍵: `stats47-f6b5dae19196.json`（リポジトリルート、git ignore 済み）
- サイト: `sc-domain:stats47.jp`（GSC でドメインプロパティ登録済み）
- npm パッケージ: `googleapis`（既に `/fetch-gsc-data` で使用中のため通常インストール済）

**権限スコープの注意**: `submit` は `webmasters.readonly` ではなく **`webmasters`** スコープが必要。`/fetch-gsc-data` は readonly で足りるが本スキルは read/write 相当を要求する。

## 引数

```
/submit-sitemap [sitemap-path]
```

- `sitemap-path`（任意、デフォルト: `https://stats47.jp/sitemap.xml`）: 完全 URL を指定

## 手順

### Step 1: パッケージ確認

```bash
node -e "require('googleapis')" 2>/dev/null && echo OK || npm install -D googleapis
```

### Step 2: Sitemap を送信

インラインで実行:

```bash
node -e "$(cat <<'JS'
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const KEY_FILE = KEY_CANDIDATES.map(f => path.resolve(process.cwd(), f)).find(f => fs.existsSync(f));
if (!KEY_FILE) throw new Error('サービスアカウント鍵が見つかりません');
const SITE_URL = 'sc-domain:stats47.jp';
const SITEMAP = process.argv[1] || 'https://stats47.jp/sitemap.xml';

(async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  await searchconsole.sitemaps.submit({
    siteUrl: SITE_URL,
    feedpath: SITEMAP,
  });
  console.log('✅ submitted: ' + SITEMAP);

  const { data } = await searchconsole.sitemaps.get({
    siteUrl: SITE_URL,
    feedpath: SITEMAP,
  });
  console.log('status:');
  console.log('  path: ' + data.path);
  console.log('  lastSubmitted: ' + data.lastSubmitted);
  console.log('  lastDownloaded: ' + data.lastDownloaded);
  console.log('  isPending: ' + data.isPending);
  console.log('  isSitemapsIndex: ' + data.isSitemapsIndex);
  console.log('  warnings: ' + data.warnings);
  console.log('  errors: ' + data.errors);
  console.log('  contents: ' + JSON.stringify(data.contents));
})().catch(e => { console.error(e.message || e); process.exit(1); });
JS
)" "$1"
```

### Step 3: 結果報告

- `✅ submitted` が出て、`status` ブロックに `lastSubmitted` が現在時刻に近いことを確認
- `errors`, `warnings` が 0 であることを確認（値があれば本文に含める）
- Google が再クロールするまで数時間〜数日。即時反映は期待しない

## エラー時の対処

| エラー | 対処 |
|---|---|
| `Insufficient Permission` | サービスアカウントに `webmasters` スコープ権限が未付与。GCP Console → IAM → サービスアカウント編集で付与 |
| `404 Not Found` sitemap 指定時 | URL が間違っている。`https://stats47.jp/sitemap.xml` が返す XML を確認 |
| `Sitemap too large` | 50MB or 50,000 URL 超過。複数 sitemap index 化が必要 |

## 関連

- `/fetch-gsc-data` — GSC 検索パフォーマンス取得（同じサービスアカウント鍵を再利用）
- `/deploy` — middleware / sitemap.ts 変更後、本スキルを続けて呼ぶと効果的
- `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` — 施策効果の観測ログ
