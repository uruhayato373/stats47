#!/usr/bin/env tsx
/** Pinned official law → NEW isolated local staging; no remote writer. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { JSDOM } from 'jsdom';

import { portCount } from '../../../data-configs/src/metrics/port-count';
import { buildRecipe } from '../../../data-configs/src/recipe';
import { buildStatsPayload } from '../mlit-ksj/ksj-stats-core';
import {
  parseDesignatedPortRows,
  PORT_DATA_DATE,
  PORT_LAW_REVISION,
  readDesignatedPortRows,
  verifySakaiAttribution,
} from './designated-ports';
import { verifySourceSha } from './parse';

async function get(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--out' || !args[1])
    throw new Error(
      'Usage: generate-designated-ports.ts --out <NEW local staging directory>'
    );
  const out = path.resolve(args[1]);
  if (existsSync(out) || /(?:^|\/)\.local\/r2(?:\/|$)/.test(out))
    throw new Error('Require NEW isolated staging, never .local/r2');
  if (
    portCount.source.kind !== 'external' ||
    portCount.source.fetcherKey !== 'manual'
  )
    throw new Error('Expected manual official source');
  const input = portCount.source.config as {
    source: { name: string; url: string; license: string; termsUrl: string };
    sourceSha256: string;
    dataDate: string;
    nationalTotal: number;
    provenance: {
      url: string;
      publicationIndexUrl: string;
      attributionUrl: string;
      attributionSha256: string;
      attributionTermsUrl: string;
    };
  };
  if (input.dataDate !== PORT_DATA_DATE || input.nationalTotal !== 664)
    throw new Error('Config/date/total drift');
  const sources = {
    'source.json': input.provenance.url,
    'attribution.html': input.provenance.attributionUrl,
    'summary.html': input.provenance.publicationIndexUrl,
    'egov-terms.html': input.source.termsUrl,
    'mlit-terms.html': input.provenance.attributionTermsUrl,
  };
  const files = await Promise.all(
    Object.entries(sources).map(async ([name, url]) => ({
      name,
      url,
      bytes: await get(url),
    }))
  );
  const source = files[0].bytes,
    attribution = files[1].bytes;
  verifySourceSha(source, input.sourceSha256);
  verifySourceSha(attribution, input.provenance.attributionSha256);
  const bodyText = (bytes: Buffer) =>
    new JSDOM(bytes.toString('utf8')).window.document.body.textContent ?? '';
  for (const file of files.slice(3)) {
    if (!bodyText(file.bytes).includes('公共データ利用規約（第1.0版）'))
      throw new Error('PDL terms changed; review required');
  }
  const summary = bodyText(files[2].bytes).normalize('NFKC').replace(/\s/g, '');
  if (!summary.includes('(令和7年以降)甲種港湾163港乙種港湾501港'))
    throw new Error('Official summary changed');
  verifySakaiAttribution(attribution.toString('utf8'));
  const { counts, ports, ko, otsu } = parseDesignatedPortRows(
    readDesignatedPortRows(JSON.parse(source.toString('utf8')))
  );
  const generatedAt = new Date().toISOString();
  const payload = buildStatsPayload({
    metricKey: portCount.key,
    unit: portCount.unit,
    yearCode: '2025',
    countsByPref: counts,
    generatedAt,
    recipe: buildRecipe(portCount),
  });
  const evidence = {
    ...input,
    metricKey: portCount.key,
    sha256: input.sourceSha256,
    revision: PORT_LAW_REVISION,
    generatedAt,
    rowCount: counts.size,
    nationalTotal: ko + otsu,
    ko,
    otsu,
    jointPort: {
      name: '境港',
      statutoryPrefectures: ['31', '32'],
      countingPrefecture: '31',
      reason:
        '国土交通省みなと一覧の県別掲載区分を集計上採用。法令上の共同港の所属を変更しない。',
    },
  };
  const statsDir = path.join(out, 'app/stats/port-count');
  const evidenceDir = path.join(out, 'evidence');
  mkdirSync(statsDir, { recursive: true });
  mkdirSync(evidenceDir);
  const write = (file: string, value: unknown) =>
    writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  write(path.join(statsDir, 'values.json'), {
    ...payload,
    meta: { ...payload.meta, source: evidence },
  });
  write(path.join(evidenceDir, 'designated-ports.json'), ports);
  for (const file of files)
    writeFileSync(path.join(evidenceDir, file.name), file.bytes, {
      flag: 'wx',
    });
  const report = {
    status: 'PASS',
    remoteWrites: 0,
    generatedAt,
    evidence,
    files: files.map(({ name, url, bytes }) => ({
      name,
      url,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    })),
  };
  write(path.join(out, 'report.json'), report);
  console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
