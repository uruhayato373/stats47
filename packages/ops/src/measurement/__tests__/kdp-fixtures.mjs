// KDP の月次レポートの見本。packages のテストと、.claude の CLI を確かめる基盤のテスト (kdp-monthly-wiring) が共有する。
import ExcelJS from 'exceljs';
import { parseKdpMonthlyReport, kdpMonthlyVaultKey } from '../kdp-monthly-reports.mjs';
import { kdpMonthlyObservations } from '../../../../product-factory/src/sales/ledger-core.mjs';

export const listings = { 'K-S1-01': { author: 'stats47', asin: null, previousEditions: [{ author: 'stats47', asin: 'B000000001' }] } };
export function fixture() {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('電子書籍のロイヤリティ').addRows([
    ['販売期間', '8月 2026'],
    ['タイトル', '著者', 'ASIN', 'マーケットプレイス', '注文数', '払い戻し数', '実質注文数', 'ロイヤリティの種類', 'コンテンツ区分', '通貨', '平均希望小売価格 (税別)', '平均販売価格 (税別)', '平均ファイルサイズ（MB）', '平均配信コスト', 'ロイヤリティ'],
    ['stats book', 'stats47', 'B000000001', 'Amazon.co.jp', 2, 0, 2, '35%', '標準', 'JPY', 100, 100, 1.46, '該当なし', 70],
    ['foreign book', 'another-site', 'B000000002', 'Amazon.co.jp', 10, 0, 10, '70%', '標準', 'JPY', 100, 100, 1, 1, 700],
  ]);
  workbook.addWorksheet('既読 KENPC').addRows([
    ['販売期間', '8月 2026'],
    ['タイトル', '著者', 'ASIN', 'マーケットプレイス', '既読 KENP (Kindle Edition Normalized Pages)', 'ロイヤリティ', '通貨'],
    ['stats book', 'stats47', 'B000000001', 'Amazon.co.jp', 10, 3.004217196, 'JPY'],
  ]);
  return workbook;
}

// KDP-LEDGER-AUTO-01: 月次レポート → 販売台帳。8 月の実データと同じ形 (旧版 ASIN の K-S1-02 が 1 行 ¥254)
export const ledgerListings = { 'K-S1-02': { author: 'stats47', asin: 'B0HKF4NLDV', previousEditions: [{ author: 'stats47', asin: 'B0HF1N51T8' }] } };
export const manualAugust = { id: '223344e97e9b72ad496f', channel: 'kdp', productId: 'K-S1-02', periodStart: '2026-08-01', periodEnd: '2026-08-31',
  orders: 1, units: 1, netRevenueYen: 254, refunds: 0, evidencePath: '.local/product-sales-evidence/kdp/kdp-monthly-2026-08.json',
  evidenceSha256: '819ad765457036c000a496b60f1daf1a6419ee2cdb637dfde36ff703cf99a275', recordedAt: '2026-10-07T21:57:23.008Z' };
export function augustWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('電子書籍のロイヤリティ').addRows([
    ['販売期間', '8月 2026'],
    ['タイトル', '著者', 'ASIN', 'マーケットプレイス', '注文数', '払い戻し数', '実質注文数', 'ロイヤリティの種類', 'コンテンツ区分', '通貨', '平均希望小売価格 (税別)', '平均販売価格 (税別)', '平均ファイルサイズ（MB）', '平均配信コスト', 'ロイヤリティ'],
    ['stats book', 'stats47', 'B0HF1N51T8', 'Amazon.co.jp', 1, 0, 1, '70%', '標準', 'JPY', 500, 500, 1.2, 4, 254],
    ['foreign book', 'another-site', 'B000000002', 'Amazon.co.jp', 10, 0, 10, '70%', '標準', 'JPY', 100, 100, 1, 1, 700],
  ]);
  workbook.addWorksheet('既読 KENPC').addRows([
    ['販売期間', '8月 2026'],
    ['タイトル', '著者', 'ASIN', 'マーケットプレイス', '既読 KENP (Kindle Edition Normalized Pages)', 'ロイヤリティ', '通貨'],
    ['foreign book', 'another-site', 'B000000002', 'Amazon.co.jp', 99, 40, 'JPY'],
  ]);
  return workbook;
}
export const augustLedger = () => {
  const report = parseKdpMonthlyReport(augustWorkbook(), ledgerListings, '2026-08');
  const vaultKey = kdpMonthlyVaultKey('2026-08');
  return { report, vaultKey, ...kdpMonthlyObservations(report, { vaultKey, recordedAt: '2026-10-08T00:00:00.000Z' }) };
};

