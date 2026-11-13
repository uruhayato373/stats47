#!/usr/bin/env node
/**
 * note の売上 API を読む (CI の認証付き収集から呼ぶ)。API はパスワードの再確認を通したセッションでだけ
 * 答え、再確認は約 30 分で切れる (2026-09-30 観測)。Mac の refresh-session.mjs note が再確認を通して
 * セッションを渡し、その直後の収集で読む。切れていれば verification_required を書いて終わる (値は作らない)。
 */
import { writeFileSync } from 'node:fs';
import { measurementContext, markMeasurementAuthenticated } from './browser-session.mjs';
import { parseNoteSales, parseNoteSalesHistory } from './report-parsers.mjs';

const output = process.argv[2];

/** 販売履歴を当月と前月の 2 か月分読む。購入者名は取り出さない (URL・日付・金額だけをブラウザの外へ出す)。 */
async function readSalesHistory(page, today) {
  const [y, m] = today.split('-').map(Number);
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const months = [prev, today.slice(0, 7)];
  const end = new Date(Date.parse(today) - 86400000).toISOString().slice(0, 10);
  const pages = [];
  for (const month of months) {
    await page.goto(`https://note.com/dashboard/sales?datespan=${month.replace('-', '')}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => {
      const main = document.querySelector('main');
      return main && /購入者がいません|\d{4}年\d{1,2}月\d{1,2}日|パスワードの確認/.test(main.innerText);
    }, null, { timeout: 30000 });
    pages.push(await page.evaluate((month) => {
      const main = document.querySelector('main');
      const text = main.innerText;
      if (/パスワードの確認/.test(text) && !/販売履歴/.test(text)) throw new Error('verification_required');
      const DATE = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
      const PRICE = /([\d,]+)円/;
      const blocks = new Set();
      // 購入 1 件は「日時」と「金額」を 1 つずつ含む最小の要素。日時の文字を持つ要素から上へたどって見つける。
      for (const el of main.querySelectorAll('*')) {
        if (el.children.length || !DATE.test(el.textContent)) continue;
        let node = el;
        for (let i = 0; i < 8 && node && node !== main; i++, node = node.parentElement) {
          if (PRICE.test(node.textContent ?? '')) { blocks.add(node); break; }
        }
      }
      const items = [...blocks].map((node) => {
        const d = DATE.exec(node.textContent ?? '');
        const link = /** @type {HTMLAnchorElement|null} */ (node.querySelector('a[href*="/n/n"]'));
        return { url: link ? link.href.split('?')[0] : null, date: `${d[1]}-${d[2].padStart(2, '0')}-${d[3].padStart(2, '0')}`,
          priceYen: Number(PRICE.exec(node.textContent ?? '')[1].replace(/,/g, '')) };
      });
      const dates = (text.match(/\d{4}年\d{1,2}月\d{1,2}日/g) ?? []).length;
      const more = [...main.querySelectorAll('button, a')].some((b) => /もっと|さらに|次へ|次のページ/.test(b.textContent));
      const empty = /購入者がいません/.test(text);
      // 画面の日時の数と取り出した件数が合わない・続きがある・0 件なのに「いません」の表示が無いときは不完全
      return { month, complete: !more && items.length === dates && (items.length > 0 || empty), items };
    }, month));
  }
  return parseNoteSalesHistory(pages, { start: `${prev}-01`, end, observedAt: new Date().toISOString() });
}
const context = await measurementContext('note');
if (!context) throw new Error('unattended_only');
/** @type {{status:string, code?:string, revenue?:object, daily?:object|null, dailyCode?:string}} */
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
  // 販売履歴 (購入 1 件ごと) から、日 × 記事の明細を作る。前月の 1 日〜昨日を毎回取り直す。
  // 読めなくても月の合計 (上) の成否は変えず、daily を null にして理由を dailyCode に残す (値は作らない)。
  if (result.status === 'pass') {
    try { result.daily = await readSalesHistory(page, today); }
    catch (error) { result.daily = null; result.dailyCode = String(error.message).slice(0, 80); }
  }
} finally { await context.close(); }
writeFileSync(output, JSON.stringify(result));
