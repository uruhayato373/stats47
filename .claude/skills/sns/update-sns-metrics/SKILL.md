---
name: update-sns-metrics
description: 各 SNS プラットフォームからメトリクスを一括取得し `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` に記録する。Use when user says "メトリクス更新", "SNS数値取得". Instagram/YouTube は公式 API、X/TikTok は browser-use CLI.
disable-model-invocation: true
argument-hint: [--platform x|instagram|youtube|tiktok|all]
---

各 SNS プラットフォームからメトリクスを取得し、時系列履歴は `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` に、最新値キャッシュは D1 `sns_posts` テーブル（impressions / likes / reposts / replies / bookmarks / metrics_updated_at カラム）に記録する。Instagram は Graph API v21、YouTube は Data API v3、X/TikTok は browser-use CLI を使用する。

**記録先の統一原則（CLAUDE.md §記録先の統一原則）**:
- 時系列履歴 → `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`（ヘルパ: `.claude/scripts/lib/sns-metrics-store.cjs`）
- 運用データ（最新値キャッシュ） → D1 `sns_posts` の cache カラム
- 旧 D1 `sns_metrics` テーブルは 2026-04-17 に廃止済み

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
PROJECT_ROOT="$(pwd)"
DB_PATH="$PROJECT_ROOT/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"

# 開始時: 残存プロセスをクリーンアップ
bash .claude/scripts/cleanup-browser.sh --force 2>/dev/null
```

**重要ルール:**
- `browser-use` コマンドは毎回フルで記述する（`$BU` 変数展開しない。zsh が解釈に失敗する）
- JS はファイルに書き出してから `eval "$(cat /tmp/xxx.js)"` で渡す。インラインの複雑な JS はクォート問題で壊れる
- Node.js スクリプトも `/tmp/*.js` にファイル書き出してから `node /tmp/xxx.js` で実行する
- **Node.js の `require("better-sqlite3")` は `/tmp/` から実行すると解決に失敗する。** 絶対パス `require("${PROJECT_ROOT}/node_modules/better-sqlite3")` を使うこと。`googleapis` も同様

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

### Phase 0: Caption Backfill

`references/phase0-caption-backfill.md` の手順に従って実行する。`--skip-backfill` 指定時はスキップ。

---

### X (Twitter)

`references/platform-x.md` の手順に従って実行する。

---

### Instagram

`references/platform-instagram.md` の手順に従って実行する。

---

### YouTube

`references/platform-youtube.md` の手順に従って実行する。

---

### TikTok

`references/platform-tiktok.md` の手順に従って実行する。

---

## 結果報告

処理完了後、以下のクエリで結果を出力:

```bash
cat > /tmp/sns-report.js << JSEOF
const Database = require("${PROJECT_ROOT}/node_modules/better-sqlite3");
const snsStore = require("${PROJECT_ROOT}/.claude/scripts/lib/sns-metrics-store.cjs");
const DB_PATH = "${PROJECT_ROOT}/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const db = new Database(DB_PATH);

console.log("\n=== プラットフォーム別更新件数（直近1時間） ===");
const updated = db.prepare("SELECT platform, COUNT(*) as cnt FROM sns_posts WHERE metrics_updated_at >= datetime('now', '-1 hour') GROUP BY platform").all();
for (const r of updated) console.log(r.platform + ": " + r.cnt);

console.log("\n=== sns-metrics snapshot 総件数（全期間） ===");
console.log(snsStore.countAll());
console.log("最新 fetched_at: " + snsStore.maxFetchedAt());

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

## 終了時クリーンアップ

全プラットフォームの処理完了後、結果報告の後に必ず実行:

```bash
bash .claude/scripts/cleanup-browser.sh 2>/dev/null
```

## 参照

- `references/phase0-caption-backfill.md` — Phase 0 Caption Backfill スクリプト
- `references/platform-x.md` — X (Twitter) メトリクス取得手順（X-1〜X-5）
- `references/platform-instagram.md` — Instagram メトリクス取得手順（IG-1〜IG-5）
- `references/platform-youtube.md` — YouTube メトリクス取得手順（YT-1）
- `references/platform-tiktok.md` — TikTok メトリクス取得手順（TT-1〜TT-4）
- `.claude/scripts/lib/sns-metrics-store.cjs` — 時系列履歴書き込みヘルパ（CSV upsert）
- `.claude/skills/analytics/sns-metrics-improvement/` — スナップショット蓄積先 + improvement-log
- `packages/database/src/schema/sns_posts.ts` — sns_posts テーブル定義（キャッシュカラム含む運用データ）
- `.claude/skills/analytics/fetch-youtube-data/SKILL.md` — YouTube API パターンの原典
- `.claude/skills/sns/find-quote-rt/SKILL.md` — X タイムライン DOM 抽出パターンの原典
