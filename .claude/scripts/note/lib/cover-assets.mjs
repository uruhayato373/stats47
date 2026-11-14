/**
 * Shared, schema-validated note cover ledger. No local image paths are persisted.
 * The ledger is one document to every caller and two datasets on disk: the main file (which revision is the
 * candidate/approved/published one, and the public observation) and one record file per article (its production
 * content and every revision). Only this module joins and splits them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import Ajv from 'ajv';
import schema from '../../../../data/note/cover-assets.schema.json' with { type: 'json' };
import recordSchema from '../../../../data/note/cover-records.schema.json' with { type: 'json' };
import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";

export const COVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const COVER_LEDGER_PATH = datasetPath("note.cover-assets");
export const COVER_RECORDS_DIR = datasetDir("note.cover-records");
const coverRecordPath = (key) => `${COVER_RECORDS_DIR}/${key}.json`;
const ajv = new Ajv({ allErrors: true });
const validateMainShape = ajv.compile(schema);
const validateRecordShape = ajv.compile(recordSchema);
const mainShapeError = () => Error(`cover ledger schema: ${ajv.errorsText(validateMainShape.errors)}`);
const recordShapeError = (name) => Error(`cover ledger schema: ${name} ${ajv.errorsText(validateRecordShape.errors)}`);
export const coverSha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const coverAssetKey = (key, sha) => `note/covers/${key}/revisions/${sha}.png`;
export const coverInputKey = (key, sha) => `note/covers/${key}/inputs/${sha}.json`;
const FILE_RENAME_ATTEMPTS = 8;
const FILE_RENAME_BACKOFF_MS = 50;
/** Preserve the old file and pending bytes through transient Windows reader locks. */
export async function renameCoverFile(source, destination) {
  for (let attempt = 0; ; attempt++) {
    try { fs.renameSync(source, destination); return; }
    catch (error) {
      if (attempt >= FILE_RENAME_ATTEMPTS - 1 || !['EPERM', 'EACCES', 'EBUSY'].includes(error.code)) throw error;
      await new Promise((resolve) => setTimeout(resolve, FILE_RENAME_BACKOFF_MS * (attempt + 1)));
    }
  }
}
export const coverUrlPath = (url) => url ? new URL(url).origin + new URL(url).pathname : null;
export function assertCoverGenerationType(type) {
  if (type === 'note-covers') throw Error(`noteカバーは ${datasetPath("note.cover-assets")} が正本です。note:cover-production と Codex imagegen を使用してください。汎用OGP生成からの上書きは終了しました。`);
}

/** Stored form: the main document without production/revisions, and one record for each article that has either. */
function splitCoverLedger(ledger) {
  if (!Array.isArray(ledger?.articles) || ledger.articles.some((row) => !Array.isArray(row?.revisions)))
    throw Error('cover ledger schema: every article needs a revisions array');
  return { main: { ...ledger, articles: ledger.articles.map(({ production, revisions, ...row }) => row) },
    records: ledger.articles.filter((row) => row.production || row.revisions.length).map((row) =>
      ({ schemaVersion: 1, articleKey: row.articleKey, ...(row.production ? { production: row.production } : {}), revisions: row.revisions })) };
}
function storedCoverLedger(ledger) {
  const { main, records } = splitCoverLedger(ledger), text = (document) => JSON.stringify(document, null, 2) + '\n';
  // Record files come first: written in this order, a pointer in the main file never names a revision that is not on disk.
  return { ...Object.fromEntries(records.map((record) => [coverRecordPath(record.articleKey), text(record)])),
    [COVER_LEDGER_PATH]: text(main) };
}
/** Repository-relative path -> file text for a valid ledger (the writer and test fixtures share this one layout). */
export function coverLedgerFiles(ledger) {
  return storedCoverLedger(validateCoverLedger(ledger));
}

export function validateCoverLedger(ledger, catalog) {
  const stored = splitCoverLedger(ledger);
  if (!validateMainShape(stored.main)) throw mainShapeError();
  for (const record of stored.records) if (!validateRecordShape(record)) throw recordShapeError(record.articleKey);
  const seen = new Set();
  const productionIds = new Set();
  for (const row of ledger.articles) {
    if (row.production) {
      if (productionIds.has(row.production.id)) throw Error(`duplicate cover production: ${row.production.id}`);
      productionIds.add(row.production.id);
      if (row.production.brief && ['headline', 'subject', 'evidence'].some(key => !row.production.brief[key].trim()))
        throw Error(`empty production brief: ${row.articleKey}`);
    }
    if (seen.has(row.articleKey)) throw Error(`duplicate cover article: ${row.articleKey}`);
    seen.add(row.articleKey);
    if (catalog) {
      const article = catalog.find((a) => a.key === row.articleKey);
      if (!article || (article.noteUrl ?? null) !== row.noteUrl) throw Error(`cover catalog mismatch: ${row.articleKey}`);
    }
    const ids = new Set();
    for (const rev of row.revisions) {
      if (ids.has(rev.id) || rev.id !== rev.sha256 || rev.storage.key !== coverAssetKey(row.articleKey, rev.sha256))
        throw Error(`cover revision identity: ${row.articleKey}`);
      ids.add(rev.id);
      if (rev.provenance.production && (!row.production || rev.provenance.production.id !== row.production.id || !rev.provenance.input))
        throw Error(`cover production identity: ${row.articleKey}`);
      if (rev.kind === 'candidate' && (!rev.quality || rev.width !== 1280 || rev.height !== 670))
        throw Error(`candidate quality evidence required: ${row.articleKey}`);
      if (rev.provenance.input && (rev.provenance.input.storage.key !== coverInputKey(row.articleKey, rev.provenance.input.sha256)
          || rev.provenance.input.sha256 !== rev.quality?.evidenceSha256))
        throw Error(`cover input identity: ${row.articleKey}`);
      if (rev.review.status === 'pass' && (!rev.review.reason || !rev.review.reviewedAt))
        throw Error(`cover review evidence required: ${row.articleKey}`);
    }
    for (const id of [row.candidateRevisionId, row.approvedRevisionId, row.published?.revisionId])
      if (id && !ids.has(id)) throw Error(`cover revision reference: ${row.articleKey}`);
    if (row.candidateRevisionId && row.revisions.find((r) => r.id === row.candidateRevisionId)?.kind !== 'candidate')
      throw Error(`cover candidate type mismatch: ${row.articleKey}`);
    if (row.approvedRevisionId && row.revisions.find((r) => r.id === row.approvedRevisionId)?.kind !== 'candidate')
      throw Error(`cover approval type mismatch: ${row.articleKey}`);
    if (row.approvedRevisionId && row.revisions.find((r) => r.id === row.approvedRevisionId)?.review.status !== 'pass')
      throw Error(`cover approval must pass: ${row.articleKey}`);
    if (row.published?.status === 'configured' && !row.published.url)
      throw Error(`configured cover URL required: ${row.articleKey}`);
    if (row.published?.status !== 'configured' && row.published?.revisionId)
      throw Error(`unconfirmed cover cannot reference a revision: ${row.articleKey}`);
  }
  if (catalog && (catalog.length !== seen.size || catalog.some((a) => !seen.has(a.key))))
    throw Error('cover catalog coverage mismatch');
  return ledger;
}

function readCoverRecords(root) {
  const directory = path.join(root, COVER_RECORDS_DIR), byArticle = new Map();
  if (!fs.existsSync(directory)) return byArticle;
  for (const name of fs.readdirSync(directory).filter((entry) => entry.endsWith('.json'))) {
    const record = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
    if (!validateRecordShape(record)) throw recordShapeError(name);
    if (`${record.articleKey}.json` !== name) throw Error(`cover record file identity: ${name}`);
    byArticle.set(record.articleKey, record);
  }
  return byArticle;
}

export function readCoverLedger(root = COVER_ROOT) {
  const main = JSON.parse(fs.readFileSync(path.join(root, COVER_LEDGER_PATH), 'utf8'));
  // The stored main document is checked before joining: a row that still carries inline production or revisions
  // (the pre-split single file) must stop here instead of shadowing the record files.
  if (!validateMainShape(main)) throw mainShapeError();
  const records = readCoverRecords(root), known = new Set(main.articles.map((row) => row.articleKey));
  const orphan = [...records.keys()].find((key) => !known.has(key));
  if (orphan) throw Error(`cover record file without ledger article: ${orphan}`);
  return validateCoverLedger({ ...main, articles: main.articles.map(({ articleKey, noteUrl, ...row }) => {
    const record = records.get(articleKey);
    return { articleKey, noteUrl, revisions: record?.revisions ?? [], ...row, ...(record?.production ? { production: record.production } : {}) };
  }) });
}

export function emptyCoverArticle(article) {
  return { articleKey: article.key, noteUrl: article.noteUrl ?? null, revisions: [], candidateRevisionId: null,
    approvedRevisionId: null, published: null, missingVersions: [] };
}

/** An exclusive writer lock prevents stale CLI processes overwriting each other's observations/reviews. */
export async function updateCoverLedger(edit, root = COVER_ROOT) {
  const file = path.join(root, COVER_LEDGER_PATH);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lock = `${file}.lock`;
  const fd = fs.openSync(lock, 'wx');
  const temporaries = [];
  try {
    if (!fs.existsSync(file) && readCoverRecords(root).size) throw Error('cover record files exist without the main ledger');
    const ledger = fs.existsSync(file) ? readCoverLedger(root)
      : { schemaVersion: 1, account: 'stats47', updatedAt: new Date().toISOString(), articles: [] };
    const filed = ledger.articles.filter((row) => row.production || row.revisions.length).map((row) => coverRecordPath(row.articleKey));
    await edit(ledger);
    ledger.updatedAt = new Date().toISOString();
    validateCoverLedger(ledger);
    ledger.articles.sort((a, b) => a.articleKey.localeCompare(b.articleKey));
    const files = storedCoverLedger(ledger);
    for (const [relative, text] of Object.entries(files)) {
      const destination = path.join(root, relative);
      // An edit touches a few articles; the record files of the others keep their bytes and mtime.
      if (fs.existsSync(destination) && fs.readFileSync(destination, 'utf8') === text) continue;
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      const temporary = `${destination}.${process.pid}.tmp`;
      temporaries.push(temporary);
      fs.writeFileSync(temporary, text);
      // Windows readers/virus scanners can briefly hold the destination. Keep the
      // writer lock and old ledger intact while retrying the same atomic rename.
      await renameCoverFile(temporary, destination);
    }
    // An article removed by this edit takes its record file with it; files the ledger never knew are refused on read.
    for (const relative of filed) if (!(relative in files)) fs.rmSync(path.join(root, relative));
    return ledger;
  } finally {
    for (const temporary of temporaries) fs.rmSync(temporary, { force: true });
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}

export function recordCoverObservation(ledger, { key, noteUrl, status, url, observedAt }) {
  const row = ledger.articles.find((a) => a.articleKey === key);
  if (!row || row.noteUrl !== noteUrl) throw Error(`cover observation identity: ${key}`);
  if (row.published && Date.parse(row.published.observedAt) > Date.parse(observedAt)) return;
  // Unknown transport results do not erase the last known image or imply an unpublished asset.
  if (status === 'unknown') return;
  const same = coverUrlPath(row.published?.url) === coverUrlPath(url);
  row.published = { status, url: status === 'configured' ? url : null, observedAt,
    revisionId: same && status === 'configured' ? row.published?.revisionId ?? null : null };
}

/** Only complete portfolio audits may advance public observations; unknown results keep their last evidence. */
export function applyCoverAudit(ledger, report) {
  if (report.account !== 'stats47' || !report.coverage?.complete || !Array.isArray(report.articles))
    throw Error('incomplete cover audit cannot update the ledger');
  for (const article of report.articles) {
    if (!article.catalogKey || !article.noteKey || article.noteUrl !== `https://note.com/stats47/n/${article.noteKey}`)
      throw Error('cover audit article identity mismatch');
    recordCoverObservation(ledger, { key: article.catalogKey, noteUrl: article.noteUrl, ...article.cover, observedAt: article.observedAt });
  }
}

export function addCoverRevision(row, revision, { candidate = false } = {}) {
  const existing = row.revisions.find((r) => r.id === revision.id);
  if (existing && (existing.storage.key !== revision.storage.key || existing.bytes !== revision.bytes))
    throw Error(`immutable cover revision mismatch: ${row.articleKey}`);
  if (existing?.kind === 'candidate' && JSON.stringify(existing.provenance.production) !== JSON.stringify(revision.provenance.production))
    throw Error(`same image cannot replace production provenance: ${row.articleKey}`);
  if (!existing) row.revisions.push(revision);
  // Identical public/archive bytes can become a reviewed candidate without duplicating the object.
  if (candidate && existing && existing.kind !== 'candidate') Object.assign(existing, {
    kind: 'candidate', version: revision.version, createdAt: revision.createdAt,
    quality: revision.quality, review: revision.review, provenance: revision.provenance,
  });
  if (candidate) row.candidateRevisionId = revision.id;
}

export function reviewCoverRevision(row, id, status, reason, now = new Date().toISOString()) {
  const revision = row.revisions.find((r) => r.id === id);
  if (!revision || !['pass', 'needs-revision'].includes(status) || !reason?.trim()) throw Error('invalid cover review');
  if (revision.kind !== 'candidate' || row.candidateRevisionId !== id || revision.width !== 1280 || revision.height !== 670 || !revision.quality)
    throw Error('only a 1280x670 candidate can be approved');
  revision.review = { status, reason: reason.trim(), reviewedAt: now };
  if (status === 'pass') row.approvedRevisionId = id;
  else if (row.approvedRevisionId === id) row.approvedRevisionId = null;
}

export function adoptedCoverRevision(row) {
  const revision = row.revisions.find(r => r.id === row.approvedRevisionId);
  return revision && revision.review.status === 'pass' && revision.id === row.candidateRevisionId
    && row.noteUrl ? revision : null;
}

export function approvedCoverRevision(row) {
  const revision = adoptedCoverRevision(row);
  return revision && revision.id !== row.published?.revisionId ? revision : null;
}

export function coverDisplayState(row, now = Date.now()) {
  const candidate = row.revisions.find((r) => r.id === row.candidateRevisionId);
  const approved = row.revisions.find((r) => r.id === row.approvedRevisionId);
  return { candidate, approved,
    review: candidate?.review.status ?? (row.missingVersions.length ? 'unavailable' : 'missing'),
    publication: candidate && row.published?.revisionId === candidate.id ? 'published'
      : approved && candidate?.id === approved.id ? 'unpublished' : 'unapproved',
    stale: !row.published || now - Date.parse(row.published.observedAt) > 7 * 86400_000 };
}
