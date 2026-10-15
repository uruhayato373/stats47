import sharp from 'sharp';
import { addCoverRevision, coverSha, updateCoverLedger } from './cover-assets.mjs';
import { createCoverStore, storeCoverBytes, storeCoverInput } from './cover-storage.mjs';
import { readCoverLedger } from './cover-assets.mjs';
import { readArticleLedger } from './article-ledger.mjs';
import { assertCoverPlan, readCoverPolicies } from './cover-production.mjs';
import { prepareGeneratedCover } from './generated-cover.mjs';
import { noteCoverCategory } from '../catalog/cover-categories.mjs';

function productionReference(row, evidence) {
  if (!row.production?.brief || evidence.production?.renderer !== 'note-imagegen-cover-v1')
    throw Error('Codex imagegen cover with current production plan required; legacy covers are read-only');
  const policies = readCoverPolicies();
  const article = readArticleLedger().articles.find(a => a.key === row.articleKey);
  const category = article && noteCoverCategory(article);
  if (!article || !category) throw Error('production article or policy missing');
  return assertCoverPlan(row, { ...article, category }, policies, evidence.production);
}

/** Import after the renderer's recorded checks. User adoption is a separate operation. */
export async function registerCoverCandidate(proposal, bytes, version, store = createCoverStore(), backgroundBytes, referenceBytes) {
  const metadata = await sharp(bytes).metadata();
  if (metadata.format !== 'png' || metadata.width !== 1280 || metadata.height !== 670 ||
      coverSha(bytes) !== proposal.sha256 || proposal.quality?.textBounds !== 'pass' ||
      proposal.quality?.textOverlap !== 'pass' || !proposal.evidence)
    throw Error(`candidate quality mismatch: ${proposal.key}`);
  const before = readCoverLedger().articles.find(a => a.articleKey === proposal.key);
  if (!before || before.noteUrl !== proposal.noteUrl) throw Error('candidate catalog identity mismatch');
  const production = productionReference(before, proposal.evidence);
  const evidence = structuredClone(proposal.evidence);
  if (production) {
    if (evidence.production.renderer === 'note-imagegen-cover-v1') {
      if (!backgroundBytes || coverSha(backgroundBytes) !== evidence.sourceImageSha256 || evidence.renderer !== evidence.production.renderer)
        throw Error('production original missing or SHA mismatch');
      const checked = await prepareGeneratedCover(evidence.production, backgroundBytes, evidence.visualReview, referenceBytes);
      if (coverSha(checked.png) !== proposal.sha256 || evidence.validationMethod !== 'visual' ||
          evidence.referenceImageSha256 !== checked.evidence.referenceImageSha256) throw Error('complete cover normalization mismatch');
      evidence.original = await storeCoverBytes(proposal.key, backgroundBytes, store);
      if (referenceBytes) evidence.referenceImage = await storeCoverBytes(proposal.key, referenceBytes, store);
    } else {
      if (!backgroundBytes || coverSha(backgroundBytes) !== evidence.backgroundSha256 || (await sharp(backgroundBytes).metadata()).format !== 'png')
        throw Error('production background missing or SHA mismatch');
      evidence.background = await storeCoverBytes(proposal.key, backgroundBytes, store);
    }
  }
  const asset = await storeCoverBytes(proposal.key, bytes, store);
  const input = await storeCoverInput(proposal.key, Buffer.from(JSON.stringify(evidence)), store);
  const revision = { ...asset, id: asset.sha256, kind: 'candidate', version, createdAt: new Date().toISOString(),
    width: metadata.width, height: metadata.height,
    quality: { textBounds: 'pass', textOverlap: 'pass', evidenceSha256: input.sha256 },
    review: { status: 'pending', reason: null, reviewedAt: null },
    provenance: { renderer: proposal.evidence.renderer ?? 'bold-note-cover', sourceUrl: proposal.evidence.valuesSource ?? null,
      sourceSha256: proposal.evidence.valuesSha256 ?? null, input, ...(production ? { production } : {}) } };
  await updateCoverLedger((ledger) => {
    const row = ledger.articles.find((a) => a.articleKey === proposal.key);
    if (!row || row.noteUrl !== proposal.noteUrl) throw Error('candidate catalog identity mismatch');
    productionReference(row, proposal.evidence);
    addCoverRevision(row, revision, { candidate: true });
  });
  return revision;
}
