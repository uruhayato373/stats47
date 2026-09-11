import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

/** The workflow writes the report; the model only returns a structured result. */
export function extractReview(entries) {
  assert.ok(Array.isArray(entries), 'Missing execution entries');
  const result = entries.findLast((entry) => entry.type === 'result');
  assert.ok(
    result && result.subtype === 'success' && !result.is_error,
    'Review execution did not succeed'
  );
  assert.equal(typeof result.result, 'string', 'Missing final review JSON');
  const report = JSON.parse(result.result.trim());
  assert.ok(
    report && !Array.isArray(report) && typeof report === 'object',
    'Expected review object'
  );
  return report;
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
    JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
  );
  // The following check-theme-review step enforces schema, evidence, changed paths and immutable observations.
  fs.writeFileSync(
    path.join(root, '.claude/state/themes/ci-review.json'),
    JSON.stringify(report, null, 2) + '\n'
  );
}
