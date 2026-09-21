import ExcelJS from 'exceljs';

const SCHEMAS = {
  '確定済み注文': ['日付', 'タイトル', '著者名', 'ASIN', 'マーケットプレイス', '有料ダウンロード数', '無料ダウンロード数'],
  '既読 KENPC': ['日付', 'タイトル', '著者名', 'ASIN', 'マーケットプレイス', '既読 KENP (Kindle Edition Normalized Pages)'],
  '電子書籍のロイヤリティ': ['ロイヤリティ発生日', 'タイトル', '著者名', 'ASIN', 'マーケットプレイス', 'ロイヤリティの種類', 'コンテンツ区分', '注文数', '払い戻し数', '実質注文数', '平均希望小売価格 (税別)', '平均販売価格 (税別)', '平均ファイルサイズ（MB）', '平均配信コスト', 'ロイヤリティ', '通貨'],
};

export function kdpAsinMap(listings) {
  const asins = new Map();
  for (const [id, listing] of Object.entries(listings)) {
    for (const edition of [listing, ...(listing.previousEditions ?? [])]) {
      if (!edition.asin) continue;
      if (!/^B0[A-Z0-9]{8}$/.test(edition.asin) || edition.author !== 'stats47') throw new Error('account_mismatch');
      if (asins.has(edition.asin) && asins.get(edition.asin) !== id) throw new Error('account_mismatch');
      asins.set(edition.asin, id);
    }
  }
  if (!asins.size) throw new Error('catalog_missing');
  return asins;
}

/** All-account downloads stay private. Only exact authored ASINs become stats47 observations. */
export function parseKdpReport(workbook, listings, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('report_incomplete');
  const asins = kdpAsinMap(listings);
  const records = [];
  let excludedRows = 0;
  const seen = new Set();
  const number = (value, integer = true, signed = false) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || (!signed && value < 0) || (integer && !Number.isSafeInteger(value))) throw new Error('report_schema_changed');
    return value;
  };
  for (const [name, columns] of Object.entries(SCHEMAS)) {
    const sheet = workbook.getWorksheet(name);
    if (!sheet || JSON.stringify(sheet.getRow(1).values.slice(1)) !== JSON.stringify(columns)) throw new Error('report_schema_changed');
    for (let i = 2; i <= sheet.rowCount; i++) {
      const cells = sheet.getRow(i).values.slice(1);
      if (cells.length !== columns.length || cells.some(x => x == null || typeof x === 'object')) throw new Error('report_schema_changed');
      const row = Object.fromEntries(columns.map((key, n) => [key, cells[n]]));
      if (cells[0] !== date || !/^B0[A-Z0-9]{8}$/.test(row.ASIN) || !row['マーケットプレイス']) throw new Error('report_incomplete');
      const id = asins.get(row.ASIN);
      if (!id) {
        if (String(row['著者名']).trim().toLowerCase() === 'stats47') throw new Error('report_incomplete: unmapped_stats47_asin');
        excludedRows++;
        continue;
      }
      if (row['著者名'] !== 'stats47') throw new Error('account_mismatch');
      const key = JSON.stringify([name, row.ASIN, row['マーケットプレイス'], row['ロイヤリティの種類'], row['コンテンツ区分'], row['通貨']]);
      if (seen.has(key)) throw new Error('report_incomplete: duplicate_row');
      seen.add(key);
      const common = { id, asin: row.ASIN, date, marketplace: row['マーケットプレイス'] };
      if (name === '確定済み注文') records.push({ ...common, kind: 'processed-orders', paid: number(row['有料ダウンロード数']), free: number(row['無料ダウンロード数']) });
      else if (name === '既読 KENPC') records.push({ ...common, kind: 'kenp', pages: number(row['既読 KENP (Kindle Edition Normalized Pages)']) });
      else {
        if (!/^[A-Z]{3}$/.test(row['通貨'])) throw new Error('report_schema_changed');
        records.push({ ...common, kind: 'estimated-ebook-royalty', amount: number(row['ロイヤリティ'], false, true), currency: row['通貨'] });
      }
    }
  }
  return { schemaVersion: 1, status: 'collected', scope: 'stats47-exact-asin', period: { start: date, end: date, basis: 'marketplace-local-date' },
    finality: 'provisional', records, coverage: { complete: true, mappedAsins: asins.size, includedRows: records.length, excludedRows },
    limitations: ['注文は処理遅延、KENPは翌月確定まで変更されうる', '電子書籍ロイヤリティは見積り。KU確定ロイヤリティ・入金・税引後収益ではない', '当日・週次確定値・口座全体の売上へ読み替えない'] };
}

export async function collectKdpReport(page, listings, outputPath, now = new Date()) {
  // The URL was observed on the account-verified bookshelf's Reports link.
  const date = new Date(now.getTime() + 9 * 3600000 - 86400000).toISOString().slice(0, 10);
  await page.goto('https://kdpreports.amazon.co.jp/dashboard', { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (/signin|\/ap\//.test(page.url())) throw new Error('auth_required');
  const yesterday = page.getByRole('tab', { name: '昨日', exact: true }).first();
  await yesterday.click();
  await page.waitForFunction(() => [...document.querySelectorAll('button[role="tab"]')].find(b => b.textContent.trim() === '昨日')?.getAttribute('aria-selected') === 'true');
  const downloadButton = page.getByRole('button', { name: 'レポートのダウンロード', exact: true });
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 90000 }), downloadButton.click(),
  ]);
  if (!/\.xlsx$/i.test(download.suggestedFilename())) throw new Error('report_schema_changed');
  await download.saveAs(outputPath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(outputPath);
  return parseKdpReport(workbook, listings, date);
}
