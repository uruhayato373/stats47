#!/usr/bin/env node
/** Fetch our selected public page, never a search-results page. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { hash } from './lib/keyword-cycle.mjs';
import { readJson, writeJson } from './keyword-cycle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DIR = '.local/seo-rank-watch';
export function pageText(html) {
  assert.match(html, /<\/html>/i, 'incomplete public HTML');
  const dom = new JSDOM(html), doc = dom.window.document;
  try {
    const main = doc.querySelector('main'); assert.ok(main && doc.querySelector('h1'), 'public page body missing');
    for (const node of main.querySelectorAll('script,style,noscript')) node.remove();
    return [doc.title, doc.querySelector('meta[name="description"]')?.content ?? '', main.textContent.replace(/\s+/g, ' ').trim(),
      ...[...main.querySelectorAll('a[href]')].map(a => `${a.textContent.trim()}: ${a.getAttribute('href')}`)].join('\n') + '\n';
  } finally { dom.window.close(); }
}
export async function capturePage(repo, input, request = fetch) {
  assert.ok(input.selected, 'no selected keyword');
  const url = `https://stats47.jp${input.selected.targetPath}`;
  const response = await request(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, 'selected public page unavailable');
  assert.match(response.headers.get('content-type') ?? '', /text\/html/i);
  const html = await response.text(), text = pageText(html);
  const record = { url, status: response.status, fetchedAt: new Date().toISOString(), inputHash: input.inputHash,
    htmlFile: `${DIR}/target-page.html`, htmlSha256: hash(html), textFile: `${DIR}/target-page.txt`, textSha256: hash(text) };
  fs.mkdirSync(path.join(repo, DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, record.htmlFile), html); fs.writeFileSync(path.join(repo, record.textFile), text);
  writeJson(repo, `${DIR}/target-page.json`, record); return record;
}
export function validatePageEvidence(repo, input) {
  const record = readJson(repo, `${DIR}/target-page.json`);
  assert.equal(record.url, `https://stats47.jp${input.selected.targetPath}`); assert.equal(record.status, 200);
  assert.equal(record.inputHash, input.inputHash, 'target capture belongs to another selection');
  assert.equal(record.htmlFile, `${DIR}/target-page.html`); assert.equal(record.textFile, `${DIR}/target-page.txt`);
  const html = fs.readFileSync(path.join(repo, record.htmlFile), 'utf8');
  assert.equal(hash(html), record.htmlSha256); assert.equal(hash(pageText(html)), record.textSha256);
  assert.equal(hash(fs.readFileSync(path.join(repo, record.textFile), 'utf8')), record.textSha256); return record;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  capturePage(ROOT, readJson(ROOT, `${DIR}/selection.json`)).then(r => console.log(`Public page verified: ${r.url} (HTTP ${r.status})`))
    .catch(e => { console.error(e.message); process.exitCode = 1; });
}
