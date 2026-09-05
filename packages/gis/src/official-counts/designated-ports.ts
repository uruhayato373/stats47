import { JSDOM } from 'jsdom';

import { PREF_CODES, PREF_NAME_BY_CODE } from '../mlit-ksj/prefecture-assign';
import { verifyCounts } from './parse';

export const PORT_LAW_REVISION = '326M50000800013_20250101_506M60000800108';
export const PORT_DATA_DATE = '2025-01-01';
// 完全な指定一覧に掲載されない県。滋賀県の湖港4港は対象。
export const DESIGNATED_PORT_ZERO_CODES = [
  '09',
  '10',
  '11',
  '19',
  '20',
  '21',
  '29',
];
const CODE_BY_NAME = new Map(
  PREF_CODES.map((code) => [PREF_NAME_BY_CODE[code], code])
);

interface LawNode {
  tag: string;
  children: (LawNode | string)[];
}
function node(value: unknown): LawNode | string {
  if (typeof value === 'string') return value;
  if (
    !value ||
    typeof value !== 'object' ||
    !('tag' in value) ||
    typeof value.tag !== 'string' ||
    !('children' in value) ||
    !Array.isArray(value.children)
  )
    throw new Error('Invalid e-Gov law tree');
  return { tag: value.tag, children: value.children.map(node) };
}
function text(value: LawNode | string): string {
  return typeof value === 'string' ? value : value.children.map(text).join('');
}
function find(value: LawNode | string, tag: string): LawNode[] {
  if (typeof value === 'string') return [];
  return [
    ...(value.tag === tag ? [value] : []),
    ...value.children.flatMap((child) => find(child, tag)),
  ];
}

/** 固定施行版の別表だけを読む。過去年次メタや有値行数は港数に使わない。 */
export function readDesignatedPortRows(input: unknown): string[][] {
  if (
    !input ||
    typeof input !== 'object' ||
    !('revision_info' in input) ||
    !input.revision_info ||
    typeof input.revision_info !== 'object' ||
    !('law_full_text' in input)
  )
    throw new Error('Missing e-Gov revision');
  const revision = input.revision_info;
  if (
    !('law_revision_id' in revision) ||
    revision.law_revision_id !== PORT_LAW_REVISION ||
    !('amendment_enforcement_date' in revision) ||
    revision.amendment_enforcement_date !== PORT_DATA_DATE
  )
    throw new Error('Port law revision/date drift');
  const appendices = find(node(input.law_full_text), 'AppdxTable');
  if (
    appendices.length !== 1 ||
    find(appendices[0], 'AppdxTableTitle').map(text).join('') !== '別表'
  )
    throw new Error('Expected unique port appendix');
  const tables = find(appendices[0], 'Table');
  if (tables.length !== 1) throw new Error('Expected unique port table');
  return tables[0].children.map((row) => {
    if (typeof row === 'string' || row.tag !== 'TableRow')
      throw new Error('Invalid port row');
    return row.children.map((column) => {
      if (typeof column === 'string' || column.tag !== 'TableColumn')
        throw new Error('Invalid port column');
      return text(column).trim();
    });
  });
}

/** 共同港を二重計上しないための加工上の帰属。法令上の単独所属とは解釈しない。 */
export function verifySakaiAttribution(html: string): void {
  const doc = new JSDOM(html).window.document;
  const links = [...doc.querySelectorAll('a')].filter(
    (a) => a.textContent?.trim() === '境港'
  );
  if (links.length !== 1)
    throw new Error('Missing/duplicate Sakai attribution');
  const heading = links[0].closest('tr')?.previousElementSibling;
  if (heading?.querySelector('strong')?.textContent?.trim() !== '鳥取県')
    throw new Error('Sakai prefecture attribution drift');
}

export function parseDesignatedPortRows(rows: readonly (readonly string[])[]) {
  if (
    JSON.stringify(rows[0]) !==
      JSON.stringify(['都道府県', '甲種港湾', '乙種港湾']) ||
    JSON.stringify(rows[rows.length - 1]) !==
      JSON.stringify(['合計', '百六十三港', '五百一港'])
  )
    throw new Error('Port table header/total drift');
  const counts = new Map(PREF_CODES.map((code) => [code, 0]));
  const seenRows = new Set<string>();
  const identities = new Set<string>();
  const ports: {
    prefectureCode: string;
    sourcePrefecture: string;
    kind: '甲種' | '乙種';
    name: string;
  }[] = [];
  let ko = 0,
    otsu = 0;
  for (const row of rows.slice(1, -1)) {
    if (row.length !== 3 || seenRows.has(row[0]))
      throw new Error('Invalid/duplicate prefecture row');
    seenRows.add(row[0]);
    const joint = row[0] === '鳥取・島根';
    if (joint && (row[1] !== '境港' || row[2] !== ''))
      throw new Error('Joint port drift');
    const code = joint ? '31' : CODE_BY_NAME.get(row[0]);
    if (!code || DESIGNATED_PORT_ZERO_CODES.includes(code))
      throw new Error('Unexpected prefecture');
    for (const [index, value] of row.slice(1).entries()) {
      const names = value ? value.split(/\s+/) : [];
      if (
        !names.length &&
        !(joint && index === 1) &&
        !(code === '25' && index === 0)
      )
        throw new Error('Missing designated port cell');
      for (const name of names) {
        if (
          !/^.+港(?:（[^（）]+）)?$/.test(name) ||
          identities.has(`${code}\0${name}`)
        )
          throw new Error('Invalid/duplicate port identity');
        identities.add(`${code}\0${name}`);
        ports.push({
          prefectureCode: code,
          sourcePrefecture: row[0],
          kind: index === 0 ? '甲種' : '乙種',
          name,
        });
        counts.set(code, counts.get(code)! + 1);
        if (index === 0) ko++;
        else otsu++;
      }
    }
  }
  if (
    seenRows.size !== 41 ||
    !seenRows.has('鳥取・島根') ||
    PREF_CODES.filter(
      (code) => !DESIGNATED_PORT_ZERO_CODES.includes(code)
    ).some((code) => !seenRows.has(PREF_NAME_BY_CODE[code]))
  )
    throw new Error('Incomplete prefecture coverage');
  if (ko !== 163 || otsu !== 501)
    throw new Error('Designated class totals drift');
  verifyCounts(counts, 664, DESIGNATED_PORT_ZERO_CODES);
  return { counts, ports, ko, otsu };
}
