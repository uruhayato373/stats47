#!/usr/bin/env node
/** Repair unregistered note cards and replace obsolete shop CTAs. Native registration precedes publication. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertAccount, launchContext, pruneProfileCaches } from './lib/note-session.mjs';
import { assertRegisteredCards, cardEntries, noteRequest, registerMissingCards, unregisteredCards, verifyPublicCards } from './lib/native-cards.mjs';
import { bodyHash, publishCardBody } from './lib/publish-card-body.mjs';
import { resolvePaidProduct, rewriteProductCards } from './lib/product-cards.mjs';
import { datasetDir } from '../../../config/datasets.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const option = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const commit = args.includes('--commit');
const slug = option('--slug', null);
const max = Number(option('--max-articles', args.includes('--all') ? '10000' : '5'));
const reportPath = resolve(ROOT, option('--output', `${datasetDir('note.operation-evidence')}/note-native-card-repair-${new Date().toISOString().slice(0, 10)}.json`));
const journalPath = resolve(ROOT, '.local/note-card-native-repair-journal.json');
const source = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '.claude/scripts/note/catalog/dump-circulation-json.ts'], { cwd: ROOT, maxBuffer: 32 * 1024 * 1024 }));
let journal;
try { journal = JSON.parse(readFileSync(journalPath, 'utf8')); } catch { journal = { schemaVersion: 1, account: 'stats47', articles: {} }; }
if (journal.account !== 'stats47') throw Error('journal account mismatch');
let metrics;
try { metrics = JSON.parse(readFileSync(resolve(ROOT, datasetDir('note.dashboard'), 'latest.json'), 'utf8')); } catch { metrics = { articles: [] }; }
const views = new Map(metrics.articles.map((article) => [article.noteId, Number(article.pageViews || 0)]));
const noteKey = (article) => article.noteUrl.match(/\/n\/(n[a-f0-9]{12})$/)?.[1];
const articles = source.articles.filter((article) => article.noteUrl && (!slug || article.key === slug))
  .sort((left, right) => (left.key === 'recovered-nf962c6702b93' ? -1 : right.key === 'recovered-nf962c6702b93' ? 1 : (views.get(noteKey(right)) || 0) - (views.get(noteKey(left)) || 0)));
if (slug && articles.length !== 1) throw Error('article not in published catalog');
const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), account: 'stats47', commit, catalogArticles: source.articles.length, articles: [] };
async function publicNote(page, key) {
  return page.evaluate(async (key) => {
    const response = await fetch(`https://note.com/api/v3/notes/${key}?publicVerify=${Date.now()}`, { credentials: 'omit' });
    if (!response.ok) throw Error(`public note HTTP ${response.status}`);
    return (await response.json()).data;
  }, key);
}
function save() {
  const replace = (temporary, target) => {
    for (let attempt = 0; ; attempt++) {
      try { renameSync(temporary, target); return; }
      catch (error) {
        if (!['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || attempt >= 4) throw error;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25 * (attempt + 1));
      }
    }
  };
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(`${reportPath}.tmp`, `${JSON.stringify(report, null, 2)}\n`);
  replace(`${reportPath}.tmp`, reportPath);
  mkdirSync(dirname(journalPath), { recursive: true });
  writeFileSync(`${journalPath}.tmp`, `${JSON.stringify(journal, null, 2)}\n`);
  replace(`${journalPath}.tmp`, journalPath);
}
const ctx = await launchContext();
let publicContext;
try {
  const apiPage = await ctx.newPage();
  await apiPage.goto('https://note.com', { waitUntil: 'domcontentloaded' });
  await assertAccount(ctx);
  publicContext = await ctx.browser().newContext({ viewport: { width: 1280, height: 1000 } });
  let changed = 0;
  let failures = 0;
  for (const article of articles) {
    if (changed >= max) break;
    const key = noteKey(article);
    const row = { key: article.key, noteKey: key, noteUrl: article.noteUrl, recordedPageViews: views.get(key) ?? null };
    report.articles.push(row);
    try {
      const before = await noteRequest(apiPage, `/api/v3/notes/${key}`);
      if (before.user?.urlname !== 'stats47' || before.status !== 'published') throw Error('article account/status mismatch');
      const product = resolvePaidProduct(article, source);
      const rewritten = rewriteProductCards(before.body, product);
      const missing = unregisteredCards(rewritten, before.embedded_contents);
      row.unregisteredBefore = missing.length;
      row.productNoteUrl = product?.noteUrl || null;
      row.productLinkChanged = rewritten !== before.body;
      const prior = journal.articles[key];
      if (prior?.stage === 'sending') throw Error('unconfirmed previous publish; inspect journal, backup and saved draft before resuming');
      if (!missing.length && !row.productLinkChanged) {
        // Publication can succeed before a reader-side check times out. Confirm it without sending another update.
        if (commit && prior?.stage === 'published') {
          assertRegisteredCards(before.body, before.embedded_contents);
          const publicLive = await publicNote(apiPage, key);
          const visibleKeys = new Set(cardEntries(publicLive.body).map((card) => card.key));
          await verifyPublicCards(publicContext, article.noteUrl, prior.registrations.map((entry) => entry.key).filter((key) => visibleKeys.has(key)));
          prior.stage = 'verified';
          prior.finishedAt = new Date().toISOString();
          delete prior.expectedBody;
        }
        row.status = 'already_registered';
        row.bodySha256 = bodyHash(before.body);
        save();
        continue;
      }
      if (!commit) { row.status = 'pending'; save(); continue; }
      const attempt = { stage: 'registering', startedAt: new Date().toISOString(), articleKey: article.key, beforeBodySha256: bodyHash(before.body), registrations: [] };
      journal.articles[key] = attempt;
      save();
      const registered = await registerMissingCards(apiPage, key, rewritten, before.embedded_contents, (entry) => { attempt.registrations.push(entry); save(); });
      const publicBefore = await publicNote(apiPage, key);
      const fresh = await noteRequest(apiPage, `/api/v3/notes/${key}`);
      if (fresh.body !== before.body || fresh.has_draft !== before.has_draft) throw Error('article changed during card preparation');
      attempt.expectedBody = registered.body;
      const backup = resolve(ROOT, '.local/note-card-repair/backups', `${key}-${Date.now()}.json`);
      const published = await publishCardBody(ctx, apiPage, before, publicBefore, registered.body, backup, (stage) => { attempt.stage = stage; save(); });
      assertRegisteredCards(published.after.body, published.after.embedded_contents);
      const publicAfter = await publicNote(apiPage, key);
      const visibleKeys = new Set(cardEntries(publicAfter.body).map((card) => card.key));
      await verifyPublicCards(publicContext, article.noteUrl, registered.registered.filter((key) => visibleKeys.has(key)));
      attempt.stage = 'verified';
      attempt.finishedAt = new Date().toISOString();
      delete attempt.expectedBody;
      row.status = 'verified';
      row.registered = attempt.registrations.length;
      row.beforeBodySha256 = published.beforeBodySha256;
      row.afterBodySha256 = published.afterBodySha256;
      row.preservedDraft = published.preservedDraft;
      row.remainingUnregistered = 0;
      changed++;
      failures = 0;
      console.log(JSON.stringify({ key: article.key, status: row.status, cards: row.registered, productLinkChanged: row.productLinkChanged, repairedArticles: changed }));
    } catch (error) {
      row.status = 'failed';
      row.error = error.message;
      failures++;
      console.error(`${article.key}: ${error.message}`);
      if (/HTTP (403|429)/.test(error.message) || failures >= 3) { save(); break; }
    } finally { save(); }
    await new Promise((done) => setTimeout(done, 1200));
  }
  report.summary = { checked: report.articles.length, repaired: report.articles.filter((row) => row.status === 'verified').length, failed: report.articles.filter((row) => row.status === 'failed').length, pending: report.articles.filter((row) => row.status === 'pending').length, registeredCards: report.articles.reduce((sum, row) => sum + (row.registered || 0), 0) };
  save();
  console.log(JSON.stringify(report.summary));
  if (report.summary.failed) process.exitCode = 1;
} finally { await publicContext?.close(); await ctx.close(); pruneProfileCaches(); }
