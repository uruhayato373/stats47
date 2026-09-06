import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import JSZip from 'jszip';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

/** Read only: published claims must match the immutable delivery, not a current ranking. */
export async function inspectPack(root, listing) {
  const contract = listing._delivery;
  if (!contract) throw new Error('delivery contract missing');
  const dir = resolve(root, contract.artifactDirectory);
  const manifestBytes = readFileSync(resolve(dir, 'manifest.json'));
  if (contract.manifestSha256 && sha256(manifestBytes) !== contract.manifestSha256) throw new Error('manifest changed');
  const manifest = JSON.parse(manifestBytes);
  for (const file of manifest.files) {
    const path = resolve(dir, file.path);
    const rel = relative(dir, path);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('unsafe manifest path');
    const bytes = readFileSync(path);
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`artifact mismatch: ${file.path}`);
  }
  const rows = parse(readFileSync(resolve(dir, 'data.csv')), { bom: true });
  const sources = parse(readFileSync(resolve(dir, 'SOURCES.csv')), { bom: true, columns: true });
  const codes = Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, '0')}000`);
  if (rows.length !== 48 || rows.slice(1).some((r, i) => r[0] !== codes[i] || r.length !== rows[0].length)) throw new Error('47 ordered prefecture codes required');
  const count = rows[0].length - 3; // code, name, missing-value notes
  if (sources.length !== count || count !== contract.indicatorCount) throw new Error('indicator count mismatch');
  const hasXlsx = manifest.files.some(f => f.path === 'product.xlsx') && existsSync(resolve(dir, 'product.xlsx'));
  if (hasXlsx !== contract.hasXlsx) throw new Error('Excel delivery mismatch');
  const ppt = await JSZip.loadAsync(readFileSync(resolve(dir, 'product.pptx')));
  // Existing databook generator: six framing slides + three per indicator.
  const slides = Object.keys(ppt.files).filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p)).length;
  if (slides !== 6 + contract.pptxIndicatorCount * 3) throw new Error('PowerPoint scope mismatch');
  return { manifest, manifestSha256: sha256(manifestBytes), rows, sources, count, slides, hasXlsx };
}

export function selectPreview(evidence, header) {
  const index = evidence.rows[0].indexOf(header);
  if (index < 2 || index >= evidence.rows[0].length - 1) throw new Error('preview indicator missing');
  return { header, source: evidence.sources[index - 2], values: evidence.rows.slice(1, 7).map(r => [r[1], r[index] || '欠損']) };
}
