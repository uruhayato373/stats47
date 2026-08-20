---
name: update-sns-metrics
description: 各 SNS プラットフォームからメトリクスを一括取得し `.Codex/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` に記録する。Use when user says "メトリクス更新", "SNS数値取得". Instagram は公式 API、X は browser-use CLI。(YouTube は撤退済で対象外)
disable-model-invocation: true
argument-hint: [--platform x|instagram|all]
primary_agent: sns-metrics-sync
co_agents: [x-strategist, instagram-strategist]
---

各 SNS プラットフォームからメトリクスを取得し、時系列履歴は `.Codex/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` に、最新値キャッシュは投稿台帳 `.Codex/state/sns/posts.json` の各レコード（impressions / likes / reposts / replies / bookmarks / metrics_updated_at カラム）に `sns-posts-store.cjs` の `updateById` で記録する。Instagram は Graph API v21、X は browser-use CLI を使用する。（YouTube は撤退済のため対象外。過去実績は posts.json に platform=youtube のまま残る）

**記録先の統一原則（.Codex/rules/data-storage.md）**:
- 時系列履歴 → `.Codex/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`（ヘルパ: `.Codex/scripts/lib/sns-metrics-store.cjs`）
- 運用データ（最新値キャッシュ） → 投稿台帳 `.Codex/state/sns/posts.json` の cache カラム（`sns-posts-store.cjs` 経由。完全DBレス。旧 D1 sns_posts は廃止）
- 旧 D1 `sns_metrics` テーブルは 2026-04-17 に廃止済み

### 期待カバレッジ

| 状態 | マッチ率 | 理由 |
|---|---|---|
| caption NULL 多数（初期状態） | 20-40% | post_url + ranking_name のみでマッチ |
| Phase 0 caption backfill 実行後 | 70-90% | caption prefix 80文字前方一致が有効化 |

**caption backfill は必ず Phase 0 で先に実行すること。** マッチ率が大幅に改善する。

## 引数

```
/update-sns-metrics [--platform x|instagram|all] [--skip-backfill]
```

- `--platform`（任意）: 取得対象（デフォルト: `all`）
- `--skip-backfill`（任意）: Phase 0 caption backfill をスキップ

## 定数

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
PROJECT_ROOT="$(pwd)"
# 投稿台帳は完全DBレス: 読み書きは `.Codex/scripts/lib/sns-posts-store.cjs`（posts.json）経由。旧 D1/SQLite は使わない

# 開始時: 残存プロセスをクリーンアップ
bash .Codex/scripts/cleanup-browser.sh --force 2>/dev/null
```

**重要ルール:**
- `browser-use` コマンドは毎回フルで記述する（`$BU` 変数展開しない。zsh が解釈に失敗する）
- JS はファイルに書き出してから `eval "$(cat /tmp/xxx.js)"` で渡す。インラインの複雑な JS はクォート問題で壊れる
- Node.js スクリプトも `/tmp/*.js` にファイル書き出してから `node /tmp/xxx.js` で実行する
- **投稿台帳ストア（`sns-posts-store.cjs`）は `PROJECT_ROOT` からの相対 `require("./.Codex/scripts/lib/sns-posts-store.cjs")` で読む**（リポジトリルートで実行）。`/tmp/*.js` の heredoc で絶対パスを使う場合は `require("${PROJECT_ROOT}/.Codex/scripts/lib/sns-posts-store.cjs")`

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

## 結果報告

処理完了後、以下のクエリで結果を出力:

投稿台帳 `posts.json`（`sns-posts-store.cjs`）と sns-metrics snapshot（`sns-metrics-store.cjs`）から集計する（完全DBレス。旧 D1 sns_posts は廃止）:

```bash
node -e '
const posts = require("./.Codex/scripts/lib/sns-posts-store.cjs");
const snsStore = require("./.Codex/scripts/lib/sns-metrics-store.cjs");
const all = posts.loadAll();
const hourAgo = new Date(Date.now() - 3600e3).toISOString();
const acc = {};
const bump = (p, k) => { (acc[p] ||= { updated: 0, total: 0, with_url: 0, with_cap: 0 })[k]++; };
for (const p of all) {
  const pl = p.platform || "?";
  bump(pl, "total");
  if ((p.metrics_updated_at || "") >= hourAgo) bump(pl, "updated");
  if (p.post_url) bump(pl, "with_url");
  if (p.caption) bump(pl, "with_cap");
}
console.log("=== プラットフォーム別更新件数（直近1時間）/ post_url・caption 充足率 ===");
for (const [pl, a] of Object.entries(acc))
  console.log(`${pl}: updated ${a.updated}, post_url ${a.with_url}/${a.total}, caption ${a.with_cap}/${a.total}`);
console.log("\n=== sns-metrics snapshot 総件数（全期間） ===");
console.log(snsStore.countAll(), "最新 fetched_at:", snsStore.maxFetchedAt());
'
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
bash .Codex/scripts/cleanup-browser.sh 2>/dev/null
```

## 参照

- `references/phase0-caption-backfill.md` — Phase 0 Caption Backfill スクリプト
- `references/platform-x.md` — X (Twitter) メトリクス取得手順（X-1〜X-5）
- `references/platform-instagram.md` — Instagram メトリクス取得手順（IG-1〜IG-5）
- `.Codex/scripts/lib/sns-metrics-store.cjs` — 時系列履歴書き込みヘルパ（CSV upsert）
- `.Codex/skills/analytics/sns-metrics-improvement/` — スナップショット蓄積先 + improvement-log
- `.Codex/state/sns/posts.json`（`.Codex/scripts/lib/sns-posts-store.cjs`）— 投稿台帳 SSOT。最新値キャッシュの書込先（完全DBレス。旧 D1 sns_posts は廃止）
- `packages/database/src/schema/sns_posts.ts` — レコードの型ソース（カラム名の参照用。配信 R2・投稿台帳には影響しない残置）
- `.Codex/skills/sns/find-quote-rt/SKILL.md` — X タイムライン DOM 抽出パターンの原典
