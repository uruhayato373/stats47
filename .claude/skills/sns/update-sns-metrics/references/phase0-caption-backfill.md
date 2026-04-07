# Phase 0: Caption Backfill

> このファイルは `update-sns-metrics` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

**メトリクス収集の前に必ず実行する。** caption NULL のレコードに対して、ローカル R2 の caption.txt からキャプションを一括投入する。これにより「caption prefix 先頭80文字」マッチが有効化され、マッチ率が 20-40% → 70-90% に改善する。

`--skip-backfill` 指定時はスキップ。

```bash
cat > /tmp/caption-backfill.js << JSEOF
const Database = require("${PROJECT_ROOT}/node_modules/better-sqlite3");
const fs = require("fs");
const path = require("path");
const DB_PATH = "${PROJECT_ROOT}/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
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
