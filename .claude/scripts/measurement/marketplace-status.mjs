import { readFileSync, writeFileSync } from 'node:fs';
import { measurementContext, markMeasurementAuthenticated } from './browser-session.mjs';
import { parseCoconalaAnalytics, validateCoconalaCoverage } from './report-parsers.mjs';
import { readBookshelfState } from '../kdp/lib/kdp-flow.mjs';
import { assertAccount as assertCoconala } from '../coconala/lib/coconala-session.mjs';

const source = process.argv[2];
const output = process.argv[3];
const context = await measurementContext(source);
try {
  const page = await context.newPage();
  const records = [];
  let analytics = null;
  let coverage = null;
  if (source === 'kdp') {
    const account = JSON.parse(readFileSync('.local/kdp-account.local.json', 'utf8'));
    if (!/^B0[A-Z0-9]{8}$/.test(account.knownAsin ?? '')) throw new Error('account_mismatch: knownAsin missing');
    const expected = { asin: account.knownAsin };
    const identity = await readBookshelfState(page, '__identity__', expected);
    if (/signin|\/ap\//.test(page.url())) throw new Error('auth_required');
    if (!identity.found || identity.asin !== expected.asin) throw new Error('account_mismatch');
    markMeasurementAuthenticated(source);
    const { listings } = JSON.parse(readFileSync('.claude/config/kdp-listings.json', 'utf8'));
    for (const [id, entry] of Object.entries(listings)) {
      if (!entry.draftId) continue;
      const value = await readBookshelfState(page, entry.draftId, entry);
      records.push({ id, found: value.found, status: value.status ?? null, asin: value.asin ?? null });
    }
    if (records.length === 0 || records.some(r => !r.found || !r.status || r.status === '不明')) throw new Error('publication_status_incomplete');
  } else if (source === 'coconala') {
    const account = await assertCoconala(page);
    if (/login|auth/.test(page.url())) throw new Error('auth_required');
    if (!account.ok) throw new Error('account_mismatch');
    markMeasurementAuthenticated(source);
    await page.goto('https://coconala.com/mypage/analytics', { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (/login|auth/.test(page.url())) throw new Error('auth_required');
    await page.getByText('全出品サービス累計', { exact: true }).waitFor({ timeout: 30000 });
    analytics = parseCoconalaAnalytics(await page.locator('body').innerText());
    const { listings } = JSON.parse(readFileSync('.claude/config/coconala-listings.json', 'utf8'));
    for (const [id, entry] of Object.entries(listings)) {
      if (entry.status !== 'listed') continue;
      const serviceId = /^https:\/\/coconala\.com\/services\/(\d+)$/.exec(entry.serviceUrl)?.[1];
      if (!serviceId) throw new Error('account_mismatch');
      const sourceUrl = `https://coconala.com/mypage/analytics/${serviceId}`;
      await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      if (/login|auth/.test(page.url())) throw new Error('auth_required');
      if (new URL(page.url()).pathname !== `/mypage/analytics/${serviceId}`) throw new Error('account_mismatch');
      await page.getByText('サービスのパフォーマンス', { exact: true }).waitFor({ timeout: 30000 });
      records.push({ id, serviceId, sourceUrl, ...parseCoconalaAnalytics(await page.locator('body').innerText(), { service: true }) });
    }
    coverage = validateCoconalaCoverage(analytics, records);
  } else throw new Error('unknown_source');
  writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), source, accountVerified: true, records,
    analytics, coverage, sales: analytics ? { status: 'collected', scope: 'account-total' } : { status: 'not_collected', reason: 'sales_report_adapter_required' } }, null, 2));
} finally { await context.close(); }
