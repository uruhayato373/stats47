/** Authenticated, read-only collectors. Commands are fixed here, never supplied by workflow input. */
export const SOURCES = {
  moshimo: { domains: ['moshimo.com'], profile: 'playwright-moshimo-profile', state: 'playwright-moshimo-state.json', secret: 'MEASUREMENT_SESSION_MOSHIMO', capability: 'outcomes' },
  a8: { domains: ['a8.net'], profile: 'playwright-a8-profile', state: 'playwright-a8-state.json', secret: 'MEASUREMENT_SESSION_A8', capability: 'site-outcomes' },
  afb: { domains: ['afi-b.com', 'affiliate-b.com'], profile: 'playwright-afb-profile', state: 'playwright-afb-state.json', secret: 'MEASUREMENT_SESSION_AFB', apiSecret: 'AFB_API_KEY', transport: 'api', capability: 'site-conversion-outcomes' },
  note: { domains: ['note.com'], profile: 'playwright-note-profile', secret: 'MEASUREMENT_SESSION_NOTE', capability: 'dashboard-metrics' },
  gsc: { domains: ['google.com'], profile: 'playwright-google-admin-profile', secret: 'MEASUREMENT_SESSION_GSC', capability: 'verified-coverage-export' },
  kdp: { domains: ['amazon.co.jp', 'amazon.com'], profile: 'playwright-kdp-profile', secret: 'MEASUREMENT_SESSION_KDP', capability: 'publication-daily-and-monthly-royalties' },
  coconala: { domains: ['coconala.com'], profile: 'playwright-coconala-profile', secret: 'MEASUREMENT_SESSION_COCONALA', capability: 'marketplace-metrics' },
};

export function sourceFor(name) {
  const source = Object.hasOwn(SOURCES, name) ? SOURCES[name] : null;
  if (!source) throw new Error('unknown_source');
  return source;
}

/** A refresh from an older login must never supersede a newly published human login. */
export function selectSessionBundle(seed, remote) {
  const bundle = remote && (!seed || (remote.bootstrapCapturedAt === seed.capturedAt && remote.capturedAt >= seed.capturedAt)) ? remote : seed;
  return bundle ? { ...bundle, bootstrapCapturedAt: bundle.bootstrapCapturedAt ?? bundle.capturedAt } : null;
}

export function scopedState(name, state) {
  const { domains } = sourceFor(name);
  const allowed = domain => domains.some(root => domain === root || domain.endsWith(`.${root}`));
  if (!Array.isArray(state?.cookies) || !Array.isArray(state?.origins)) throw new Error('invalid_session');
  const cookies = state.cookies.filter(c => allowed(String(c.domain).replace(/^\./, '')));
  const origins = state.origins.filter(o => {
    try { const u = new URL(o.origin); return u.protocol === 'https:' && allowed(u.hostname); } catch { return false; }
  });
  if (cookies.length === 0) throw new Error('session_missing');
  return { cookies, origins };
}

export function failureCode(message = '') {
  for (const code of ['api_key_missing', 'api_auth_required', 'api_rate_limited', 'api_unavailable']) if (message.startsWith(code)) return code;
  if (/session_missing|secret_missing/.test(message)) return 'session_missing';
  if (/auth_required|login_required|未ログイン|ログイン待|not-signed-in|session_expired/.test(message)) return 'auth_required';
  if (/account_mismatch|別アカウント|口座不一致|サイト帰属|不一致.*site|site ID不一致/.test(message)) return 'account_mismatch';
  if (/Timeout|timeout|ETIMEDOUT/.test(message)) return 'timeout';
  if (/AccessDenied|vault_|SignatureDoesNotMatch|InvalidAccessKey/.test(message)) return 'storage_error';
  if (/catalog_missing|collection_incomplete|report_incomplete|report_schema_changed|publication_status_incomplete|reject_rows/.test(message)) return 'report_incomplete';
  return 'collection_failed';
}
