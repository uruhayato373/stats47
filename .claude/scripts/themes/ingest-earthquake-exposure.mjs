import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { readPopulationZip } from './lib/earthquake-dbf.mjs';
const require = createRequire(import.meta.url);
const unzipper = require('unzipper');
const {
  EARTHQUAKE_EXPOSURE_SOURCE: source,
} = require('../../../packages/data-configs/src/theme-catalog/earthquake-exposure-source.ts');
const {
  assertEarthquakePopulationSnapshot,
  assertEarthquakePrefArtifact,
  buildEarthquakePrefArtifact,
  assertEarthquakeManifest,
  assertEarthquakeVerification,
} = require('../../../packages/data-configs/src/theme-catalog/earthquake-exposure-schema.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hashFile = async (path) => {
  let bytes = 0,
    h = createHash('sha256');
  for await (const b of createReadStream(path)) {
    bytes += b.length;
    h.update(b);
  }
  return { bytes, sha256: h.digest('hex') };
};
const canonicalPath = async (path) => {
  try {
    return await realpath(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return resolve(await canonicalPath(dirname(resolve(path))), basename(path));
  }
};
const inside = (path, base) => {
  const rel = relative(base, path);
  return (
    rel === '' ||
    (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + sep))
  );
};
export function assertPrivatePath(path, publicRoot) {
  assert.ok(
    !inside(resolve(path), resolve(publicRoot)) &&
      !/\/\.local\/r2(?:\/|$)/.test(resolve(path).replaceAll('\\', '/')),
    'Private source/work/report path must stay outside public R2'
  );
}
export function classifyEarthquakeIntensity(value) {
  assert.ok(
    Number.isFinite(value) && value >= 0 && value < 10,
    'Invalid instrumental intensity'
  );
  return value < 4.5
    ? 0
    : value < 5
      ? 1
      : value < 5.5
        ? 2
        : value < 6
          ? 3
          : value < 6.5
            ? 4
            : 5;
}
export function populationTenThousandths(value) {
  assert.ok(Number.isFinite(value) && value >= 0);
  const n = Math.round(value * 10000);
  assert.ok(
    Number.isSafeInteger(n) && Math.abs(n / 10000 - value) < 1e-8,
    'Unexpected population precision'
  );
  return n;
}
const zero = () => ({ records: 0, population2020: 0, population2050: 0 });
const add = (target, population) => {
  target.records++;
  target.population2020 += populationTenThousandths(population.PTN_2020);
  target.population2050 += populationTenThousandths(population.PTN_2050);
};
const finishCounts = (row) => ({
  ...row,
  population2020: row.population2020 / 10000,
  population2050: row.population2050 / 10000,
});
const coverage = (total, missing) => ({
  population2020Percent:
    (1 - missing.population2020 / total.population2020) * 100,
  population2050Percent:
    (1 - missing.population2050 / total.population2050) * 100,
});
async function pinnedInput(path, pin, publicRoot) {
  const actual = await realpath(path);
  assertPrivatePath(actual, publicRoot);
  const metadata = JSON.parse(await readFile(path + '.metadata.json', 'utf8'));
  assert.equal(metadata.url, pin.url);
  assert.equal(metadata.version, pin.version);
  assert.equal(metadata.sha256, pin.sha256);
  assert.equal(metadata.bytes, pin.bytes);
  const checked = await hashFile(actual);
  assert.equal(checked.sha256, pin.sha256, 'Original source SHA changed');
  assert.equal(checked.bytes, pin.bytes);
  assert.match(
    metadata.acquiredAt,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  );
  assert.ok(
    Number.isFinite(Date.parse(metadata.acquiredAt)),
    'Genuine acquisition timestamp required; no mtime substitution'
  );
  return {
    actual,
    evidence: {
      id: pin.id,
      version: pin.version,
      url: pin.url,
      sha256: pin.sha256,
      bytes: pin.bytes,
      acquiredAt: metadata.acquiredAt,
      bodyVisibility:
        pin.id === source.hazard.id
          ? 'private-original'
          : 'public-license-original',
    },
  };
}
async function hazardIndex(path) {
  const zip = await unzipper.Open.file(path),
    files = zip.files.filter((f) =>
      /(^|\/)P-Y2024-MAP-AVR-TTL_MTTL(?:-\d{4})?\.csv$/.test(f.path)
    );
  assert.ok(files.length > 0);
  assert.equal(
    zip.files.filter((f) => /\.csv$/i.test(f.path) && !files.includes(f))
      .length,
    0,
    'Unexpected scenario CSV'
  );
  const index = new Map(),
    csvEvidence = [];
  let missing = 0;
  for (const file of files) {
    let header = null,
      rows = 0,
      bytes = 0;
    const h = createHash('sha256'),
      stream = file.stream();
    stream.on('data', (b) => {
      h.update(b);
      bytes += b.length;
    });
    for await (const line of createInterface({
      input: stream,
      crlfDelay: Infinity,
    })) {
      if (!line) continue;
      const fields = line.split(',').map((s) => s.trim());
      if (!header) {
        header = fields;
        assert.equal(header[0], '# CODE');
        assert.equal(header[5], source.hazard.field);
        continue;
      }
      assert.equal(fields.length, header.length);
      assert.match(fields[0], /^\d{8}[1-4]{2}$/);
      assert.match(fields[5], /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i);
      const code = Number(fields[0]),
        value = Number(fields[5]);
      assert.ok(!index.has(code), 'Duplicate hazard grid');
      const band = value === -9999 ? -1 : classifyEarthquakeIntensity(value);
      if (band === -1) missing++;
      index.set(code, band);
      rows++;
    }
    assert.ok(header);
    assert.equal(bytes, file.uncompressedSize);
    csvEvidence.push({
      entry: file.path,
      bytes,
      sha256: h.digest('hex'),
      records: rows,
    });
  }
  assert.equal(index.size, source.expectedCounts.hazardRecords);
  assert.equal(missing, 0, 'Pinned source missing-value distribution changed');
  return { index, missing, csvEvidence };
}
function nationalRow(rows) {
  const total = zero(),
    unmatched = { ...zero(), notInSourceRecords: 0, missingValueRecords: 0 },
    bands = source.bands.map((b) => ({ key: b.key, ...zero() }));
  for (const row of rows)
    for (const [target, input] of [
      [total, row.total],
      [unmatched, row.unmatched],
      ...bands.map((b, i) => [b, row.bands[i]]),
    ]) {
      target.records += input.records;
      target.population2020 += populationTenThousandths(input.population2020);
      target.population2050 += populationTenThousandths(input.population2050);
    }
  for (const row of rows) {
    unmatched.notInSourceRecords += row.unmatched.notInSourceRecords;
    unmatched.missingValueRecords += row.unmatched.missingValueRecords;
  }
  const result = {
    areaCode: '00000',
    areaName: '全国',
    total: finishCounts(total),
    bands: bands.map(finishCounts),
    unmatched: finishCounts(unmatched),
  };
  return { ...result, coverage: coverage(result.total, result.unmatched) };
}
export async function buildEarthquakePopulation({
  sourceDir,
  privateWorkDir,
  publicRoot,
  generatedAt = new Date().toISOString(),
}) {
  publicRoot = await canonicalPath(publicRoot);
  const originals = await realpath(sourceDir);
  assertPrivatePath(originals, publicRoot);
  assertPrivatePath(privateWorkDir, publicRoot);
  await mkdir(privateWorkDir, { recursive: true });
  assertPrivatePath(await realpath(privateWorkDir), publicRoot);
  const hazard = await pinnedInput(
    resolve(originals, 'jshis-Y2024-all.zip'),
    source.hazard,
    publicRoot
  );
  const checkedPopulation = [];
  // Validate every original before producing any distributable payload.
  for (const pin of source.populationSources)
    checkedPopulation.push({
      pin,
      ...(await pinnedInput(
        resolve(originals, 'population', pin.areaCode.slice(0, 2) + '.zip'),
        pin,
        publicRoot
      )),
    });
  const { index, missing, csvEvidence } = await hazardIndex(hazard.actual);
  const identities = new Set(),
    owners = new Map(),
    shared = new Set(),
    rows = [],
    privateEvidence = [];
  for (const checked of checkedPopulation) {
    const pref = checked.pin.areaCode.slice(0, 2),
      total = zero(),
      unmatched = { ...zero(), notInSourceRecords: 0, missingValueRecords: 0 },
      bands = source.bands.map((b) => ({ key: b.key, ...zero() })),
      joins = [];
    const dbf = await readPopulationZip(checked.actual, pref, (p) => {
      const identity = pref + ':' + p.SHICODE + ':' + p.MESH_ID;
      assert.ok(!identities.has(identity), 'Duplicate population identity');
      identities.add(identity);
      if (owners.has(p.MESH_ID) && owners.get(p.MESH_ID) !== pref)
        shared.add(p.MESH_ID);
      if (!owners.has(p.MESH_ID)) owners.set(p.MESH_ID, pref);
      if (p.PTN_2020 === 0 && p.PTN_2050 === 0) return;
      add(total, p);
      const band = index.get(Number(p.MESH_ID));
      let reason = null;
      if (band === undefined || band === -1) {
        add(unmatched, p);
        if (band === undefined) {
          unmatched.notInSourceRecords++;
          reason = 'not-in-source';
        } else {
          unmatched.missingValueRecords++;
          reason = 'missing-source-value';
        }
      } else add(bands[band], p);
      joins.push([
        p.MESH_ID,
        p.SHICODE,
        p.PTN_2020,
        p.PTN_2050,
        band === undefined || band === -1 ? null : band,
        reason,
      ]);
    });
    const row = {
      areaCode: checked.pin.areaCode,
      areaName: checked.pin.areaName,
      total: finishCounts(total),
      bands: bands.map(finishCounts),
      unmatched: finishCounts(unmatched),
    };
    row.coverage = coverage(row.total, row.unmatched);
    rows.push(row);
    const privateBody = JSON.stringify({
      columns: [
        'meshId',
        'municipalityCode',
        'population2020',
        'population2050',
        'intensityBandIndex',
        'missingReason',
      ],
      rows: joins,
    });
    const privatePath = resolve(privateWorkDir, pref + '.json');
    assertPrivatePath(privatePath, publicRoot);
    await writeFile(privatePath, privateBody);
    privateEvidence.push({
      areaCode: row.areaCode,
      path: privatePath,
      bytes: Buffer.byteLength(privateBody),
      sha256: hash(privateBody),
      dbf,
    });
    console.log(
      JSON.stringify({
        areaCode: row.areaCode,
        records: row.total.records,
        unmatched: row.unmatched.records,
      })
    );
  }
  const snapshot = {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt,
    rows,
    national: nationalRow(rows),
  };
  assertEarthquakePopulationSnapshot(snapshot);
  const verification = {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt,
    status: 'PASS',
    sourceFiles: 48,
    checkedPrefectures: 47,
    hazardRecords: index.size,
    populationRecords: snapshot.national.total.records,
    uniquePopulationGridCells: owners.size,
    crossPrefectureGridCells: shared.size,
    unmatchedRecords: snapshot.national.unmatched.records,
    invalidPopulationValues: 0,
    duplicatePopulationIdentities: 0,
    missingHazardValues: missing,
    conservationChecks: 144,
  };
  assertEarthquakeVerification(verification);
  const files = [];
  const put = (key, value) => {
    const content = JSON.stringify(value);
    const ref = {
      key,
      sha256: hash(content),
      bytes: Buffer.byteLength(content),
    };
    files.push({ ...ref, content });
    return ref;
  };
  const intermediates = rows.map((row) => {
    const payload = buildEarthquakePrefArtifact(snapshot, row);
    assertEarthquakePrefArtifact(payload, row.areaCode);
    return {
      areaCode: row.areaCode,
      ...put(`${source.r2Root}/pref/${row.areaCode.slice(0, 2)}.json`, payload),
    };
  });
  const aggregate = put(`${source.r2Root}/item.json`, snapshot),
    verificationRef = put(`${source.r2Root}/verification.json`, verification);
  const manifest = {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt,
    kind: 'restricted-source-prefecture-aggregate',
    canonicalPath: source.canonicalPath,
    operation: source.algorithm,
    publicShape: 'prefecture-intensity-band-population',
    jshisOriginalPublic: false,
    inputs: [hazard.evidence, ...checkedPopulation.map((p) => p.evidence)],
    intermediates,
    aggregate,
    verification: verificationRef,
    reproduction: {
      command:
        'node --import tsx .claude/scripts/themes/ingest-earthquake-exposure.mjs --source-dir <PRIVATE_INPUT_DIR> --private-work-dir <PRIVATE_WORK_DIR> --write-local',
      privateInputRequirement:
        'J-SHIS original ZIP and joined mesh rows remain outside public R2',
      populationIdentity: 'prefecture+SHICODE+MESH_ID; many-to-one hazard join',
      unmatchedPolicy: 'preserve separately; never classify as intensity zero',
    },
  };
  assertEarthquakeManifest(manifest);
  put(`${source.r2Root}/manifest.json`, manifest);
  assert.equal(files.length, 50);
  for (const file of files) {
    assert.ok(file.key.startsWith(source.r2Root + '/'));
    assert.ok(file.bytes <= 5_000_000);
  }
  await writeFile(
    resolve(privateWorkDir, 'lineage.json'),
    JSON.stringify(
      {
        generatedAt,
        originalJshisPath: hazard.actual,
        csvEvidence,
        privateEvidence,
      },
      null,
      2
    )
  );
  return { snapshot, manifest, verification, files };
}
async function main() {
  const { values: options } = parseArgs({
    options: {
      'source-dir': { type: 'string' },
      'private-work-dir': { type: 'string' },
      'write-local': { type: 'boolean', default: false },
      'local-r2-root': { type: 'string', default: resolve(root, '.local/r2') },
      out: {
        type: 'string',
        default: '/tmp/stats47-earthquake-exposure-build.json',
      },
      help: { type: 'boolean', default: false },
    },
  });
  if (options.help) {
    console.log(
      'Offline pinned originals only. --source-dir and --private-work-dir are required outside public R2. --write-local stages only 50 strict public aggregate artifacts; no remote writes.'
    );
    return;
  }
  assert.ok(options['source-dir'] && options['private-work-dir']);
  const publicRoot = resolve(options['local-r2-root']);
  assertPrivatePath(
    await canonicalPath(resolve(options.out)),
    await canonicalPath(publicRoot)
  );
  const bundle = await buildEarthquakePopulation({
    sourceDir: resolve(options['source-dir']),
    privateWorkDir: resolve(options['private-work-dir']),
    publicRoot,
  });
  if (options['write-local'])
    for (const file of bundle.files) {
      const destination = resolve(publicRoot, file.key);
      assert.ok(inside(destination, publicRoot));
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, file.content);
    }
  const report = {
    status: options['write-local'] ? 'verified-local-staged' : 'verified',
    definitionVersion: source.definitionVersion,
    verification: bundle.verification,
    files: bundle.files.map(({ content, ...f }) => f),
    privateWorkDir: resolve(options['private-work-dir']),
    housingSpatialScope: 'unfulfilled',
  };
  await mkdir(dirname(resolve(options.out)), { recursive: true });
  await writeFile(resolve(options.out), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify({
      status: report.status,
      files: bundle.files.length,
      report: resolve(options.out),
    })
  );
}
if (
  process.argv[1] &&
  (await realpath(process.argv[1])) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
