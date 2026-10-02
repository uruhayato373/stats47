#!/usr/bin/env node
/** Remote note cover lifecycle. Ledger is the only authority; temporary input is removed after verified remote registration. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { COVER_ROOT, readCoverLedger, validateCoverLedger, emptyCoverArticle, updateCoverLedger,
  recordCoverObservation, addCoverRevision, reviewCoverRevision, coverSha } from './lib/cover-assets.mjs';
import { createCoverStore, fetchCoverSource, fetchNoteDetail, storeCoverBytes, readStoredCover, readStoredCoverInput } from './lib/cover-storage.mjs';
import { registerCoverCandidate } from './lib/cover-ingest.mjs';
import { enumerateNoteBodies } from '../lib/gallery-collectors.mjs';

const command = process.argv[2];
const options = {};
for (let i = 3; i < process.argv.length; i += 2) {
  const flag = process.argv[i];
  if (!['--keys', '--manifest', '--output', '--revision', '--status', '--reason', '--missing-version', '--source'].includes(flag) || !process.argv[i + 1])
    throw Error(`invalid argument: ${flag}`);
  options[flag.slice(2)] = process.argv[i + 1];
}
const catalog = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx',
  '.claude/scripts/note/catalog/dump-circulation-json.ts', '--all'], { cwd: COVER_ROOT, encoding: 'utf8', maxBuffer: 8e6 })).articles;
const keys = new Set(options.keys?.split(',') ?? []);
if (keys.size && [...keys].some((k) => !catalog.some((a) => a.key === k))) throw Error('unknown article key');
const selected = catalog.filter((a) => (a.noteUrl || command === 'prepare') && (!keys.size || keys.has(a.key)));
const now = () => new Date().toISOString();

function observations(record) {
  if (record.account !== 'stats47') throw Error('observation account mismatch');
  return (record.articles ?? []).flatMap((item) => {
    const key = item.catalogKey ?? item.key;
    const article = catalog.find((a) => a.key === key);
    const id = item.noteKey ?? item.noteId;
    if (!article || article.noteUrl !== `https://note.com/stats47/n/${id}` ||
      (item.noteUrl && item.noteUrl !== article.noteUrl)) throw Error(`observation identity mismatch: ${key}`);
    const status = item.publicCover ? 'configured' : item.cover?.status;
    if (!['configured', 'missing'].includes(status)) return [];
    if (!item.observedAt || !Number.isFinite(Date.parse(item.observedAt))) throw Error('observation timestamp missing');
    return [{ key, noteUrl: article.noteUrl, status, url: item.publicCover ?? item.cover?.url ?? null, observedAt: item.observedAt }];
  });
}

async function boundedMap(items, work) {
  let cursor = 0, completed = 0;
  const failures = [];
  await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      try { await work(item); completed++; }
      catch (error) { failures.push(`${item.key ?? item.articleKey}: ${error.message}`); }
      if ((completed + failures.length) % 25 === 0) console.log(`${command}: ${completed} complete, ${failures.length} failed`);
    }
  }));
  console.log(JSON.stringify({ command, completed, failures }));
  if (failures.length) throw Error('remote cover operation incomplete; successful revisions retained, rerun safely');
}

if (command === 'seed') {
  const directory = path.join(COVER_ROOT, '.claude/state/metrics');
  const files = [path.join(directory, 'note-cover-audit-latest.json')];
  for (const dir of [directory, path.join(directory, 'releases')]) {
    if (fs.existsSync(dir)) files.push(...fs.readdirSync(dir).filter((name) => /note-cover-refresh.*verification\.json$/.test(name)).map((name) => path.join(dir, name)));
  }
  const imported = files.filter((file) => fs.existsSync(file)).flatMap((file) => observations(JSON.parse(fs.readFileSync(file, 'utf8'))));
  await updateCoverLedger((ledger) => {
    for (const article of catalog) {
      const existing = ledger.articles.find((a) => a.articleKey === article.key);
      if (!existing) ledger.articles.push(emptyCoverArticle(article));
      else if (existing.noteUrl === null && article.noteUrl) existing.noteUrl = article.noteUrl;
    }
    for (const observation of imported) recordCoverObservation(ledger, observation);
    if (options['missing-version']) for (const row of ledger.articles.filter((a) => a.noteUrl))
      if (!row.missingVersions.includes(options['missing-version'])) row.missingVersions.push(options['missing-version']);
    validateCoverLedger(ledger, catalog);
  });
  console.log(`Seeded ${catalog.length} articles, imported ${imported.length} observations`);
} else if (command === 'validate') {
  const ledger = validateCoverLedger(readCoverLedger(), catalog);
  console.log(JSON.stringify({ articles: ledger.articles.length, revisions: ledger.articles.reduce((s, a) => s + a.revisions.length, 0) }));
} else if (command === 'archive') {
  const store = createCoverStore();
  // Network requests run concurrently, ledger mutations are queued in this process (cross-process lock remains exclusive).
  let writes = Promise.resolve();
  const mutate = (edit) => { const next = writes.then(() => updateCoverLedger(edit)); writes = next.catch(() => {}); return next; };
  await boundedMap(selected, async (article) => {
    const detail = await fetchNoteDetail(article.noteUrl.split('/').at(-1));
    const observedAt = now();
    let revision = null;
    if (detail.eyecatch) {
      const original = await fetchCoverSource(detail.eyecatch);
      const metadata = await sharp(original).metadata();
      const bytes = metadata.format === 'png' ? original : await sharp(original).png().toBuffer();
      const asset = await storeCoverBytes(article.key, bytes, store);
      revision = { ...asset, id: asset.sha256, kind: 'published-original', version: 'public-cover-archive', createdAt: observedAt,
        width: metadata.width, height: metadata.height, review: { status: 'not-required', reason: 'Existing public image preserved', reviewedAt: null },
        provenance: { renderer: null, sourceUrl: detail.eyecatch, sourceSha256: coverSha(original) } };
    }
    await mutate((ledger) => {
      const row = ledger.articles.find((a) => a.articleKey === article.key);
      recordCoverObservation(ledger, { key: article.key, noteUrl: article.noteUrl, observedAt,
        status: detail.eyecatch ? 'configured' : 'missing', url: detail.eyecatch ?? null });
      if (revision) { addCoverRevision(row, revision); row.published.revisionId = revision.id; }
    });
  });
} else if (command === 'archive-r2') {
  const bodies = new Map(enumerateNoteBodies(COVER_ROOT).map(a => [a.slug, a]));
  const store = createCoverStore();
  for (const article of selected) {
    const body = bodies.get(article.key);
    if (!body) throw Error(`legacy R2 identity missing: ${article.key}`);
    const sourceUrl = `https://storage.stats47.jp/${body.r2Path}/images/cover-1280x670.png`;
    let original;
    try { original = await fetchCoverSource(sourceUrl); }
    catch (error) { if (error.message === 'cover source HTTP 404') { console.log(`No legacy R2 cover: ${article.key}`); continue; } throw error; }
    const metadata = await sharp(original).metadata();
    const bytes = metadata.format === 'png' ? original : await sharp(original).png().toBuffer();
    const asset = await storeCoverBytes(article.key, bytes, store);
    const revision = { ...asset, id: asset.sha256, kind: 'r2-archive', version: `legacy-r2-import-${now().slice(0, 10)}`, createdAt: now(),
      width: metadata.width, height: metadata.height,
      review: { status: 'not-required', reason: 'Legacy R2 asset preserved; not adopted for note', reviewedAt: null },
      provenance: { renderer: 'legacy-public-r2', sourceUrl, sourceSha256: coverSha(original) } };
    await updateCoverLedger(l => addCoverRevision(l.articles.find(a => a.articleKey === article.key), revision));
  }
  console.log('Legacy R2 assets preserved without changing candidate/approval/publication pointers');
} else if (command === 'prepare') {
  if (!options.output || !keys.size) throw Error('prepare requires --output and --keys');
  if (options.source && !['note', 'ledger'].includes(options.source)) throw Error('prepare source must be note or ledger');
  const ledgerInput = options.source === 'ledger' ? readCoverLedger() : null;
  const inputStore = ledgerInput ? createCoverStore() : null;
  const output = path.resolve(options.output);
  const relative = path.relative(COVER_ROOT, output);
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) throw Error('temporary input must be outside the repository');
  const allowed = [os.tmpdir(), 'C:/tmp', '/tmp'].some((dir) => { const rel = path.relative(path.resolve(dir), output); return rel && !rel.startsWith('..') && !path.isAbsolute(rel); });
  if (!allowed) throw Error('output must be a temporary subdirectory');
  if (fs.existsSync(output)) {
    const marker = path.join(output, '.note-cover-temporary-input');
    if (!fs.existsSync(marker) || fs.readFileSync(marker, 'utf8') !== 'stats47') throw Error('temporary directory already exists and is not owned by this generator');
  } else fs.mkdirSync(output);
  fs.mkdirSync(path.join(output, 'before'), { recursive: true });
  fs.mkdirSync(path.join(output, 'after'), { recursive: true });
  fs.writeFileSync(path.join(output, '.note-cover-temporary-input'), 'stats47');
  const inventory = [];
  await boundedMap(selected, async (article) => {
    const id = article.noteUrl?.split('/').at(-1) ?? article.key;
    let detail;
    if (ledgerInput) {
      const record = ledgerInput.articles.find(row => row.articleKey === article.key);
      const published = record?.published;
      const revision = record?.revisions.find(r => r.id === published?.revisionId);
      if (!article.noteUrl || record?.noteUrl !== article.noteUrl || published?.status !== 'configured' || !revision)
        throw Error('verified archived public cover required for ledger preparation');
      const bytes = await readStoredCover(revision, inputStore);
      fs.writeFileSync(path.join(output, 'before', `${id}.image`), bytes);
      detail = { body: '', eyecatch: published.url, price: article.priceJpy ?? 0,
        source: 'verified-ledger-public-cover', observedAt: published.observedAt };
    } else if (article.noteUrl) detail = await fetchNoteDetail(id);
    else {
      const directories = [path.join(COVER_ROOT, 'docs/31_note記事原稿', article.vertical, article.key),
        path.join(COVER_ROOT, 'docs/31_note記事原稿', article.key)];
      const draft = directories.map(dir => path.join(dir, 'draft.md')).find(file => fs.existsSync(file));
      if (!draft) throw Error('draft source missing; create the article draft before preparing its cover');
      detail = { body: fs.readFileSync(draft, 'utf8'), eyecatch: null, price: article.priceJpy ?? 0 };
    }
    fs.writeFileSync(path.join(output, 'before', `${id}.json`), JSON.stringify(detail));
    if (detail.eyecatch && !ledgerInput) fs.writeFileSync(path.join(output, 'before', `${id}.image`), await fetchCoverSource(detail.eyecatch));
    inventory.push({ catalogKey: article.key, noteKey: id, noteUrl: article.noteUrl ?? null, title: article.title,
      vertical: article.vertical, price: detail.price ?? 0, cover: { status: detail.eyecatch ? 'configured' : 'missing', url: detail.eyecatch ?? null } });
  });
  fs.writeFileSync(path.join(output, 'inventory.json'), JSON.stringify(inventory));
} else if (command === 'import') {
  if (!options.manifest) throw Error('import requires --manifest');
  const manifest = JSON.parse(fs.readFileSync(options.manifest, 'utf8'));
  if (manifest.account !== 'stats47' || !/^[\w-]+$/.test(manifest.version)) throw Error('manifest identity');
  if (!Array.isArray(manifest.articles) || new Set(manifest.articles.map(a => a.key)).size !== manifest.articles.length)
    throw Error('manifest duplicate/invalid articles');
  const store = createCoverStore();
  for (const item of manifest.articles.filter((a) => a.action !== 'keep' && (!keys.size || keys.has(a.key)))) {
    if (!catalog.some((a) => a.key === item.key && (a.noteUrl ?? null) === (item.noteUrl ?? null))) throw Error('manifest catalog mismatch');
    await registerCoverCandidate(item, fs.readFileSync(item.file), manifest.version, store);
  }
  console.log('Remote import verified; candidates await review in the ledger');
} else if (command === 'review') {
  if (keys.size !== 1 || !options.revision || !options.status || !options.reason) throw Error('review requires one --keys, --revision, --status and --reason');
  const articleKey = [...keys][0];
  const revision = readCoverLedger().articles.find((a) => a.articleKey === articleKey)?.revisions.find((r) => r.id === options.revision);
  if (!revision) throw Error('unknown revision');
  await readStoredCover(revision);
  await updateCoverLedger((ledger) => reviewCoverRevision(ledger.articles.find((a) => a.articleKey === articleKey), options.revision, options.status, options.reason));
  console.log('Review saved for the exact remote revision');
} else if (command === 'verify') {
  const store = createCoverStore();
  const revisions = readCoverLedger().articles.filter((a) => !keys.size || keys.has(a.articleKey)).flatMap((a) => a.revisions.map((r) => ({ articleKey: a.articleKey, revision: r })));
  await boundedMap(revisions, async (item) => {
    await readStoredCover(item.revision, store);
    await readStoredCoverInput(item.revision, store);
  });
} else {
  throw Error('Usage: cover-assets.mjs seed|validate|archive|archive-r2|prepare|import|review|verify [--keys key1,key2] [--output TEMP_DIR --source note|ledger] [--manifest PATH] [--revision SHA --status pass|needs-revision --reason TEXT]');
}
