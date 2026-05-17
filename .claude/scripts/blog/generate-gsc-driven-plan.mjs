#!/usr/bin/env node
/**
 * GSC 起点ブログ記事企画ドラフト生成
 *
 * GSC snapshot N 週分を集計 → 順位 11-30 / 表示≥10 のクエリを抽出 →
 * テーマクラスター化 → metric/articles 突合 → 企画ドラフトを保存。
 *
 * Usage:
 *   NODE_PATH=./node_modules node .claude/scripts/blog/generate-gsc-driven-plan.mjs [週数] [本数]
 *
 *   週数: 集計対象の週数 (デフォルト 5)
 *   本数: 出力するテーマ上位数 (デフォルト 40)
 *
 * 出力: docs/20_ブログ記事企画/backlog/gsc-driven-YYYY-MM-DD.md
 *
 * SKILL: .claude/skills/blog/plan-blog-from-gsc/SKILL.md
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const PROJECT_ROOT = process.cwd();
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const SNAPSHOT_DIR = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots"
);
const OUT_DIR = path.join(PROJECT_ROOT, "docs/20_ブログ記事企画/backlog");

const WEEK_COUNT = parseInt(process.argv[2] || "5", 10);
const TOPIC_LIMIT = parseInt(process.argv[3] || "40", 10);

if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ D1 SQLite not found: ${DB_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(SNAPSHOT_DIR)) {
  console.error(`❌ Snapshot dir not found: ${SNAPSHOT_DIR}`);
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

// ====== Phase 1: GSC 集計 ======
const allWeeks = fs
  .readdirSync(SNAPSHOT_DIR)
  .filter((d) => /^\d{4}-W\d{2}$/.test(d))
  .sort()
  .reverse();
const weeks = allWeeks.slice(0, WEEK_COUNT);
console.log(`[1/4] Aggregating ${weeks.length} weeks: ${weeks.join(", ")}`);

const agg = new Map();
for (const w of weeks) {
  const p = path.join(SNAPSHOT_DIR, w, "queries.csv");
  if (!fs.existsSync(p)) continue;
  const lines = fs.readFileSync(p, "utf8").trim().split("\n").slice(1);
  for (const l of lines) {
    const parts = l.split(",");
    const position = parseFloat(parts[parts.length - 1]);
    const ctr = parseFloat(parts[parts.length - 2]);
    const impressions = parseInt(parts[parts.length - 3], 10);
    const clicks = parseInt(parts[parts.length - 4], 10);
    const query = parts
      .slice(0, parts.length - 4)
      .join(",")
      .replace(/^"|"$/g, "");
    if (!agg.has(query))
      agg.set(query, { query, clicks: 0, impressions: 0, weighted_pos: 0 });
    const a = agg.get(query);
    a.clicks += clicks;
    a.impressions += impressions;
    a.weighted_pos += position * impressions;
  }
}
const rows = Array.from(agg.values()).map((r) => ({
  ...r,
  position: r.impressions > 0 ? r.weighted_pos / r.impressions : 0,
  ctr: r.impressions > 0 ? r.clicks / r.impressions : 0,
}));

const mid = rows.filter(
  (r) => r.position > 10 && r.position <= 30 && r.impressions >= 10
);
const lowCtr = rows.filter(
  (r) => r.position <= 10 && r.impressions >= 30 && r.ctr < 0.05
);
console.log(
  `  → mid (11-30, imp>=10): ${mid.length} queries / low_ctr: ${lowCtr.length} queries`
);

// ====== Phase 2: metric / articles 突合 ======
console.log(`[2/4] Loading metrics and articles from D1`);
const metrics = db
  .prepare(
    `SELECT key, title, category_key, unit FROM metrics WHERE is_active = 1`
  )
  .all();
const articles = db
  .prepare(`SELECT slug, title FROM articles WHERE published = 1`)
  .all();

function getCoreKeywords(query) {
  const cleaned = query
    .replace(/[ 　]/g, "")
    .replace(
      /(都道府県別|都道府県|ランキング|別|最新|2024|2023|2026|2025|2022|2021|全国|数|割合|1位|どこ|ですか|要因|順|徳島|秋田|新潟|京都|沖縄|大阪|和歌山|愛知|埼玉|東京|福岡|北海道|大分|宮崎|三重)/g,
      ""
    );
  return cleaned.match(/[一-龥ァ-ヴー]{2,}/g) || [];
}

function mapToMetric(query) {
  const kws = getCoreKeywords(query);
  if (kws.length === 0) return null;
  for (const m of metrics) {
    const t = m.title.replace(/[ 　]/g, "");
    if (kws.every((k) => t.includes(k))) return m;
  }
  return null;
}

function isCoveredByArticle(query) {
  const kws = getCoreKeywords(query);
  if (kws.length === 0) return null;
  for (const a of articles) {
    const t = a.title.replace(/[ 　]/g, "");
    if (kws.every((k) => t.includes(k))) return a;
  }
  return null;
}

function getTheme(query) {
  const kws = getCoreKeywords(query);
  for (const k of kws) {
    if (
      /(消費量|消費額|漁獲量|普及率|施設数|蔵書数|現在高|出生率|身長|寿命|普及|発電|医療|受療率|年収|初任給|賃金|物価|生活費|空き家|借金|地方債|交付税|自主財源|付加価値|健康|住宅|農業|工業|商業|教育|医療|福祉|介護|犯罪|事故|気温|降雪|降水|風|太陽|新エネ|電力|ガス|水道|郵便|金融)/.test(
        k
      )
    ) {
      return k;
    }
  }
  return kws[0] || "その他";
}

// ====== Phase 3: テーマクラスター化 ======
console.log(`[3/4] Clustering ${mid.length} queries into themes`);
const themes = new Map();
for (const r of mid) {
  const theme = getTheme(r.query);
  const metric = mapToMetric(r.query);
  const article = isCoveredByArticle(r.query);
  if (!themes.has(theme))
    themes.set(theme, {
      theme,
      queries: [],
      total_imp: 0,
      total_clicks: 0,
      metric: null,
      existing_article: null,
    });
  const t = themes.get(theme);
  t.queries.push({ ...r, metric, article });
  t.total_imp += r.impressions;
  t.total_clicks += r.clicks;
  if (metric && !t.metric) t.metric = metric;
  if (article && !t.existing_article) t.existing_article = article;
}

const sorted = Array.from(themes.values()).sort(
  (a, b) => b.total_imp - a.total_imp
);

// 集計サマリー
const newWithMetric = sorted.filter(
  (t) => !t.existing_article && t.metric
).length;
const newNoMetric = sorted.filter(
  (t) => !t.existing_article && !t.metric
).length;
const rewrite = sorted.filter((t) => t.existing_article).length;

// ====== Phase 4: 出力 ======
const today = new Date().toISOString().slice(0, 10);
const outPath = path.join(OUT_DIR, `gsc-driven-${today}.md`);
console.log(`[4/4] Writing to ${outPath}`);

let md = `# GSC 起点ブログ記事企画 (${weeks[0]} 抽出)

> 生成日: ${today}
> 起点データ: \`.claude/skills/analytics/gsc-improvement/reference/snapshots/\` (${weeks.length} 週: ${weeks.join(", ")})
> 抽出条件: 順位 11-30 / 表示 ≥ 10 → ${mid.length} クエリ → ${sorted.length} テーマに集約
> 想定本数: 上位 ${Math.min(TOPIC_LIMIT, sorted.length)} 本

## 凡例

- **NEW**: 既存記事に該当なし。新規記事を書く
- **REWRITE**: 既存記事あり。リライト・補強または姉妹記事を追加
- **NO-METRIC**: 該当 \`metrics\` レコード無し。新規 metric 登録から必要 (\`/fetch-estat-data\` 経由)
- \`+metric:<key>\` — 使用する metric (既存ランキングデータ)

## サマリー

| 種別 | 件数 |
|---|---|
| NEW (metric 済) → 即着手可能 | ${newWithMetric} |
| NEW (NO-METRIC) → metric 登録必要 | ${newNoMetric} |
| REWRITE → 既存記事リライト | ${rewrite} |
| **総テーマ** | **${sorted.length}** |

## 別バケット: タイトル改修候補

順位 1-10 / 表示 ≥ 30 / CTR < 5% のクエリ ${lowCtr.length} 件 (タイトル文言の改修で CTR 改善余地)。詳細は別途 \`/seo-audit\` 等を参照。

---

`;

const limit = Math.min(TOPIC_LIMIT, sorted.length);
for (let i = 0; i < limit; i++) {
  const t = sorted[i];
  const tag = t.existing_article
    ? "REWRITE"
    : t.metric
      ? "NEW"
      : "NEW (NO-METRIC)";
  const metricInfo = t.metric
    ? `\`+metric:${t.metric.key}\` (${t.metric.title}, category=${t.metric.category_key || "?"})`
    : "★ metric 未登録 — 新規取得検討";
  md += `## ${i + 1}. ${t.theme} [${tag}] - 想定 imp=${t.total_imp}\n\n`;
  md += `- **データソース**: ${metricInfo}\n`;
  if (t.existing_article)
    md += `- **既存記事**: [\`${t.existing_article.slug}\`] ${t.existing_article.title}\n`;
  md += `- **GSC クエリ (${t.queries.length} 件)**:\n`;
  for (const q of t.queries.slice(0, 5)) {
    md += `  - imp=${q.impressions} / pos=${q.position.toFixed(1)} / ck=${q.clicks} | \`${q.query}\`\n`;
  }
  if (t.queries.length > 5) md += `  - …他 ${t.queries.length - 5} 件\n`;
  md += `\n`;
}

md += `\n---

## 次のステップ

1. 上記の上位テーマから着手対象を選定 (NEW (metric 済) が最も即効性高い)
2. \`Agent(subagent_type="article-writer")\` を並列起動して原稿を書く
3. \`/publish-bulk-articles <slug1> <slug2> ...\` で D1 INSERT + R2 sync + 動作確認
4. 2-4 週後に \`/fetch-gsc-data\` で CTR 改善を実測 (\`.claude/rules/evidence-based-judgment.md\` 準拠)
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(outPath, md);

console.log(`✓ ${limit} themes written`);
console.log(
  `Summary: NEW(metric済) ${newWithMetric} / NEW(no metric) ${newNoMetric} / REWRITE ${rewrite}`
);
console.log(`Low-CTR bucket: ${lowCtr.length} queries (title改修候補)`);
console.log(`\nOutput: ${outPath}`);
console.log(
  `Next: Agent(subagent_type="article-writer") for top themes, or /publish-bulk-articles after writing.`
);

db.close();
