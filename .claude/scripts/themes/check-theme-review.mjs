import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const git = (...args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
const reportPath = '.claude/state/themes/ci-review.json';
const experimentsPath = '.claude/state/themes/experiments.json';
const meaningful = text => typeof text === 'string' && text.trim() && !/^(test|todo|tbd|placeholder|sample|テスト|仮|未記入)[.!。]*$/i.test(text.trim());
const evidenceRef = ref => typeof ref === 'string' && (/^https:\/\/[^/\s]+\/[^\s]+$/.test(ref) || /^(\.claude|\.local|apps|packages)\/[^\s]+$/.test(ref)) && !ref.split('/').includes('..');
export function evidenceFilePath(ref) {
  return ref.replace(/(?:#[^\s]*|:[1-9]\d*(?:-[1-9]\d*)?)$/, '');
}
export function validateReview(report, input, files, before, after) {
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.inputSha256, input.reviewInputSha256);
  assert.equal(report.reviewedAt, input.observedAt);
  assert.equal(report.month, input.observedAt.slice(0, 7));
  assert.ok(['proposed', 'no-change', 'blocked'].includes(report.status));
  assert.ok(
    meaningful(report.summary) &&
      report.summary.length <= 1000
  );
  assert.ok(Array.isArray(report.findings) && report.findings.length <= 10);
  assert.ok(
    report.findings.every(
      (f) =>
        typeof f.themeKey === 'string' &&
        meaningful(f.detail) &&
        Array.isArray(f.evidenceRefs) &&
        f.evidenceRefs.length > 0 && f.evidenceRefs.every(evidenceRef)
    )
  );
  assert.ok(
    Array.isArray(report.unreviewedThemes) && Array.isArray(report.tests)
  );
  for (const f of files) {
    const allowed =
      f === reportPath ||
      f === experimentsPath ||
      [
        'apps/web/src/features/theme-dashboard/',
        'packages/data-configs/src/theme-catalog/',
        '.claude/scripts/themes/',
      ].some((p) => f.startsWith(p));
    assert.ok(
      allowed &&
        !/theme-followup|audit-theme-runtime|check-theme-review|record-theme-review|theme-weekly-workflow|build-theme-alert|validate-theme-state/.test(
          f
        ),
      `Disallowed review change: ${f}`
    );
  }
  const keys = new Set(before.experiments.map((e) => e.themeKey));
  assert.ok(
    [
      ...report.findings.map((f) => f.themeKey),
      ...report.unreviewedThemes,
    ].every((k) => keys.has(k)),
    'Unknown theme'
  );
  assert.ok(Array.isArray(report.sourceReviews), 'Missing source review coverage');
  for (const row of report.sourceReviews) {
    assert.ok(keys.has(row.themeKey), 'Unknown theme');
    assert.ok(meaningful(row.detail) && Array.isArray(row.evidenceRefs) && row.evidenceRefs.length > 0 && row.evidenceRefs.every(ref => evidenceRef(ref) && ref.startsWith('https://')), 'Source review needs official URL evidence');
  }
  const reviewed = new Set(report.sourceReviews.map(row => row.themeKey));
  assert.deepEqual([...new Set(report.unreviewedThemes)].sort(), [...keys].filter(key => !reviewed.has(key)).sort(), 'Unreviewed themes must match recorded source coverage');
  const protectedFields = (ex) => ({
    ...ex,
    experiments: ex.experiments.map((e) => {
      const c = structuredClone(e);
      delete c.verdict;
      delete c.evidenceRefs;
      delete c.notes;
      if (c.result) {
        delete c.result.launchReview;
        delete c.result.baselineCandidate;
      }
      return c;
    }),
  });
  assert.deepEqual(
    protectedFields(after),
    protectedFields(before),
    'Experiment dates, baselines and observations are immutable in review'
  );
  after.experiments.forEach((entry, index) => {
    const original = before.experiments[index];
    if (entry.verdict !== original.verdict) {
      assert.ok(
        original.verdict === 'pending' &&
          original.evaluateAt?.d56 &&
          original.evaluateAt.d56 <= input.observedAt,
        'Only due d56 experiments can receive a final verdict'
      );
    }
  });
  const codeChanged = files.some(
    (f) => f !== reportPath && f !== experimentsPath
  );
  if (codeChanged) assert.equal(report.status, 'proposed');
  return { codeChanged, proposalChanges: files.some((f) => f !== reportPath) };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
  const files = [
    ...new Set(
      [
        ...git('diff', '--name-only', 'HEAD').trim().split('\n'),
        ...git('ls-files', '--others', '--exclude-standard').trim().split('\n'),
      ].filter(Boolean)
    ),
  ];
  const report = read(reportPath);
  for (const row of [...report.findings, ...(report.sourceReviews ?? [])]) {
    for (const ref of row.evidenceRefs) {
      if (!ref.startsWith('https://')) assert.ok(fs.existsSync(path.join(ROOT, evidenceFilePath(ref))), `Missing evidence: ${ref}`);
    }
  }
  const { codeChanged, proposalChanges } = validateReview(
    read(reportPath),
    read('.claude/state/themes/ci-followup.json'),
    files,
    JSON.parse(git('show', `HEAD:${experimentsPath}`)),
    read(experimentsPath)
  );
  const evidenceDir = path.join(ROOT, '.local/ci/theme-followup');
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(
    path.join(evidenceDir, 'review-paths.txt'),
    files.join('\n') + '\n'
  );
  fs.writeFileSync(
    path.join(evidenceDir, 'review-body.md'),
    read(reportPath).summary +
      '\n\n検証と根拠: `.claude/state/themes/ci-review.json`。\n'
  );
  if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `code_changed=${codeChanged}\nproposal_changes=${proposalChanges}\n`
    );
  console.log(`Review contract PASS (${files.length} files)`);
}
