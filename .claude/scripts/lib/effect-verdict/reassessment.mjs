/** Append-only reassessment provenance; the original weekly verdict stays immutable. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { hasBaselineAssessment } from '../../metrics/lib/adsense-measurement-contract.mjs';

export const ASSESSMENT_CONTRACT_VERSION = 1;
export const sha256 = text => createHash('sha256').update(text).digest('hex');

export function reassessmentProvenance(originalPath, week) {
  const original = fs.readFileSync(originalPath, 'utf8');
  const doc = JSON.parse(original);
  if (doc.week !== week) throw new Error('reassessment source week mismatch');
  return { week, sourceSha256: sha256(original), sourceDecidedAt: doc.decidedAt ?? null };
}

/** Choose only decisions bound to the unchanged source, exact week and current
 * contract. Future-dated, stale-contract and unrelated decisions cannot hide a fail.
 */
export function selectReassessment(originalPath, week, now = new Date()) {
  const folder = path.join(path.dirname(originalPath), 'reassessments', week);
  if (!fs.existsSync(originalPath) || !fs.existsSync(folder)) return originalPath;
  const source = reassessmentProvenance(originalPath, week);
  const originalSubjects = JSON.parse(fs.readFileSync(originalPath, 'utf8')).verdicts ?? [];
  const candidates = fs.readdirSync(folder).filter(name => name.endsWith('.json')).map(name => {
    const file = path.join(folder, name);
    try {
      const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
      const time = Date.parse(doc.decidedAt);
      const originalTime = Date.parse(source.sourceDecidedAt);
      if (!Array.isArray(doc.verdicts) || doc.summary?.total !== doc.verdicts.length ||
        originalSubjects.some(original => !doc.verdicts.some(v => v.subjectId === original.subjectId && v.domainId === original.domainId)) ||
        doc.verdicts.some(v => v.assessment?.kind === 'baseline-observation' ? !hasBaselineAssessment(v) : v.assessment?.kind !== 'effect-experiment')) return null;
      if (doc.week !== week || doc.reassesses?.week !== week ||
        doc.assessmentContractVersion !== ASSESSMENT_CONTRACT_VERSION ||
        doc.reassesses?.sourceSha256 !== source.sourceSha256 ||
        !Number.isFinite(time) || time > now.getTime() ||
        (Number.isFinite(originalTime) && time < originalTime)) return null;
      return { file, time };
    } catch { return null; }
  }).filter(Boolean).sort((a, b) => b.time - a.time);
  return candidates[0]?.file ?? originalPath;
}
