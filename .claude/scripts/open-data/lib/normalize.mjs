import { parse } from 'csv-parse/sync';
import unzipper from 'unzipper';
import { crc32 } from 'node:zlib';
import { require as tsxRequire } from 'tsx/cjs/api';
import Ajv from 'ajv';

const { normalizeOpenDataArea, OPEN_DATA_NORMALIZED_TABLE_SCHEMA } = tsxRequire('../../../../packages/data-configs/src/open-data-catalog/normalized-table.ts', import.meta.url);
const ajv = new Ajv({ allErrors: true, strictNumbers: true });
const validateTable = ajv.compile(OPEN_DATA_NORMALIZED_TABLE_SCHEMA);

/** Check each time/dimension/unit slice, including missing declared levels, before writing. */
export function assertNormalizedTable(table, levels) {
  if (!validateTable(table)) throw Error(`Normalized table Schema: ${ajv.errorsText(validateTable.errors)}`);
  const expected = new Set(levels);
  if (!expected.size) throw Error('No declared area levels');
  const slices = new Map();
  const seen = new Set();
  for (const row of table.rows) {
    if (!Number.isFinite(row.value) || !expected.has(row.areaLevel)) throw Error('Invalid normalized value/level');
    const slice = JSON.stringify([row.time, Object.entries(row.dims).sort(([a], [b]) => a.localeCompare(b)), row.unit]);
    const key = JSON.stringify([slice, row.areaLevel, row.areaCode]);
    if (seen.has(key)) throw Error('Duplicate normalized row');
    seen.add(key);
    const totals = slices.get(slice) ?? new Map();
    const total = (totals.get(row.areaLevel) ?? 0) + row.value;
    if (!Number.isFinite(total)) throw Error('Conservation total overflow');
    totals.set(row.areaLevel, total);
    slices.set(slice, totals);
  }
  for (const totals of slices.values()) {
    if (totals.size !== expected.size) throw Error(`Conservation failed: missing area level in ${table.table}`);
    const [reference, ...others] = [...totals.values()];
    for (const total of others) {
      // Integer counts must match exactly; sums allow only floating-point accumulation error.
      const tolerance = Number.isInteger(reference) && Number.isInteger(total) ? 0
        : Number.EPSILON * Math.max(1, Math.abs(reference), Math.abs(total)) * table.rows.length;
      if (Math.abs(reference - total) > tolerance) throw Error(`Conservation failed: ${table.table} hierarchy totals differ`);
    }
  }
}

export const NORMALIZE_LIMIT = 256 * 1024 ** 2;
export function decodeCsv(bytes, encoding = 'auto') {
  if (encoding !== 'auto') return new TextDecoder(encoding, { fatal: true }).decode(bytes);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return new TextDecoder('shift_jis', { fatal: true }).decode(bytes); }
}

/** Expand in memory, with aggregate limits; paths are never passed to the filesystem. */
export async function csvMembers(bytes, name, maxBytes = NORMALIZE_LIMIT) {
  if (bytes.length > maxBytes) throw Error('Normalization byte limit exceeded');
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== 0x04034b50) {
    if (!/\.csv$/i.test(name)) throw Error('Normalization supports CSV and ZIP only');
    return [{ name, bytes }];
  }
  const zip = await unzipper.Open.buffer(bytes);
  const result = []; let total = 0; const names = new Set();
  if (zip.files.length > 1000) throw Error('ZIP member limit exceeded');
  for (const file of zip.files) {
    if (file.path.startsWith('/') || file.path.includes('\\') || file.path.split('/').some((p) => p === '..') || /^[A-Za-z]:/.test(file.path)) throw Error('Unsafe ZIP member');
    if (file.type === 'Directory') continue;
    if (names.has(file.path)) throw Error('Duplicate ZIP member');
    names.add(file.path);
    total += file.uncompressedSize;
    if (total > maxBytes) throw Error('ZIP expansion limit exceeded');
    if (!/\.csv$/i.test(file.path)) continue;
    const chunks = []; let actual = 0;
    for await (const chunk of file.stream()) {
      actual += chunk.length;
      if (actual > file.uncompressedSize || actual > maxBytes) throw Error('ZIP expansion limit exceeded');
      chunks.push(chunk);
    }
    if (actual !== file.uncompressedSize) throw Error('ZIP member size mismatch');
    const body = Buffer.concat(chunks);
    if (crc32(body) !== (file.crc32 >>> 0)) throw Error('ZIP member CRC mismatch');
    result.push({ name: file.path, bytes: body });
  }
  return result;
}

export function normalizeTable({ datasetId, version, table, members, provenance }) {
  const pattern = new RegExp(table.filePattern);
  const selected = members.filter((m) => pattern.test(m.name));
  if (!selected.length) throw Error(`No input for table: ${table.table}`);
  const groups = new Map();
  const dimColumns = Object.entries(table.dims ?? {}).sort(([a], [b]) => a.localeCompare(b));
  for (const member of selected) {
    const records = parse(decodeCsv(member.bytes, table.encoding), { bom: true, skip_empty_lines: true });
    const header = records.shift();
    if (!header?.length || new Set(header).size !== header.length) throw Error('Missing or duplicate CSV headers');
    const required = [...table.areas.flatMap((a) => (a.compose ?? [a]).map((part) => part.column)), ...dimColumns.map(([, column]) => column), ...(table.aggregation === 'sum' ? [table.valueColumn] : [])];
    for (const column of required) if (!header.includes(column)) throw Error(`Missing CSV column: ${column}`);
    const at = (record, column) => record[header.indexOf(column)].trim();
    for (const record of records) {
      const value = table.aggregation === 'count' ? 1 : Number(at(record, table.valueColumn));
      if (table.aggregation === 'sum' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(at(record, table.valueColumn))) throw Error('Invalid numeric cell');
      if (!Number.isFinite(value)) throw Error('Non-finite value');
      const dims = Object.fromEntries(dimColumns.map(([key, column]) => [key, at(record, column)]));
      for (const area of table.areas) {
        const composed = (area.compose ?? [area]).map((part) => {
          const code = at(record, part.column);
          if (!code) throw Error('Empty area code');
          if (!part.width) return code;
          if (!/^\d+$/.test(code) || code.length > part.width) throw Error('Invalid area code component');
          return code.padStart(part.width, '0');
        }).join('');
        const normalizedArea = normalizeOpenDataArea(area.level, composed);
        const { areaCode } = normalizedArea;
        const row = { ...normalizedArea, time: table.time === '$version' ? version : table.time, dims, value: 0, unit: table.unit };
        const key = JSON.stringify([area.level, areaCode, row.time, dims]);
        const group = groups.get(key) ?? row;
        group.value += value;
        if (!Number.isFinite(group.value)) throw Error('Aggregate overflow');
        groups.set(key, group);
      }
    }
  }
  if (!groups.size) throw Error('Empty normalized table');
  return { datasetId, version, table: table.table, columns: ['areaCode', 'areaLevel', 'time', 'dims', 'value', 'unit'], rows: [...groups.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, row]) => row), provenance };
}
