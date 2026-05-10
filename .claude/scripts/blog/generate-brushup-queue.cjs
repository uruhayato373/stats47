#!/usr/bin/env node
/**
 * generate-brushup-queue.cjs
 * GSC pages.csv からブログ記事の改善優先度キューを生成する。
 * - .claude/state/metrics/blog/history.csv に週次スコアを追記
 * - docs/20_ブログ記事企画/brushup-queue.md を最新版に上書き
 *
 * 使用方法: node .claude/scripts/blog/generate-brushup-queue.cjs [YYYY-Www]
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SNAPSHOTS_DIR = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots"
);
const HISTORY_CSV = path.join(
  PROJECT_ROOT,
  ".claude/state/metrics/blog/history.csv"
);
const QUEUE_MD = path.join(
  PROJECT_ROOT,
  "docs/20_ブログ記事企画/brushup-queue.md"
);

// 引数で週を指定、なければ最新週を自動検出
function resolveWeek(arg) {
  if (arg) return arg;
  const weeks = fs
    .readdirSync(SNAPSHOTS_DIR)
    .filter((d) => /^\d{4}-W\d{2}$/.test(d))
    .sort();
  if (!weeks.length) throw new Error("No GSC snapshot weeks found");
  return weeks[weeks.length - 1];
}

function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

function main() {
  const week = resolveWeek(process.argv[2]);
  const pagesCSV = path.join(SNAPSHOTS_DIR, week, "pages.csv");

  if (!fs.existsSync(pagesCSV)) {
    console.error(`pages.csv not found: ${pagesCSV}`);
    process.exit(1);
  }

  const rows = parseCSV(pagesCSV);
  const blogRows = rows
    .filter((r) => r.page && r.page.includes("/blog/"))
    .map((r) => ({
      slug: r.page.split("/blog/")[1]?.replace(/\/$/, "") ?? "",
      impressions: parseInt(r.impressions, 10) || 0,
      clicks: parseInt(r.clicks, 10) || 0,
      ctr: parseFloat(r.ctr) || 0,
      position: parseFloat(r.position) || 0,
    }))
    .filter((r) => r.slug);

  if (!blogRows.length) {
    console.error("No blog rows found in pages.csv");
    process.exit(1);
  }

  const avgCtr = blogRows.reduce((s, r) => s + r.ctr, 0) / blogRows.length;

  const scored = blogRows
    .map((r) => ({
      ...r,
      ctrGap: avgCtr - r.ctr,
      score: (avgCtr - r.ctr) * Math.log10(r.impressions + 1),
    }))
    .sort((a, b) => b.score - a.score);

  const today = new Date().toISOString().slice(0, 10);

  // ── history.csv への追記 ────────────────────────────────────────────
  fs.mkdirSync(path.dirname(HISTORY_CSV), { recursive: true });
  const historyHeader = "week,slug,impressions,clicks,ctr,ctr_gap,score";
  if (!fs.existsSync(HISTORY_CSV)) {
    fs.writeFileSync(HISTORY_CSV, historyHeader + "\n");
  }
  const top20 = scored.slice(0, 20);
  const newLines = top20
    .map(
      (r) =>
        `${week},${r.slug},${r.impressions},${r.clicks},${r.ctr.toFixed(4)},${r.ctrGap.toFixed(4)},${r.score.toFixed(4)}`
    )
    .join("\n");

  // 既存の同週分を削除して上書き（冪等）
  const existing = fs.readFileSync(HISTORY_CSV, "utf8");
  const filtered = existing
    .split("\n")
    .filter((l) => l && !l.startsWith(week + ","))
    .join("\n");
  fs.writeFileSync(
    HISTORY_CSV,
    filtered.trimEnd() + "\n" + newLines + "\n"
  );

  // ── brushup-queue.md の生成 ─────────────────────────────────────────
  fs.mkdirSync(path.dirname(QUEUE_MD), { recursive: true });

  const tableRows = top20
    .map((r, i) => {
      const ctrPct = (r.ctr * 100).toFixed(2) + "%";
      const gapPct = (r.ctrGap >= 0 ? "+" : "") + (r.ctrGap * 100).toFixed(2) + "%";
      return `| ${i + 1} | ${r.slug} | ${r.impressions.toLocaleString()} | ${ctrPct} | ${gapPct} | ${r.score.toFixed(3)} |`;
    })
    .join("\n");

  const md = `# ブログ改善優先度キュー

生成日: ${today} / GSC 参照週: ${week} / ブログ記事数: ${blogRows.length} / 平均 CTR: ${(avgCtr * 100).toFixed(2)}%

**スコア** = CTR ギャップ（平均 - ページ）× log10(impressions + 1)

| 優先度 | slug | imp | CTR | 平均比 | score |
|---|---|---:|---:|---:|---:|
${tableRows}

## 次のステップ

\`\`\`bash
# 上位記事から順に補強
/brushup-blog-article ${top20[0]?.slug ?? ""}
/brushup-blog-article ${top20[1]?.slug ?? ""}
/brushup-blog-article ${top20[2]?.slug ?? ""}
\`\`\`

## 注記

- CTR 0.00% = 計測週中クリックゼロ（検索表示はされている）
- スコア式: \`(avg_ctr - page_ctr) × log10(impressions + 1)\`
- 自動更新: \`.github/workflows/fetch-metrics-weekly.yml\` (毎週日曜 JST 20:00)
`;

  fs.writeFileSync(QUEUE_MD, md);

  console.log(`✅ brushup-queue.md 更新完了 (${week}, ${blogRows.length} 記事)`);
  console.log(`   Top 3: ${top20.slice(0, 3).map((r) => r.slug).join(", ")}`);
  console.log(`   history.csv: ${HISTORY_CSV}`);
}

main();
