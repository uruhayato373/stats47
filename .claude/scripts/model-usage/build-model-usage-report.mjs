#!/usr/bin/env node
/**
 * モデル使用量の週次レポートと改善提案を作る (記録→改善)。
 *
 *   node .claude/scripts/model-usage/build-model-usage-report.mjs [--stdout]
 *
 * 読む: .claude/state/metrics/model-usage/local-*.json (collect-local-usage.mjs が書く対話・agent の実績)
 *       .claude/state/metrics/claude-usage/history.csv  (CI 無人実行の実績。record-claude-usage.mjs が書く)
 *       .claude/state/metrics/model-usage/canary/*.json (run-canary.mjs が書く品質比較)
 *       .claude/agents/*.md の frontmatter (model / effort)
 *       .claude/config/{model-pricing,model-optimization-policy}.json
 * 書く: .claude/state/metrics/model-usage/latest.json (管理画面 /ops/agents と /weekly-review が読む)
 *
 * 提案は決定的な規則だけで出し、frontmatter は書き換えない。採否は canary の結果を見て人が決める。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { proposeChanges, recentWeeks, round, summarizeAgents, summarizeMain } from './usage-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const STATE = path.join(ROOT, '.claude/state/metrics/model-usage');
const rel = (p) => path.relative(ROOT, p);
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

/** agent frontmatter の name / model / effort だけ読む (1 行の値のみ) */
export function readAgents(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => {
      const head = fs.readFileSync(path.join(dir, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const field = (k) => head.match(new RegExp(`^${k}:\\s*(\\S+)\\s*$`, 'm'))?.[1] ?? null;
      return { name: field('name') ?? f.replace(/\.md$/, ''), model: field('model'), effort: field('effort') };
    });
}

/** CI の history.csv を workflow ごとに要約 (直近 n 週)。model / effort 列が無い古い行は unknown */
export function summarizeCi(csvText, windowDays, now = new Date()) {
  const lines = csvText.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const since = new Date(now.getTime() - windowDays * 86400000).toISOString().slice(0, 10);
  const map = new Map();
  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    const r = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
    if (r.date < since) continue;
    const cur = map.get(r.workflow) ?? { workflow: r.workflow, runs: 0, items: 0, costUsd: 0, errors: 0, models: {}, efforts: {} };
    cur.runs++;
    cur.items += Number(r.items) || 0;
    cur.costUsd += Number(r.cost_usd) || 0;
    cur.errors += r.is_error === '1' ? 1 : 0;
    const model = r.model || 'unknown';
    const effort = r.effort || 'unknown';
    cur.models[model] = (cur.models[model] ?? 0) + 1;
    cur.efforts[effort] = (cur.efforts[effort] ?? 0) + 1;
    map.set(r.workflow, cur);
  }
  return [...map.values()]
    .map((w) => ({ ...w, costUsd: round(w.costUsd), costPerRun: round(w.costUsd / w.runs), costPerItem: w.items ? round(w.costUsd / w.items) : null }))
    .sort((a, b) => b.costUsd - a.costUsd);
}

export function readCanaryResults(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: f, ...readJson(path.join(dir, f)) }));
}

export function buildReport({ localDocs, agents, ciCsv, canary, pricing, policy, now = new Date() }) {
  const rows = localDocs.flatMap((d) => d.rows ?? []);
  const subWeeks = recentWeeks(rows.filter((r) => r.scope === 'sub'), policy.windowWeeks);
  const mainWeeks = recentWeeks(rows.filter((r) => r.scope === 'main'), policy.windowWeeks);
  // 同じ agent × 候補の canary は最新の 1 件だけを判定に使う
  const latestCanary = [...new Map(canary.map((c) => [`${c.agent}|${c.candidate?.model}|${c.candidate?.effort ?? ''}`, c])).values()];
  const ci = ciCsv ? summarizeCi(ciCsv, policy.windowWeeks * 7, now) : [];
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    window: { weeks: policy.windowWeeks, subWeeks: [...subWeeks].sort(), mainWeeks: [...mainWeeks].sort() },
    sources: {
      local: localDocs.map((d) => ({ platform: d.platform, generatedAt: d.generatedAt, weeks: d.scan?.weeks ?? [] })),
      pricing: { source: pricing.source, observedAt: pricing.observedAt },
      ciHistory: '.claude/state/metrics/claude-usage/history.csv',
    },
    agents: summarizeAgents(rows, subWeeks).map((s) => {
      const a = agents.find((x) => x.name === s.agentType);
      return { ...s, declaredModel: a?.model ?? null, declaredEffort: a?.effort ?? null, custom: Boolean(a) };
    }),
    main: summarizeMain(rows, mainWeeks),
    ci,
    canary: latestCanary.map(({ file, agent, baseline, candidate, verdict, scores, generatedAt }) => ({ file, agent, baseline, candidate, verdict, scores, generatedAt })),
    proposals: proposeChanges({
      agents,
      rows,
      pricing,
      policy,
      canary: latestCanary.map((c) => ({ agent: c.agent, candidate: c.candidate?.model, effort: c.candidate?.effort, verdict: c.verdict })),
      ciRuns: ci,
    }),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const localDocs = fs.existsSync(STATE)
    ? fs.readdirSync(STATE).filter((f) => /^local-.+\.json$/.test(f)).map((f) => readJson(path.join(STATE, f)))
    : [];
  const ciPath = path.join(ROOT, '.claude/state/metrics/claude-usage/history.csv');
  const report = buildReport({
    localDocs,
    agents: readAgents(path.join(ROOT, '.claude/agents')),
    ciCsv: fs.existsSync(ciPath) ? fs.readFileSync(ciPath, 'utf8') : null,
    canary: readCanaryResults(path.join(STATE, 'canary')),
    pricing: readJson(path.join(ROOT, '.claude/config/model-pricing.json')),
    policy: readJson(path.join(ROOT, '.claude/config/model-optimization-policy.json')),
  });
  if (process.argv.includes('--stdout')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    fs.mkdirSync(STATE, { recursive: true });
    const out = path.join(STATE, 'latest.json');
    fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`記録: ${rel(out)} (agent ${report.agents.length}・CI ${report.ci.length}・canary ${report.canary.length}・提案 ${report.proposals.length})`);
    for (const p of report.proposals.slice(0, 10)) console.log(`  - [${p.kind}] ${p.agent}: ${p.suggested} (${p.evidence})`);
  }
}
