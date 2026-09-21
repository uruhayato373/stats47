/** A rejected login generation is not retried unattended. A newer human seed can resume it. */
export function authenticationPause(source, bundle, recovery, previousAttempt) {
  const generation = bundle?.bootstrapCapturedAt ?? bundle?.capturedAt;
  if (!Number.isFinite(Date.parse(generation))) throw new Error('session_missing');
  if (recovery && recovery.source !== source) throw new Error('vault_recovery_source_mismatch');
  if (recovery?.code === 'auth_required') {
    if (!Number.isFinite(Date.parse(recovery.bootstrapCapturedAt)) || !Number.isFinite(Date.parse(recovery.blockedSince))) {
      throw new Error('vault_recovery_invalid');
    }
    if (Date.parse(generation) <= Date.parse(recovery.bootstrapCapturedAt)) return recovery;
  }
  // Migrate an already rejected pre-breaker session without another login attempt.
  if (!recovery && previousAttempt?.source === source && previousAttempt.status === 'failed'
    && previousAttempt.code === 'auth_required' && Number.isFinite(Date.parse(previousAttempt.observedAt))
    && Date.parse(generation) <= Date.parse(previousAttempt.observedAt)) {
    return { source, code: 'auth_required', bootstrapCapturedAt: generation, blockedSince: previousAttempt.observedAt };
  }
  return null;
}

export function rejectedAuthentication(source, bundle, observedAt) {
  return { source, code: 'auth_required', bootstrapCapturedAt: bundle.bootstrapCapturedAt ?? bundle.capturedAt,
    blockedSince: observedAt };
}
