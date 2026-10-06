import sharp from 'sharp';
import { addCoverRevision, coverSha, updateCoverLedger } from './cover-assets.mjs';
import { createCoverStore, storeCoverBytes, storeCoverInput } from './cover-storage.mjs';

/** Import bytes only after deterministic layout checks. Approval is a separate operation. */
export async function registerCoverCandidate(proposal, bytes, version, store = createCoverStore()) {
  const metadata = await sharp(bytes).metadata();
  if (metadata.format !== 'png' || metadata.width !== 1280 || metadata.height !== 670 ||
      coverSha(bytes) !== proposal.sha256 || proposal.quality?.textBounds !== 'pass' ||
      proposal.quality?.textOverlap !== 'pass' || !proposal.evidence)
    throw Error(`candidate quality mismatch: ${proposal.key}`);
  const asset = await storeCoverBytes(proposal.key, bytes, store);
  const input = await storeCoverInput(proposal.key, Buffer.from(JSON.stringify(proposal.evidence)), store);
  const revision = { ...asset, id: asset.sha256, kind: 'candidate', version, createdAt: new Date().toISOString(),
    width: metadata.width, height: metadata.height,
    quality: { textBounds: 'pass', textOverlap: 'pass', evidenceSha256: input.sha256 },
    review: { status: 'pending', reason: null, reviewedAt: null },
    provenance: { renderer: proposal.evidence.renderer ?? 'bold-note-cover', sourceUrl: proposal.evidence.valuesSource ?? null,
      sourceSha256: proposal.evidence.valuesSha256 ?? null, input } };
  await updateCoverLedger((ledger) => {
    const row = ledger.articles.find((a) => a.articleKey === proposal.key);
    if (!row || row.noteUrl !== proposal.noteUrl) throw Error('candidate catalog identity mismatch');
    addCoverRevision(row, revision, { candidate: true });
  });
  return revision;
}
