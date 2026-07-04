# Phase 0: Caption Backfill

> このファイルは `update-sns-metrics` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

**メトリクス収集の前に必ず実行する。** caption NULL のレコードに対して、ローカル R2 の caption.txt からキャプションを一括投入する。これにより「caption prefix 先頭80文字」マッチが有効化され、マッチ率が 20-40% → 70-90% に改善する。

`--skip-backfill` 指定時はスキップ。

投稿台帳 `posts.json`（`sns-posts-store.cjs`）の caption 空レコードを走査し、`updateById` で埋める（完全DBレス。旧 D1 sns_posts は廃止）。

```bash
cat > /tmp/caption-backfill.js << JSEOF
const fs = require("fs");
const path = require("path");
const store = require("${PROJECT_ROOT}/.claude/scripts/lib/sns-posts-store.cjs");

// caption が空のレコードを取得
const nullCaptions = store.query((p) => !p.caption);
console.log("Caption NULL records: " + nullCaptions.length);

let filled = 0;

{
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
          store.updateById(row.id, { caption });
          filled++;
          break;
        }
      }
    }
  }
}

console.log("Backfilled: " + filled + " / " + nullCaptions.length);

// 更新後の充足率を表示（投稿台帳 posts.json から集計）
const capAcc = {};
for (const p of store.loadAll()) {
  const a = capAcc[p.platform] || (capAcc[p.platform] = { total: 0, with_cap: 0 });
  a.total++;
  if (p.caption) a.with_cap++;
}
console.log("\n=== Caption 充足率（backfill 後） ===");
for (const [pl, a] of Object.entries(capAcc)) console.log(pl + ": " + a.with_cap + "/" + a.total);
JSEOF

node /tmp/caption-backfill.js
rm -f /tmp/caption-backfill.js
```
