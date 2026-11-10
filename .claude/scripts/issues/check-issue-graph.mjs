#!/usr/bin/env node
/**
 * 問いの台帳の検査と棚卸し。
 *
 *   node .claude/scripts/issues/check-issue-graph.mjs              # 検査 (error があれば exit 1)
 *   node .claude/scripts/issues/check-issue-graph.mjs --coverage   # 棚卸し (GSC の直近 4 週と突き合わせる)
 *   node .claude/scripts/issues/check-issue-graph.mjs --coverage --weeks 8 --limit 50 --json
 *   node .claude/scripts/issues/check-issue-graph.mjs --candidates # 問いの候補 (「なぜ・理由・関係」型でどの問いの queries にも無い検索語)
 *   node .claude/scripts/issues/check-issue-graph.mjs --figures    # まだ載っていない図の配信先と、台帳どうしのずれ
 *   node .claude/scripts/issues/check-issue-graph.mjs --axes [issue:K]  # 分析の軸から引いた図の目的・型と、埋まっていない理由
 *
 * 規則の本体は issue-graph-core.mjs。形と外部キーは check-datasets が見る。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir, datasetPath } from "../../../config/datasets.mjs";
import { METRIC_DEFINITIONS_DIR } from "../../../config/paths.mjs";
import {
  classifyCoverage,
  computeReach,
  effectiveAxes,
  findQueryCandidates,
  indexPages,
  listFigureDestinations,
  parseCsv,
  READ_THRESHOLD,
  resolveAxesFigure,
  sumTraffic,
  validateIssueGraph,
} from "./issue-graph-core.mjs";
import { readDraftStates } from "./issue-draft-state.mjs";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const readJson = (rel) => JSON.parse(readFileSync(join(PROJECT_ROOT, rel), "utf8"));

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback;
};

const PAGES_DIR = datasetDir("content.pages");
const pageFiles = readdirSync(join(PROJECT_ROOT, PAGES_DIR))
  .filter((f) => f.endsWith(".json"))
  .map((f) => readJson(`${PAGES_DIR}/${f}`));
const pages = indexPages(pageFiles);
const { issues } = readJson(datasetPath("content.issues"));
const { links } = readJson(datasetPath("content.issue-links"));

if (flag("--figures")) {
  const { figures } = readJson(datasetPath("content.figures"));
  const { analyses } = readJson(datasetPath("content.analyses"));
  const drafts = readDraftStates(PROJECT_ROOT, figures);
  const rows = listFigureDestinations({ figures, analyses, posts: readJson(datasetPath("sns.posts")).posts, pages, drafts });
  if (flag("--json")) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    for (const r of rows) console.log(`${r.drift ? "!" : " "} ${r.figure} (${r.issue}) ${r.channel} ${r.target}: 台帳 ${r.status} / 実際 ${r.actual}`);
    console.log(`図の配信先: 未掲載 ${rows.length} 件 (うち ずれ ${rows.filter((r) => r.drift).length} 件。! がずれ)`);
  }
  process.exit(rows.some((r) => r.drift) ? 1 : 0);
}

if (flag("--axes")) {
  const { templates } = readJson(datasetPath("content.image-templates"));
  const metricKeys = new Set(
    readdirSync(join(PROJECT_ROOT, METRIC_DEFINITIONS_DIR)).filter((f) => f.endsWith(".ts")).map((f) => f.slice(0, -3)),
  );
  const byId = new Map(issues.map((i) => [i.id, i]));
  const prefix = args[args.indexOf("--axes") + 1]?.startsWith("issue:") ? args[args.indexOf("--axes") + 1] : "issue:";
  const rows = issues
    .filter((i) => i.status === "active" && i.id.startsWith(prefix))
    .map((issue) => ({ id: issue.id, question: issue.question, ...resolveAxesFigure({ issue, axes: effectiveAxes(issue, byId), templates, metricKeys }) }));
  if (flag("--json")) {
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  }
  const count = (g) => rows.filter((r) => r.gaps.includes(g)).length;
  for (const r of rows) console.log(`${r.gaps.length ? "!" : " "} ${r.id} ${r.purpose ?? "-"} → ${r.primary ?? "-"} (${r.allowed.join(",")}) ${r.gaps.join(",")}`);
  console.log(
    `軸: 対象 ${rows.length} 件 / 図が決まる ${rows.filter((r) => !r.gaps.length).length} / 型未定 ${count("型未定")} / 未検証 ${count("未検証")} / 粒度不足 ${count("粒度不足")} / 描画器なし ${count("描画器なし")} / 指標なし ${count("指標なし")}`,
  );
  // 書いた指標が存在しないのは台帳の誤り。ほかは埋める作業の残りなので止めない
  process.exit(count("指標なし") ? 1 : 0);
}

if (!flag("--coverage") && !flag("--candidates")) {
  const { errors, warnings } = validateIssueGraph({ issues, links, pages });
  for (const w of warnings) console.log(`! ${w}`);
  for (const e of errors) console.error(`✗ ${e}`);
  const major = issues.filter((i) => i.level === "major").length;
  console.log(
    `${errors.length ? "✗" : "✓"} issues:check: 問い ${issues.length} 件 (大 ${major} / 小 ${issues.length - major}) / 関係 ${links.length} 件 / error ${errors.length} / warning ${warnings.length}`,
  );
  process.exit(errors.length ? 1 : 0);
}

const SNAP_DIR = datasetDir("gsc.snapshots");
const weeks = option("--weeks", 4);
const limit = option("--limit", 30);
const snapshotWeeks = existsSync(join(PROJECT_ROOT, SNAP_DIR))
  ? readdirSync(join(PROJECT_ROOT, SNAP_DIR)).filter((w) => /^\d{4}-W\d{2}$/.test(w)).sort().slice(-weeks)
  : [];
const readWeeks = (name) =>
  snapshotWeeks
    .map((w) => join(PROJECT_ROOT, SNAP_DIR, w, name))
    .filter((f) => existsSync(f))
    .map((f) => parseCsv(readFileSync(f, "utf8")));
const period = snapshotWeeks.length ? `${snapshotWeeks[0]}〜${snapshotWeeks.at(-1)}` : "GSC の記録なし";

if (flag("--candidates")) {
  const candidates = findQueryCandidates({ issues, weeks: readWeeks("queries.csv") });
  if (flag("--json")) {
    console.log(JSON.stringify({ weeks: snapshotWeeks, candidates }, null, 2));
    process.exit(0);
  }
  console.log(`# 問いの候補 (${period} の GSC の検索語)
`);
  console.log(`「なぜ・理由・関係」型で、どの問いの queries にも無い語 ${candidates.length} 件のうち上位 ${Math.min(limit, candidates.length)} 件。
`);
  console.log("| 検索語 | クリック | 表示 |");
  console.log("|---|---:|---:|");
  for (const c of candidates.slice(0, limit)) console.log(`| ${c.query} | ${c.clicks} | ${c.impressions} |`);
  process.exit(0);
}

const traffic = sumTraffic(readWeeks("pages.csv"));
const reach = computeReach({ issues, links, pages });
const { byKind, orphanRead } = classifyCoverage({ pages, reach, traffic });

if (flag("--json")) {
  console.log(JSON.stringify({ weeks: snapshotWeeks, threshold: READ_THRESHOLD, byKind, orphanRead }, null, 2));
  process.exit(0);
}

console.log(`# 問いの棚卸し (${period} の GSC と突き合わせ)\n`);
console.log(`読まれている = 期間合計でクリック ${READ_THRESHOLD.clicks} 以上か表示 ${READ_THRESHOLD.impressions} 以上\n`);
console.log("| 種別 | 公開 | 紐づく | テーマ経由のみ | 紐づかないが読まれている | 紐づかず読まれていない |");
console.log("|---|---:|---:|---:|---:|---:|");
const sum = { total: 0, linked: 0, weak: 0, orphanRead: 0, orphanIdle: 0 };
for (const [kind, r] of Object.entries(byKind).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`| ${kind} | ${r.total} | ${r.linked} | ${r.weak} | ${r.orphanRead} | ${r.orphanIdle} |`);
  for (const k of Object.keys(sum)) sum[k] += r[k];
}
console.log(`| 計 | ${sum.total} | ${sum.linked} | ${sum.weak} | ${sum.orphanRead} | ${sum.orphanIdle} |`);
console.log(`\n## 紐づかないが読まれている (上位 ${Math.min(limit, orphanRead.length)} / ${orphanRead.length})\n`);
console.log("問いを足す候補。どの検索語で来ているかを見て、大きな問いの下に小さな問いとして足す。\n");
console.log("| ページ | クリック | 表示 |");
console.log("|---|---:|---:|");
for (const o of orphanRead.slice(0, limit)) console.log(`| ${o.id} ${o.title} | ${o.clicks} | ${o.impressions} |`);
