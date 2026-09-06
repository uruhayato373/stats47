import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { inspectPack } from './lib/pack-evidence.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const listings = JSON.parse(readFileSync(resolve(root, '.claude/config/coconala-listings.json'))).listings;
for (const [id, listing] of Object.entries(listings)) {
  if (!id.startsWith('P-')) continue;
  if (!listing._delivery.labelRevision) throw new Error(`${id}: no label revision`);
  const evidence = await inspectPack(root, listing);
  const dir = resolve(root, listing._delivery.artifactDirectory);
  const old = parse(readFileSync(resolve(root, '.local/coconala-products', id, 'v1/data.csv')), { bom: true });
  if (old.length !== evidence.rows.length || old[0].length !== evidence.rows[0].length) throw new Error(`${id}: scope changed`);
  for (let row = 1; row < 48; row++) for (let col = 0; col < old[0].length - 1; col++) {
    if (old[row][col] !== evidence.rows[row][col]) throw new Error(`${id}: value or missing cell changed ${row}/${col}`);
  }
  if (evidence.hasXlsx) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(resolve(dir, 'product.xlsx'));
    const ws = wb.getWorksheet('一覧');
    if (!ws) throw new Error(`${id}: overview missing`);
    for (let col = 3; col <= evidence.count + 2; col++) {
      if (ws.getCell(1, col).value !== evidence.rows[0][col - 1]) throw new Error(`${id}: Excel label mismatch`);
      for (let row = 2; row <= 48; row++) {
        const csv = evidence.rows[row - 1][col - 1];
        if (ws.getCell(row, col).value !== (csv === '' ? null : Number(csv))) throw new Error(`${id}: Excel data mismatch`);
      }
    }
  }
  const ppt = await JSZip.loadAsync(readFileSync(resolve(dir, 'product.pptx')));
  const xml = (await Promise.all(Object.entries(ppt.files).filter(([p]) => /^ppt\/slides\/slide\d+\.xml$/.test(p)).map(([, f]) => f.async('string')))).join('');
  const decoded = xml.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
  for (const s of evidence.sources.slice(0, listing._delivery.pptxIndicatorCount)) {
    if (!decoded.includes(s['表名'])) throw new Error(`${id}: PPT definition missing: ${s['表名']}`);
  }
  const pdf = resolve(dir, 'databook.pdf');
  const text = execFileSync('pdftotext', [pdf, '-'], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }).replace(/\s/g, '');
  for (const s of evidence.sources) {
    if (!text.includes(s['表名'].replace(/\s/g, ''))) throw new Error(`${id}: PDF definition missing: ${s['表名']}`);
  }
  const bbox = execFileSync('pdftotext', ['-bbox', pdf, '-'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  let words = 0;
  for (const m of bbox.matchAll(/<word xMin="([\d.-]+)" yMin="([\d.-]+)" xMax="([\d.-]+)" yMax="([\d.-]+)"/g)) {
    words++;
    if (+m[1] < 0 || +m[2] < 0 || +m[3] > 595 || +m[4] > 842) throw new Error(`${id}: PDF clipped text`);
  }
  if (!words) throw new Error(`${id}: no PDF words`);
  console.log(JSON.stringify({ id, indicators: evidence.count, csvConservation: true, excelMatches: evidence.hasXlsx ? true : 'not-included', pptDefinitions: true, pdfDefinitions: true, pdfClippedWords: 0, words, manifestSha256: evidence.manifestSha256 }));
}
