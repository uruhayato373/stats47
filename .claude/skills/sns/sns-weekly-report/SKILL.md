---
name: sns-weekly-report
description: `.claude/skills/analytics/sns-metrics-improvement/snapshots` の週次 CSV スナップショットから SNS パフォーマンスレポートを Markdown で生成する。Use when user says "SNSレポート", "週次レポート", "SNS分析". プラットフォーム横断で集計.
disable-model-invocation: true
---

`.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`（`/update-sns-metrics` が蓄積）を集計し、週次レポートを Markdown で生成する。

**記録先の統一原則（.claude/rules/data-storage.md）**: SNS メトリクスの時系列履歴は `.claude/` 配下のファイル。旧 D1 `sns_metrics` テーブルは 2026-04-17 に廃止済み。

## 引数

```
/sns-weekly-report [YYYY-Www]
```

- 週番号（任意）: ISO 8601 週番号（例: `2026-W10`）。省略時は前週。

## 前提

- `.claude/skills/analytics/sns-metrics-improvement/snapshots/` に `/update-sns-metrics` でデータが蓄積済み
- ヘルパ: `.claude/scripts/lib/sns-metrics-store.cjs`（`readByRange(start, end)` / `readByDate(date)` / `countAll()` / `maxFetchedAt()`）

## 手順

### 1. 対象期間の算出

指定された週番号から月曜〜日曜の日付範囲を算出する（YYYY-MM-DD）。

### 2. スナップショット読み込み + 集計

```bash
cat > /tmp/sns-weekly-agg.js << 'JSEOF'
const store = require(process.cwd() + "/.claude/scripts/lib/sns-metrics-store.cjs");
const [start, end] = process.argv.slice(2);       // 例: 2026-04-07 2026-04-13
const rows = store.readByRange(start, end);

// プラットフォーム別サマリー
const byPlatform = {};
for (const r of rows) {
  const p = r.platform || "unknown";
  if (!byPlatform[p]) byPlatform[p] = { posts: new Set(), impressions: 0, reach: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0 };
  const b = byPlatform[p];
  b.posts.add(r.content_key || r.sns_post_id);
  for (const k of ["impressions", "reach", "views", "likes", "comments", "shares", "saves"]) {
    b[k] += Number(r[k]) || 0;
  }
}
for (const p of Object.keys(byPlatform)) byPlatform[p].post_count = byPlatform[p].posts.size;
console.log("platform summary:", JSON.stringify(byPlatform, (k, v) => v instanceof Set ? undefined : v, 2));

// エンゲージメント上位 10 投稿
const withEng = rows.map(r => ({
  ...r,
  eng: ["likes", "comments", "shares", "saves"].reduce((s, k) => s + (Number(r[k]) || 0), 0),
}));
withEng.sort((a, b) => b.eng - a.eng);
console.log("\ntop 10 posts:");
for (const r of withEng.slice(0, 10)) {
  console.log(` - ${r.platform} ${r.content_key} eng=${r.eng} likes=${r.likes} comments=${r.comments}`);
}
JSEOF
node /tmp/sns-weekly-agg.js <monday> <sunday>
```

前週比を出す場合は、同じスクリプトを `前週 monday/sunday` で再実行して差分を算出する。

### 3. レポート生成

`docs/04_レビュー/sns-weekly-report/{YYYY-Www}.md` に Write tool で書き出す。frontmatter:

```yaml
---
type: sns-weekly-report
week: 2026-Www
date: 2026-MM-DD
status: active
---
```

同週の Weekly Review ファイル（`docs/03_週次運用/weekly-review/{YYYY-Www}.md` 等）が既にある場合、本文の冒頭で相対リンクし、Weekly Review 側にも SNS レポートへのリンクを追記して相互参照する。

過去のレポートは `ls -t docs/04_レビュー/sns-weekly-report/*.md | head -5` で参照できる。

### 4. 分析コメント

データに基づいて以下の分析を記載:

- 前週比での増減トレンド
- エンゲージメント率の高い/低い投稿の特徴
- プラットフォーム別の傾向差
- 次週のアクション提案（投稿頻度・テーマ・プラットフォーム注力先）

## 参照

- `.claude/scripts/lib/sns-metrics-store.cjs` — CSV スナップショット I/O ヘルパ
- `.claude/skills/analytics/sns-metrics-improvement/` — スナップショット + improvement-log
- `packages/database/src/schema/sns_posts.ts` — sns_posts テーブル定義（キャッシュカラム込み運用データ）
