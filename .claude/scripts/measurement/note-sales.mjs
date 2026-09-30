#!/usr/bin/env node
/**
 * note の売上 API を読む (CI の認証付き収集から呼ぶ)。API はパスワードの再確認を通したセッションでだけ
 * 答え、再確認は約 30 分で切れる (2026-09-30 観測)。Mac の refresh-session.mjs note が再確認を通して
 * セッションを渡し、その直後の収集で読む。切れていれば verification_required を書いて終わる (値は作らない)。
 */
import { writeFileSync } from 'node:fs';
import { measurementContext, markMeasurementAuthenticated } from './browser-session.mjs';
import { parseNoteSales } from './report-parsers.mjs';

const output = process.argv[2];
const context = await measurementContext('note');
if (!context) throw new Error('unattended_only');
let result;
try {
  const page = await context.newPage();
  await page.goto('https://note.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  const response = await page.evaluate(async () => {
    const res = await fetch('/api/v1/stats/sales', { credentials: 'include' });
    return { status: res.status, body: await res.json().catch(() => null) };
  });
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  try { result = { status: 'pass', revenue: parseNoteSales(response.body, today) }; markMeasurementAuthenticated('note'); }
  catch (error) { result = { status: 'failed', code: error.message === 'verification_required' ? 'verification_required' : 'report_schema_changed' }; }
} finally { await context.close(); }
writeFileSync(output, JSON.stringify(result));
