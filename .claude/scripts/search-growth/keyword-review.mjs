#!/usr/bin/env node
/** The reviewer can only read/search. Trusted code applies bounded text changes. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { hash, METHODS } from './lib/keyword-cycle.mjs';
import { editableFile, readJson, writeJson } from './keyword-cycle.mjs';

const COPY_PROPERTIES = new Set(['seoTitle', 'seoDescription', 'title', 'description', 'intro', 'summary', 'question', 'answer']);
const PROPERTY_METHOD = { seoTitle: 'title', title: 'title', seoDescription: 'description', description: 'description', intro: 'intro', summary: 'content', question: 'faq', answer: 'faq' };
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const meaningful = text => typeof text === 'string' && text.trim().length >= 20 && !/^(test|todo|placeholder|テスト|仮データ)\b/i.test(text.trim());
function successfulUses(entries) {
  const parts = entries.flatMap(e => Array.isArray(e.message?.content) ? e.message.content : []);
  const returned = new Set(parts.filter(p => p.type === 'tool_result' && !p.is_error).map(p => p.tool_use_id));
  return parts.filter(p => p.type === 'tool_use' && returned.has(p.id));
}
export function validateReview(entries, selection) {
  const result = entries.findLast(e => e.type === 'result');
  assert.ok(result?.subtype === 'success' && !result.is_error, 'review did not finish');
  const report = result.structured_output;
  assert.ok(report && ['proposed', 'no-change', 'implementation-needed', 'needs-approval'].includes(report.status));
  assert.equal(report.keyword, selection.keyword); assert.equal(report.targetPath, selection.targetPath);
  assert.ok(meaningful(report.needs) && meaningful(report.gap) && meaningful(report.done));
  assert.ok(Array.isArray(report.competitors) && report.competitors.length >= 1 && report.competitors.length <= 3);
  const uses = successfulUses(entries);
  assert.ok(uses.some(u => u.name === 'WebSearch'), 'fresh WebSearch evidence required');
  for (const competitor of report.competitors) {
    assert.ok(meaningful(competitor.findings));
    const url = new URL(competitor.url); assert.equal(url.protocol, 'https:');
    assert.ok(uses.some(u => u.name === 'WebFetch' && u.input?.url === competitor.url), 'competitor not read');
  }
  assert.ok(uses.some(u => u.name === 'WebFetch' && u.input?.url === `https://stats47.jp${selection.targetPath}`), 'target page not read');
  assert.ok(Array.isArray(report.patches) && report.patches.length <= 3);
  if (report.status === 'proposed') {
    assert.ok(METHODS.includes(report.method));
    assert.notEqual(report.method, selection.previousMethod, 'no-effect method must change');
    assert.ok(report.patches.length > 0, 'no patch is not an improvement');
    const actualMethods = report.patches.map(p => PROPERTY_METHOD[p.property]);
    assert.ok(actualMethods.includes(report.method), 'method must describe the actual changed property');
    for (const previous of selection.previousMethods ?? [selection.previousMethod]) assert.ok(!actualMethods.includes(previous), 'previous failed method cannot be relabeled');
  } else assert.equal(report.patches.length, 0, 'unapproved proposals cannot edit');
  return report;
}
export function applyTextPatches(source, patches, targetPath) {
  let output = source;
  for (const patch of patches) {
    assert.ok(COPY_PROPERTIES.has(patch.property), 'only existing editorial text can change');
    assert.ok(typeof patch.oldText === 'string' && meaningful(patch.newText) && patch.newText.length <= 900);
    assert.notEqual(patch.oldText, patch.newText);
    assert.ok(!/<\/?[a-z]|noindex|javascript:|\brobots\b/i.test(patch.newText), 'markup/indexing changes require approval');
    const ast = ts.createSourceFile('page.ts', output, ts.ScriptTarget.Latest, true);
    const matches = [];
    const visit = node => {
      if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && node.text === patch.oldText && ts.isPropertyAssignment(node.parent)) {
        const name = node.parent.name.getText(ast).replace(/^['"]|['"]$/g, '');
        let allowed = name === patch.property;
        if (targetPath.startsWith('/survey/')) {
          const key = targetPath.split('/').at(-1); let cursor = node.parent; allowed = false;
          while (cursor) {
            if (ts.isPropertyAssignment(cursor) && cursor.name.getText(ast).replace(/^['"]|['"]$/g, '') === key) { allowed = name === patch.property; break; }
            cursor = cursor.parent;
          }
        }
        if (allowed) matches.push(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast); assert.equal(matches.length, 1, 'patch must address one existing string in the selected page');
    const node = matches[0]; output = output.slice(0, node.getStart(ast)) + JSON.stringify(patch.newText) + output.slice(node.end);
  }
  return output;
}
export function prepareProposal(repo, entries, input, id) {
  assert.match(id, /^[0-9]+-[0-9]+$/);
  const selected = input.selected; assert.ok(selected, 'no candidate');
  const report = validateReview(entries, selected);
  const proposal = { schemaVersion: 1, id, ...report, selectedAt: input.date, inputHash: input.inputHash, methods: [...new Set(report.patches.map(p => PROPERTY_METHOD[p.property]))], files: [] };
  if (report.status === 'proposed') {
    const file = editableFile(repo, selected.targetPath); assert.ok(file && file === selected.editableFile, 'target requires owner implementation');
    const before = fs.readFileSync(path.join(repo, file), 'utf8');
    const after = applyTextPatches(before, report.patches, selected.targetPath);
    fs.writeFileSync(path.join(repo, file), after);
    proposal.files.push({ path: file, beforeSha256: hash(before), sha256: hash(after) });
  }
  writeJson(repo, '.local/seo-rank-watch/review.json', proposal);
  writeJson(repo, 'data/seo/latest-review.json', proposal);
  if (report.status !== 'no-change') writeJson(repo, `data/seo/proposals/${id}.json`, proposal);
  const body = [`キーワード: ${report.keyword}`, `対象: ${report.targetPath}`, `GSC平均順位: ${selected.rank ?? '未取得'} / 表示回数: ${selected.impressions}`, '',
    `検索ニーズ: ${report.needs}`, '', `不足: ${report.gap}`, '', `実施内容: ${report.done}`, '',
    ...report.competitors.map(c => `- [比較したページ](${c.url}): ${c.findings}`), '',
    report.status === 'proposed' ? '1キーワードの既存テキストだけを変更しました。公開の実測確認後に7日観察を開始します。' : report.status === 'no-change' ? '必要な改善が見つからなかったため変更はありません。' : report.status === 'needs-approval' ? 'noindexまたは大きい構造変更を含むため承認が必要です。サイトの内容は変更していません。' : '置換処理の対象外となる実装を、このキーワードの担当へ引き継ぐ提案です。サイト変更は未実施です。',
    '順位改善は予測せず、公開後の確定7日GSCで次回判定します。'];
  fs.writeFileSync(path.join(repo, '.local/seo-rank-watch/review-body.md'), body.join('\n') + '\n');
  fs.writeFileSync(path.join(repo, '.local/seo-rank-watch/proposal-paths.txt'), [...proposal.files.map(f => f.path), 'data/seo/latest-review.json', ...(report.status !== 'no-change' ? [`data/seo/proposals/${id}.json`] : [])].join('\n') + '\n');
  return proposal;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const proposal = prepareProposal(ROOT, JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), readJson(ROOT, '.local/seo-rank-watch/selection.json'), process.argv[3]);
  console.log(`${proposal.status}: ${proposal.keyword}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `proposal=${proposal.status !== 'no-change'}\ncode_changed=${proposal.files.length > 0}\n`);
}
