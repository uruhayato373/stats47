#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { jstDateOf } from '../metrics/lib/periods.mjs';
import { hash, validateSnapshot, validateLog, reviewDue, selectKeyword, rankingMovements, recordDeployment } from './lib/keyword-cycle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export function readJson(repo, file) { return JSON.parse(fs.readFileSync(path.join(repo, file), 'utf8')); }
export function writeJson(repo, file, value) {
  const target = path.join(repo, file); fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n');
}
export function editableFile(repo, targetPath) {
  if (/^\/survey\/[a-z0-9-]+$/.test(targetPath)) return 'apps/web/src/features/survey/survey-editorial.ts';
  const match = /^\/(ranking|themes)\/([a-z0-9-]+)$/.exec(targetPath);
  if (!match) return null;
  const file = `packages/data-configs/src/${match[1] === 'ranking' ? 'metrics' : 'theme-catalog'}/${match[2]}.ts`;
  return fs.existsSync(path.join(repo, file)) ? file : null;
}
export function pageFragment(source, targetPath) {
  if (!targetPath.startsWith('/survey/')) return source;
  const key = targetPath.split('/').at(-1), ast = ts.createSourceFile('survey.ts', source, ts.ScriptTarget.Latest, true), matches = [];
  const visit = node => {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast).replace(/^['"]|['"]$/g, '') === key && ts.isObjectLiteralExpression(node.initializer)) matches.push(node.initializer.getText(ast));
    ts.forEachChild(node, visit);
  };
  visit(ast); assert.equal(matches.length, 1, 'survey target not uniquely found'); return matches[0];
}
function proposals(repo) {
  const dir = path.join(repo, 'data/seo/proposals');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => n.endsWith('.json')).map(n => readJson(repo, `data/seo/proposals/${n}`)) : [];
}
export function appendHistory(repo, snapshot, keywords, selected) {
  const index = readJson(repo, 'data/seo/rank-history.json');
  for (const item of index.snapshots) assert.equal(hash(fs.readFileSync(path.join(repo, item.file), 'utf8')), item.sha256, 'history changed');
  // A second run on the same date reuses history; it cannot revise past observations.
  if (index.snapshots.some(item => item.date === snapshot.asOf)) return;
  assert.ok(!index.snapshots.length || index.snapshots.at(-1).date < snapshot.asOf, 'history is append-only');
  const names = new Set([...keywords.map(e => e.keyword), selected?.keyword].filter(Boolean));
  const record = { ...snapshot, current: { ...snapshot.current, rows: snapshot.current.rows.filter(r => names.has(r.keyword)) },
    previous: { ...snapshot.previous, rows: snapshot.previous.rows.filter(r => names.has(r.keyword)) } };
  const file = `data/seo/rank-history/${snapshot.asOf}.json`;
  assert.ok(!fs.existsSync(path.join(repo, file)), 'existing history cannot be replaced');
  writeJson(repo, file, record);
  index.snapshots.push({ date: snapshot.asOf, file, sha256: hash(fs.readFileSync(path.join(repo, file), 'utf8')) });
  writeJson(repo, 'data/seo/rank-history.json', index);
}
export function runCycle(repo, snapshot) {
  validateSnapshot(snapshot);
  const keywords = readJson(repo, 'data/seo/keywords.json');
  const { log, verdicts } = reviewDue(readJson(repo, 'data/seo/improvement-log.json'), snapshot);
  const pending = proposals(repo).filter(p => !log.entries.some(e => e.actions.some(a => a.proposalId === p.id)));
  let selected = selectKeyword({ keywords, log, snapshot, pending });
  const selectionFile = `data/seo/selections/${snapshot.asOf}.json`;
  if (fs.existsSync(path.join(repo, selectionFile))) {
    const frozen = readJson(repo, selectionFile).selected;
    const blocked = !frozen || pending.some(p => p.keyword === frozen.keyword || p.targetPath === frozen.targetPath)
      || log.entries.some(e => (e.keyword === frozen.keyword && e.status !== 'active') || (e.targetPath === frozen.targetPath && e.status === 'observing'));
    const row = frozen && snapshot.current.rows.find(r => r.keyword === frozen.keyword && r.targetPath === frozen.targetPath);
    selected = blocked || row?.rank <= 1 ? null : { ...frozen, rank: row?.rank ?? null, impressions: row?.impressions ?? 0 };
  } else writeJson(repo, selectionFile, { date: snapshot.asOf, selected });
  if (selected) selected.editableFile = editableFile(repo, selected.targetPath);
  const report = { schemaVersion: 1, date: snapshot.asOf, period: snapshot.current.period,
    inputHash: hash(snapshot), movements: rankingMovements(snapshot), verdicts, selected,
    observing: log.entries.filter(e => e.status === 'observing').map(e => ({ keyword: e.keyword, nextReviewDate: e.nextReviewDate })),
    pendingPublication: pending.map(p => ({ keyword: p.keyword, targetPath: p.targetPath, proposalId: p.id })) };
  appendHistory(repo, snapshot, [...keywords.keywords, ...log.entries, ...pending], selected);
  writeJson(repo, 'data/seo/improvement-log.json', log);
  writeJson(repo, 'data/seo/latest-report.json', report);
  writeJson(repo, '.local/seo-rank-watch/selection.json', report);
  return report;
}
export function renderReport(report) {
  const lines = [`# キーワード7日サイクル (${report.date})`, '', `確定GSC: ${report.period.periodStart}〜${report.period.periodEnd}`, '', '## 前の7日から3順位以上の変化'];
  lines.push(...(report.movements.length ? report.movements.map(r => `- ${r.keyword}: ${r.before.toFixed(2)} → ${r.after.toFixed(2)} / 表示 ${r.beforeImpressions} → ${r.impressions} (${r.targetPath})`) : ['- 該当なし']));
  lines.push('', '## 今回の判定', ...(report.verdicts.length ? report.verdicts.map(r => `- ${r.keyword}: ${r.status} / ${r.outcome ?? r.reason}`) : ['- 期限到来の観察なし']));
  const s = report.selected;
  lines.push('', '## 今日の対象', s ? `- ${s.keyword} / ${s.targetPath} / 平均順位 ${s.rank ?? '未取得'} / 表示 ${s.impressions} / 選定順 ${s.group}` : '- 候補なし。改善を作らず終了。');
  lines.push('', '## 観察中', ...(report.observing.length ? report.observing.map(r => `- ${r.keyword}: ${r.nextReviewDate}`) : ['- なし']));
  lines.push('', '## 公開確認待ち', ...(report.pendingPublication.length ? report.pendingPublication.map(r => `- ${r.keyword}: ${r.proposalId}`) : ['- なし']), '', '順位差は観測値です。改善の因果効果や今後の順位を断定しません。');
  return lines.join('\n') + '\n';
}
async function confirmDeployment(repo, snapshot, args) {
  const get = flag => args[args.indexOf(flag) + 1];
  const runId = get('--run'); assert.match(runId, /^[0-9]+$/);
  const run = JSON.parse(execFileSync('gh', ['api', `repos/uruhayato373/stats47/actions/runs/${runId}`], { encoding: 'utf8' }));
  assert.equal(run.path, '.github/workflows/deploy-workers.yml'); assert.equal(run.conclusion, 'success'); assert.equal(run.head_branch, 'main');
  const date = jstDateOf(run.updated_at);
  let log = readJson(repo, 'data/seo/improvement-log.json');
  for (const proposal of proposals(repo)) {
    if (proposal.status !== 'proposed' || !proposal.patches?.length) continue;
    if (log.entries.some(e => e.actions.some(a => a.proposalId === proposal.id))) continue;
    try {
      const publishedProposal = JSON.parse(execFileSync('git', ['show', `${run.head_sha}:data/seo/proposals/${proposal.id}.json`], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
      assert.deepEqual(publishedProposal, proposal);
      for (const file of proposal.files) assert.equal(hash(execFileSync('git', ['show', `${run.head_sha}:${file.path}`], { cwd: repo, encoding: 'utf8' })), file.sha256);
      const response = await fetch(`https://stats47.jp${proposal.targetPath}`, { signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, 200); const html = await response.text(); assert.match(html, /<\/html>/i);
      const escaped = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
      for (const patch of proposal.patches) assert.ok(html.includes(patch.newText) || html.includes(escaped(patch.newText)), 'published copy not confirmed');
      const baseline = date === snapshot.asOf ? snapshot : readJson(repo, `data/seo/rank-history/${date}.json`);
      log = recordDeployment(log, proposal, baseline, { date, sha: run.head_sha, runUrl: run.html_url });
    } catch { console.log(`Publication not confirmed: ${proposal.id}; observation has not started.`); }
  }
  writeJson(repo, 'data/seo/improvement-log.json', log);
}
export function checkKeywordState(repo, base = null) {
    validateLog(readJson(repo, 'data/seo/improvement-log.json'));
    for (const item of readJson(repo, 'data/seo/rank-history.json').snapshots) assert.equal(hash(fs.readFileSync(path.join(repo, item.file), 'utf8')), item.sha256);
    if (base) {
      for (const entry of readJson(repo, 'data/seo/improvement-log.json').entries.filter(e => e.status === 'observing')) {
        const file = editableFile(repo, entry.targetPath) ?? entry.actions.at(-1)?.files?.[0]?.path; if (!file) continue;
        const before = execFileSync('git', ['show', `${base}:${file}`], { cwd: repo, encoding: 'utf8' });
        assert.equal(pageFragment(fs.readFileSync(path.join(repo, file), 'utf8'), entry.targetPath), pageFragment(before, entry.targetPath), `observing keyword cannot be improved: ${entry.keyword}`);
      }
      const old = execFileSync('git', ['ls-tree', '--name-only', base, 'data/seo/rank-history.json'], { cwd: repo, encoding: 'utf8' }).trim();
      if (old) {
        const before = JSON.parse(execFileSync('git', ['show', `${base}:data/seo/rank-history.json`], { cwd: repo, encoding: 'utf8' }));
        assert.deepEqual(readJson(repo, 'data/seo/rank-history.json').snapshots.slice(0, before.snapshots.length), before.snapshots, 'past history index changed');
        for (const item of before.snapshots) assert.equal(hash(execFileSync('git', ['show', `${base}:${item.file}`], { cwd: repo, encoding: 'utf8' })), hash(fs.readFileSync(path.join(repo, item.file), 'utf8')), 'past rank data changed');
        const beforeLog = JSON.parse(execFileSync('git', ['show', `${base}:data/seo/improvement-log.json`], { cwd: repo, encoding: 'utf8' }));
        const currentLog = readJson(repo, 'data/seo/improvement-log.json');
        for (const previous of beforeLog.entries) {
          const current = currentLog.entries.find(e => e.keyword === previous.keyword); assert.ok(current, 'keyword history removed');
          assert.deepEqual(current.actions.slice(0, previous.actions.length), previous.actions, 'past actions changed');
          assert.deepEqual((current.reviews ?? []).slice(0, (previous.reviews ?? []).length), previous.reviews ?? [], 'past reviews changed');
          if (previous.status === 'achieved') assert.equal(current.status, 'achieved');
        }
      }
    }
    return true;
}
async function main() {
  const args = process.argv.slice(2), command = args[0] ?? 'run';
  const repo = args.includes('--repo') ? path.resolve(args[args.indexOf('--repo') + 1]) : ROOT;
  if (command === 'check') {
    checkKeywordState(repo, args.includes('--base') ? args[args.indexOf('--base') + 1] : null);
    console.log('Keyword state and immutable history verified'); return;
  }
  const snapshot = readJson(repo, '.local/seo-rank-watch/gsc.json'); validateSnapshot(snapshot);
  if (command === 'deployment') await confirmDeployment(repo, snapshot, args);
  else assert.equal(command, 'run');
  const report = runCycle(repo, snapshot); console.log(renderReport(report));
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `selected=${!!report.selected}\n`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
