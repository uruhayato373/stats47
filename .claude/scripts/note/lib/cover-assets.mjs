/** Shared, schema-validated note cover ledger. No local image paths are persisted. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import Ajv from 'ajv';
import schema from '../../../../data/note/cover-assets.schema.json' with { type: 'json' };

export const COVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const COVER_LEDGER_PATH = 'data/note/cover-assets.json';
const ajv = new Ajv({ allErrors: true });
const validateShape = ajv.compile(schema);
export const coverSha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const coverAssetKey = (key, sha) => `note/covers/${key}/revisions/${sha}.png`;
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
  if (type === 'note-covers') throw Error('noteカバーは data/note/cover-assets.json が正本です。note:assets と generate-cover-refresh.ts を使用してください。汎用OGP生成からの上書きは終了しました。');
}

export function validateCoverLedger(ledger, catalog) {
  if (!validateShape(ledger)) throw Error(`cover ledger schema: ${ajv.errorsText(validateShape.errors)}`);
  const seen = new Set();
  for (const row of ledger.articles) {
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
      if (rev.kind === 'candidate' && (!rev.quality || rev.width !== 1280 || rev.height !== 670))
        throw Error(`candidate quality evidence required: ${row.articleKey}`);
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

export function readCoverLedger(root = COVER_ROOT) {
  return validateCoverLedger(JSON.parse(fs.readFileSync(path.join(root, COVER_LEDGER_PATH), 'utf8')));
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
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    const ledger = fs.existsSync(file) ? readCoverLedger(root)
      : { schemaVersion: 1, account: 'stats47', updatedAt: new Date().toISOString(), articles: [] };
    await edit(ledger);
    ledger.updatedAt = new Date().toISOString();
    validateCoverLedger(ledger);
    ledger.articles.sort((a, b) => a.articleKey.localeCompare(b.articleKey));
    fs.writeFileSync(temporary, JSON.stringify(ledger, null, 2) + '\n');
    // Windows readers/virus scanners can briefly hold the destination. Keep the
    // writer lock and old ledger intact while retrying the same atomic rename.
    await renameCoverFile(temporary, file);
    return ledger;
  } finally {
    fs.rmSync(temporary, { force: true });
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
