#!/usr/bin/env node
/**
 * 問いの分析を、計画・計算・反証・下書き・審査の順に進める実行役 (npm run analysis:run)。
 * 順番はコードが決める (analysis-run-core.mjs)。判断は Codex が read-only で JSON を返し、
 * 結果はファイルに置くので Claude の会話を消費しない。Claude を使うのは最終審査の 1 回だけ。
 * 公開はしない。止まったら理由を 1 行で出して終わる。
 *
 *   npm run analysis:run -- --analysis analysis:M01-factory-size [--notebooks "A,B"] [--max-steps 12] [--dry-run]
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { datasetPath } from "../../../config/datasets.mjs";
import { MAX_ROUNDS, draftBlockers, nextStep } from "./analysis-run-core.mjs";
import { reviewedArticleText } from "./analysis-cycle-core.mjs";
import { checkAnalyses } from "./check-analysis-cycle.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const HERE = ".claude/scripts/analysis";
const DEFAULT_MAX_STEPS = 12;
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const analysisId = arg("--analysis");
if (!analysisId) {
  console.error("引数: --analysis <id> [--notebooks \"A,B\"] [--max-steps N] [--dry-run]");
  process.exit(2);
}
const dryRun = process.argv.includes("--dry-run");
const maxSteps = Number(arg("--max-steps") ?? DEFAULT_MAX_STEPS);

const at = (...parts) => join(ROOT, ...parts);
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const readText = (path) => (existsSync(path) ? readFileSync(path, "utf8") : null);
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const LEDGER = at(datasetPath("content.analyses"));

const loadAnalysis = () => readJson(LEDGER).analyses.find((a) => a.id === analysisId);
function saveAnalysis(patch) {
  const ledger = readJson(LEDGER);
  Object.assign(ledger.analyses.find((a) => a.id === analysisId), patch);
  writeJson(LEDGER, ledger);
}
const first = loadAnalysis();
if (!first) {
  console.error(`台帳に無い: ${analysisId}。先に分析の台帳の行と spec を足す`);
  process.exit(2);
}

// 既存の手順と同じ .local/analysis/m01 に置く
const short = analysisId.match(/^analysis:([A-Z][0-9]{2}(?:-[0-9]+)?)/)[1].toLowerCase();
const work = at(".local/analysis", short);
mkdirSync(work, { recursive: true });
const paths = {
  frame: join(work, "frame.json"),
  plan: join(work, "plan.json"),
  research: join(work, "research.json"),
  result: join(work, "result.json"),
  run: join(work, "run.json"),
};
const slug = first.article?.slug;
const articleDir = at("contents/blog", slug ?? "");
const articlePath = join(articleDir, "article.md");
const summaryPath = join(articleDir, "data", "analysis-summary.json");
const reviewPath = join(articleDir, "review.md");
const issue = readJson(at(datasetPath("content.issues"))).issues.find((i) => i.id === first.issue);

const NEW_ROUNDS = { ledger: 0, author: 0, draft: 0 };
const saved = existsSync(paths.run) ? readJson(paths.run) : { steps: [] };
const run = { ...saved, rounds: { ...NEW_ROUNDS, ...saved.rounds } };
const saveRun = () => writeJson(paths.run, run);
const rel = (path) => relative(ROOT, path);

function shell(command, args, options = {}) {
  const done = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", shell: process.platform === "win32", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28, ...options });
  if (done.status !== 0 && !options.allowFailure) throw new Error(`${command} ${args.slice(0, 2).join(" ")}: exit ${done.status}\n${(done.stderr ?? "").slice(-1500)}`);
  return done;
}

const prompt = (name, values) => readFileSync(at(HERE, "prompts", `${name}.md`), "utf8").replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? "(なし)"));

/**
 * Codex を 1 回呼ぶ。標準入力を閉じないと背景実行で無言で止まる (2026-10 の実例)。
 * read-only なので作業ツリーを書かず、返答はファイルにだけ残す。
 */
function codex(step, text, { schema, sandbox = "read-only" }) {
  const out = join(work, `${step}.out`);
  const args = ["exec", "--json", "--ephemeral", "-s", sandbox, "-C", ROOT, "-o", out];
  if (schema) args.push("--output-schema", at(HERE, "schemas", `${schema}.schema.json`));
  const started = Date.now();
  const done = shell("codex", [...args, text], { allowFailure: true });
  const usage = done.stdout.split("\n").flatMap((line) => {
    try {
      const event = JSON.parse(line);
      return event.type === "turn.completed" ? [event.usage] : [];
    } catch {
      return [];
    }
  });
  const tokens = usage.reduce((sum, u) => sum + (u.input_tokens ?? 0) + (u.output_tokens ?? 0), 0);
  run.steps.push({ step, at: new Date().toISOString(), seconds: Math.round((Date.now() - started) / 1000), tokens, status: done.status });
  saveRun();
  if (done.status !== 0 || !existsSync(out)) throw new Error(`Codex が失敗: ${step}\n${done.stdout.slice(-800)}\n${done.stderr.slice(-800)}`);
  return readFileSync(out, "utf8");
}

const shared = () => {
  const analysis = loadAnalysis();
  return {
    question: issue.question,
    terms: (analysis.questionTerms ?? []).join("・"),
    frame: rel(paths.frame),
    spec: analysis.spec,
    script: analysis.script,
    summary: rel(summaryPath),
    plan: rel(paths.plan),
    research: existsSync(paths.research) ? rel(paths.research) : "(なし)",
    finding: analysis.finding,
    claims: JSON.stringify(analysis.claims ?? []),
    caveats: JSON.stringify(analysis.caveats ?? []),
    article: rel(articlePath),
    articleMeta: JSON.stringify(analysis.article),
  };
};
const formatFindings = (findings = []) => findings.map((f) => `- ${typeof f === "string" ? f : `[${f.severity}] ${f.text}`}`).join("\n") || "(なし)";

function figuresOf() {
  return readJson(at(datasetPath("content.figures"))).figures.filter((f) => f.analysis === analysisId);
}

const STEPS = {
  frame() {
    const analysis = loadAnalysis();
    shell("npm", ["run", "-s", "analysis:frame", "--", "--spec", analysis.spec, "--out", rel(paths.frame)]);
  },
  research() {
    // NotebookLM は白書などの論点を集めるだけで、数値の根拠にしない。使えないときは無しで進む
    const done = shell("node", [`.claude/scripts/notebooklm-cross-query.mjs`, "--json", "--notebooks", arg("--notebooks"), `${issue.question} について、先行する分析の論点、よくある読み違い、定義の注意点を出典付きで挙げてください。`], { allowFailure: true });
    writeJson(paths.research, done.status === 0 ? { answers: done.stdout } : { skipped: `exit ${done.status}` });
  },
  plan() {
    writeFileSync(paths.plan, codex("plan", prompt("plan", shared()), { schema: "plan" }));
  },
  author({ findings, round }) {
    const analysis = loadAnalysis();
    const hasScript = existsSync(at(analysis.script));
    const scope = hasScript
      ? "読むだけ。ファイルを書かない。外部へ書くコマンドを実行しない"
      : `${analysis.script} だけを書いてよい。frame.json を入力に result.json・図の SVG と JSON を出力先へ書く既存の ${HERE}/m01-factory-size.ts と同じ形にする。他のファイルを変えない`;
    const before = hasScript ? "" : shell("git", ["status", "--porcelain"]).stdout;
    const reply = codex("author", prompt("author", { ...shared(), findings: formatFindings(findings), authorScope: scope }), { schema: "author", sandbox: hasScript ? "read-only" : "workspace-write" });
    if (!hasScript) {
      const added = shell("git", ["status", "--porcelain"]).stdout.split("\n").filter((line) => line && !before.includes(line));
      const stray = added.filter((line) => !line.includes(analysis.script));
      if (stray.length) throw new Error(`Codex が範囲外を変えた:\n${stray.join("\n")}`);
    }
    const body = JSON.parse(reply);
    const clean = (claim) => Object.fromEntries(Object.entries(claim).filter(([, value]) => value !== null));
    saveAnalysis({
      finding: body.finding,
      caveats: body.caveats,
      claims: body.claims.map(clean),
      viewpoints: body.viewpoints.map((v) => ({ ...v, status: "done" })),
      observedAt: new Date().toISOString().slice(0, 10),
    });
    run.rounds[round] += 1;
    saveRun();
  },
  analyze() {
    const analysis = loadAnalysis();
    shell("npx", ["tsx", analysis.script, rel(paths.frame), rel(work)]);
    mkdirSync(join(articleDir, "data"), { recursive: true });
    const figures = figuresOf();
    if (figures.some((f) => f.chart)) {
      shell("npm", ["run", "-s", "analysis:draft", "--", "--analysis", analysisId, "--result", rel(paths.result), "--figures-only"]);
      rmSync(join(articleDir, "article.prompt.txt"), { force: true });
    } else {
      for (const file of readdirSync(work)) {
        if (/\.(svg|json)$/.test(file) && !["frame.json", "plan.json", "research.json", "result.json", "run.json"].includes(file))
          copyFileSync(join(work, file), join(articleDir, "data", file));
      }
      copyFileSync(paths.result, summaryPath);
    }
    run.scriptSha = sha256(readFileSync(at(analysis.script)));
    saveRun();
  },
  refute() {
    const body = JSON.parse(codex("refute", prompt("refute", shared()), { schema: "refute" }));
    saveAnalysis({
      refutation: {
        reviewer: "codex",
        at: new Date().toISOString().slice(0, 10),
        summarySha256: sha256(readFileSync(summaryPath)),
        checks: body.checks,
      },
    });
  },
  draft({ findings }) {
    const figures = figuresOf().map((f) => `${f.chart?.name ?? f.id}: ${f.title} / ${f.reads}`).join("\n");
    const text = codex("draft", prompt("draft", { ...shared(), figures, findings: formatFindings(findings) }), {});
    if (!text.startsWith("---\n")) throw new Error("下書きが frontmatter で始まっていない");
    writeFileSync(articlePath, text.endsWith("\n") ? text : `${text}\n`);
    saveAnalysis({ stage: "draft" });
    run.rounds.draft += 1;
    saveRun();
  },
  review() {
    const articleSha = sha256(readFileSync(articlePath));
    const body = JSON.parse(codex("review", prompt("review", shared()), { schema: "review" }));
    run.firstReview = { articleSha, ...body };
    saveRun();
  },
};

function gateBlockers() {
  const done = shell("node", [".claude/scripts/blog/quality-gate.mjs", rel(articlePath)], { allowFailure: true });
  const json = done.stdout.slice(done.stdout.indexOf("{\n"));
  try {
    return draftBlockers(JSON.parse(json).blockers ?? []);
  } catch {
    return draftBlockers([`品質ゲートの出力を読めない: ${done.stdout.slice(-300)}`]);
  }
}

function currentState() {
  const analysis = loadAnalysis();
  const article = readText(articlePath);
  const summary = readText(summaryPath);
  const review = readText(reviewPath);
  const articleSha = article ? sha256(reviewedArticleText(article)) : null;
  const cycle = checkAnalyses(slug).errors.map((e) => e.replace(`${analysisId}: `, ""));
  const ledgerErrors = cycle.filter((e) => /視点|主張|結論が問い/.test(e));
  const findings = [...(review ?? "").matchAll(/^- \[(BLOCK|MAJOR|MINOR)\](.*)$/gm)].map(([, severity, text]) => ({ severity, text: text.trim() }));
  // 規約の PASS は BLOCK が無いという意味なので、読み違いを生む MAJOR が残る本文は通さない
  const verdict = findings.some((f) => f.severity !== "MINOR") ? "REVISE" : review?.match(/^verdict:\s*(\w+)/m)?.[1];
  const reviewedSha = review?.match(/^articleSha256:\s*([0-9a-f]{64})/m)?.[1];
  return {
    frame: existsSync(paths.frame),
    wantsResearch: Boolean(arg("--notebooks")),
    research: existsSync(paths.research),
    plan: existsSync(paths.plan),
    script: existsSync(at(analysis.script)),
    summaryFresh: Boolean(summary) && run.scriptSha === sha256(readFileSync(at(analysis.script))) && existsSync(paths.result),
    ledgerReady: Boolean(summary) && ledgerErrors.length === 0,
    ledgerErrors,
    refutationFresh: analysis.refutation?.summarySha256 === (summary ? sha256(summary) : null),
    brokenClaims: (analysis.refutation?.checks ?? []).filter((c) => c.verdict === "broken").map((c) => `${c.claim}: ${c.numbers}`),
    article: Boolean(article),
    articleSha,
    gateBlockers: article ? gateBlockers() : [],
    firstReview: run.firstReview,
    finalReview: reviewedSha ? { articleSha: reviewedSha, verdict, findings } : null,
    rounds: run.rounds,
  };
}

for (let i = 0; i < maxSteps; i += 1) {
  const next = nextStep(currentState());
  if (next.stop) {
    console.log(`■ 止まった: ${next.stop} — ${next.detail}`);
    if (next.stop === "needs-final-review") console.log(`  Agent blog-critic に ${rel(articlePath)} を審査させる。review.md の frontmatter に articleSha256: ${sha256(readFileSync(articlePath))} を書かせる`);
    process.exit(next.stop === "needs-owner" ? 1 : 0);
  }
  if (next.step === "done") {
    saveAnalysis({ stage: "reviewed" });
    run.rounds = NEW_ROUNDS;
    saveRun();
    const tokens = run.steps.reduce((sum, s) => sum + (s.tokens ?? 0), 0);
    console.log(`✓ 審査まで完了。公開はしていない (Codex ${run.steps.length} 回・${tokens.toLocaleString()} トークン)`);
    process.exit(0);
  }
  console.log(`→ ${next.step}`);
  if (dryRun) process.exit(0);
  STEPS[next.step](next);
}
console.log(`■ 止まった: ${maxSteps} 手で終わらない。もう一度実行すると続きから進む (上限 ${MAX_ROUNDS} 回のやり直しは run.json が覚えている)`);
