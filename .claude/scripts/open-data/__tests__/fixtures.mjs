import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { datasetPath } from '../../../../config/datasets.mjs';
import { loadCatalog, sha256, writeJson } from '../lib/contracts.mjs';
import { archiveRecipe, loadSnapshot, localKey } from '../lib/archive.mjs';
import { createHttpClient } from '../lib/http.mjs';

export function temp(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'open-data-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
export const table = {
  table: 'facility-sum', filePattern: '\\.csv$',
  areas: [{ level: 'prefecture', column: 'pref' }, { level: 'municipality', compose: [{ column: 'pref', width: 2 }, { column: 'city', width: 3 }] }],
  time: '$version', dims: { kind: 'kind' }, aggregation: 'sum', valueColumn: 'value', unit: '施設',
};
export const xlsxTable = { ...table, filePattern: '\\.xlsx$', xlsx: { sheet: '施設', headerRow: 2, dataStartRow: 4, stopOnBlankColumn: 'pref' } };
export const provenance = { manifestKey: 'open-data/raw/test/v1/manifest.json', manifestSha256: sha256('manifest'), recipeSha256: sha256('recipe') };

export async function workbookBytes(edit = () => {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('表紙').getCell('A1').value = 'Ignored';
  const sheet = workbook.addWorksheet('施設');
  sheet.addRow(['タイトル']);
  sheet.addRow(['pref', 'city', 'kind', 'value']);
  sheet.addRow(['単位などの注記']);
  sheet.addRow([1, 101, '病院', { formula: '1+1', result: 2 }]);
  sheet.addRow([1, 102, '病院', 3]);
  sheet.addRow([13, 101, '診療所', 0]);
  sheet.mergeCells('A4:A5');
  sheet.addRow([]);
  sheet.addRow(['ここから注記', '', '', '-']);
  edit(sheet, workbook);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function httpClient(objects) {
  return createHttpClient({ intervalMs: 0, sleep: async () => {}, fetchImpl: async (url, options) => {
    if (!objects.has(url)) throw Error(`Unexpected URL: ${url}`);
    const body = objects.get(url);
    return new Response(options.method === 'HEAD' ? null : body, { headers: { 'content-length': String(body.length), 'content-type': 'application/octet-stream' } });
  } });
}

export async function archivedFixture(t, { files = { 'source.csv': Buffer.from('pref,city,kind,value\n1,101,病院,2\n1,102,病院,3\n') }, definition = table } = {}) {
  const root = temp(t);
  const dataset = loadCatalog().datasets[0];
  const urls = new Map(Object.entries(files).map(([name, body]) => [`https://example.test/${name}`, body]));
  const recipe = { datasetId: dataset.id, fetch: { type: 'http-file', urls: [...urls.keys()] }, version: 'v1', normalize: { tables: [structuredClone(definition)] } };
  writeJson(path.join(root, datasetPath('open-data.datasets')), { datasets: [dataset] });
  writeJson(path.join(root, datasetPath('open-data.fetch-recipes')), { recipes: [recipe] });
  await archiveRecipe({ recipe, dataset, root, client: httpClient(urls), apply: true, now: () => '2026-01-01T00:00:00.000Z' });
  const entry = loadSnapshot(root, dataset.id).versions[0];
  const objects = new Map([...entry.files.map((file) => file.key), entry.manifestKey].map((key) => [key, { body: fs.readFileSync(localKey(root, key)) }]));
  fs.rmSync(path.join(root, '.local/r2'), { recursive: true });
  return { root, dataset, recipe, entry, objects, urls, client: httpClient(urls) };
}
