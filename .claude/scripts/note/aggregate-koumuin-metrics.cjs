#!/usr/bin/env node
/**
 * aggregate-koumuin-metrics.cjs
 *
 * 公務員 × Claude Code バーティカル専用のメトリクス集計スクリプト。
 *
 * 入力:
 *   1. fetch-note-metrics 出力: .claude/state/metrics/note/note-YYYY-MM-DD.json
 *      (新形式 snapshots/YYYY-MM-DD.json にも追従)
 *   2. docs/31_note記事原稿/koumuin-claude-code/<NN-slug>/draft.md の YAML frontmatter
 *
 * 出力:
 *   1. <output>.csv : 記事別の生データ (slug / title / views / likes / comments / price / sales 等)
 *   2. <output>    : 人間向け Markdown レポート (全体 / 区分別 / マイルストーン判定 / 推奨アクション)
 *
 * Usage:
 *   node .claude/scripts/note/aggregate-koumuin-metrics.cjs \
 *     --since 2026-05-18 --until 2026-06-08 \
 *     --vertical koumuin-claude-code \
 *     --output /tmp/koumuin-report-2026-06.md
 *
 *   node .claude/scripts/note/aggregate-koumuin-metrics.cjs --help
 *
 * 依存: Node.js 標準ライブラリのみ
 */

"use strict";

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DEFAULT_METRICS_DIR = path.join(
  PROJECT_ROOT,
  ".claude/state/metrics/note"
);
const DEFAULT_DOCS_ROOT = path.join(PROJECT_ROOT, "docs/31_note記事原稿");
const DEFAULT_VERTICAL = "koumuin-claude-code";

// 親プランのマイルストーン基準 (M1 / M3 / M6)
const MILESTONES = {
  M1: { label: "M1 (1 ヶ月)", views: 100, revenue_jpy: 10_000, days: 30 },
  M3: { label: "M3 (3 ヶ月)", views: 500, revenue_jpy: 50_000, days: 90 },
  M6: { label: "M6 (6 ヶ月)", views: 2_000, revenue_jpy: 200_000, days: 180 },
};

// -----------------------------------------------------------------------------
// CLI parser
// -----------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {
    since: null,
    until: null,
    vertical: DEFAULT_VERTICAL,
    output: null,
    metricsDir: DEFAULT_METRICS_DIR,
    docsRoot: DEFAULT_DOCS_ROOT,
    help: false,
    runTest: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--since":
        args.since = argv[++i];
        break;
      case "--until":
        args.until = argv[++i];
        break;
      case "--vertical":
        args.vertical = argv[++i];
        break;
      case "--output":
        args.output = argv[++i];
        break;
      case "--metrics-dir":
        args.metricsDir = argv[++i];
        break;
      case "--docs-root":
        args.docsRoot = argv[++i];
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--self-test":
        args.runTest = true;
        break;
      default:
        if (a.startsWith("--")) {
          throw new Error(`Unknown option: ${a}`);
        }
    }
  }
  return args;
}

function printHelp() {
  process.stdout.write(
    [
      "Usage: node aggregate-koumuin-metrics.cjs [options]",
      "",
      "Options:",
      "  --since YYYY-MM-DD     集計開始日 (この日以降の snapshot を採用)",
      "  --until YYYY-MM-DD     集計終了日 (この日以前の snapshot を採用)",
      "  --vertical <name>      対象バーティカル (default: koumuin-claude-code)",
      "  --output <path>        Markdown レポート出力先 (.csv は同階層に併存)",
      "  --metrics-dir <path>   fetch-note-metrics の保存先 (default: .claude/state/metrics/note)",
      "  --docs-root <path>     note 原稿のルート (default: docs/31_note記事原稿)",
      "  --self-test            内蔵テストを実行して終了",
      "  -h, --help             本ヘルプを表示",
      "",
      "例:",
      "  node .claude/scripts/note/aggregate-koumuin-metrics.cjs \\",
      "    --since 2026-05-18 --until 2026-06-08 \\",
      "    --vertical koumuin-claude-code \\",
      "    --output /tmp/koumuin-report-2026-06.md",
      "",
    ].join("\n")
  );
}

// -----------------------------------------------------------------------------
// frontmatter 抽出 (publish-note Phase 0 と同じ簡易 YAML parser)
// -----------------------------------------------------------------------------
function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const raw of m[1].split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (/^-?\d+$/.test(val)) val = Number(val);
    else val = val.replace(/^["']|["']$/g, "");
    out[key] = val;
  }
  return out;
}

// -----------------------------------------------------------------------------
// ドラフト frontmatter 一覧を取得
// -----------------------------------------------------------------------------
async function loadDrafts(docsRoot, vertical) {
  const verticalDir = path.join(docsRoot, vertical);
  if (!fs.existsSync(verticalDir)) {
    throw new Error(`vertical directory not found: ${verticalDir}`);
  }
  const entries = await fsp.readdir(verticalDir, { withFileTypes: true });
  const drafts = [];
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const draftPath = path.join(verticalDir, ent.name, "draft.md");
    if (!fs.existsSync(draftPath)) continue;
    const content = await fsp.readFile(draftPath, "utf8");
    const fm = parseFrontmatter(content);
    if (!fm.slug) continue;
    drafts.push({
      dir: ent.name, // 例: "01-claude-code-setup-complete"
      slug: fm.slug,
      title: fm.title || fm.slug,
      is_paid: fm.is_paid === true,
      price_jpy: typeof fm.price_jpy === "number" ? fm.price_jpy : 0,
      noteId: fm.note_id || fm.noteId || null,
      published_at: fm.published_at || null,
      status: fm.status || null,
      category: fm.category || null,
    });
  }
  return drafts;
}

// -----------------------------------------------------------------------------
// snapshot 列挙 (since/until で絞り込み)
// -----------------------------------------------------------------------------
async function listSnapshots(metricsDir, since, until) {
  const files = [];
  const collect = async (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const ent of await fsp.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isFile() && ent.name.endsWith(".json")) {
        const m = ent.name.match(/(\d{4}-\d{2}-\d{2})/);
        if (!m) continue;
        const date = m[1];
        if (since && date < since) continue;
        if (until && date > until) continue;
        files.push({ path: full, date });
      }
    }
  };
  // 旧: 直下 note-YYYY-MM-DD.json / 新: snapshots/YYYY-MM-DD.json
  await collect(metricsDir);
  await collect(path.join(metricsDir, "snapshots"));
  files.sort((a, b) => a.date.localeCompare(b.date));
  return files;
}

// -----------------------------------------------------------------------------
// snapshot 群を読み込み、noteId / url をキーに最新値を抽出
// -----------------------------------------------------------------------------
async function loadLatestMetrics(snapshots) {
  const byNoteId = new Map();
  for (const snap of snapshots) {
    const json = JSON.parse(await fsp.readFile(snap.path, "utf8"));
    for (const a of json.articles || []) {
      const key = a.noteId || a.url;
      if (!key) continue;
      byNoteId.set(key, { ...a, fetched_at: json.fetched_at || snap.date });
    }
  }
  return byNoteId;
}

// -----------------------------------------------------------------------------
// drafts + metrics を JOIN
// -----------------------------------------------------------------------------
function joinDraftsWithMetrics(drafts, metricsByNoteId) {
  return drafts.map((d) => {
    const m = d.noteId ? metricsByNoteId.get(d.noteId) : null;
    const views = m ? m.views || 0 : 0;
    const likes = m ? m.likes || 0 : 0;
    const comments = m ? m.comments || 0 : 0;
    const purchases = m && typeof m.purchases === "number" ? m.purchases : 0;
    const sales_jpy = d.is_paid ? purchases * d.price_jpy : 0;
    const cvr = views > 0 ? purchases / views : 0;
    return {
      ...d,
      views,
      likes,
      comments,
      purchases,
      sales_jpy,
      cvr,
      has_metric: Boolean(m),
    };
  });
}

// -----------------------------------------------------------------------------
// 集計: 全体 / 区分別 / 価格帯別
// -----------------------------------------------------------------------------
function aggregate(rows) {
  const total = {
    articles: rows.length,
    published: rows.filter((r) => r.has_metric).length,
    views: sum(rows, "views"),
    likes: sum(rows, "likes"),
    comments: sum(rows, "comments"),
    purchases: sum(rows, "purchases"),
    sales_jpy: sum(rows, "sales_jpy"),
  };
  total.cvr = total.views > 0 ? total.purchases / total.views : 0;

  const byPaid = {
    free: summarize(rows.filter((r) => !r.is_paid)),
    paid: summarize(rows.filter((r) => r.is_paid)),
  };

  const byPrice = {};
  for (const r of rows.filter((r) => r.is_paid)) {
    const band = `¥${r.price_jpy}`;
    if (!byPrice[band]) byPrice[band] = [];
    byPrice[band].push(r);
  }
  const byPriceSummary = {};
  for (const [band, list] of Object.entries(byPrice)) {
    byPriceSummary[band] = summarize(list);
  }
  return { total, byPaid, byPrice: byPriceSummary };
}

function summarize(rows) {
  return {
    articles: rows.length,
    views: sum(rows, "views"),
    likes: sum(rows, "likes"),
    purchases: sum(rows, "purchases"),
    sales_jpy: sum(rows, "sales_jpy"),
  };
}

function sum(rows, k) {
  return rows.reduce((a, b) => a + (b[k] || 0), 0);
}

// -----------------------------------------------------------------------------
// マイルストーン判定
// -----------------------------------------------------------------------------
function judgeMilestone(total, elapsedDays) {
  const candidates = Object.values(MILESTONES).filter(
    (m) => elapsedDays <= m.days
  );
  const target = candidates[0] || MILESTONES.M6;
  const viewsRatio = target.views > 0 ? total.views / target.views : 0;
  const revRatio =
    target.revenue_jpy > 0 ? total.sales_jpy / target.revenue_jpy : 0;
  const verdict =
    viewsRatio >= 1 && revRatio >= 1
      ? "OK (達成)"
      : viewsRatio >= 0.5 && revRatio >= 0.5
        ? "ON-TRACK (50% 以上)"
        : "BEHIND (50% 未満)";
  return { target, viewsRatio, revRatio, verdict };
}

// -----------------------------------------------------------------------------
// 推奨アクション (CVR 低い記事の特定)
// -----------------------------------------------------------------------------
function recommendActions(rows) {
  const actions = [];
  const paidRows = rows.filter((r) => r.is_paid && r.views > 0);
  // CVR 低位 3 件 (purchases=0 含む)
  const lowCvr = [...paidRows].sort((a, b) => a.cvr - b.cvr).slice(0, 3);
  for (const r of lowCvr) {
    actions.push(
      `[CVR改善] ${r.slug} (views=${r.views}, purchases=${r.purchases}, cvr=${(r.cvr * 100).toFixed(2)}%) — 無料部分の刈り込み / 価格 (¥${r.price_jpy}) 見直し / タイトル A/B`
    );
  }
  // views=0 (集計不可)
  const noMetric = rows.filter((r) => !r.has_metric);
  if (noMetric.length > 0) {
    actions.push(
      `[計測不可] ${noMetric.length} 本が note 上で未確認 (未公開 or noteId frontmatter 未記入)。公開後に slug→noteId 紐付けを追記。`
    );
  }
  // バイラル候補 (likes / views が高い)
  const viral = [...rows]
    .filter((r) => r.views >= 100)
    .sort((a, b) => b.likes / Math.max(b.views, 1) - a.likes / Math.max(a.views, 1))
    .slice(0, 2);
  for (const r of viral) {
    const rate = ((r.likes / Math.max(r.views, 1)) * 100).toFixed(2);
    actions.push(
      `[横展開候補] ${r.slug} (likes/views=${rate}%) — 類似テーマで 2 本目を企画`
    );
  }
  return actions;
}

// -----------------------------------------------------------------------------
// CSV / Markdown writer
// -----------------------------------------------------------------------------
function toCsv(rows) {
  const header = [
    "slug",
    "title",
    "category",
    "is_paid",
    "price_jpy",
    "views",
    "likes",
    "comments",
    "purchases",
    "sales_jpy",
    "cvr_pct",
    "has_metric",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.slug,
        csvEscape(r.title),
        r.category || "",
        r.is_paid ? "true" : "false",
        r.price_jpy,
        r.views,
        r.likes,
        r.comments,
        r.purchases,
        r.sales_jpy,
        (r.cvr * 100).toFixed(2),
        r.has_metric ? "true" : "false",
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}

function csvEscape(s) {
  if (s == null) return "";
  const str = String(s);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toMarkdown({ rows, agg, period, vertical, milestone }) {
  const { total, byPaid, byPrice } = agg;
  const out = [];
  out.push(`# ${vertical} メトリクスレポート`);
  out.push("");
  out.push(`- 期間: ${period.since || "-"} 〜 ${period.until || "-"}`);
  out.push(`- 経過日数: ${period.elapsedDays} 日`);
  out.push(`- 生成日時: ${new Date().toISOString()}`);
  out.push("");

  out.push("## 全体サマリ");
  out.push("");
  out.push(`| 指標 | 値 |`);
  out.push(`|---|---|`);
  out.push(`| 対象記事 | ${total.articles} 本 (うち公開計測済み ${total.published}) |`);
  out.push(`| 総 PV | ${total.views.toLocaleString()} |`);
  out.push(`| 総スキ | ${total.likes.toLocaleString()} |`);
  out.push(`| 総コメント | ${total.comments.toLocaleString()} |`);
  out.push(`| 総購入 | ${total.purchases.toLocaleString()} |`);
  out.push(`| 総売上 | ¥${total.sales_jpy.toLocaleString()} |`);
  out.push(`| 平均 CVR | ${(total.cvr * 100).toFixed(2)}% |`);
  out.push("");

  out.push("## 区分別 (無料 / 有料)");
  out.push("");
  out.push(`| 区分 | 記事数 | PV | スキ | 購入 | 売上 |`);
  out.push(`|---|---|---|---|---|---|`);
  for (const [k, v] of Object.entries(byPaid)) {
    out.push(
      `| ${k} | ${v.articles} | ${v.views} | ${v.likes} | ${v.purchases} | ¥${v.sales_jpy.toLocaleString()} |`
    );
  }
  out.push("");

  if (Object.keys(byPrice).length > 0) {
    out.push("## 価格帯別");
    out.push("");
    out.push(`| 価格 | 記事数 | PV | 購入 | 売上 |`);
    out.push(`|---|---|---|---|---|`);
    for (const [band, v] of Object.entries(byPrice)) {
      out.push(
        `| ${band} | ${v.articles} | ${v.views} | ${v.purchases} | ¥${v.sales_jpy.toLocaleString()} |`
      );
    }
    out.push("");
  }

  out.push("## マイルストーン判定");
  out.push("");
  out.push(
    `- 基準: ${milestone.target.label} (PV ${milestone.target.views} / 売上 ¥${milestone.target.revenue_jpy.toLocaleString()})`
  );
  out.push(`- PV 達成率: ${(milestone.viewsRatio * 100).toFixed(1)}%`);
  out.push(`- 売上 達成率: ${(milestone.revRatio * 100).toFixed(1)}%`);
  out.push(`- 判定: **${milestone.verdict}**`);
  out.push("");

  out.push("## 記事別 (PV 降順)");
  out.push("");
  out.push(`| slug | 区分 | PV | スキ | 購入 | 売上 | CVR |`);
  out.push(`|---|---|---|---|---|---|---|`);
  const sorted = [...rows].sort((a, b) => b.views - a.views);
  for (const r of sorted) {
    out.push(
      `| ${r.slug} | ${r.is_paid ? `有 ¥${r.price_jpy}` : "無"} | ${r.views} | ${r.likes} | ${r.purchases} | ¥${r.sales_jpy.toLocaleString()} | ${(r.cvr * 100).toFixed(2)}% |`
    );
  }
  out.push("");

  out.push("## 推奨アクション");
  out.push("");
  const actions = recommendActions(rows);
  if (actions.length === 0) {
    out.push("- (該当なし)");
  } else {
    for (const a of actions) out.push(`- ${a}`);
  }
  out.push("");
  return out.join("\n");
}

// -----------------------------------------------------------------------------
// メイン
// -----------------------------------------------------------------------------
async function main(args) {
  const drafts = await loadDrafts(args.docsRoot, args.vertical);
  if (drafts.length === 0) {
    throw new Error(`No drafts found in ${args.vertical}`);
  }

  const snapshots = await listSnapshots(args.metricsDir, args.since, args.until);
  if (snapshots.length === 0) {
    console.warn(
      `[warn] No snapshots in ${args.metricsDir} for ${args.since || "*"}〜${args.until || "*"}. drafts のみ集計。`
    );
  }
  const metricsByNoteId = await loadLatestMetrics(snapshots);

  const rows = joinDraftsWithMetrics(drafts, metricsByNoteId);
  const agg = aggregate(rows);

  const elapsedDays =
    args.since && args.until
      ? Math.max(
          1,
          Math.round(
            (Date.parse(args.until) - Date.parse(args.since)) / 86_400_000
          )
        )
      : 30;
  const milestone = judgeMilestone(agg.total, elapsedDays);

  const outputPath =
    args.output ||
    path.join(
      "/tmp",
      `${args.vertical}-report-${new Date().toISOString().slice(0, 10)}.md`
    );
  const csvPath = outputPath.replace(/\.md$/, "") + ".csv";

  const md = toMarkdown({
    rows,
    agg,
    period: { since: args.since, until: args.until, elapsedDays },
    vertical: args.vertical,
    milestone,
  });
  const csv = toCsv(rows);

  await fsp.writeFile(outputPath, md, "utf8");
  await fsp.writeFile(csvPath, csv, "utf8");

  console.log(`[ok] markdown: ${outputPath}`);
  console.log(`[ok] csv     : ${csvPath}`);
  console.log(
    `[ok] articles=${agg.total.articles} views=${agg.total.views} sales=¥${agg.total.sales_jpy.toLocaleString()} verdict=${milestone.verdict}`
  );
}

// -----------------------------------------------------------------------------
// 簡易セルフテスト
// -----------------------------------------------------------------------------
function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`[FAIL] ${label}\n  expected: ${e}\n  actual  : ${a}`);
  }
  console.log(`[OK] ${label}`);
}

function runSelfTest() {
  const fm = parseFrontmatter(
    [
      "---",
      "slug: foo-bar",
      "is_paid: true",
      "price_jpy: 1500",
      "tags: [a, b]",
      "---",
      "body",
    ].join("\n")
  );
  assertEqual(fm.slug, "foo-bar", "parseFrontmatter.slug");
  assertEqual(fm.is_paid, true, "parseFrontmatter.is_paid");
  assertEqual(fm.price_jpy, 1500, "parseFrontmatter.price_jpy");
  assertEqual(fm.tags, ["a", "b"], "parseFrontmatter.tags");

  const drafts = [
    { slug: "a", title: "A", is_paid: true, price_jpy: 1000, noteId: "n1", category: "x" },
    { slug: "b", title: "B", is_paid: false, price_jpy: 0, noteId: "n2", category: "x" },
  ];
  const metrics = new Map([
    ["n1", { views: 100, likes: 5, comments: 0, purchases: 2 }],
    ["n2", { views: 50, likes: 3, comments: 1 }],
  ]);
  const rows = joinDraftsWithMetrics(drafts, metrics);
  assertEqual(rows[0].sales_jpy, 2000, "join.sales_jpy");
  assertEqual(rows[0].cvr, 0.02, "join.cvr");
  assertEqual(rows[1].sales_jpy, 0, "join.free.sales_jpy");

  const agg = aggregate(rows);
  assertEqual(agg.total.views, 150, "aggregate.total.views");
  assertEqual(agg.total.sales_jpy, 2000, "aggregate.total.sales_jpy");
  assertEqual(agg.byPaid.paid.articles, 1, "aggregate.byPaid.paid");
  assertEqual(agg.byPaid.free.articles, 1, "aggregate.byPaid.free");

  const m = judgeMilestone({ views: 200, sales_jpy: 20_000 }, 30);
  assertEqual(m.target.label, MILESTONES.M1.label, "milestone.M1");
  assertEqual(m.verdict, "OK (達成)", "milestone.verdict.OK");

  console.log("\nAll self-tests passed.");
}

// -----------------------------------------------------------------------------
// entry
// -----------------------------------------------------------------------------
(async () => {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    printHelp();
    process.exit(1);
  }
  if (args.help) {
    printHelp();
    return;
  }
  if (args.runTest) {
    try {
      runSelfTest();
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
    return;
  }
  try {
    await main(args);
  } catch (e) {
    console.error(`[error] ${e.message}`);
    process.exit(1);
  }
})();
