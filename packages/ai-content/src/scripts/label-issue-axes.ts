/**
 * label-issue-axes.ts — 問いの台帳 (data/content/issues.json) の軸 (axes) の下書きを headless `claude -p` で作る。
 *
 * 軸は 説明側 (explanatory) と 結果側 (outcome) で、それぞれ 比較・構成・変化 のどれか。
 * 図の目的と型はモデルに決めさせない (issue-graph-core.mjs の resolveAxesFigure が図の型の台帳から引く)。
 *
 *   1. データの候補はコードが決める: 答え・根拠・テーマのページが使う指標のうち問いの粒度の値を持つものと、
 *      全国の問い・家計調査を使う問いには家計調査の分析単位 (系列。年収階級・世帯類型など属性別の値)
 *   2. モデルは問いの文と候補だけを読み、軸の型・短い名前・候補からのデータを JSON で返す (約 20 件ずつ 1 回)
 *   3. 候補に無いデータ・語彙外の型は捨てて下書きへ書く。台帳は書き換えない
 *   4. --apply <下書き> で、軸がまだ無い問いにだけ台帳へ足す (人が下書きを見てから)
 *
 * --fill は、軸はあるが群の区分以外の側にデータの無い問い (--axes の「未検証」) を対象にする。
 * 軸の名前と型は台帳のままにし、--apply ではデータの無い側にだけ data を足す (書いてある軸を書き換えない)。
 *
 *   npx tsx packages/ai-content/src/scripts/label-issue-axes.ts --prefix issue:K [--fill] [--batch 22] [--model claude-sonnet] [--dry-run]
 *   npx tsx packages/ai-content/src/scripts/label-issue-axes.ts --apply .local/ci/issue-axes-<run>.json
 *
 * ユーザーの端末で実行する (Claude Code のセッション内からは Keychain を読めない)。
 * 確認: node .claude/scripts/issues/check-issue-graph.mjs --axes issue:K
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { KAKEI_ANALYSES } from "@stats47/data-configs";

import { readMetricGrains } from "../../../../.claude/scripts/issues/issue-data-grains.mjs";
import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";
import { METRIC_DEFINITIONS_DIR } from "../../../../config/paths.mjs";
import { isClaudeCliAlias, type ClaudeCliAlias } from "../services/claude-cli-output";
import { callClaudeCli } from "../services/claude-cli-runner";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const ISSUES = path.join(ROOT, datasetPath("content.issues"));
const LINKS = path.join(ROOT, datasetPath("content.issue-links"));
const PAGES_DIR = path.join(ROOT, datasetDir("content.pages"));
const METRICS_DIR = path.join(ROOT, METRIC_DEFINITIONS_DIR);
const OUT_DIR = path.join(ROOT, ".local/ci");
const PATTERNS = new Set(["compare", "compose", "change"]);
const MAX_CANDIDATES = 15;

type DataRef = { metric: string } | { series: string };
interface Axis {
  label: string;
  pattern: string;
  data?: DataRef[];
  group?: true;
}
interface Issue {
  id: string;
  question: string;
  unit: string;
  answerability: string;
  primaryTheme?: string | null;
  dataNote?: string;
  pitfall?: string;
  status: string;
  axes?: { explanatory: Axis | null; outcome: Axis };
}

const args = process.argv.slice(2);
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const readJson = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));

/** 群の区分以外の側にデータが無い (--axes の「未検証」) */
const needsData = (axis: Axis | null | undefined) => Boolean(axis) && axis?.group !== true && !axis?.data?.length;
const isUnverified = (issue: Issue) => Boolean(issue.axes) && (needsData(issue.axes?.explanatory) || needsData(issue.axes?.outcome));

if (args.includes("--apply")) {
  const draft = readJson(path.resolve(opt("--apply", ""))) as { mode?: "fill"; labels: { id: string; axes: Issue["axes"] }[] };
  const doc = readJson(ISSUES) as { issues: Issue[] };
  const byId = new Map(draft.labels.map((l) => [l.id, l.axes]));
  let added = 0;
  // 埋める: 台帳の軸の名前・型はそのままにし、データの無い側にだけ下書きのデータを足す
  const fill = (current: Axis | null, drafted: Axis | null | undefined): Axis | null =>
    current && needsData(current) && drafted?.data?.length ? { ...current, data: drafted.data } : current;
  doc.issues = doc.issues.map((issue) => {
    const axes = byId.get(issue.id);
    if (!axes) return issue;
    if (draft.mode !== "fill") {
      if (issue.axes) return issue;
      added++;
      return { ...issue, axes };
    }
    if (!issue.axes) return issue;
    const next = { explanatory: fill(issue.axes.explanatory, axes.explanatory), outcome: fill(issue.axes.outcome, axes.outcome) as Axis };
    if (JSON.stringify(next) === JSON.stringify(issue.axes)) return issue;
    added++;
    return { ...issue, axes: next };
  });
  fs.writeFileSync(ISSUES, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(
    draft.mode === "fill"
      ? `データを足した問い: ${added} 件 (データの無い側にだけ足し、書いてある軸は変えない)`
      : `台帳へ足した軸: ${added} 件 (軸がすでにある問いは触らない)`,
  );
  process.exit(0);
}

const fillMode = args.includes("--fill");

const prefix = opt("--prefix", "issue:");
const batchSize = Number(opt("--batch", "22"));
const modelArg = opt("--model", "claude-sonnet");
if (!isClaudeCliAlias(modelArg)) throw new Error(`--model は claude-haiku / claude-sonnet / claude-opus: ${modelArg}`);
const model: ClaudeCliAlias = modelArg;

const allIssues = readJson(ISSUES).issues as Issue[];
const issues = allIssues.filter(
  (i) => i.status === "active" && i.id.startsWith(prefix) && (fillMode ? isUnverified(i) : !i.axes),
);
const links = readJson(LINKS).links as { issue: string; page: string; role: string }[];
type Page = { id: string; key?: string; kind: string; rankingKeys?: string[] };
const pages = new Map<string, Page>();
for (const f of fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith(".json"))) {
  for (const p of (readJson(path.join(PAGES_DIR, f)).pages ?? []) as Page[]) pages.set(p.id, p);
}
const metricGrains = readMetricGrains(ROOT, pages);
const rankingKeysOf = (pageId: string) => {
  const p = pages.get(pageId);
  if (!p) return [];
  return p.kind === "ranking" && p.key ? [p.key] : (p.rankingKeys ?? []);
};
const titleOf = (key: string) => {
  const file = path.join(METRICS_DIR, `${key}.ts`);
  if (!fs.existsSync(file)) return null;
  return /"title":\s*"([^"]+)"/.exec(fs.readFileSync(file, "utf8"))?.[1] ?? key;
};
const parentOf = (id: string) => /^(issue:[A-Z]\d{2})-\d+$/.exec(id)?.[1];
type Candidate = { ref: DataRef; id: string; title: string };
/**
 * 指標の候補: 問いと親に張ったページ、テーマのページが使う指標のうち、問いの粒度の値を持つもの。
 * 粒度の合わない指標を候補に出さない (県の値しか無い指標で市区町村の問いに答えると書いてしまう)。
 */
const metricCandidatesOf = (issue: Issue): Candidate[] => {
  const parent = allIssues.find((i) => i.id === parentOf(issue.id));
  const ids = [issue.id, parent?.id].filter(Boolean);
  const theme = issue.primaryTheme ?? parent?.primaryTheme;
  const keys = [...links.filter((l) => ids.includes(l.issue)).flatMap((l) => rankingKeysOf(l.page)), ...(theme ? rankingKeysOf(theme) : [])];
  return [...new Set(keys)]
    .filter((k) => metricGrains.get(k)?.has(issue.unit))
    .flatMap((k) => (titleOf(k) ? [{ ref: { metric: k }, id: k, title: titleOf(k) as string }] : []))
    .slice(0, MAX_CANDIDATES);
};
/** 系列の候補: 全国の問いと、家計調査を使うと書いた問いに、家計調査の分析単位 (都市別の順位は指標で足りるので除く) */
const seriesCandidatesOf = (issue: Issue): Candidate[] =>
  issue.unit === "japan" || /家計調査/.test(issue.dataNote ?? "")
    ? KAKEI_ANALYSES.filter((a) => a.source.geography === "national").map((a) => ({ ref: { series: a.id }, id: a.id, title: a.question }))
    : [];
const candidatesOf = (issue: Issue) => ({ metrics: metricCandidatesOf(issue), series: seriesCandidatesOf(issue) });

const SYSTEM = `あなたは統計サイトの分析設計者です。問いごとに、答えるために比べる軸を JSON で返します。
- 軸は説明側 (explanatory) と結果側 (outcome)。説明側は比べる条件、結果側は評価する値。「どこが多いか」「何を多く買うか」のように条件の無い記述の問いは explanatory を null にする
- 時間 (調査年・月・制度改正の前後) は軸にしない。年の推移は結果側の pattern を change にして表し、説明側は他に条件が無ければ null にする
- 「◯◯市の世帯は何を多く買うか」のように 1 つの地域を全国と比べる問いは記述の問いなので explanatory を null にする
- 説明側が群の区分 (年収五分位・世帯類型・性別・有無・東西など) のときは "group": true を書き、metrics を書かない (その区分の系列が候補にあれば series に書く)。量の説明側 (所得水準・高齢化率など) は group を書かない
- pattern は compare (地域・品目の値の大小を比べる) / compose (全体の内訳・構成比) / change (年の推移・増減) のどれか 1 つ
- label は 20 字以内の名詞句。因果を表す語 (原因・要因・せいで) を使わない
- metrics は、その問いの「指標の候補」に載っているキーだけから選ぶ。series は「系列の候補」(年収階級・世帯類型など属性別の値) に載っている ID だけから選ぶ。候補に合うものが無ければ書かない。推測でキーや ID を作らない
- 出力は JSON 配列だけ: [{"id":"issue:..","explanatory":null|{"label":"..","pattern":"..","metrics":[..],"series":[..]}|{"label":"..","pattern":"compare","group":true,"series":[..]},"outcome":{"label":"..","pattern":"..","metrics":[..],"series":[..]}}]。前置き・コードフェンスは書かない`;

const promptOf = (batch: Issue[]) =>
  batch
    .map((i) => {
      const c = candidatesOf(i);
      return [
        `## ${i.id}`,
        `問い: ${i.question}`,
        `粒度: ${i.unit} / 言える強さ: ${i.answerability}`,
        i.dataNote ? `使う統計: ${i.dataNote}` : "",
        // 埋めるときは軸の名前と型を変えない。データを選ぶ手がかりとして渡す
        fillMode && i.axes ? `決まっている軸 (名前と型を変えずに返す): ${JSON.stringify(i.axes)}` : "",
        `指標の候補: ${c.metrics.length ? c.metrics.map((x) => `${x.id} (${x.title})`).join(" / ") : "なし"}`,
        c.series.length ? `系列の候補: ${c.series.map((x) => `${x.id} (${x.title})`).join(" / ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

/** モデルの答えを台帳の形に合わせて削る。候補に無い指標と語彙外の型は捨てる */
function clean(raw: unknown, issue: Issue): Issue["axes"] | null {
  const c = candidatesOf(issue);
  const allowedMetrics = new Set(c.metrics.map((x) => x.id));
  const allowedSeries = new Set(c.series.map((x) => x.id));
  const pick = (v: unknown, allowed: Set<string>) => [...new Set((Array.isArray(v) ? v : []).filter((k): k is string => allowed.has(k)))];
  const axis = (a: unknown): Axis | null => {
    if (!a || typeof a !== "object") return null;
    const { label, pattern, metrics, series, group } = a as { label: string; pattern: string; metrics?: unknown; series?: unknown; group?: unknown };
    if (typeof label !== "string" || !label.trim() || !PATTERNS.has(pattern)) return null;
    const seriesRefs: DataRef[] = pick(series, allowedSeries).map((id) => ({ series: id }));
    // 群の区分は指標を持たない (区分の系列だけを持てる)
    const data: DataRef[] = group === true ? seriesRefs : [...pick(metrics, allowedMetrics).map((key) => ({ metric: key })), ...seriesRefs];
    return { label: label.trim(), pattern: group === true ? "compare" : pattern, ...(group === true ? { group: true as const } : {}), ...(data.length ? { data } : {}) };
  };
  const r = raw as { explanatory?: unknown; outcome?: unknown };
  const outcome = axis(r.outcome);
  if (!outcome) return null;
  const explanatory = r.explanatory === null ? null : axis(r.explanatory);
  if (r.explanatory !== null && !explanatory) return null;
  return { explanatory, outcome };
}

const batches: Issue[][] = [];
for (let i = 0; i < issues.length; i += batchSize) batches.push(issues.slice(i, i + batchSize));
console.log(`対象 ${issues.length} 件 / ${batches.length} 回に分けて呼ぶ (${model}・effort low${fillMode ? "・データの無い側を埋める" : ""})`);
if (args.includes("--dry-run")) {
  // 候補が 1 件も無い問いは、呼んでもデータを選べない (指標の拡充か、データが無いことの記録が要る)
  const empty = issues.filter((i) => !candidatesOf(i).metrics.length && !candidatesOf(i).series.length);
  console.log(`候補のある問い ${issues.length - empty.length} 件 / 候補が 0 件の問い ${empty.length} 件`);
  console.log(`prompt 長 (1 回目): ${promptOf(batches[0] ?? []).length} 字`);
  process.exit(0);
}

async function main(): Promise<void> {
  const labels: { id: string; axes: Issue["axes"] }[] = [];
  const rejected: string[] = [];
  let cost = 0;
  for (const [n, batch] of batches.entries()) {
    const r = await callClaudeCli({ model, prompt: promptOf(batch), systemPrompt: SYSTEM, effort: "low", maxThinking: 0 });
    cost += r.costUsd;
    console.log(`  [${n + 1}/${batches.length}] in=${r.usage.inputTokens} out=${r.usage.outputTokens} cost=$${r.costUsd.toFixed(3)}`);
    let parsed: unknown[] = [];
    try {
      parsed = JSON.parse(r.text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch {
      console.log(`  JSON を読めない: ${r.text.slice(0, 200)}`);
    }
    for (const issue of batch) {
      const raw = parsed.find((p) => (p as { id?: string })?.id === issue.id);
      const axes = raw ? clean(raw, issue) : null;
      if (axes) labels.push({ id: issue.id, axes });
      else rejected.push(issue.id);
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, `issue-axes-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}.json`);
  fs.writeFileSync(out, `${JSON.stringify({ ...(fillMode ? { mode: "fill" } : {}), prefix, model, costUsd: cost, labels, rejected }, null, 2)}\n`);
  console.log(`下書き: ${out} (軸 ${labels.length} 件 / 形が合わず捨てた ${rejected.length} 件 / $${cost.toFixed(2)})`);
  console.log(`中身を見てから: npx tsx packages/ai-content/src/scripts/label-issue-axes.ts --apply ${path.relative(ROOT, out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
