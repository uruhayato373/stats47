#!/usr/bin/env node
/**
 * rakuten-report.mjs — 楽天アフィリエイトの成果を、管理画面が使う JSON API から読んで月別に記録する (読み取り専用)。
 *
 * 楽天アフィリエイトに公開の成果 API は無い。管理画面 (affiliate.rakuten.co.jp/report) は同じオリジンの
 * 次の JSON を読んで表を描くので、ログイン済みのセッションでそれを読む (2026-10-01 に実画面の通信で確認):
 *   /api/report/monthly?date=YYYY-MM&overview=1 … その月の発生 (totals: clicks / sales=売上件数 / amount=売上金額 / rewards=成果報酬・未確定)
 *   /api/report/reward?date=YYYY-01             … その年の成果確定月ごとの確定額 (rows: yearmonth / points / cash / transfer)
 *
 * 記録先: data/affiliate/rakuten-results.json (record-rakuten-results.mjs と同じ形。同じ月は上書き)
 * - 当月と前月の発生を毎回取り直す (前月の成果は月をまたいで動くため)
 * - confirmedYen は「その月に確定した額」(ポイント + キャッシュ + 銀行振込)。発生月の確定額ではない
 *
 * セッション: CI は collect.mjs が渡す MEASUREMENT_BROWSER_STATE_PATH、手元は .local/playwright-rakuten-state.json。
 * ログイン画面へ戻されたら auth_required で止まる (値を作らない)。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAKUTEN_RESULTS_PATH, upsertRecord } from './record-rakuten-results.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const REPORT_URL = 'https://affiliate.rakuten.co.jp/report/summary';

/** JST の当月と前月 (YYYY-MM)。 */
export function targetMonths(now = new Date()) {
  const jst = new Date(now.getTime() + 9 * 3600000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const fmt = (yy, mm) => `${yy}-${String(mm + 1).padStart(2, '0')}`;
  return m === 0 ? [fmt(y - 1, 11), fmt(y, 0)] : [fmt(y, m - 1), fmt(y, m)];
}

const isCount = (v) => Number.isInteger(v) && v >= 0;

/** API の応答を検査して月の記録にする。形が違えば report_schema_changed。 */
export function buildRecords({ months, overviews, rewards, observedAt }) {
  const confirmed = new Map();
  for (const year of rewards) {
    if (!Array.isArray(year?.rows)) throw new Error('report_schema_changed: reward');
    for (const r of year.rows) {
      if (!/^\d{4}-\d{2}$/.test(r?.yearmonth) || ![r.points, r.cash, r.transfer].every(isCount)) throw new Error('report_schema_changed: reward_row');
      confirmed.set(r.yearmonth, r.points + r.cash + r.transfer);
    }
  }
  return months.map((month, i) => {
    const t = overviews[i]?.totals;
    if (!t || ![t.clicks, t.sales, t.amount, t.rewards].every(isCount)) throw new Error('report_schema_changed: monthly');
    if (!confirmed.has(month)) throw new Error('report_incomplete: reward_month_missing');
    return { month, clicks: t.clicks, orders: t.sales, amountYen: t.amount, estimatedYen: t.rewards,
      confirmedYen: confirmed.get(month), observedAt, source: 'collector:rakuten-affiliate-api' };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const statePath = process.env.MEASUREMENT_BROWSER_STATE_PATH || join(ROOT, '.local/playwright-rakuten-state.json');
  if (!existsSync(statePath)) { console.error('session_missing'); process.exit(1); }
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ storageState: statePath, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    const page = await context.newPage();
    await page.goto(REPORT_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    if (!page.url().startsWith('https://affiliate.rakuten.co.jp/report')) throw new Error('auth_required: redirected_to_login');
    const months = targetMonths();
    const years = [...new Set(months.map((m) => m.slice(0, 4)))];
    const get = (path) => page.evaluate(async (p) => {
      const res = await fetch(p, { headers: { accept: 'application/json' } });
      if (res.status === 401 || res.status === 403) return { __auth: true };
      if (!res.ok) return { __status: res.status };
      return res.json();
    }, path);
    const overviews = [];
    for (const m of months) overviews.push(await get(`/api/report/monthly?date=${m}&overview=1`));
    const rewards = [];
    for (const y of years) rewards.push(await get(`/api/report/reward?date=${y}-01`));
    if ([...overviews, ...rewards].some((r) => r?.__auth)) throw new Error('auth_required: api_401');
    if ([...overviews, ...rewards].some((r) => r?.__status)) throw new Error('collection_failed: api_status');
    const records = buildRecords({ months, overviews, rewards, observedAt: new Date().toISOString() });
    const path = join(ROOT, RAKUTEN_RESULTS_PATH);
    let results = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
    for (const r of records) results = upsertRecord(results, r);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(results, null, 2) + '\n');
    if (process.env.MEASUREMENT_BROWSER_OUTPUT_STATE_PATH) {
      writeFileSync(process.env.MEASUREMENT_BROWSER_OUTPUT_STATE_PATH, JSON.stringify(await context.storageState()), { mode: 0o600 });
    }
    console.log(JSON.stringify({ status: 'pass', months: records.map((r) => ({ month: r.month, orders: r.orders, estimatedYen: r.estimatedYen, confirmedYen: r.confirmedYen })) }));
  } catch (error) {
    console.error(String(error.message).slice(0, 200));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
