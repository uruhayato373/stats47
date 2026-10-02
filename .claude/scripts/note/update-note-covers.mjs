#!/usr/bin/env node
/** Cover-only updates from approved, immutable remote ledger revisions. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { readCoverLedger, updateCoverLedger, recordCoverObservation, approvedCoverRevision } from './lib/cover-assets.mjs';
import { readStoredCover, createCoverStore, fetchNoteDetail, fetchCoverSource } from './lib/cover-storage.mjs';
import {
  sha256,
  assetPath,
  assertTarget,
  assertPreserved,
  assertProduction,
  uploadInBrowser,
} from './lib/cover-update.mjs';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const opts = { commit: false, limit: Infinity, keys: null };
for (let i = 2; i < process.argv.length; i++) {
  const flag = process.argv[i];
  if (flag === '--commit') {
    opts.commit = true;
    continue;
  }
  if (flag === '--help') {
    console.log(
      'node update-note-covers.mjs [--keys key1,key2] [--limit N] [--commit]\nWithout --commit: validate approved remote assets/catalog only. Import old manifests with note:assets import first. Resume uses a revision-specific journal.'
    );
    process.exit(0);
  }
  if (
    !['--keys', '--limit'].includes(flag) ||
    !process.argv[i + 1]
  )
    throw Error('invalid argument ' + flag);
  opts[flag.slice(2)] = process.argv[++i];
}
opts.limit = Number(opts.limit);
if (!(opts.limit > 0)) throw Error('invalid limit');
const ledger = readCoverLedger();
const manifest = { account: 'stats47', version: '', articles: ledger.articles.flatMap((row) => {
  const revision = approvedCoverRevision(row);
  if (!revision) return [];
  return [{ key: row.articleKey, noteUrl: row.noteUrl, noteId: row.noteUrl.split('/').at(-1),
    action: row.published?.status === 'missing' ? 'create' : 'improve',
    sha256: revision.sha256, revision, beforeCover: { url: row.published?.url ?? null },
    quality: { ...revision.quality, visualReview: revision.review.status } }];
}) };
manifest.version = `ledger-${sha256(manifest.articles.map((a) => `${a.key}:${a.sha256}`).sort().join('\n')).slice(0, 16)}`;
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
const catalogByKey = new Map(catalog.articles.map((a) => [a.key, a]));
const selected = new Set(opts.keys?.split(',') ?? []);
const articles = manifest.articles.filter(
  (a) => a.action !== 'keep' && (!selected.size || selected.has(a.key))
);
if (selected.size && selected.size !== articles.length)
  throw Error('unknown/unchanged selected key');
if (
  new Set(manifest.articles.map((a) => a.noteId)).size !==
  manifest.articles.length
)
  throw Error('duplicate note');
const assets = new Map(), originals = new Map(), store = articles.length ? createCoverStore() : null;
for (const a of articles) {
  if (catalogByKey.get(a.key)?.noteUrl !== a.noteUrl)
    throw Error('catalog mismatch ' + a.key);
  const bytes = await readStoredCover(a.revision, store);
  assertProduction(a, bytes, await sharp(bytes).metadata());
  assets.set(a.key, bytes);
  const original = await publicDetail(a);
  originals.set(a.key, original);
}
console.log(`[note-covers] ${articles.length} reviewed assets validated`);
if (!opts.commit || !articles.length) process.exit(0);

const journalPath = path.join(
  ROOT,
  '.claude/state/metrics',
  `note-cover-refresh-${manifest.version}.json`
);
const journal = fs.existsSync(journalPath)
  ? JSON.parse(fs.readFileSync(journalPath, 'utf8'))
  : {
      schemaVersion: 1,
      version: manifest.version,
      account: 'stats47',
      kind: 'cover-remediation',
      startedAt: new Date().toISOString(),
      articles: [],
    };
if (journal.version !== manifest.version || journal.account !== 'stats47')
  throw Error('journal identity');
const writeJournal = () => {
  fs.mkdirSync(path.dirname(journalPath), { recursive: true });
  journal.updatedAt = new Date().toISOString();
  fs.writeFileSync(
    journalPath + '.tmp',
    JSON.stringify(journal, null, 2) + '\n'
  );
  fs.renameSync(journalPath + '.tmp', journalPath);
};
const run = promisify(execFile),
  cli =
    process.env.BROWSER_USE_BIN ||
    path.join(os.homedir(), '.browser-use-env/bin/browser-use');
const session = `note-covers-${process.pid}-${Date.now()}`;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function browser(command, ...args) {
  const { stdout } = await run(
    cli,
    [
      '--session',
      session,
      '--json',
      ...(command === 'open' ? ['--headed', '--profile', 'Profile 5'] : []),
      command,
      ...args,
    ],
    { timeout: 45000, maxBuffer: 4e6 }
  );
  const reply = JSON.parse(stdout);
  if (!reply.success)
    throw Error(
      'browser ' +
        command +
        ' failed: ' +
        JSON.stringify(reply.error ?? reply.data).slice(0, 500)
    );
  return reply.data;
}
async function evaluate(code) {
  const data = await browser('eval', code);
  return typeof data.result === 'string'
    ? JSON.parse(data.result)
    : data.result;
}
async function publicDetail(a) {
  const d = await fetchNoteDetail(a.noteId);
  assertTarget(d, a);
  return d;
}
async function verifyImage(a, url, ui = false) {
  if (new URL(url).origin !== 'https://assets.st-note.com')
    throw Error('unexpected image host');
  const bytes = await fetchCoverSource(url),
    m = await sharp(bytes).metadata();
  if (Math.abs(m.width / m.height - 1280 / 670) > 0.001)
    throw Error('public image aspect ratio');
  const actual = await sharp(bytes)
    .resize(1280, 670)
    .removeAlpha()
    .raw()
    .toBuffer();
  const expected = await sharp(assets.get(a.key))
    .resize(1280, 670)
    .removeAlpha()
    .raw()
    .toBuffer();
  if (actual.length !== expected.length) throw Error('image channels');
  let delta = 0;
  for (let i = 0; i < actual.length; i++)
    delta += Math.abs(actual[i] - expected[i]);
  const meanPixelError = delta / actual.length;
  // note optimizes even the original upload URL; observed same-file API pilot MAE=0.66/255.
  if (meanPixelError > 3) throw Error('public image differs ' + meanPixelError);
  return {
    width: m.width,
    height: m.height,
    sha256: sha256(bytes),
    meanPixelError,
  };
}
function processes() {
  return execFileSync('ps', ['-axo', 'pid=,ppid=,command='], {
    encoding: 'utf8',
  })
    .split('\n')
    .map((x) => x.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/))
    .filter(Boolean)
    .map((m) => ({ pid: +m[1], ppid: +m[2], command: m[3] }));
}
async function cleanup() {
  const before = processes(),
    daemon = before.find(
      (p) =>
        p.command.includes('browser_use.skill_cli.daemon') &&
        p.command.split(/\s+/).includes(session)
    );
  const owned = new Set(daemon ? [daemon.pid] : []);
  for (let again = true; again;) {
    again = false;
    for (const p of before)
      if (owned.has(p.ppid) && !owned.has(p.pid)) {
        owned.add(p.pid);
        again = true;
      }
  }
  const profiles = before
    .filter((p) => owned.has(p.pid))
    .map(
      (p) =>
        p.command.match(
          /--user-data-dir=([^ ]*browser-use-user-data-dir-[^ ]*)/
        )?.[1]
    )
    .filter(Boolean);
  try {
    await run(cli, ['--session', session, '--json', 'close'], {
      timeout: 15000,
    });
  } catch {}
  for (const p of processes()
    .filter(
      (p) =>
        owned.has(p.pid) &&
        before.some((b) => b.pid === p.pid && b.command === p.command)
    )
    .reverse()) {
    try {
      process.kill(p.pid, 'SIGKILL');
    } catch {}
  }
  for (const dir of new Set(profiles))
    fs.rmSync(dir, { recursive: true, force: true });
}
let active;
try {
  await browser('open', 'https://note.com/settings/account');
  let account = false;
  for (let i = 0; i < 40 && !account; i++) {
    account = await evaluate(
      'JSON.stringify({ok:/note ID\\s*stats47\\b/.test(document.body.innerText),login:location.pathname.includes("login")})'
    );
    if (account.login) throw Error('login required');
    account = account.ok;
    if (!account) await pause(400);
  }
  if (!account) throw Error('stats47 account not confirmed');
  let completed = 0;
  for (const a of articles) {
    if (completed >= opts.limit) break;
    active = journal.articles.find((x) => x.key === a.key);
    if (active?.status === 'verified') {
      if (active.sourceSha256 !== a.sha256)
        throw Error('review changed after upload');
    }
    // Recheck approval immediately before mutation, including resumed journals.
    const approvedRow = readCoverLedger().articles.find((r) => r.articleKey === a.key);
    if (approvedRow?.approvedRevisionId !== a.sha256) throw Error('cover approval changed');
    const original = originals.get(a.key);
    const before = await publicDetail(a);
    const fingerprint = assertPreserved(original, before);
    if (active?.contentFingerprint && Object.keys(active.contentFingerprint).some((field) => active.contentFingerprint[field] !== fingerprint[field]))
      throw Error('article content changed since the recorded operation');
    // Recovery after uncertain POST: verify the recorded returned URL, never repeat mutation.
    if (active && active.status !== 'preparing') {
      if (
        !active.uploadedUrl ||
        assetPath(before.eyecatch) !== assetPath(active.uploadedUrl)
      )
        throw Error('uncertain upload requires inspection ' + a.key);
    } else {
      if (assetPath(before.eyecatch) !== assetPath(a.beforeCover.url))
        throw Error('cover changed since inventory ' + a.key);
      if (!active) {
        active = {
          key: a.key,
          noteId: a.noteId,
          action: a.action,
          sourceSha256: a.sha256,
          previousUrl: before.eyecatch,
          contentFingerprint: fingerprint,
          hasDraftBefore: before.has_draft,
          startedAt: new Date().toISOString(),
          status: 'preparing',
          transport: 'cover-only-api',
        };
        journal.articles.push(active);
      }
      writeJournal();
      const data = assets.get(a.key).toString('base64');
      await evaluate(
        'window.__noteCoverBytes="";window.__noteCoverResult=null;true'
      );
      for (let i = 0; i < data.length; i += 12000)
        await evaluate(
          `window.__noteCoverBytes+=${JSON.stringify(data.slice(i, i + 12000))};true`
        );
      active.status = 'uploading';
      writeJournal();
      await evaluate(
        uploadInBrowser({ noteId: before.id, width: 1280, height: 670 })
      );
      let result;
      for (let i = 0; i < 120; i++) {
        result = await evaluate('JSON.stringify(window.__noteCoverResult)');
        if (result) break;
        await pause(500);
      }
      if (result?.status !== 201 || !result?.body?.data?.url)
        throw Error('upload failed ' + JSON.stringify(result));
      active.uploadedUrl = result.body.data.url;
      active.uploadedAt = new Date().toISOString();
      active.status = 'uploaded';
      writeJournal();
    }
    const after = await publicDetail(a);
    assertPreserved(original, after);
    if (assetPath(after.eyecatch) !== assetPath(active.uploadedUrl))
      throw Error('public cover not updated');
    if (after.has_draft !== active.hasDraftBefore)
      throw Error('draft state changed');
    active.imageVerification = await verifyImage(
      a,
      active.uploadedUrl,
      active.transport === 'editor-ui'
    );
    active.publicUrl = after.eyecatch;
    active.status = 'verified';
    active.verifiedAt = new Date().toISOString();
    delete active.error;
    writeJournal();
    await updateCoverLedger((current) => {
      const row = current.articles.find((r) => r.articleKey === a.key);
      if (row?.approvedRevisionId !== a.sha256) throw Error('cover approval changed after upload; inspect journal');
      recordCoverObservation(current, { key: a.key, noteUrl: a.noteUrl, status: 'configured',
        url: after.eyecatch, observedAt: active.verifiedAt });
      row.published.revisionId = a.sha256;
    });
    completed++;
    console.log(
      `[note-covers] verified ${journal.articles.filter((x) => x.status === 'verified').length}/${manifest.articles.filter((x) => x.action !== 'keep').length}: ${a.key}`
    );
    await pause(350);
  }
} catch (error) {
  if (active) {
    active.error = error.message;
    writeJournal();
  }
  console.error(error);
  process.exitCode = 2;
} finally {
  await cleanup();
}
