import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

/** The workflow writes the report; the model only returns a structured result. */
export function extractReview(entries, input, themeKeys, priorReview = null) {
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
  assert.ok(Array.isArray(report.sourceReviews), 'Missing source reviews');
  const sourceReviews = new Map();
  if (priorReview?.month === input.observedAt.slice(0, 7)) {
    for (const row of priorReview.sourceReviews ?? []) sourceReviews.set(row.themeKey, row);
  }
  for (const row of report.sourceReviews) sourceReviews.set(row.themeKey, row);
  return {
    ...report,
    sourceReviews: [...sourceReviews.values()],
    unreviewedThemes: [...new Set(themeKeys)].filter(key => !sourceReviews.has(key)).sort(),
    schemaVersion: 1,
    inputSha256: input.reviewInputSha256,
    reviewedAt: input.observedAt,
    month: input.observedAt.slice(0, 7),
  };
}

export function validateReplay(report, input, runId) {
  assert.match(runId, /^[0-9]+$/);
  assert.ok(input.runUrl?.endsWith(`/runs/${runId}`), 'Replay must match the current observation run');
  assert.equal(report.inputSha256, input.reviewInputSha256, 'Stale replay evidence');
  assert.equal(report.reviewedAt, input.observedAt);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..'
  );
  const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const previousPath = '.claude/state/themes/ci-review.json';
  const input = read('.claude/state/themes/ci-followup.json');
  let report;
  if (process.argv[2] === '--replay') {
    report = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
    validateReplay(report, input, process.argv[5]);
    fs.cpSync(process.argv[4], path.join(root, '.local/ci/theme-followup'), { recursive: true });
  } else {
    report = extractReview(
      JSON.parse(fs.readFileSync(process.argv[2], 'utf8')),
      input,
      read('.claude/state/themes/experiments.json').experiments.map(e => e.themeKey),
      fs.existsSync(path.join(root, previousPath)) ? read(previousPath) : null
    );
  }
  // The following check-theme-review step enforces schema, evidence, changed paths and immutable observations.
  fs.writeFileSync(
    path.join(root, '.claude/state/themes/ci-review.json'),
    JSON.stringify(report, null, 2) + '\n'
  );
}
