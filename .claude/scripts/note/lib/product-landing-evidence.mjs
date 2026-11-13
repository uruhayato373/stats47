import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import JSZip from 'jszip';
import { PREF_AREA_CODES } from '../../lib/prefectures.cjs';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Read the bytes sold on note, never today's rankings. The archive SHA is the delivery identity. */
export async function inspectLandingArchive(bytes, archive, delivery) {
  if (bytes.length !== archive.bytes || sha256(bytes) !== archive.sha256) throw Error('固定納品ZIPのSHA/サイズが一致しません');
  const zip = await JSZip.loadAsync(bytes);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const roots = new Set(entries.map((entry) => entry.name.split('/')[0]));
  const prefix = zip.file('data.csv') ? '' : roots.size === 1 ? `${[...roots][0]}/` : '';
  if (entries.some((entry) => entry.name.includes('..') || entry.name.includes('\\'))) throw Error('固定納品ZIPのパスが不正です');
  const read = async (name) => {
    const entry = zip.file(`${prefix}${name}`);
    if (!entry) throw Error(`固定納品ZIPに ${name} がありません`);
    return entry.async('nodebuffer');
  };
  const [csv, sourceCsv] = await Promise.all([read('data.csv'), read('SOURCES.csv')]);
  const rows = parse(csv, { bom: true });
  const sources = parse(sourceCsv, { bom: true, columns: true });
  if (rows.length !== 48 || rows.slice(1).some((row, i) => row[0] !== PREF_AREA_CODES[i] || row.length !== rows[0].length))
    throw Error('固定納品CSVは47都道府県の順序・列数が必要です');
  if (rows[0].length - 3 !== sources.length || sources.length !== delivery.indicatorCount)
    throw Error('固定納品CSVと出典・台帳の指標数が一致しません');
  const metrics = sources.map((source, i) => {
    const key = /app\/ranking\/([^/]+)\/values\.json/.exec(source['加工式'])?.[1];
    if (!key) throw Error(`指標キーを出典から解決できません: ${source['表名']}`);
    if (rows[0][i + 2] !== `${source['表名']}（${source['単位']}・${source['年']}）`)
      throw Error(`CSV列と出典の定義・年・単位が一致しません: ${key}`);
    return { key, title: source['表名'], year: source['年'], unit: source['単位'], source: source['調査名'], sourceUrl: source.URL,
      header: rows[0][i + 2], column: i + 2 };
  });
  if (new Set(metrics.map((metric) => metric.key)).size !== metrics.length) throw Error('固定納品の指標キーが重複しています');
  return { rows, metrics, files: entries.map((entry) => entry.name.slice(prefix.length)).sort(),
    dataSha256: sha256(csv), sourcesSha256: sha256(sourceCsv) };
}

/** Empty cells remain absent. A selected chart may not silently replace missing values with zero. */
export function selectLandingMetric(evidence, key) {
  const metric = evidence.metrics.find((candidate) => candidate.key === key);
  if (!metric) throw Error(`固定納品に収録されていない指標: ${key}`);
  const rows = evidence.rows.slice(1).map((row) => {
    const text = row[metric.column];
    if (text === '' || !Number.isFinite(Number(text))) throw Error(`作成例に欠損があります: ${key}/${row[0]}`);
    return { area_code: row[0], area_name: row[1], value: Number(text) };
  }).sort((a, b) => b.value - a.value || a.area_code.localeCompare(b.area_code));
  return { ...metric, rows: rows.map((row) => ({ ...row, rank: rows.findIndex((other) => other.value === row.value) + 1 })) };
}
