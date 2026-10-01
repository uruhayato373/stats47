#!/usr/bin/env node
/**
 * モデル / effort の canary 比較 (改善サイクルの品質ゲート)。
 *
 *   node .claude/scripts/model-usage/run-canary.mjs --agent code-reviewer \
 *     --model claude-sonnet-5-5 [--effort high] \
 *     [--baseline-model opus] [--baseline-effort xhigh] [--repeats 2] [--dry-run]
 *
 * 同じ fixture (答えの分かっている試験課題) を baseline と candidate の設定で headless claude に解かせ、
 * 正解を見つけた割合 (recall) と API 換算費用を比べる。採点は正規表現だけで行い、モデルに採点させない。
 * 合格条件は .claude/config/model-optimization-policy.json の canary 節。
 *
 * 読む: .claude/scripts/model-usage/canary-fixtures/<agent>.json
 * 書く: .claude/state/metrics/model-usage/canary/<日付>-<agent>-<candidate>.json (採点結果と費用だけ。本文は書かない)
 *       .local/model-canary/<同名>/ (生の出力。人が採点の妥当性を確かめる用・git 管理しない)
 *
 * ★費用が掛かる (headless claude を repeats×2 回起動する)。fixture は tools なしで解ける自己完結の課題にし、
 *   hooks と MCP を切って実行する (`--tools "" --strict-mcp-config` + disableAllHooks)。
 * ★baseline を省くと agent frontmatter の model と、policy の canary.baselineEffort を使う。
 * ★採点器 (fixture の expected) を直したら `--rescore <結果 json>` で保存済みの生出力を採点し直す (Claude は呼ばない)。
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const FIXTURES = path.join(ROOT, '.claude/scripts/model-usage/canary-fixtures');
const OUT_DIR = path.join(ROOT, '.claude/state/metrics/model-usage/canary');
const RAW_DIR = path.join(ROOT, '.local/model-canary');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** 出力テキストが fixture の各正解に当たったか。パターンは大文字小文字を区別しない */
export function scoreOutput(text, expected) {
  const hits = expected.map((e) => ({ id: e.id, hit: e.anyOf.some((p) => new RegExp(p, 'i').test(text)) }));
  return { hits, recall: hits.length ? hits.filter((h) => h.hit).length / hits.length : 0 };
}

/** fixture の課題一覧。cases が無い旧形式 (prompt + expected が 1 つ) も 1 件の case として扱う */
export function fixtureCases(fixture) {
  return fixture.cases ?? [{ id: 'default', prompt: fixture.prompt, expected: fixture.expected }];
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** baseline と candidate の採点から判定する (決定的) */
export function judge(baseline, candidate, rules) {
  const b = { recall: mean(baseline.map((r) => r.recall)), cost: mean(baseline.map((r) => r.costUsd ?? 0)) };
  const c = { recall: mean(candidate.map((r) => r.recall)), cost: mean(candidate.map((r) => r.costUsd ?? 0)) };
  if ([...baseline, ...candidate].some((r) => r.isError)) return { verdict: 'error', baseline: b, candidate: c };
  if (c.recall < b.recall - rules.maxRecallDrop) return { verdict: 'fail-quality', baseline: b, candidate: c };
  if (b.cost > 0 && c.cost > b.cost * rules.maxCostRatio) return { verdict: 'fail-cost', baseline: b, candidate: c };
  return { verdict: 'pass', baseline: b, candidate: c };
}

function runOnce({ agent, model, effort, prompt }) {
  const args = [
    '-p', prompt,
    '--agent', agent,
    '--model', model,
    ...(effort ? ['--effort', effort] : []),
    '--tools', '',
    '--strict-mcp-config',
    '--no-session-persistence',
    '--setting-sources', 'project',
    '--settings', '{"disableAllHooks":true}',
    '--output-format', 'json',
  ];
  const res = spawnSync('claude', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 15 * 60 * 1000 });
  try {
    const j = JSON.parse(res.stdout);
    return {
      isError: j.is_error === true,
      text: typeof j.result === 'string' ? j.result : '',
      costUsd: typeof j.total_cost_usd === 'number' ? j.total_cost_usd : null,
      durationMs: j.duration_ms ?? null,
      models: Object.keys(j.modelUsage ?? {}),
      outputTokens: j.usage?.output_tokens ?? null,
    };
  } catch {
    return { isError: true, text: `${res.stdout ?? ''}\n${res.stderr ?? ''}`.slice(0, 2000), costUsd: null, durationMs: null, models: [], outputTokens: null };
  }
}

function agentModel(agent) {
  const md = fs.readFileSync(path.join(ROOT, '.claude/agents', `${agent}.md`), 'utf8');
  return md.match(/^model:\s*(\S+)/m)?.[1] ?? 'inherit';
}

/** 保存済みの生出力を今の fixture で採点し直す。費用・時間・モデルは元の記録をそのまま使う */
export function rescore(doc, fixture, readRaw, policy) {
  const cases = fixtureCases(fixture);
  const runs = {};
  for (const side of ['baseline', 'candidate']) {
    runs[side] = doc.runs[side].map((run, i) => {
      const hits = cases.flatMap((c) => scoreOutput(readRaw(side, i + 1, c.id), c.expected).hits.map((h) => ({ ...h, id: `${c.id}/${h.id}` })));
      return { ...run, hits, recall: hits.filter((h) => h.hit).length / hits.length };
    });
  }
  const j = judge(runs.baseline, runs.candidate, policy);
  return {
    ...doc,
    fixture: { ...doc.fixture, version: fixture.fixtureVersion, expected: cases.flatMap((c) => c.expected.map((e) => `${c.id}/${e.id}`)) },
    rules: { maxRecallDrop: policy.maxRecallDrop, maxCostRatio: policy.maxCostRatio },
    verdict: j.verdict,
    scores: { baseline: j.baseline, candidate: j.candidate },
    runs,
    rescoredAt: new Date().toISOString(),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) && process.argv.includes('--rescore')) {
  const file = path.resolve(arg('--rescore'));
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, doc.fixture.file), 'utf8'));
  const policy = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude/config/model-optimization-policy.json'), 'utf8')).canary;
  const rawDir = path.join(ROOT, doc.raw);
  const next = rescore(doc, fixture, (side, n, caseId) => fs.readFileSync(path.join(rawDir, `${side}-${n}-${caseId}.md`), 'utf8'), policy);
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`採点し直し (fixture v${doc.fixture.version} → v${fixture.fixtureVersion}): ${doc.verdict} → ${next.verdict} / recall ${next.scores.baseline.recall} → ${next.scores.candidate.recall}`);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const agent = arg('--agent');
  const candidateModel = arg('--model');
  if (!agent || !candidateModel) {
    console.error('usage: run-canary.mjs --agent <name> --model <candidate> [--effort e] [--baseline-model m] [--baseline-effort e] [--repeats n] [--dry-run]');
    process.exit(2);
  }
  const fixturePath = path.join(FIXTURES, `${agent}.json`);
  if (!fs.existsSync(fixturePath)) {
    console.error(`fixture が無い: ${path.relative(ROOT, fixturePath)}。答えの分かっている課題を先に作る (code-reviewer.json が見本)`);
    process.exit(2);
  }
  const policy = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude/config/model-optimization-policy.json'), 'utf8')).canary;
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const repeats = Number(arg('--repeats', policy.repeats));
  const baseline = { model: arg('--baseline-model', agentModel(agent)), effort: arg('--baseline-effort', policy.baselineEffort) };
  const candidate = { model: candidateModel, effort: arg('--effort', baseline.effort) };
  const date = new Date().toISOString().slice(0, 10);
  // 現行側も名前に入れる (同じ日に現行を変えて比べ直すと上書きされるため)
  const slug = `${date}-${agent}-${baseline.model}-${baseline.effort ?? 'inherit'}-vs-${candidate.model}-${candidate.effort ?? 'inherit'}`;
  const cases = fixtureCases(fixture);

  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify({ agent, fixtureVersion: fixture.fixtureVersion, cases: cases.map((c) => c.id), baseline, candidate, repeats, claudeCalls: repeats * 2 * cases.length, out: path.join(path.relative(ROOT, OUT_DIR), `${slug}.json`) }, null, 2));
    process.exit(0);
  }

  const results = { baseline: [], candidate: [] };
  fs.mkdirSync(path.join(RAW_DIR, slug), { recursive: true });
  for (let i = 0; i < repeats; i++) {
    for (const [side, cfg] of Object.entries({ baseline, candidate })) {
      // 1 回 = 全 case を解く。recall は全 case の正解をまとめた割合、費用は合計
      const perCase = cases.map((c) => {
        const r = runOnce({ agent, ...cfg, prompt: c.prompt });
        fs.writeFileSync(path.join(RAW_DIR, slug, `${side}-${i + 1}-${c.id}.md`), r.text);
        return { id: c.id, r, s: scoreOutput(r.text, c.expected) };
      });
      const hits = perCase.flatMap((x) => x.s.hits.map((h) => ({ ...h, id: `${x.id}/${h.id}` })));
      const run = {
        hits,
        recall: hits.filter((h) => h.hit).length / hits.length,
        isError: perCase.some((x) => x.r.isError),
        costUsd: perCase.reduce((n, x) => n + (x.r.costUsd ?? 0), 0),
        durationMs: perCase.reduce((n, x) => n + (x.r.durationMs ?? 0), 0),
        models: [...new Set(perCase.flatMap((x) => x.r.models))],
        outputTokens: perCase.reduce((n, x) => n + (x.r.outputTokens ?? 0), 0),
      };
      results[side].push(run);
      console.log(`${side} #${i + 1}: recall ${run.recall.toFixed(2)} cost $${run.costUsd.toFixed(4)} models ${run.models.join('+')}${run.isError ? ' ERROR' : ''}`);
    }
  }
  const j = judge(results.baseline, results.candidate, policy);
  const doc = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    agent,
    fixture: { file: path.relative(ROOT, fixturePath), version: fixture.fixtureVersion, expected: cases.flatMap((c) => c.expected.map((e) => `${c.id}/${e.id}`)) },
    baseline,
    candidate,
    repeats,
    rules: { maxRecallDrop: policy.maxRecallDrop, maxCostRatio: policy.maxCostRatio },
    verdict: j.verdict,
    scores: { baseline: j.baseline, candidate: j.candidate },
    runs: results,
    raw: path.relative(ROOT, path.join(RAW_DIR, slug)),
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, `${slug}.json`);
  fs.writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`判定 ${j.verdict}: recall ${j.baseline.recall} → ${j.candidate.recall} / 費用 $${j.baseline.cost?.toFixed(4)} → $${j.candidate.cost?.toFixed(4)}`);
  console.log(`記録: ${path.relative(ROOT, out)}`);
}
