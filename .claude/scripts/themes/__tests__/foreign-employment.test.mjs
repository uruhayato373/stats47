import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { extractForeignEmployment } from '../ingest-foreign-employment.mjs';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const prefectures = require('../../../../packages/area/src/data/prefectures.json');
function fixture() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('別表２');
  const reference = workbook.addWorksheet('参考-7');
  const status = workbook.addWorksheet('別表３');
  for (const [cell, value] of Object.entries({ A1: '［別表２］都道府県別外国人雇用事業所数及び外国人労働者数', A3: '令和7年10月末時点', C4: '事業所数', G4: '外国人労働者数', J3: '(単位:所、人)', C6: 371215, G6: 2571037 })) sheet.getCell(cell).value = value;
  for (const [cell, value] of Object.entries({ K4: '令和7年', K5: '事業所数', M5: '外国人労働者数', K6: 371215, M6: 2571037 })) reference.getCell(cell).value = value;
  for (const [cell, value] of Object.entries({ A2: '令和7年10月末時点', C3: '全在留資格計', C5: 2571037 })) status.getCell(cell).value = value;
  const pdfRows = [];
  for (const [index, pref] of prefectures.entries()) {
    const row = index + 7;
    const name = pref.prefName === '北海道' ? pref.prefName : pref.prefName.slice(0, -1);
    const establishments = Math.floor(371215 / 47) + Number(index < 371215 % 47);
    const workers = Math.floor(2571037 / 47) + Number(index < 2571037 % 47);
    for (const target of [sheet, reference]) { target.getCell(`A${row}`).value = index + 1; target.getCell(`B${row}`).value = name; }
    sheet.getCell(`C${row}`).value = establishments; sheet.getCell(`G${row}`).value = workers;
    reference.getCell(`K${row}`).value = establishments; reference.getCell(`M${row}`).value = workers;
    status.getCell(`A${index + 6}`).value = index + 1; status.getCell(`B${index + 6}`).value = name; status.getCell(`C${index + 6}`).value = workers;
    pdfRows.push(`${index + 1} ${name} ${establishments} 0 [0%] 0% ${workers} 0 [0%] 0%`);
  }
  return {
    workbook,
    definition: '事業主に雇用される外国人労働者 特別永住者 「外交」 「公用」の者を除く 届出件数 令和7年10月末時点 2,571,037人 371,215所',
    pdf: ['[別表2]都道府県別外国人雇用事業所数及び外国人労働者数 令和7年10月末時点', '全国計 371215 0 [0%] 0% 2571037 0 [0%] 0%', ...pdfRows].join('\n'),
  };
}
test('当年列・県番号・PDFの値と一致する雇用届出だけを抽出する', () => {
  const f = fixture();
  const result = extractForeignEmployment(f.workbook, f.definition, f.pdf);
  assert.equal(result.rows.length, 47);
  assert.equal(result.checks.pdfMatchedValues, 94);
  assert.equal(result.national['foreign-worker-count'], 2571037);
});
test('前年の列・欠値・対象定義の欠落・県の取り違えを拒否する', () => {
  for (const mutate of [
    (f) => { f.workbook.getWorksheet('参考-7').getCell('K4').value = '令和6年'; },
    (f) => { f.workbook.getWorksheet('別表２').getCell('G7').value = null; },
    (f) => { f.definition = f.definition.replace('特別永住者', ''); },
    (f) => { f.workbook.getWorksheet('別表２').getCell('B7').value = '青森'; },
  ]) { const f = fixture(); mutate(f); assert.throws(() => extractForeignEmployment(f.workbook, f.definition, f.pdf)); }
});
