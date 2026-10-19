import { readFileSync, writeFileSync } from 'node:fs';
import { measurementContext, markMeasurementAuthenticated } from './browser-session.mjs';
import { readBookshelfState } from '../kdp/lib/kdp-flow.mjs';
import { collectKdpReport, openKdpReports } from './kdp-reports.mjs';
import { collectKdpMonthlyReport } from './kdp-monthly-reports.mjs';
import { KDP_LISTINGS } from '../../../config/paths.mjs';

const source = process.argv[2];
const output = process.argv[3];
const context = await measurementContext(source);
try {
  const page = await context.newPage();
  const records = [];
  let analytics = null;
  let coverage = null;
  let sales = null;
  let monthlyRoyalties = null;
  let revenue = null;
  if (source === 'kdp') {
    const account = JSON.parse(readFileSync('.local/kdp-account.local.json', 'utf8'));
    if (!/^B0[A-Z0-9]{8}$/.test(account.knownAsin ?? '')) throw new Error('account_mismatch: knownAsin missing');
    const expected = { asin: account.knownAsin };
    const identity = await readBookshelfState(page, '__identity__', expected);
    if (/signin|\/ap\//.test(page.url())) throw new Error('auth_required');
    if (!identity.found || identity.asin !== expected.asin) throw new Error('account_mismatch');
    const { listings } = JSON.parse(readFileSync(KDP_LISTINGS, 'utf8'));
    // Collect the short-lived Reports session before the slow catalog scan.
    // Keep Reports open instead of navigating its page back to the bookshelf.
    const reportsPage = await context.newPage();
    await openKdpReports(reportsPage);
    sales = await collectKdpReport(reportsPage, listings, output.replace(/\.json$/, '.xlsx'));
    monthlyRoyalties = await collectKdpMonthlyReport(reportsPage, listings, output.replace(/\.json$/, '.monthly.xlsx'));
    for (const [id, entry] of Object.entries(listings)) {
      if (!entry.draftId) continue;
      const value = await readBookshelfState(page, entry.draftId, { ...entry, reuseVisibleRow: true });
      records.push({ id, found: value.found, status: value.status ?? null, asin: value.asin ?? null });
    }
    if (records.length === 0 || records.some(r => !r.found || !r.status || r.status === '不明')) throw new Error('publication_status_incomplete');
    markMeasurementAuthenticated(source);
  } else throw new Error('unknown_source');
  writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), source, accountVerified: true, records,
    analytics, coverage, monthlyRoyalties, revenue, sales: sales ?? (analytics ? { status: 'collected', scope: 'account-total' } : { status: 'not_collected' }) }, null, 2));
} finally { await context.close(); }
