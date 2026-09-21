import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ExcelJS from 'exceljs';
import { kdpAsinMap } from './kdp-reports.mjs';

// Observed from the Japanese August 2026 export on 2026-09-21.
// https://kdp.amazon.co.jp/ja_JP/help/topic/G200641190
const SCHEMAS = {
  '電子書籍のロイヤリティ': ['タイトル', '著者', 'ASIN', 'マーケットプレイス', '注文数', '払い戻し数', '実質注文数', 'ロイヤリティの種類', 'コンテンツ区分', '通貨', '平均希望小売価格 (税別)', '平均販売価格 (税別)', '平均ファイルサイズ（MB）', '平均配信コスト', 'ロイヤリティ'],
  '既読 KENPC': ['タイトル', '著者', 'ASIN', 'マーケットプレイス', '既読 KENP (Kindle Edition Normalized Pages)', 'ロイヤリティ', '通貨'],
};

function monthParts(month) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('report_incomplete: invalid_month');
  return month.split('-').map(Number);
}

/** Before the normal mid-month release, collect the preceding available month.
 * The actual UI and file must still prove availability; the date alone is not proof. */
export function expectedKdpRoyaltyMonth(now = new Date()) {
  const japan = new Date(now.getTime() + 9 * 3600000);
  return new Date(Date.UTC(japan.getUTCFullYear(), japan.getUTCMonth() - (japan.getUTCDate() >= 15 ? 1 : 2), 1)).toISOString().slice(0, 7);
}

/** Keep 24 report months, independently of the daily evidence's 30-day ring. */
export function kdpMonthlyVaultKey(month) {
  const [year, number] = monthParts(month);
  return `kdp/monthly/month-${(year * 12 + number - 1) % 24}`;
}

export function parseKdpMonthlyReport(workbook, listings, month) {
  const [year, number] = monthParts(month);
  const asins = kdpAsinMap(listings);
  if (JSON.stringify(workbook.worksheets.map(s => s.name).sort()) !== JSON.stringify(Object.keys(SCHEMAS).sort())) {
    // Never silently drop a newly introduced format, bonus, or summary sheet.
    throw new Error('report_schema_changed: monthly_sheets');
  }
  const records = [], seen = new Set();
  let excludedRows = 0;
  const numeric = (value, { integer = false, signed = false } = {}) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || (!signed && value < 0) || (integer && !Number.isSafeInteger(value))) {
      throw new Error('report_schema_changed: monthly_number');
    }
    return value;
  };
  for (const [name, columns] of Object.entries(SCHEMAS)) {
    const sheet = workbook.getWorksheet(name);
    if (JSON.stringify(sheet.getRow(1).values.slice(1)) !== JSON.stringify(['販売期間', `${number}月 ${year}`])) throw new Error('report_incomplete: monthly_period');
    if (JSON.stringify(sheet.getRow(2).values.slice(1)) !== JSON.stringify(columns)) throw new Error('report_schema_changed: monthly_columns');
    for (let index = 3; index <= sheet.rowCount; index++) {
      const cells = sheet.getRow(index).values.slice(1);
      if (cells.length !== columns.length || Array.from(cells).some(v => v == null || typeof v === 'object')) throw new Error('report_schema_changed: monthly_cells');
      const row = Object.fromEntries(columns.map((key, n) => [key, cells[n]]));
      if (!/^B0[A-Z0-9]{8}$/.test(row.ASIN) || !/^[A-Z]{3}$/.test(row['通貨']) ||
          ['タイトル', '著者', 'マーケットプレイス'].some(key => typeof row[key] !== 'string' || !row[key].trim())) throw new Error('report_schema_changed: monthly_identity');
      const key = JSON.stringify([name, ...cells]);
      if (seen.has(key)) throw new Error('report_incomplete: duplicate_row');
      seen.add(key);
      const id = asins.get(row.ASIN);
      if (!id) {
        if (row['著者'].trim().toLowerCase() === 'stats47') throw new Error('report_incomplete: unmapped_stats47_asin');
        excludedRows++;
        continue;
      }
      if (row['著者'] !== 'stats47') throw new Error('account_mismatch');
      const common = { id, asin: row.ASIN, month, marketplace: row['マーケットプレイス'], currency: row['通貨'],
        amount: numeric(row['ロイヤリティ'], { signed: true }) };
      if (name === '既読 KENPC') records.push({ ...common, kind: 'monthly-kenp-royalty', pages: numeric(row['既読 KENP (Kindle Edition Normalized Pages)'], { integer: true }) });
      else {
        const orders = numeric(row['注文数'], { integer: true }), refunds = numeric(row['払い戻し数'], { integer: true });
        const netUnits = numeric(row['実質注文数'], { integer: true, signed: true });
        if (orders - refunds !== netUnits) throw new Error('report_incomplete: monthly_units');
        if (!['35%', '70%'].includes(row['ロイヤリティの種類']) || typeof row['コンテンツ区分'] !== 'string' || !row['コンテンツ区分']) throw new Error('report_schema_changed: monthly_transaction');
        records.push({ ...common, kind: 'monthly-ebook-royalty', orders, refunds, netUnits,
          royaltyType: row['ロイヤリティの種類'], transactionType: row['コンテンツ区分'] });
      }
    }
  }
  const totals = [...new Set(records.map(r => r.currency))].sort().map(currency => {
    const rows = records.filter(r => r.currency === currency);
    return { currency, ebookRoyalty: rows.filter(r => r.kind === 'monthly-ebook-royalty').reduce((n, r) => n + r.amount, 0),
      kenpRoyalty: rows.filter(r => r.kind === 'monthly-kenp-royalty').reduce((n, r) => n + r.amount, 0),
      totalRoyalty: rows.reduce((n, r) => n + r.amount, 0) };
  });
  return { schemaVersion: 1, status: 'collected', scope: 'stats47-exact-asin', finality: 'finalized-monthly-royalty',
    period: { month, start: `${month}-01`, end: new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10), basis: 'provider-report-month' },
    records, totals, coverage: { complete: true, mappedAsins: asins.size, includedRows: records.length, excludedRows, zeroFilled: false },
    limitations: ['月次ロイヤリティであり入金・税引後利益・週次純収益ではない', '通貨を換算・合算せず、KU端数も元明細の精度を保持する', 'Prime Readingボーナスはこのレポートに含まれない', '明細の無い書籍を0件で補完しない'] };
}

export async function collectKdpMonthlyReport(page, listings, outputPath, now = new Date()) {
  const month = expectedKdpRoyaltyMonth(now), [year, number] = monthParts(month);
  const label = `${year}年${number}月`;
  await page.getByRole('link', { name: '月別のロイヤリティ', exact: true }).click();
  await page.getByRole('heading', { name: '月別のロイヤリティ', exact: true }).waitFor({ timeout: 30000 });
  const selector = page.getByRole('combobox', { name: /月を選択/ });
  await selector.click();
  await page.getByRole('option', { name: label, exact: true }).click();
  await page.getByRole('combobox', { name: `${label} 月を選択`, exact: true }).waitFor();
  const main = page.getByRole('main');
  await main.getByRole('cell', { name: '総収益', exact: true }).waitFor({ timeout: 45000 });
  if (await main.getByRole('cell', { name: 'N/A', exact: true }).count()) throw new Error('report_incomplete: monthly_not_finalized');
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }),
    page.getByRole('button', { name: 'レポートのダウンロード', exact: true }).click()]);
  const filename = download.suggestedFilename();
  if (!filename.startsWith(`KDP_Prior_Month_Royalties-${month}-01-`) || !filename.endsWith('.xlsx')) throw new Error('report_incomplete: monthly_filename');
  await download.saveAs(outputPath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(outputPath);
  return { ...parseKdpMonthlyReport(workbook, listings, month),
    artifact: { filename, sha256: createHash('sha256').update(readFileSync(outputPath)).digest('hex') } };
}
