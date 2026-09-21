/** Official read-only conversion API. No cookie fallback and no account-wide requests.
 * Contract: affiliate-asp.json api.specUrl (2023-12-25, verified 2026-09-21).
 */
import { assertSiteOrThrow } from '../ads/lib/asp-site-guard.mjs';

const DAY = 86400000;
const BASIS = { occurrence: { code: '2', field: 'commit_time' }, recognition: { code: '3', field: 'recognition_time' } };
function responseShape(value, depth = 0) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return { type: 'array', length: value.length, item: depth < 2 && value.length ? responseShape(value[0], depth + 1) : null };
  if (typeof value === 'object' && depth < 2) return Object.fromEntries(Object.entries(value).slice(0, 30).map(([key, child]) => [key, responseShape(child, depth + 1)]));
  return typeof value;
}
function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('report_schema_changed: date');
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) throw new Error('report_schema_changed: date');
  return value;
}
function id(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new Error('report_schema_changed: id');
  if (!['string', 'number'].includes(typeof value) || !/^[1-9]\d*$/.test(String(value))) throw new Error('report_schema_changed: id');
  return String(value);
}
function providerDate(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}[-/]\d{2}[-/]\d{2}(?:[ T]\d{2}:\d{2}:\d{2})?$/.test(value)) throw new Error('report_schema_changed: timestamp');
  return dateOnly(value.slice(0, 10).replaceAll('/', '-'));
}
export function afbPeriod(now = new Date()) {
  // The schedule uses JST. Provider timestamps remain provider-date (timezone not documented).
  const today = new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
  const end = new Date(Date.parse(today) - DAY).toISOString().slice(0, 10);
  const start = new Date(Date.parse(today) - 28 * DAY).toISOString().slice(0, 10);
  return { start, end };
}
export function afbRequest(config, period, basis, now = new Date()) {
  if (config.targetSiteName !== 'stats47') throw new Error('account_mismatch');
  const partnerId = id(config.asps.afb.api.partnerId);
  const siteId = id(config.asps.afb.sites[config.targetSiteName]);
  const mode = BASIS[basis];
  if (!mode) throw new Error('report_schema_changed: basis');
  const start = dateOnly(period.start), end = dateOnly(period.end);
  const today = new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
  if (start > end || end >= today || Date.parse(today) - Date.parse(start) > 30 * DAY) throw new Error('report_incomplete: period');
  const url = new URL(`https://api.afi-b.com/partners/${partnerId}/conversion`);
  url.search = new URLSearchParams({ start_date: start, end_date: end, conversion_date_type: mode.code, partner_site_id: siteId }).toString();
  return { url, partnerId, siteId, period: { start, end }, basis, dateField: mode.field };
}
export function parseAfbOutcomes(payload, request) {
  // The spec's "response" labels the HTTP body, not a wrapper property.
  // Verified live on 2026-09-21: successful zero outcomes are the literal JSON [].
  if (!Array.isArray(payload)) throw new Error(`report_schema_changed: envelope ${JSON.stringify(responseShape(payload))}`);
  const seen = new Set();
  const totals = Object.fromEntries(['pending', 'approved', 'rejected'].map(key => [key, { count: 0, reportedMargin: 0 }]));
  const records = payload.map(row => {
    if (!row || typeof row !== 'object') throw new Error('report_schema_changed: row');
    assertSiteOrThrow({ actualSiteId: row.partner_site_id, expectedSiteId: request.siteId });
    const conversionId = id(row.commit_id), promotionId = id(row.adv_id);
    if (seen.has(conversionId)) throw new Error('report_incomplete: duplicate_conversion');
    seen.add(conversionId);
    const status = ['pending', 'approved', 'rejected'][/^[012]$/.test(String(row.commit_flg)) ? Number(row.commit_flg) : -1];
    if (!status) throw new Error('report_schema_changed: status');
    const margin = row.margin;
    if (!['string', 'number'].includes(typeof margin) || !/^\d+(?:\.\d{1,2})?$/.test(String(margin))) throw new Error('report_schema_changed: margin');
    const [whole, fraction = ''] = String(margin).split('.');
    const marginCents = Number(whole + fraction.padEnd(2, '0'));
    if (!Number.isSafeInteger(marginCents)) throw new Error('report_schema_changed: margin');
    const dates = { clickDate: providerDate(row.visit_time), occurrenceDate: providerDate(row.commit_time), recognitionDate: providerDate(row.recognition_time) };
    const referenceDate = request.basis === 'occurrence' ? dates.occurrenceDate : dates.recognitionDate;
    if (!referenceDate || referenceDate < request.period.start || referenceDate > request.period.end
      || (request.basis === 'recognition' && status === 'pending')) throw new Error('report_incomplete: basis_or_period');
    const reportedMargin = Number(margin);
    totals[status].count++;
    totals[status].reportedMargin += marginCents;
    // Referrer, keyword and device are unnecessary for revenue measurement: do not restore them.
    return { conversionId, promotionId, siteId: request.siteId, status, reportedMargin, ...dates };
  });
  for (const total of Object.values(totals)) {
    if (!Number.isSafeInteger(total.reportedMargin)) throw new Error('report_schema_changed: total');
    total.reportedMargin /= 100;
  }
  return { basis: request.basis, period: request.period, records, totals, rowCount: records.length };
}
export async function collectAfbOutcomes({ config, apiKey, now = new Date(), fetchImpl = fetch }) {
  if (typeof apiKey !== 'string' || !/^[A-Za-z0-9_-]{20,256}$/.test(apiKey)) throw new Error('api_key_missing');
  const period = afbPeriod(now), reports = {}, raw = {};
  for (const basis of Object.keys(BASIS)) {
    const request = afbRequest(config, period, basis, now);
    let response;
    try {
      response = await fetchImpl(request.url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { 'Content-Type': 'application/json', authorizationtoken: apiKey } });
    } catch { throw new Error('api_unavailable'); }
    if ([401, 403].includes(response.status)) throw new Error('api_auth_required');
    if (response.status === 429) throw new Error('api_rate_limited');
    if (!response.ok) throw new Error('api_unavailable');
    if (!(response.headers.get('content-type') ?? '').includes('application/json')) throw new Error('report_schema_changed: content_type');
    const text = await response.text();
    if (Buffer.byteLength(text) > 20 * 1024 * 1024) throw new Error('report_incomplete: response_too_large');
    let payload;
    try { payload = JSON.parse(text); } catch { throw new Error('report_schema_changed: json'); }
    reports[basis] = parseAfbOutcomes(payload, request);
    raw[basis] = payload; // Stored only after every row has passed site attribution and schema guards.
  }
  return { raw, report: { schemaVersion: 1, source: 'afb', capability: 'site-conversion-outcomes', observedAt: now.toISOString(),
    partnerId: String(config.asps.afb.api.partnerId), siteId: String(config.asps.afb.sites.stats47),
    period, dateSemantics: 'provider-date', amountSemantics: 'provider-reported-margin-not-net-payout',
    coverage: { occurrence: reports.occurrence.rowCount, recognition: reports.recognition.rowCount }, reports } };
}
