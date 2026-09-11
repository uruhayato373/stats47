import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

/** The workflow writes the report; the model only returns a structured result. */
export function extractReview(entries, input) {
  assert.ok(Array.isArray(entries), 'Missing execution entries');
  const result = entries.findLast((entry) => entry.type === 'result');
  assert.ok(
    result && result.subtype === 'success' && !result.is_error,
    'Review execution did not succeed'
  );
  const report = result.structured_output;
  assert.ok(
    report && !Array.isArray(report) && typeof report === 'object',
    'Missing structured review object'
  );
  assert.match(input.reviewInputSha256, /^[a-f0-9]{64}$/);
  assert.match(input.observedAt, /^\d{4}-\d{2}-\d{2}$/);
  return {
    ...report,
    schemaVersion: 1,
    inputSha256: input.reviewInputSha256,
    reviewedAt: input.observedAt,
    month: input.observedAt.slice(0, 7),
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..'
  );
  const report = extractReview(
    JSON.parse(fs.readFileSync(process.argv[2], 'utf8')),
    JSON.parse(fs.readFileSync(path.join(root, '.claude/state/themes/ci-followup.json'), 'utf8'))
  );
  // The following check-theme-review step enforces schema, evidence, changed paths and immutable observations.
  fs.writeFileSync(
    path.join(root, '.claude/state/themes/ci-review.json'),
    JSON.stringify(report, null, 2) + '\n'
  );
}
