import { parse } from 'csv-parse/sync';
import fs from 'node:fs';
import unzipper from 'unzipper';
import { crc32 } from 'node:zlib';
import { require as tsxRequire } from 'tsx/cjs/api';
import Ajv from 'ajv';
import ExcelJS from 'exceljs';
import { datasetPath } from '../../../../../config/datasets.mjs';

const { normalizeOpenDataArea, OPEN_DATA_NORMALIZED_TABLE_SCHEMA } = tsxRequire('../../../../data-configs/src/open-data-catalog/normalized-table.ts', import.meta.url);
const prefectures = JSON.parse(fs.readFileSync(new URL(`../../../../../${datasetPath('areas.prefectures')}`, import.meta.url), 'utf8'));
const prefectureCodesByName = new Map(prefectures.map((p) => [p.prefName, p.prefCode]));
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
export async function csvMembers(bytes, name, maxBytes = NORMALIZE_LIMIT, filePatterns, budget = { used: 0 }) {
  const selected = (memberName) => !filePatterns || filePatterns.some((pattern) => new RegExp(pattern).test(memberName));
  // XLSX is itself a ZIP. Decode it as a workbook before treating ZIPs as containers.
  if (/\.xlsx$/i.test(name)) {
    if (!selected(name)) return [];
    await zipMembers(bytes, maxBytes, true, selected, budget);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    return [{ name, bytes, workbook }];
  }
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== 0x04034b50) {
    if (!selected(name)) return [];
    if (!/\.csv$/i.test(name)) throw Error('Normalization supports CSV, XLSX and ZIP only');
    budget.used += bytes.length;
    if (budget.used > maxBytes) throw Error('Normalization byte limit exceeded');
    return [{ name, bytes }];
  }
  const members = await zipMembers(bytes, maxBytes, false, selected, budget);
  const result = [];
  for (const member of members) {
    if (/\.xlsx$/i.test(member.name)) result.push(...await csvMembers(member.bytes, member.name, maxBytes, filePatterns, budget));
    else if (selected(member.name)) result.push(member);
  }
  return result;
}

async function zipMembers(bytes, maxBytes, verifyOnly, selected, budget) {
  const zip = await unzipper.Open.buffer(bytes);
  const result = []; const names = new Set();
  if (zip.files.length > 1000) throw Error('ZIP member limit exceeded');
  for (const file of zip.files) {
    if (file.path.startsWith('/') || file.path.includes('\\') || file.path.split('/').some((p) => p === '..') || /^[A-Za-z]:/.test(file.path)) throw Error('Unsafe ZIP member');
    if (file.type === 'Directory') continue;
    if (names.has(file.path)) throw Error('Duplicate ZIP member');
    names.add(file.path);
    if (!verifyOnly && (!/\.(csv|xlsx)$/i.test(file.path) || !selected(file.path))) continue;
    // Charge only entries actually inflated, across all selected files/workbooks.
    budget.used += file.uncompressedSize;
    if (budget.used > maxBytes) throw Error('ZIP expansion limit exceeded');
    const chunks = []; let actual = 0;
    for await (const chunk of file.stream()) {
      actual += chunk.length;
      if (actual > file.uncompressedSize || actual > maxBytes) throw Error('ZIP expansion limit exceeded');
      chunks.push(chunk);
    }
    if (actual !== file.uncompressedSize) throw Error('ZIP member size mismatch');
    const body = Buffer.concat(chunks);
    if (crc32(body) !== (file.crc32 >>> 0)) throw Error('ZIP member CRC mismatch');
    if (!verifyOnly) result.push({ name: file.path, bytes: body });
  }
  return result;
}

function cellText(cell) {
  const value = cell.master.value; // Merged cells read the top-left value.
  const scalar = value && typeof value === 'object' && ('formula' in value || 'sharedFormula' in value) ? value.result : value;
  if (scalar == null) return '';
  if (scalar instanceof Date) return scalar.toISOString().slice(0, 10);
  if (typeof scalar !== 'object') return String(scalar);
  if (scalar.richText) return scalar.richText.map((part) => part.text).join('');
  if (scalar.text != null) return String(scalar.text);
  if (scalar.error) return scalar.error;
  throw Error('Unsupported XLSX cell value');
}

export function xlsxRecords(workbook, options, metadata = {}, filename = '', transforms = {}) {
  if (!options) throw Error('XLSX table requires xlsx settings');
  if (Array.isArray(options.sheet)) {
    if (!options.sheet.length || new Set(options.sheet).size !== options.sheet.length) throw Error('Invalid XLSX sheet list');
    const seen = new Set();
    const sheets = options.sheet.map((sheet) => {
      if (Array.isArray(sheet)) throw Error('Invalid XLSX sheet list');
      const worksheet = typeof sheet === 'number' ? workbook.worksheets[sheet - 1] : workbook.getWorksheet(sheet);
      if (worksheet && seen.has(worksheet)) throw Error('Duplicate XLSX sheet selection');
      seen.add(worksheet);
      return xlsxRecords(workbook, { ...options, sheet }, metadata, filename, transforms);
    });
    const [header] = sheets[0];
    if (sheets.some(([other]) => JSON.stringify(other) !== JSON.stringify(header))) throw Error('XLSX sheet headers differ');
    return [header, ...sheets.flatMap((rows) => rows.slice(1))];
  }
  const { sheet, headerRow, dataStartRow, dataEndRow, stopOnBlankColumn, columns, rowStep = 1 } = options;
  const headerRows = Array.isArray(headerRow) ? headerRow : [headerRow];
  if (!(typeof sheet === 'string' && sheet.trim() || Number.isInteger(sheet) && sheet > 0)
    || !headerRows.length || new Set(headerRows).size !== headerRows.length || headerRows.some((r) => !Number.isInteger(r) || r < 1)
    || !Number.isInteger(rowStep) || rowStep < 1 || !Number.isInteger(dataStartRow) || dataStartRow <= Math.max(...headerRows)
    || dataEndRow !== undefined && (!Number.isInteger(dataEndRow) || dataEndRow < dataStartRow)) throw Error('Invalid XLSX row/sheet settings');
  // Numeric sheet selection is the 1-based position, not ExcelJS's potentially sparse ID.
  const worksheet = typeof sheet === 'number' ? workbook.worksheets[sheet - 1] : workbook.getWorksheet(sheet);
  if (!worksheet) throw Error(`Missing XLSX sheet: ${sheet}`);
  const width = Math.max(...headerRows.map((r) => worksheet.getRow(r).cellCount));
  const read = (row) => Array.from({ length: width }, (_, i) => cellText(worksheet.getRow(row).getCell(i + 1)).trim());
  const indexes = columns ? Object.values(columns).map((n) => n - 1) : Array.from({ length: width }, (_, i) => i);
  if (!indexes.length || new Set(indexes).size !== indexes.length || indexes.some((n) => !Number.isInteger(n) || n < 0 || n >= worksheet.columnCount)) throw Error('Invalid XLSX column selection');
  const headerValues = headerRows.map(read);
  const header = columns ? Object.keys(columns) : indexes.map((i) => [...new Set(headerValues.map((row) => row[i]).filter(Boolean))].join('/'));
  const stopIndex = stopOnBlankColumn === undefined ? -1 : header.indexOf(stopOnBlankColumn);
  if (stopOnBlankColumn !== undefined && stopIndex < 0) throw Error(`Missing XLSX stop column: ${stopOnBlankColumn}`);
  const records = [header];
  for (let row = dataStartRow; row <= Math.min(dataEndRow ?? worksheet.rowCount, worksheet.rowCount); row += rowStep) {
    const values = read(row);
    const record = indexes.map((i) => i < width ? values[i] : cellText(worksheet.getRow(row).getCell(i + 1)).trim());
    if (stopIndex >= 0 && !record[stopIndex]) break;
    if (record.every((value) => value === '')) continue;
    records.push(record);
  }
  return prepareRecords(addMetadata(records, metadata, { filename, sheet: worksheet.name }), transforms, 'XLSX');
}

function capture(value, pattern, group = 1) {
  const match = new RegExp(pattern).exec(value);
  if (!match || !match[group]) throw Error(`Capture failed: ${pattern}`);
  return match[group];
}

function addMetadata(records, metadata, context) {
  const names = Object.keys(metadata);
  if (!names.length) return records;
  const [header, ...rows] = records;
  if (names.some((name) => header.includes(name))) throw Error('Metadata column collision');
  const values = Object.values(metadata).map((rule) => {
    if (context[rule.source] === undefined) throw Error(`Missing metadata source: ${rule.source}`);
    return capture(context[rule.source], rule.pattern, rule.group);
  });
  return [[...header, ...names], ...rows.map((row) => [...row, ...values])];
}

function prepareRecords(input, table, format) {
  const [header, ...rows] = input;
  if (!header?.length || new Set(header).size !== header.length) throw Error(`Missing or duplicate ${format} headers`);
  const sourceColumns = [...(table.fillDown ?? []), ...(table.where ?? []).map((filter) => filter.column)];
  for (const column of sourceColumns) if (!header.includes(column)) throw Error(`Missing ${format} column: ${column}`);
  const previous = new Map();
  const filters = (table.where ?? []).map((rule) => ({ ...rule, regex: rule.matches === undefined ? undefined : new RegExp(rule.matches) }));
  const records = rows.filter((record) => {
    for (const column of table.fillDown ?? []) {
      const index = header.indexOf(column);
      const value = (record[index] ?? '').trim();
      if (value) previous.set(column, value);
      else record[index] = previous.get(column) ?? '';
    }
    return filters.every((rule) => {
      const value = (record[header.indexOf(rule.column)] ?? '').trim();
      return rule.equals !== undefined ? value === rule.equals
        : rule.notEquals !== undefined ? value !== rule.notEquals : rule.regex.test(value);
    });
  });
  return [header, ...records];
}

function areaComponent(value, part) {
  let code = value;
  if (part.capture) code = capture(code, part.capture);
  if (part.mapping) {
    if (!Object.hasOwn(part.mapping.values, code)) throw Error(`Unmapped area code: ${code}`);
    code = part.mapping.values[code];
  }
  if (part.prefectureName) {
    if (!prefectureCodesByName.has(code)) throw Error(`Unknown prefecture name: ${code}`);
    code = prefectureCodesByName.get(code);
  }
  if (!code) throw Error('Empty area code');
  if (!part.width) return code;
  if (!/^\d+$/.test(code) || code.length > part.width) throw Error('Invalid area code component');
  return code.padStart(part.width, '0');
}

export function normalizeTable({ datasetId, version, table, members, provenance }) {
  if (!['error', 'skip'].includes(table.nonNumeric ?? 'error')) throw Error('Invalid nonNumeric policy');
  const pattern = new RegExp(table.filePattern);
  const selected = members.filter((m) => pattern.test(m.name));
  if (!selected.length) throw Error(`No input for table: ${table.table}`);
  const groups = new Map();
  const dimColumns = Object.entries(table.dims ?? {}).sort(([a], [b]) => a.localeCompare(b));
  for (const member of selected) {
    const isXlsx = /\.xlsx$/i.test(member.name);
    if (isXlsx && !member.workbook) throw Error('XLSX must be loaded through csvMembers');
    if (!isXlsx && table.xlsx) throw Error('XLSX settings matched a non-XLSX member');
    let records = isXlsx ? xlsxRecords(member.workbook, table.xlsx, table.metadataColumns, member.name, table)
      : prepareRecords(addMetadata(parse(decodeCsv(member.bytes, table.encoding), { bom: true, skip_empty_lines: true }), table.metadataColumns ?? {}, { filename: member.name }), table, 'CSV');
    const format = isXlsx ? 'XLSX' : 'CSV';
    let header = records.shift();
    if (!header?.length || new Set(header).size !== header.length) throw Error(`Missing or duplicate ${format} headers`);
    if (table.unpivot) {
      const { columns, areaColumn, valueColumn } = table.unpivot;
      const entries = Object.entries(columns);
      if (!entries.length || areaColumn === valueColumn || [areaColumn, valueColumn].some((name) => header.includes(name))) throw Error('Invalid unpivot output columns');
      const indexes = entries.map(([column, area]) => {
        const index = header.indexOf(column);
        if (index < 0) throw Error(`Missing ${format} column: ${column}`);
        return [index, area];
      });
      // Keep source columns available for time/dimensions; each selected cell is one observation.
      const width = header.length;
      records = records.flatMap((record) => indexes.map(([index, area]) => [
        ...Array.from({ length: width }, (_, i) => record[i] ?? ''), area, record[index] ?? '',
      ]));
      header = [...header, areaColumn, valueColumn];
    }
    const required = [...table.areas.flatMap((a) => (a.compose ?? [a]).map((part) => part.column)), ...dimColumns.flatMap(([, column]) => typeof column === 'string' ? [column] : []), ...(table.aggregation === 'sum' ? [table.valueColumn] : []), ...(table.timeColumn ? [table.timeColumn] : [])];
    for (const column of required) if (!header.includes(column)) throw Error(`Missing ${format} column: ${column}`);
    const at = (record, column) => (record[header.indexOf(column)] ?? '').trim();
    for (const record of records) {
      const time = table.timeColumn ? at(record, table.timeColumn) : table.time === '$version' ? version : table.time;
      if (!time) throw Error('Empty observation time');
      const value = table.aggregation === 'count' ? 1 : Number(at(record, table.valueColumn));
      if (table.aggregation === 'sum' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(at(record, table.valueColumn))) {
        if (table.nonNumeric === 'skip') continue;
        throw Error('Invalid numeric cell');
      }
      if (!Number.isFinite(value)) throw Error('Non-finite value');
      const dims = Object.fromEntries(dimColumns.map(([key, column]) => [key, typeof column === 'string' ? at(record, column) : column.value]));
      for (const area of table.areas) {
        const composed = (area.compose ?? [area]).map((part) => areaComponent(at(record, part.column), part)).join('');
        const normalizedArea = normalizeOpenDataArea(area.level, composed);
        const { areaCode } = normalizedArea;
        const row = { ...normalizedArea, time, dims, value: 0, unit: table.unit };
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
