import Database from "better-sqlite3";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DBPATH = resolve(
  "/Users/minamidaisuke/stats47",
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const MIN_ARTICLES = 3;

const db = new Database(DBPATH);

// 3本以上ある「残すタグ」を確定
const keepRows = db.prepare(`
  SELECT json_each.value as tag, COUNT(*) as cnt
  FROM articles, json_each(articles.tags)
  WHERE published = 1
  GROUP BY json_each.value
  HAVING cnt >= ?
`).all(MIN_ARTICLES);
const keepTags = new Set(keepRows.map(r => r.tag));
console.log(`残すタグ: ${keepTags.size}個`);
console.log([...keepTags].sort().join(", "));

// 全記事のタグをフィルタ
const articles = db.prepare("SELECT slug, tags FROM articles").all();
const updateStmt = db.prepare(
  "UPDATE articles SET tags = ?, updated_at = datetime('now') WHERE slug = ?"
);

let updated = 0, removed = 0;
const updateAll = db.transaction(() => {
  for (const article of articles) {
    let tags;
    try { tags = JSON.parse(article.tags || "[]"); } catch { tags = []; }
    const filtered = tags.filter(t => keepTags.has(t));
    if (filtered.length !== tags.length) {
      removed += tags.length - filtered.length;
      updateStmt.run(JSON.stringify(filtered), article.slug);
      updated++;
    }
  }
});
updateAll();

console.log(`\n更新: ${updated}件の記事 / 削除されたタグ参照: ${removed}件`);

// 結果確認
const after = db.prepare(`
  SELECT json_each.value as tag, COUNT(*) as cnt
  FROM articles, json_each(articles.tags)
  WHERE published = 1
  GROUP BY json_each.value
  ORDER BY cnt DESC
`).all();
console.log(`\n残ったタグ数: ${after.length}`);
after.forEach(r => console.log(`  ${r.tag}: ${r.cnt}本`));

db.close();
