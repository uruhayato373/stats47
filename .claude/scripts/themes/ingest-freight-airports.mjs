#!/usr/bin/env node
/** Official OD and airport profiles; R2 files are written only with --write-local. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const {
  FREIGHT_OD_SOURCE: freightSource,
} = require('../../../packages/data-configs/src/theme-catalog/freight-od-source.ts');
const {
  AIRPORT_TRAFFIC_SOURCE: airportSource,
} = require('../../../packages/data-configs/src/theme-catalog/airport-traffic-source.ts');
const {
  freightOdSnapshotSchema,
} = require('../../../apps/web/src/features/freight-od/lib/freight-od-snapshot.ts');
const {
  airportTrafficSnapshotSchema,
} = require('../../../apps/web/src/features/airport-traffic/lib/airport-traffic-snapshot.ts');
export const SOURCES = [...freightSource.files, ...airportSource.files];
export const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const compact = (value) => String(value).replace(/\s/g, '');
const shortName = (name) =>
  name === '北海道' ? name : name.replace(/[都府県]$/, '');
const prefMap = new Map(
  prefectures.map((p) => [shortName(p.prefName), p.prefCode])
);
export function numeric(value) {
  assert.equal(typeof value, 'number', 'blank/suppression/string is not zero');
  assert.ok(
    Number.isSafeInteger(value) && value >= 0,
    'nonnegative safe integer required'
  );
  return value;
}
function value(sheet, row, col) {
  const raw = sheet.getCell(row, col).value;
  return raw && typeof raw === 'object' && 'result' in raw ? raw.result : raw;
}
export function workbook(sourcePath, expectedSha, sheetNames) {
  // Read the actual cached XML value. ExcelJS drops a cached zero on shared formulas.
  const python = String.raw`import sys,zipfile,xml.etree.ElementTree as E,json,hashlib,pathlib,posixpath
p=pathlib.Path(sys.argv[1]);b=p.read_bytes();assert hashlib.sha256(b).hexdigest()==sys.argv[2]
wanted=json.loads(sys.argv[3]);z=zipfile.ZipFile(p);ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
strings=[]
if 'xl/sharedStrings.xml' in z.namelist():
 strings=[''.join(t.text or '' for t in n.findall('m:t',ns)+n.findall('m:r/m:t',ns)) for n in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)]
rels={r.attrib['Id']:posixpath.normpath('xl/'+r.attrib['Target']) for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
result={}
for sh in E.fromstring(z.read('xl/workbook.xml')).findall('m:sheets/m:sheet',ns):
 name=sh.attrib['name']
 if name not in wanted:continue
 target=rels[sh.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
 if target.startswith('/'):target=target.lstrip('/')
 cells={}
 for c in E.fromstring(z.read(target)).findall('.//m:sheetData/m:row/m:c',ns):
  v=c.find('m:v',ns);typ=c.attrib.get('t','n');out=None
  if typ=='inlineStr':out=''.join(c.find('m:is',ns).itertext())
  elif v is not None and v.text is not None:
   if typ=='s':out=strings[int(v.text)]
   elif typ in ['str','e']:out=v.text
   else:out=float(v.text);out=int(out) if out.is_integer() else out
  cells[c.attrib['r']]=out
 result[name]=cells
assert set(result)==set(wanted)
print(json.dumps(result,ensure_ascii=False,separators=(',',':')))`;
  const sheets = JSON.parse(
    execFileSync(
      'python3',
      ['-c', python, sourcePath, expectedSha, JSON.stringify(sheetNames)],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 16 * 1024 * 1024,
      }
    )
  );
  const column = (n) => {
    let s = '';
    for (; n > 0; n = Math.floor((n - 1) / 26))
      s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
  };
  return {
    getWorksheet: (name) =>
      sheets[name]
        ? {
            rowCount: Math.max(
              ...Object.keys(sheets[name]).map((key) =>
                Number(key.match(/\d+$/)[0])
              )
            ),
            getCell: (row, col) => ({
              value: sheets[name][column(col) + row] ?? null,
            }),
          }
        : undefined,
  };
}
function fromRaw(raw, filename, sheets) {
  return workbook(raw.paths.get(filename), sha(raw.get(filename)), sheets);
}
export function parseOdSheet(sheet, definition) {
  assert.ok(sheet, 'missing OD sheet');
  const expectedLabel = definition.label;
  const matrix = new Map();
  const cellKey = (o, d) => `${o}:${d}`;
  const headers = [];
  for (let i = 1; i <= sheet.rowCount; i++) {
    if (value(sheet, i, 2) !== '着') continue;
    assert.equal(value(sheet, i - 3, 2), '令和6年度');
    assert.ok(
      compact(value(sheet, i - 3, 8)).includes(`（${expectedLabel}その`),
      'mode/source header mismatch'
    );
    assert.equal(
      value(sheet, i - 3, 16),
      definition.mode === 'air' ? '（単位：キログラム）' : '（単位：トン）'
    );
    if (definition.mode !== 'air')
      assert.equal(value(sheet, i - 2, 14), '総貨物');
    assert.equal(
      value(sheet, i + 1, 2),
      '発',
      'OD axes must remain origin rows/destination columns'
    );
    headers.push(i);
    for (let r = i + 2; r <= i + 56; r++) {
      const origin = value(sheet, r, 2);
      assert.equal(typeof origin, 'string');
      for (let c = 3; c <= 16; c++) {
        const dest = value(sheet, i, c);
        if (dest === null) continue;
        assert.equal(typeof dest, 'string');
        const key = cellKey(origin, dest);
        assert.ok(!matrix.has(key), 'duplicate source OD');
        matrix.set(key, numeric(value(sheet, r, c)));
      }
    }
  }
  assert.deepEqual(headers, [5, 67, 128, 190], 'source layout changed');
  assert.equal(matrix.size, 55 * 55);
  const get = (o, d) => numeric(matrix.get(cellKey(o, d)));
  const names = [...prefMap.keys()];
  const subregions = ['札幌', '旭川', '函館', '室蘭', '釧路', '帯広', '北見'];
  for (const name of [...names, '全国']) {
    assert.equal(
      subregions.reduce((s, sub) => s + get(sub, name), 0),
      get('北海道', name),
      'Hokkaido origin aggregate'
    );
    assert.equal(
      subregions.reduce((s, sub) => s + get(name, sub), 0),
      get(name, '北海道'),
      'Hokkaido destination aggregate'
    );
  }
  const mode = {
    mode: definition.mode,
    label: definition.label,
    unit: definition.unit,
    periodType: definition.periodType,
    officialNationalTotal: get('全国', '全国'),
    od: names.flatMap((o) =>
      names.map((d) => ({
        originAreaCode: prefMap.get(o),
        destinationAreaCode: prefMap.get(d),
        value: get(o, d),
      }))
    ),
    originTotals: names.map((o) => ({
      areaCode: prefMap.get(o),
      value: get(o, '全国'),
    })),
    destinationTotals: names.map((d) => ({
      areaCode: prefMap.get(d),
      value: get('全国', d),
    })),
  };
  assert.equal(mode.officialNationalTotal, definition.officialNationalTotal);
  return mode;
}
export async function buildFreight(raw, generatedAt) {
  const od = fromRaw(raw, 'freight-od.xlsx', ['0-1', '0-2', '0-3']);
  const air = fromRaw(raw, 'freight-air.xlsx', ['貨物府県']);
  const national = fromRaw(raw, 'freight-national.xlsx', ['貨物']);
  const modes = freightSource.modes.map((definition, i) =>
    parseOdSheet(
      i === 3 ? air.getWorksheet('貨物府県') : od.getWorksheet(`0-${i + 1}`),
      definition
    )
  );
  const n = national.getWorksheet('貨物');
  assert.equal(value(n, 3, 16), '令和6年度');
  assert.equal(value(n, 8, 7), '総貨物');
  for (let i = 0; i < 3; i++) {
    const col = [11, 13, 15][i];
    assert.equal(value(n, 7, col), '（千トン）');
    assert.equal(
      Math.round(modes[i].officialNationalTotal / 1000),
      numeric(value(n, 8, col)),
      'independent national thousand-ton table'
    );
  }
  return freightOdSnapshotSchema.parse({
    schemaVersion: 1,
    period: freightSource.period,
    commodity: '総貨物',
    generatedAt,
    source: {
      title: freightSource.title,
      url: freightSource.url,
      files: freightSource.files,
    },
    prefectures: prefectures.map((p) => ({
      areaCode: p.prefCode,
      areaName: p.prefName,
    })),
    modes,
    notes: freightSource.notes,
  });
}
const passengerKeys = [
  'internationalBoarding',
  'internationalAlighting',
  'internationalTransit',
  'internationalTotal',
  'domesticBoarding',
  'domesticAlighting',
  'domesticTotal',
  'total',
];
const cargoKeys = [
  'internationalLoaded',
  'internationalUnloaded',
  'internationalTotal',
  'domesticLoaded',
  'domesticUnloaded',
  'domesticTotal',
  'total',
];
function take(sheet, row, start, keys) {
  return Object.fromEntries(
    keys.map((key, i) => [key, numeric(value(sheet, row, start + i))])
  );
}
export function parseAirportSheet(sheet) {
  assert.ok(sheet);
  const airports = [];
  const groups = new Map();
  const heli = [];
  for (let row = 1; row <= sheet.rowCount; row++) {
    if (value(sheet, row, 3) !== '空港名 ：') continue;
    assert.equal(compact(value(sheet, row - 1, 3)), '令和7年空港管理状況調書');
    assert.equal(value(sheet, row + 18, 3), '暦年 計');
    assert.equal(value(sheet, row + 45, 3), '暦年 計');
    assert.equal(compact(value(sheet, row + 1, 7)), '乗降客数（人）');
    assert.equal(compact(value(sheet, row + 28, 7)), '貨物取扱量（トン）');
    assert.equal(value(sheet, row + 3, 9), '通過客');
    assert.equal(value(sheet, row + 30, 4), '積');
    assert.equal(value(sheet, row + 30, 5), '卸');
    const nameWithGroup = compact(value(sheet, row, 4));
    const data = {
      passengers: take(sheet, row + 18, 7, passengerKeys),
      cargo: take(sheet, row + 45, 4, cargoKeys),
    };
    // The twelve source months must sum to the selected calendar-year line.
    for (const [kind, startRow, startCol, keys] of [
      ['passengers', row + 5, 7, passengerKeys],
      ['cargo', row + 32, 4, cargoKeys],
    ]) {
      keys.forEach((key, i) => {
        let sum = 0;
        for (let month = 0; month < 12; month++) {
          assert.equal(value(sheet, startRow + month, 3), `${month + 1}月`);
          sum += numeric(value(sheet, startRow + month, startCol + i));
        }
        assert.equal(
          sum,
          data[kind][key],
          `calendar-month sum ${nameWithGroup}/${key}`
        );
      });
    }
    if (nameWithGroup.includes('計')) {
      assert.ok(!groups.has(nameWithGroup));
      groups.set(nameWithGroup, data);
      continue;
    }
    if (/[へヘ]リ/.test(nameWithGroup)) {
      heli.push(data);
      continue;
    }
    const airportName = nameWithGroup.split(/[（(]/)[0];
    const mapping = airportSource.airports.find(
      (item) => item.airportName === airportName
    );
    assert.ok(mapping, `unmapped airport ${airportName}`);
    airports.push({ airportName, areaCodes: [...mapping.areaCodes], ...data });
  }
  assert.equal(airports.length, 96);
  assert.equal(heli.length, 12);
  assert.equal(groups.size, 11);
  const national = { passengers: {}, cargo: {} };
  for (const [kind, keys] of [
    ['passengers', passengerKeys],
    ['cargo', cargoKeys],
  ])
    for (const key of keys) {
      const total = airports.reduce((sum, row) => sum + row[kind][key], 0);
      const heliSum = heli.reduce((sum, row) => sum + row[kind][key], 0);
      assert.equal(heliSum, groups.get('ヘリポート計')[kind][key]);
      assert.equal(
        total + heliSum,
        groups.get('全空港計３（全空港計１、全空港計２）')[kind][key],
        'official total less heliports'
      );
      national[kind][key] = total;
    }
  return { airports, national };
}
export async function buildAirports(raw, generatedAt) {
  const w = fromRaw(raw, 'airport-2025.xlsx', ['空港管理状況調書']);
  const parsed = parseAirportSheet(w.getWorksheet('空港管理状況調書'));
  return airportTrafficSnapshotSchema.parse({
    schemaVersion: 1,
    period: airportSource.period,
    periodType: airportSource.periodType,
    releaseStatus: airportSource.releaseStatus,
    generatedAt,
    passengerUnit: airportSource.passengerUnit,
    cargoUnit: airportSource.cargoUnit,
    source: {
      title: airportSource.title,
      url: airportSource.url,
      files: airportSource.files,
    },
    ...parsed,
    notes: airportSource.notes,
  });
}
export function verifySource(source, bytes) {
  assert.equal(sha(bytes), source.sha256, `source SHA: ${source.filename}`);
}
export function verifyLocations(raw) {
  const texts = new Map();
  for (const source of airportSource.files.filter((source) =>
    source.filename.startsWith('airport-location-')
  )) {
    const bytes = raw.get(source.filename);
    const text = source.filename.endsWith('.pdf')
      ? execFileSync('pdftotext', ['-layout', '-', '-'], {
          input: bytes,
          encoding: 'utf8',
          maxBuffer: 4 * 1024 * 1024,
        })
      : new TextDecoder('shift_jis').decode(bytes).replace(/<[^>]+>/g, '');
    texts.set(source.filename, text);
  }
  for (const mapping of airportSource.airports) {
    const e = mapping.locationEvidence;
    let text = texts.get(e.filename);
    assert.ok(text);
    if (e.page !== null) text = text.split('\f')[e.page - 1];
    assert.ok(
      compact(text).includes(compact(e.locationText)),
      `official location evidence ${mapping.airportName}`
    );
  }
}
export async function main(args = process.argv.slice(2)) {
  const { values: o } = parseArgs({
    args,
    options: {
      'source-dir': {
        type: 'string',
        default: '.local/verification/themes/freight-airport-source',
      },
      root: { type: 'string' },
      'write-local': { type: 'boolean', default: false },
      'generated-at': { type: 'string' },
    },
  });
  const sourceDir = resolve(o['source-dir']);
  await mkdir(sourceDir, { recursive: true });
  const root = resolve(
    o.root ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
  );
  const raw = new Map();
  raw.paths = new Map();
  for (const source of SOURCES) {
    const filename = resolve(sourceDir, source.filename);
    let bytes;
    try {
      bytes = await readFile(filename);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const response = await fetch(source.url);
      assert.ok(response.ok, `HTTP ${response.status}: ${source.filename}`);
      bytes = Buffer.from(await response.arrayBuffer());
      verifySource(source, bytes);
      await writeFile(filename, bytes);
    }
    verifySource(source, bytes);
    raw.set(source.filename, bytes);
    raw.paths.set(source.filename, filename);
  }
  verifyLocations(raw);
  const generatedAt = o['generated-at'] ?? new Date().toISOString();
  const freight = await buildFreight(raw, generatedAt);
  const airports = await buildAirports(raw, generatedAt);
  const outputs = [
    [freightSource.r2Key, freight],
    [airportSource.r2Key, airports],
  ];
  if (o['write-local'])
    for (const [key, payload] of outputs) {
      const path = resolve(root, '.local/r2', key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(payload));
    }
  // Review artifacts are always confined to the explicitly selected source directory.
  await writeFile(
    resolve(sourceDir, 'freight-od-proposed.json'),
    JSON.stringify(freight)
  );
  await writeFile(
    resolve(sourceDir, 'airports-proposed.json'),
    JSON.stringify(airports)
  );
  const proof = {
    status: 'PASS',
    writeLocal: o['write-local'],
    generatedAt,
    sources: SOURCES,
    outputs: outputs.map(([key, payload]) => ({
      key,
      sha256: sha(JSON.stringify(payload)),
    })),
    freight: freight.modes.map((m) => ({
      mode: m.mode,
      cells: m.od.length,
      unit: m.unit,
      periodType: m.periodType,
      national: m.officialNationalTotal,
      odSum: m.od.reduce((s, p) => s + p.value, 0),
    })),
    airportCount: airports.airports.length,
    airportPrefectureCount: new Set(
      airports.airports.flatMap((a) => a.areaCodes)
    ).size,
    airportNational: airports.national,
    checks: [
      'source SHA',
      'original units/years/axes',
      'all monthly airport cells equal calendar-year totals',
      'Hokkaido seven-subregion rows and columns',
      '47x47 OD row/column conservation',
      'national thousand-ton independent table',
      'official airport total minus 12 heliports',
      'official source location evidence',
      'strict profile schemas',
    ],
  };
  await writeFile(
    resolve(sourceDir, 'ingest-verification.json'),
    JSON.stringify(proof, null, 2)
  );
  return proof;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main()
    .then((proof) =>
      process.stdout.write(
        JSON.stringify({
          status: proof.status,
          writeLocal: proof.writeLocal,
          outputs: proof.outputs,
        }) + '\n'
      )
    )
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
