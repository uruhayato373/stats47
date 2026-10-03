#!/usr/bin/env node
/** Verify ledger-owned private bytes and public cover identity. No local manifest or image dependency. */
import fs from 'node:fs';
import path from 'node:path';
import { COVER_ROOT, readCoverLedger, updateCoverLedger, recordCoverObservation, coverUrlPath } from './lib/cover-assets.mjs';
import { readStoredCover, createCoverStore, fetchNoteDetail } from './lib/cover-storage.mjs';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--keys' || !args[1]))
  throw Error('Usage: verify-cover-refresh.mjs [--keys key1,key2] (ledger-based; import old manifests with note:assets import)');
const keys = new Set(args[1]?.split(',') ?? []);
const ledger = readCoverLedger();
if ([...keys].some((key) => !ledger.articles.some((a) => a.articleKey === key))) throw Error('unknown article key');
const selected = ledger.articles.filter((a) => a.noteUrl && (!keys.size || keys.has(a.articleKey)));
const store = createCoverStore();
const state = path.join(COVER_ROOT, '.claude/state/metrics');
const journals = fs.readdirSync(state).filter((name) => /^note-cover-refresh-ledger-[a-f0-9]+\.json$/.test(name))
  .flatMap((name) => {
    const journal = JSON.parse(fs.readFileSync(path.join(state, name), 'utf8'));
    if (journal.account !== 'stats47') throw Error('journal account mismatch');
    return journal.articles;
  });
const checks = [], observations = [];
let cursor = 0;
await Promise.all(Array.from({ length: Math.min(4, selected.length) }, async () => {
  while (cursor < selected.length) {
    const row = selected[cursor++];
    try {
      for (const revision of row.revisions) await readStoredCover(revision, store);
      const detail = await fetchNoteDetail(row.noteUrl.split('/').at(-1));
      const observedAt = new Date().toISOString();
      observations.push({ key: row.articleKey, noteUrl: row.noteUrl, status: detail.eyecatch ? 'configured' : 'missing', url: detail.eyecatch ?? null, observedAt });
      if (coverUrlPath(detail.eyecatch) !== coverUrlPath(row.published?.url)) throw Error('public cover changed since last observation');
      if (row.approvedRevisionId && row.approvedRevisionId !== row.published?.revisionId) throw Error('approved revision not published');
      const operation = journals.find((a) => a.key === row.articleKey && a.sourceSha256 === row.published?.revisionId && a.status === 'verified');
      // Content preservation is proven inside each update run (before/after); later article edits are not cover drift.
      if (operation && coverUrlPath(operation.publicUrl) !== coverUrlPath(detail.eyecatch))
        throw Error('public cover differs from verified upload');
      checks.push({ key: row.articleKey, status: 'pass', publicCover: detail.eyecatch, observedAt });
    } catch (error) { checks.push({ key: row.articleKey, status: 'fail', reason: error.message }); }
  }
}));
await updateCoverLedger(current => { for (const observation of observations) recordCoverObservation(current, observation); });
const report = { schemaVersion: 1, account: 'stats47', generatedAt: new Date().toISOString(),
  status: checks.some(a => a.status === 'fail') ? 'fail' : 'pass', articles: checks };
const output = path.join(state, 'note/cover-lifecycle-latest.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, checked: checks.length, failures: checks.filter(a => a.status === 'fail') }));
process.exitCode = report.status === 'pass' ? 0 : 2;
