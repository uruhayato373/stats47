#!/usr/bin/env node
/** Read-only final audit of the whole public portfolio and a completed cover refresh. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { auditNoteCovers } from './lib/cover-audit.mjs';
import {
  assertTarget,
  assertPreserved,
  assetPath,
} from './lib/cover-update.mjs';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
if (process.argv.length !== 4 || process.argv[2] !== '--manifest')
  throw Error('Usage: node verify-cover-refresh.mjs --manifest PATH');
const manifestPath = path.resolve(process.argv[3]),
  base = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.account !== 'stats47' || !/^[\w-]+$/.test(manifest.version))
  throw Error('manifest identity');
const state = path.join(ROOT, '.claude/state/metrics');
const journal = JSON.parse(
  fs.readFileSync(
    path.join(state, `note-cover-refresh-${manifest.version}.json`),
    'utf8'
  )
);
const catalog = JSON.parse(
  execFileSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '.claude/scripts/note/catalog/dump-circulation-json.ts',
    ],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 8e6 }
  )
);
const details = new Map();
const audit = await auditNoteCovers({
  catalog,
  fetchJson: async (url) => {
    let last;
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(url, {
          signal: AbortSignal.timeout(30000),
          headers: { 'cache-control': 'no-cache' },
        });
        if (!r.ok) throw Error('HTTP ' + r.status);
        const json = await r.json();
        if (new URL(url).pathname.startsWith('/api/v3/notes/'))
          details.set(json.data?.key, json.data);
        return json;
      } catch (error) {
        last = error;
        if (i < 2) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
    throw last;
  },
});
const checks = [],
  issues = [];
if (
  new Set(manifest.articles.map((a) => a.noteId)).size !==
  manifest.articles.length
)
  issues.push('duplicate manifest target');
if (manifest.articles.length !== audit.summary.total)
  issues.push('portfolio size changed');
for (const a of manifest.articles) {
  try {
    const after = details.get(a.noteId);
    assertTarget(after, a);
    const before = JSON.parse(
      fs.readFileSync(path.join(base, 'before', a.noteId + '.json'), 'utf8')
    );
    const fingerprint = assertPreserved(before, after);
    const operation = journal.articles.find((x) => x.key === a.key);
    if (a.action === 'keep') {
      if (assetPath(after.eyecatch) !== assetPath(a.beforeCover.url))
        throw Error('kept cover changed');
      if (operation) throw Error('kept cover has mutation journal');
    } else {
      if (
        operation?.status !== 'verified' ||
        operation.sourceSha256 !== a.sha256
      )
        throw Error('upload not verified');
      if (assetPath(after.eyecatch) !== assetPath(operation.uploadedUrl))
        throw Error('public cover differs from verified upload');
    }
    const draftChanged = before.has_draft !== after.has_draft;
    if (draftChanged && !operation?.editorDraftCreated)
      throw Error('unexpected draft state change');
    checks.push({
      key: a.key,
      noteId: a.noteId,
      action: a.action,
      status: 'pass',
      publicCover: after.eyecatch,
      contentFingerprint: fingerprint,
      originalHasDraft: before.has_draft,
      hasDraft: after.has_draft,
      editorDraftCreated: Boolean(draftChanged),
      observedAt: new Date().toISOString(),
    });
  } catch (error) {
    issues.push({ key: a.key, error: error.message });
    checks.push({ key: a.key, status: 'fail' });
  }
}
const report = {
  schemaVersion: 1,
  version: manifest.version,
  account: 'stats47',
  kind: 'cover-remediation',
  generatedAt: new Date().toISOString(),
  status: audit.status === 'pass' && !issues.length ? 'pass' : 'fail',
  summary: {
    ...audit.summary,
    created: checks.filter((a) => a.action === 'create' && a.status === 'pass')
      .length,
    improved: checks.filter(
      (a) => a.action === 'improve' && a.status === 'pass'
    ).length,
    kept: checks.filter((a) => a.action === 'keep' && a.status === 'pass')
      .length,
    contentPreserved: checks.filter((a) => a.status === 'pass').length,
    editorDrafts: checks.filter((a) => a.editorDraftCreated).map((a) => a.key),
  },
  issues,
  articles: checks,
};
function save(name, data) {
  const p = path.join(state, name);
  fs.writeFileSync(p + '.tmp', JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(p + '.tmp', p);
}
save('note-cover-audit-latest.json', audit);
save(`note-cover-audit-${manifest.version}-after.json`, audit);
save(`note-cover-refresh-${manifest.version}-verification.json`, report);
console.log(
  JSON.stringify(
    { status: report.status, summary: report.summary, issues: report.issues },
    null,
    2
  )
);
process.exitCode = report.status === 'pass' ? 0 : 2;
