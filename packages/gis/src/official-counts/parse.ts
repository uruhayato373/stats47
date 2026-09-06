import { createHash } from 'node:crypto';

import { JSDOM } from 'jsdom';
import unzipper from 'unzipper';

import { PREF_CODES, PREF_NAME_BY_CODE } from '../mlit-ksj/prefecture-assign';

const CODE_BY_NAME = new Map(
  PREF_CODES.map((code) => [PREF_NAME_BY_CODE[code], code])
);
// 2026-04-01の全数表に掲載されない7県。滋賀（湖沼漁港）は除外しない。
export const ZERO_PORT_CODES = [
  '09',
  '10',
  '11',
  '19',
  '20',
  '21',
  '29',
] as const;

export function verifySourceSha(bytes: Buffer, expected: string): string {
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (!/^[a-f0-9]{64}$/.test(expected) || actual !== expected) {
    throw new Error(`Source SHA drift: ${actual} != ${expected}`);
  }
  return actual;
}

export function verifyCounts(
  counts: ReadonlyMap<string, number>,
  total: number,
  zeroCodes: readonly string[]
) {
  if (counts.size !== 47 || PREF_CODES.some((code) => !counts.has(code)))
    throw new Error('Expected exactly 47 prefectures');
  let sum = 0;
  for (const [code, value] of counts) {
    if (!PREF_CODES.includes(code) || !Number.isSafeInteger(value) || value < 0)
      throw new Error(`Invalid count: ${code}`);
    if ((value === 0) !== zeroCodes.includes(code))
      throw new Error(`Unexpected zero/nonzero: ${code}`);
    sum += value;
  }
  if (sum !== total)
    throw new Error(`National total mismatch: ${sum} != ${total}`);
}

/** ListのA-E列だけを使い、リンク・見た目・緯度経度から県を推測しない。 */
export function parseStationRows(
  rows: readonly (readonly string[])[],
  total: number
) {
  const header = ['県名', '駅 名', '登録回', '登録年月', '所在地'];
  if (header.some((v, i) => rows[0]?.[i]?.trim() !== v))
    throw new Error('Station header changed');
  const counts = new Map(PREF_CODES.map((code) => [code, 0]));
  const seen = new Set<string>();
  for (const row of rows.slice(1)) {
    const fields = row
      .slice(0, 5)
      .map((value) => value.normalize('NFKC').trim());
    if (fields.every((value) => value === '')) continue;
    if (fields.length !== 5 || fields.some((value) => !value))
      throw new Error('Incomplete station row');
    const [pref, name, registration, date, address] = fields;
    const code = CODE_BY_NAME.get(pref);
    if (
      !code ||
      !/^第\d+回$/.test(registration) ||
      !/^[HR]\d+\.\d+$/.test(date)
    )
      throw new Error(`Invalid station row: ${fields.join('/')}`);
    const identity = [pref, name, address].join('\0');
    if (seen.has(identity)) throw new Error(`Duplicate station: ${name}`);
    seen.add(identity);
    counts.set(code, counts.get(code)! + 1);
  }
  verifyCounts(counts, total, []);
  return counts;
}

export function readSharedStrings(xml: string): string[] {
  const doc = new JSDOM(xml, { contentType: 'text/xml' }).window.document;
  // rPhはふりがな。表示文字に連結すると県名・駅名が変わる。
  return [...doc.querySelectorAll('si')].map((si) =>
    [...si.querySelectorAll('t')]
      .filter((t) => !t.closest('rPh'))
      .map((t) => t.textContent)
      .join('')
  );
}

/** 既存依存unzipper/jsdomでXLSXの固定Listシートを読む。数式は採用しない。 */
export async function readStationWorkbook(bytes: Buffer): Promise<string[][]> {
  const zip = (await unzipper.Open.buffer(bytes)) as {
    files: { path: string; buffer(): Promise<Buffer> }[];
  };
  const xml = async (file: string) => {
    const entry = zip.files.filter((entry) => entry.path === file);
    if (entry.length !== 1)
      throw new Error(`Missing/duplicate XLSX member: ${file}`);
    return new JSDOM((await entry[0].buffer()).toString('utf8'), {
      contentType: 'text/xml',
    }).window.document;
  };
  const workbook = await xml('xl/workbook.xml');
  const sheets = [...workbook.querySelectorAll('sheet')];
  if (sheets.length !== 1 || sheets[0].getAttribute('name') !== 'List')
    throw new Error('Expected List sheet only');
  const rels = await xml('xl/_rels/workbook.xml.rels');
  const rel = [...rels.querySelectorAll('Relationship')].find(
    (r) => r.getAttribute('Id') === sheets[0].getAttribute('r:id')
  );
  if (rel?.getAttribute('Target') !== 'worksheets/sheet1.xml')
    throw new Error('Unexpected List sheet target');
  const strings = readSharedStrings(
    (await xml('xl/sharedStrings.xml')).documentElement.outerHTML
  );
  return [
    ...(await xml('xl/worksheets/sheet1.xml')).querySelectorAll('row'),
  ].map((row) => {
    const values = ['', '', '', '', ''];
    for (const cell of row.querySelectorAll('c')) {
      const ref = cell.getAttribute('r') ?? '';
      const match = /^([A-E])\d+$/.exec(ref);
      if (!match) continue;
      if (cell.querySelector('f'))
        throw new Error(`Formula in station data: ${ref}`);
      const raw = cell.querySelector('v')?.textContent ?? '';
      const value = cell.getAttribute('t') === 's' ? strings[Number(raw)] : raw;
      if (value === undefined) throw new Error(`Invalid shared string: ${ref}`);
      values[match[1].charCodeAt(0) - 65] = value;
    }
    return values;
  });
}

/** 15列=（各種別の港数/県管理/市町村管理）×4＋総計の3列。 */
export function parsePortText(text: string, total: number) {
  if (
    !text.includes('都道府県別漁港管理者別漁港数一覧') ||
    !text.includes('令和８年４月１日現在')
  )
    throw new Error('Port table/date changed');
  const counts = new Map<string, number>();
  const sums = Array<number>(15).fill(0);
  let national: number[] | undefined;
  for (const line of text.split(/\r?\n/)) {
    const tokens = line.trim().split(/\s+/);
    const code = CODE_BY_NAME.get(tokens[0]);
    if (!code && !/^[0-9,]+$/.test(tokens[0])) continue;
    const raw = code ? tokens.slice(1) : tokens;
    if (
      raw.length !== 15 ||
      raw.some((token) => !/^(?:-|[0-9]+(?:,[0-9]{3})*)$/.test(token))
    )
      throw new Error('Port columns changed');
    const values = raw.map((token) =>
      token === '-' ? 0 : Number(token.replace(/,/g, ''))
    );
    for (let i = 0; i < 15; i += 3) {
      if (values[i] !== values[i + 1] + values[i + 2])
        throw new Error('Port manager subtotal mismatch');
    }
    if (values[12] !== values[0] + values[3] + values[6] + values[9])
      throw new Error('Port type subtotal mismatch');
    if (!code) {
      if (national) throw new Error('Duplicate national row');
      national = values;
      continue;
    }
    if (
      counts.has(code) ||
      ZERO_PORT_CODES.includes(code as (typeof ZERO_PORT_CODES)[number])
    )
      throw new Error(`Duplicate/unexpected prefecture: ${code}`);
    counts.set(code, values[12]);
    values.forEach((value, i) => {
      sums[i] += value;
    });
  }
  if (
    !national ||
    national[12] !== total ||
    sums.some((value, i) => value !== national![i])
  )
    throw new Error('Port national columns mismatch');
  if (
    counts.size !== 40 ||
    PREF_CODES.filter((code) => !counts.has(code)).join(',') !==
      ZERO_PORT_CODES.join(',')
  )
    throw new Error('Port 40-prefecture coverage changed');
  ZERO_PORT_CODES.forEach((code) => counts.set(code, 0));
  verifyCounts(counts, total, ZERO_PORT_CODES);
  return counts;
}
