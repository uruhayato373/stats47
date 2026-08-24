#!/usr/bin/env node
/**
 * GSC の「計測 → 週次レビュー → 候補判断 → 次週計画 → 月次集約」を監査する。
 *
 * 判断は行わず、既存 SSOT の鮮度と接続だけを検査する。結果は GitHub Actions と
 * gsc-improvement / weekly-review / weekly-plan / monthly-plan が共通利用する。
 *
 * Usage:
 *   node .claude/scripts/gsc/audit-operations-cycle.mjs
 *   node .claude/scripts/gsc/audit-operations-cycle.mjs --stage monitor --write --strict
 *   node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review-input --week 2026-W34
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isoWeekOf } from '../lib/effect-verdict/iso-week.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

const DEFAULT_POLICY = {
  schemaVersion: 1,
  urlInspectionMaxAgeDays: 3,
  searchGrowthMaxAgeDays: 8,
  minimumCandidateDecisionsPerWeek: 1,
  minimumReviewsInTrailingFourWeeks: 3,
  requiredMonthlyHeading: '## GSC運用サイクル',
  legacyMissingTargetSubjectIds: [],
};

const STAGES = new Set([
  'review-input',
  'review',
  'plan',
  'monthly',
  'monitor',
]);
const LEVEL_RANK = { pass: 0, warn: 1, fail: 2 };

function readText(file, fallback = null) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return fallback;
  }
}

function readJson(file, fallback = null) {
  const text = readText(file);
  if (text == null) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function listIsoWeeks(dir) {
  try {
    return fs
      .readdirSync(dir)
      .filter((name) => /^\d{4}-W\d{2}$/.test(name))
      .sort();
  } catch {
    return [];
  }
}

function listVerdictWeeks(dir) {
  try {
    return fs
      .readdirSync(dir)
      .map((name) => /^verdicts-(\d{4}-W\d{2})\.json$/.exec(name)?.[1])
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

function frontmatterValue(text, key) {
  if (!text?.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end < 0) return null;
  return (
    text.slice(4, end).match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'))?.[1] ??
    null
  );
}

function parseDateFromHeading(text, prefix) {
  const match = text?.match(
    new RegExp(`^# ${prefix}[^\\d]*(\\d{4}-\\d{2}-\\d{2})`, 'm')
  );
  return match?.[1] ?? null;
}

function ageDays(observedAt, now) {
  if (!observedAt) return null;
  const observed = new Date(`${String(observedAt).slice(0, 10)}T00:00:00Z`);
  const current = new Date(`${dateInTokyo(now)}T00:00:00Z`);
  if (Number.isNaN(observed.getTime())) return null;
  return Math.floor((current - observed) / 86_400_000);
}

function mondayOfIsoWeek(week) {
  const match = /^(\d{4})-W(\d{2})$/.exec(week ?? '');
  if (!match) throw new Error(`ISO week ではない: ${week}`);
  const year = Number(match[1]);
  const weekNumber = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (weekNumber - 1) * 7);
  return monday;
}

export function addIsoWeeks(week, delta) {
  const date = mondayOfIsoWeek(week);
  date.setUTCDate(date.getUTCDate() + delta * 7);
  return isoWeekOf(date);
}

function datePartsInTokyo(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return Object.fromEntries(
    parts
      .filter((part) => ['year', 'month', 'day'].includes(part.type))
      .map((part) => [part.type, part.value])
  );
}

function dateInTokyo(now) {
  const { year, month, day } = datePartsInTokyo(now);
  return `${year}-${month}-${day}`;
}

function monthInTokyo(now) {
  const { year, month } = datePartsInTokyo(now);
  return `${year}-${month}`;
}

function isoWeekInTokyo(now) {
  return isoWeekOf(dateInTokyo(now));
}

function completedIsoWeek(now) {
  return addIsoWeeks(isoWeekInTokyo(now), -1);
}

function decisionWeek(candidate) {
  const at = candidate.approvedAt ?? candidate.dismissedAt ?? null;
  if (!at) return null;
  try {
    return isoWeekInTokyo(new Date(at));
  } catch {
    return null;
  }
}

function loadPolicy(root, override) {
  if (override) return { ...DEFAULT_POLICY, ...override };
  const stored = readJson(
    path.join(root, '.claude/config/gsc-operations-cycle.json'),
    {}
  );
  return { ...DEFAULT_POLICY, ...stored };
}

function addCheck(checks, code, level, detail, action = null) {
  checks.push({ code, level, detail, action });
}

function summarizeStatus(checks) {
  return checks.reduce(
    (status, check) =>
      LEVEL_RANK[check.level] > LEVEL_RANK[status] ? check.level : status,
    'pass'
  );
}

function requiredByStage(stage, target) {
  const requirements = {
    review: new Set(['review', 'plan', 'monthly', 'monitor']),
    plan: new Set(['plan', 'monitor']),
    monthly: new Set(['monthly', 'monitor']),
    candidateDecision: new Set(['review', 'plan', 'monthly', 'monitor']),
  };
  return requirements[target]?.has(stage) ?? false;
}

export function auditOperationsCycle({
  root = PROJECT_ROOT,
  now = new Date(),
  stage = 'monitor',
  week = null,
  policy: policyOverride = null,
} = {}) {
  if (!STAGES.has(stage)) throw new Error(`未知の stage: ${stage}`);
  const policy = loadPolicy(root, policyOverride);
  const checks = [];
  const paths = {
    snapshots: path.join(
      root,
      '.claude/skills/analytics/gsc-improvement/reference/snapshots'
    ),
    verdicts: path.join(root, '.claude/state/effect-verdict'),
    reviews: path.join(
      root,
      '.claude/skills/management/weekly-review/reference/reviews'
    ),
    weeklyPlan: path.join(root, '.claude/todo/weekly.md'),
    monthlyPlan: path.join(root, '.claude/todo/monthly.md'),
    candidates: path.join(root, '.claude/state/search-growth/candidates.json'),
    inspectionLatest: path.join(
      root,
      '.claude/state/metrics/gsc/url-inspection/LATEST.md'
    ),
    improvements: path.join(root, '.claude/todo/improvements.md'),
  };

  const snapshotWeeks = listIsoWeeks(paths.snapshots);
  const measurementWeek = week ?? snapshotWeeks.at(-1) ?? null;
  const expectedCompletedWeek = completedIsoWeek(now);
  const expectedPlanWeek = measurementWeek
    ? addIsoWeeks(measurementWeek, 1)
    : null;
  const currentMonth = monthInTokyo(now);

  if (!measurementWeek) {
    addCheck(
      checks,
      'snapshot-missing',
      'fail',
      'GSC weekly snapshot が無い',
      '/fetch-gsc-data snapshot <YYYY-Www>'
    );
  } else {
    const summary = readJson(
      path.join(paths.snapshots, measurementWeek, 'summary.json')
    );
    const complete =
      summary?.finalized7d?.coverage?.status === 'complete' &&
      !summary?.wowBlockedReason;
    addCheck(
      checks,
      'snapshot-period',
      complete ? 'pass' : 'fail',
      complete
        ? `${measurementWeek} finalized7d coverage complete`
        : `${measurementWeek} summary が missing/partial`,
      complete ? null : `npm run fetch-gsc-snapshot -- ${measurementWeek}`
    );
    const onTime = measurementWeek >= expectedCompletedWeek;
    addCheck(
      checks,
      'snapshot-freshness',
      onTime ? 'pass' : 'fail',
      `latest=${measurementWeek}, expected>=${expectedCompletedWeek}`,
      onTime ? null : `npm run fetch-gsc-snapshot -- ${expectedCompletedWeek}`
    );
  }

  const verdictPath = measurementWeek
    ? path.join(paths.verdicts, `verdicts-${measurementWeek}.json`)
    : null;
  const verdictDoc = verdictPath ? readJson(verdictPath) : null;
  if (!verdictDoc) {
    addCheck(
      checks,
      'effect-verdict',
      'fail',
      `${measurementWeek ?? '対象週'} の effect verdict が無い`,
      measurementWeek
        ? `node .claude/scripts/lib/effect-verdict/cli.mjs --week ${measurementWeek}`
        : null
    );
  } else {
    addCheck(
      checks,
      'effect-verdict',
      'pass',
      `${measurementWeek} verdict ${verdictDoc.summary?.total ?? 0}件を記録済み`
    );
    const missingTargets = (verdictDoc.verdicts ?? []).filter((verdict) =>
      verdict.guards?.some((guard) => guard.code === 'insufficient-target')
    );
    const legacy = new Set(policy.legacyMissingTargetSubjectIds ?? []);
    const unknown = missingTargets.filter(
      (verdict) => !legacy.has(verdict.subjectId)
    );
    const known = missingTargets.filter((verdict) =>
      legacy.has(verdict.subjectId)
    );
    addCheck(
      checks,
      'effect-target-ratchet',
      unknown.length ? 'fail' : known.length ? 'warn' : 'pass',
      unknown.length
        ? `新規の想定効果値欠落: ${unknown.map((item) => item.subjectId).join(', ')}`
        : known.length
          ? `既知の過去欠落 ${known.length}件（新規欠落0）`
          : '想定効果値欠落0',
      unknown.length
        ? 'デプロイ前の improvement-log に [target: ±N unit] を登録'
        : known.length
          ? '既知7件は推測で補わず、週次で終了または再計測を判断'
          : null
    );

    const improvements = readText(paths.improvements, '') ?? '';
    const unresolvedConfirmed = (verdictDoc.verdicts ?? []).filter(
      (verdict) =>
        verdict.label &&
        verdict.label !== 'effect/pending' &&
        improvements.includes(verdict.subjectId)
    );
    addCheck(
      checks,
      'effect-backlog-reconciliation',
      unresolvedConfirmed.length ? 'fail' : 'pass',
      unresolvedConfirmed.length
        ? `確定済みだが active 一覧に残存: ${unresolvedConfirmed.map((item) => item.subjectId).join(', ')}`
        : '確定 verdict と active 一覧の不整合0',
      unresolvedConfirmed.length
        ? '/triage-improvement-log で確定結果を反映'
        : null
    );
  }

  const candidateDoc = readJson(paths.candidates);
  const candidateGeneratedAge = ageDays(candidateDoc?.generatedAt, now);
  const candidateFresh =
    candidateDoc?.week === measurementWeek &&
    candidateGeneratedAge != null &&
    candidateGeneratedAge <= policy.searchGrowthMaxAgeDays;
  addCheck(
    checks,
    'search-growth-freshness',
    candidateFresh ? 'pass' : 'fail',
    candidateDoc
      ? `week=${candidateDoc.week ?? '-'}, age=${candidateGeneratedAge ?? '?'}d`
      : 'candidates.json が無い',
    candidateFresh ? null : 'npm run search-growth:all'
  );

  const requiredSources = ['gsc', 'coverage', 'inspection'];
  const unhealthySources = requiredSources.filter((source) => {
    const item = candidateDoc?.sourceHealth?.[source];
    return (
      !item ||
      ['missing', 'stale'].includes(item.freshness) ||
      ['failed', 'skipped'].includes(item.status)
    );
  });
  addCheck(
    checks,
    'search-growth-sources',
    unhealthySources.length ? 'fail' : 'pass',
    unhealthySources.length
      ? `stale/missing: ${unhealthySources.join(', ')}`
      : 'gsc/coverage/inspection は利用可能',
    unhealthySources.length
      ? 'npm run search-growth:collect && npm run search-growth:all'
      : null
  );

  const validDecisionWeeks = new Set(
    [measurementWeek, expectedPlanWeek].filter(Boolean)
  );
  const decisions = (candidateDoc?.candidates ?? []).filter((candidate) =>
    validDecisionWeeks.has(decisionWeek(candidate))
  );
  if (requiredByStage(stage, 'candidateDecision')) {
    const decisionRequired =
      (candidateDoc?.candidates?.length ?? 0) > 0 &&
      unhealthySources.length === 0;
    const enough =
      !decisionRequired ||
      decisions.length >= policy.minimumCandidateDecisionsPerWeek;
    addCheck(
      checks,
      'search-growth-decision',
      enough ? 'pass' : 'fail',
      decisionRequired
        ? `${measurementWeek} の承認/却下 ${decisions.length}件（必要 ${policy.minimumCandidateDecisionsPerWeek}件以上）`
        : '証拠不足または候補0のため判断を強制しない',
      enough
        ? null
        : 'npm run search-growth:triage で最大3件を確認し、approve または dismiss を最低1件記録'
    );
  }

  const inspectionText = readText(paths.inspectionLatest);
  const inspectionDate = parseDateFromHeading(
    inspectionText,
    'GSC URL Inspection'
  );
  const inspectionAge = ageDays(inspectionDate, now);
  const inspectionFresh =
    inspectionAge != null && inspectionAge <= policy.urlInspectionMaxAgeDays;
  addCheck(
    checks,
    'url-inspection-freshness',
    inspectionFresh ? 'pass' : 'fail',
    inspectionDate
      ? `latest=${inspectionDate}, age=${inspectionAge}d`
      : 'LATEST.md の取得日を読めない',
    inspectionFresh ? null : 'gsc-url-inspection-daily workflow を確認'
  );

  const reviewPath = measurementWeek
    ? path.join(paths.reviews, `${measurementWeek}.md`)
    : null;
  const reviewText = reviewPath ? readText(reviewPath) : null;
  if (requiredByStage(stage, 'review')) {
    const hasSearchGrowth = /##\s+search-growth\s+候補/i.test(reviewText ?? '');
    addCheck(
      checks,
      'weekly-review',
      reviewText && hasSearchGrowth ? 'pass' : 'fail',
      reviewText
        ? `${measurementWeek} review の search-growth 節=${hasSearchGrowth ? 'あり' : 'なし'}`
        : `${measurementWeek} review が無い`,
      reviewText && hasSearchGrowth ? null : `/weekly-review ${measurementWeek}`
    );
  }

  const weeklyPlanText = readText(paths.weeklyPlan);
  const weeklyPlanWeek = frontmatterValue(weeklyPlanText, 'week');
  if (requiredByStage(stage, 'plan')) {
    const current = weeklyPlanWeek === expectedPlanWeek;
    addCheck(
      checks,
      'weekly-plan',
      current ? 'pass' : 'fail',
      `plan=${weeklyPlanWeek ?? '-'}, expected=${expectedPlanWeek ?? '-'}`,
      current ? null : `/weekly-plan ${expectedPlanWeek}`
    );
  }

  const monthlyPlanText = readText(paths.monthlyPlan);
  const monthlyPlanMonth = frontmatterValue(monthlyPlanText, 'month');
  if (requiredByStage(stage, 'monthly')) {
    const current = monthlyPlanMonth === currentMonth;
    const hasHeading = monthlyPlanText?.includes(policy.requiredMonthlyHeading);
    addCheck(
      checks,
      'monthly-plan',
      current && hasHeading ? 'pass' : 'fail',
      `month=${monthlyPlanMonth ?? '-'}, GSC運用サイクル節=${hasHeading ? 'あり' : 'なし'}`,
      current && hasHeading ? null : `/monthly-plan ${currentMonth}`
    );

    const trailingWeeks = measurementWeek
      ? Array.from({ length: 4 }, (_, index) =>
          addIsoWeeks(measurementWeek, -index)
        )
      : [];
    const reviewCount = trailingWeeks.filter((reviewWeek) =>
      fs.existsSync(path.join(paths.reviews, `${reviewWeek}.md`))
    ).length;
    addCheck(
      checks,
      'monthly-review-coverage',
      reviewCount >= policy.minimumReviewsInTrailingFourWeeks ? 'pass' : 'fail',
      `直近4週レビュー ${reviewCount}/4（必要 ${policy.minimumReviewsInTrailingFourWeeks}以上）`,
      reviewCount >= policy.minimumReviewsInTrailingFourWeeks
        ? null
        : '欠落週の /weekly-review を先に実行'
    );
  }

  const status = summarizeStatus(checks);
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    stage,
    status,
    measurementWeek,
    expectedCompletedWeek,
    expectedPlanWeek,
    currentMonth,
    summary: {
      pass: checks.filter((check) => check.level === 'pass').length,
      warn: checks.filter((check) => check.level === 'warn').length,
      fail: checks.filter((check) => check.level === 'fail').length,
    },
    checks,
  };
}

export function renderMarkdown(result) {
  const mark = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' };
  const lines = [
    `# GSC Operations Cycle — ${result.measurementWeek ?? 'unknown'}`,
    '',
    `**Status**: ${mark[result.status]} / **Stage**: ${result.stage} / **Generated**: ${result.generatedAt}`,
    '',
    `計測週: ${result.measurementWeek ?? '-'} / 次週計画: ${result.expectedPlanWeek ?? '-'} / 月次: ${result.currentMonth}`,
    '',
    '| Check | Result | Evidence |',
    '|---|---|---|',
  ];
  for (const check of result.checks) {
    lines.push(
      `| ${check.code} | ${mark[check.level]} | ${String(check.detail).replaceAll('|', '\\|')} |`
    );
  }
  const actions = result.checks.filter((check) => check.action);
  lines.push('', '## 次のアクション', '');
  if (!actions.length) {
    lines.push('- なし。次回の定期監査まで観測を継続する。');
  } else {
    for (const check of actions)
      lines.push(`- **${check.code}**: ${check.action}`);
  }
  lines.push('', '_SSOT: `.claude/config/gsc-operations-cycle.json`_', '');
  return lines.join('\n');
}

function getArg(args, flag, fallback = null) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')
    ? args[index + 1]
    : fallback;
}

function main() {
  const args = process.argv.slice(2);
  const root = path.resolve(getArg(args, '--root', PROJECT_ROOT));
  const nowRaw = getArg(args, '--now');
  const now = nowRaw ? new Date(nowRaw) : new Date();
  if (Number.isNaN(now.getTime()))
    throw new Error(`--now が日時ではない: ${nowRaw}`);
  const stage = getArg(args, '--stage', 'monitor');
  const week = getArg(args, '--week');
  const result = auditOperationsCycle({ root, now, stage, week });
  const markdown = renderMarkdown(result);

  if (args.includes('--write')) {
    const outDir = path.join(root, '.claude/state/metrics/gsc');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'operations-cycle-LATEST.json'),
      `${JSON.stringify(result, null, 2)}\n`
    );
    fs.writeFileSync(path.join(outDir, 'operations-cycle-LATEST.md'), markdown);
  }

  if (args.includes('--json'))
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(markdown);

  if (args.includes('--strict') && result.status === 'fail')
    process.exitCode = 1;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename)
)
  main();
