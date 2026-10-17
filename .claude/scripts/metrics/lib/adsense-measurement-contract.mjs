/** Typed assessment contract. Baseline observations never claim an experiment effect.
 * Policy: adsense-improvement/SKILL.md, restart 2026-10-11; first review 2026-11-13.
 */
export const ADSENSE_BASELINE = Object.freeze({
  kind: 'baseline-observation',
  subjectId: 'ADSENSE-PLACEMENT-01',
  domainId: 'adsense',
  accountId: 'pub-9055416085403520',
  deployWeek: '2026-W41',
  firstWeek: '2026-W42',
  weeks: Object.freeze(['2026-W42', '2026-W43', '2026-W44', '2026-W45']),
  reviewDate: '2026-11-13',
});

/** @returns {{kind:'baseline-observation'}|{kind:'effect-experiment'}} */
export function assessmentForSubject({ domainId, subjectId, id }) {
  return domainId === ADSENSE_BASELINE.domainId && (subjectId ?? id) === ADSENSE_BASELINE.subjectId
    ? ADSENSE_BASELINE : { kind: 'effect-experiment' };
}

/** History has no account column before schema migration. Weeks before restart are
 * never eligible; explicit account metadata, when present, must match as well.
 */
export function isCurrentAccountRow(row) {
  const account = row?.accountId ?? row?.account_id;
  return Boolean(row?.week && row.week >= ADSENSE_BASELINE.firstWeek &&
    (!account || account.replace(/^accounts\//, '') === ADSENSE_BASELINE.accountId));
}

export function observeAdsenseBaseline(rows, now = new Date().toISOString()) {
  const accepted = (rows ?? []).filter(isCurrentAccountRow);
  const observedWeeks = ADSENSE_BASELINE.weeks.filter(week => accepted.some(row =>
    row.week === week && row.earnings != null && String(row.earnings).trim() !== '' && Number.isFinite(Number(row.earnings))));
  const missingWeeks = ADSENSE_BASELINE.weeks.filter(week => !observedWeeks.includes(week));
  return {
    status: missingWeeks.length ? 'pending' : 'ready',
    observedWeeks, missingWeeks,
    overdue: String(now).slice(0, 10) >= ADSENSE_BASELINE.reviewDate && missingWeeks.length > 0,
  };
}

/** Past weekly verdicts are immutable. Only a registered baseline contract changes the
 * interpretation; generic experiments with a missing target still fail the ratchet.
 */
export function hasBaselineAssessment(verdict) {
  const contract = assessmentForSubject(verdict);
  const given = verdict.assessment;
  return contract.kind === 'baseline-observation' && given?.kind === contract.kind &&
    given.subjectId === contract.subjectId && given.domainId === contract.domainId &&
    given.accountId === contract.accountId && given.deployWeek === contract.deployWeek && given.firstWeek === contract.firstWeek &&
    given.reviewDate === contract.reviewDate && verdict.label === "effect/pending" &&
    verdict.before == null && verdict.after == null && verdict.delta == null && verdict.target == null && JSON.stringify(given.weeks) === JSON.stringify(contract.weeks);
}

export function isMissingEffectTarget(verdict) {
  if (hasBaselineAssessment(verdict)) return false;
  return Boolean(verdict.guards?.some(guard => guard.code === 'insufficient-target'));
}
