/**
 * label-issue-axes.ts — 問いの台帳 (data/content/issues.json) の軸 (axes) の下書きを headless `claude -p` で作る。
 *
 * 軸は 説明側 (explanatory) と 結果側 (outcome) で、それぞれ 比較・構成・変化 のどれか。
 * 図の目的と型はモデルに決めさせない (issue-graph-core.mjs の resolveAxesFigure が図の型の台帳から引く)。
 *
 *   1. 指標の候補はコードが決める: 答えのページと根拠のページが使う指標キー (data/content/pages の rankingKeys)
 *   2. モデルは問いの文と候補だけを読み、軸の型・短い名前・候補からの指標を JSON で返す (約 20 件ずつ 1 回)
 *   3. 候補に無い指標・語彙外の型は捨てて下書きへ書く。台帳は書き換えない
 *   4. --apply <下書き> で、軸がまだ無い問いにだけ台帳へ足す (人が下書きを見てから)
 *
 *   npx tsx packages/ai-content/src/scripts/label-issue-axes.ts --prefix issue:K [--batch 22] [--model claude-sonnet] [--dry-run]
 *   npx tsx packages/ai-content/src/scripts/label-issue-axes.ts --apply .local/ci/issue-axes-<run>.json
 *
 * ユーザーの端末で実行する (Claude Code のセッション内からは Keychain を読めない)。
 * 確認: node .claude/scripts/issues/check-issue-graph.mjs --axes issue:K
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

interface Axis {
  label: string;
  pattern: string;
  metrics?: string[];
}
interface Issue {
  id: string;
  question: string;
  unit: string;
  answerability: string;
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

if (args.includes("--apply")) {
  const draft = readJson(path.resolve(opt("--apply", ""))) as { labels: { id: string; axes: Issue["axes"] }[] };
  const doc = readJson(ISSUES) as { issues: Issue[] };
  const byId = new Map(draft.labels.map((l) => [l.id, l.axes]));
  let added = 0;
  doc.issues = doc.issues.map((issue) => {
    const axes = byId.get(issue.id);
    if (!axes || issue.axes) return issue;
    added++;
    return { ...issue, axes };
  });
  fs.writeFileSync(ISSUES, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`台帳へ足した軸: ${added} 件 (軸がすでにある問いは触らない)`);
  process.exit(0);
}

const prefix = opt("--prefix", "issue:");
const batchSize = Number(opt("--batch", "22"));
const modelArg = opt("--model", "claude-sonnet");
if (!isClaudeCliAlias(modelArg)) throw new Error(`--model は claude-haiku / claude-sonnet / claude-opus: ${modelArg}`);
const model: ClaudeCliAlias = modelArg;

const issues = (readJson(ISSUES).issues as Issue[]).filter((i) => i.status === "active" && i.id.startsWith(prefix) && !i.axes);
const links = readJson(LINKS).links as { issue: string; page: string; role: string }[];
const rankingKeysOf = new Map<string, string[]>();
for (const f of fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith(".json"))) {
  for (const p of (readJson(path.join(PAGES_DIR, f)).pages ?? []) as { id: string; key?: string; kind: string; rankingKeys?: string[] }[]) {
    rankingKeysOf.set(p.id, p.kind === "ranking" && p.key ? [p.key] : (p.rankingKeys ?? []));
  }
}
const titleOf = (key: string) => {
  const file = path.join(METRICS_DIR, `${key}.ts`);
  if (!fs.existsSync(file)) return null;
  return /"title":\s*"([^"]+)"/.exec(fs.readFileSync(file, "utf8"))?.[1] ?? key;
};
const parentOf = (id: string) => /^(issue:[A-Z]\d{2})-\d+$/.exec(id)?.[1];
const candidatesOf = (issue: Issue) => {
  const ids = [issue.id, parentOf(issue.id)].filter(Boolean);
  const keys = links.filter((l) => ids.includes(l.issue)).flatMap((l) => rankingKeysOf.get(l.page) ?? []);
  return [...new Set(keys)].flatMap((k) => (titleOf(k) ? [{ key: k, title: titleOf(k) as string }] : [])).slice(0, MAX_CANDIDATES);
};

const SYSTEM = `あなたは統計サイトの分析設計者です。問いごとに、答えるために比べる軸を JSON で返します。
- 軸は説明側 (explanatory) と結果側 (outcome)。説明側は比べる条件、結果側は評価する値。「どこが多いか」「何を多く買うか」のように条件の無い記述の問いは explanatory を null にする
- 時間 (調査年・月・制度改正の前後) は軸にしない。年の推移は結果側の pattern を change にして表し、説明側は他に条件が無ければ null にする
- 「◯◯市の世帯は何を多く買うか」のように 1 つの地域を全国と比べる問いは記述の問いなので explanatory を null にする
- 説明側が群の区分 (年収五分位・世帯類型・東西など) のときは metrics を書かない。指標の値で地域を並べる説明側だけが metrics を持つ
- pattern は compare (地域・品目の値の大小を比べる) / compose (全体の内訳・構成比) / change (年の推移・増減) のどれか 1 つ
- label は 20 字以内の名詞句。因果を表す語 (原因・要因・せいで) を使わない
- metrics は、その問いの「指標の候補」に載っているキーだけから選ぶ。候補に合うものが無ければ metrics を書かない。推測でキーを作らない
- 出力は JSON 配列だけ: [{"id":"issue:..","explanatory":null|{"label":"..","pattern":"..","metrics":[..]},"outcome":{"label":"..","pattern":"..","metrics":[..]}}]。前置き・コードフェンスは書かない`;

const promptOf = (batch: Issue[]) =>
  batch
    .map((i) => {
      const c = candidatesOf(i);
      return [
        `## ${i.id}`,
        `問い: ${i.question}`,
        `粒度: ${i.unit} / 言える強さ: ${i.answerability}`,
        i.dataNote ? `使う統計: ${i.dataNote}` : "",
        `指標の候補: ${c.length ? c.map((x) => `${x.key} (${x.title})`).join(" / ") : "なし"}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

/** モデルの答えを台帳の形に合わせて削る。候補に無い指標と語彙外の型は捨てる */
function clean(raw: unknown, issue: Issue): Issue["axes"] | null {
  const allowed = new Set(candidatesOf(issue).map((c) => c.key));
  const axis = (a: unknown): Axis | null => {
    if (!a || typeof a !== "object") return null;
    const { label, pattern, metrics } = a as Axis;
    if (typeof label !== "string" || !label.trim() || !PATTERNS.has(pattern)) return null;
    const kept = (Array.isArray(metrics) ? metrics : []).filter((k) => allowed.has(k));
    return { label: label.trim(), pattern, ...(kept.length ? { metrics: [...new Set(kept)] } : {}) };
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
console.log(`対象 ${issues.length} 件 / ${batches.length} 回に分けて呼ぶ (${model}・effort low)`);
if (args.includes("--dry-run")) {
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
  fs.writeFileSync(out, `${JSON.stringify({ prefix, model, costUsd: cost, labels, rejected }, null, 2)}\n`);
  console.log(`下書き: ${out} (軸 ${labels.length} 件 / 形が合わず捨てた ${rejected.length} 件 / $${cost.toFixed(2)})`);
  console.log(`中身を見てから: npx tsx packages/ai-content/src/scripts/label-issue-axes.ts --apply ${path.relative(ROOT, out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
