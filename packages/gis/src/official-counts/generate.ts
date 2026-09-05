#!/usr/bin/env tsx
/** Official XLSX/PDF → fresh local staging only. Never uploads or merges old years. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { JSDOM } from 'jsdom';

import { roadsideStationCount } from '../../../data-configs/src/metrics/roadside-station-count';
import { fishingPortCountKsj } from '../../../data-configs/src/metrics/fishing-port-count-ksj';
import { buildRecipe } from '../../../data-configs/src/recipe';
import { buildStatsPayload } from '../mlit-ksj/ksj-stats-core';
import {
  parsePortText,
  parseStationRows,
  readStationWorkbook,
  verifySourceSha,
} from './parse';

async function get(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--out' || !args[1])
    throw new Error('Usage: generate.ts --out <NEW local staging directory>');
  const out = path.resolve(args[1]);
  if (existsSync(out) || /(?:^|\/)\.local\/r2(?:\/|$)/.test(out))
    throw new Error(
      'Output must be a NEW isolated staging directory, never .local/r2'
    );
  const work = mkdtempSync('/tmp/stats47-official-counts-');
  const generatedAt = new Date().toISOString();
  const prepared = [];
  for (const config of [roadsideStationCount, fishingPortCountKsj]) {
    if (
      config.source.kind !== 'external' ||
      config.source.fetcherKey !== 'manual'
    )
      throw new Error('Expected manual official source');
    const input = config.source.config as {
      source: { name: string; url: string; license: string; termsUrl: string };
      sourceSha256: string;
      dataDate: string;
      nationalTotal: number;
      provenance: {
        url?: string;
        pdfUrl?: string;
        publicationIndexUrl: string;
      };
    };
    const url = input.provenance.url ?? input.provenance.pdfUrl!;
    const bytes = await get(url);
    const sha256 = verifySourceSha(bytes, input.sourceSha256);
    const isStation = config.key === roadsideStationCount.key;
    const sourcePath = path.join(
      work,
      isStation ? 'stations.xlsx' : 'ports.pdf'
    );
    writeFileSync(sourcePath, bytes);
    const indexBytes = await get(input.provenance.publicationIndexUrl);
    const termsBytes = await get(input.source.termsUrl);
    const termsText =
      new JSDOM(termsBytes.toString('utf8')).window.document.body.textContent ??
      '';
    if (!termsText.includes('公共データ利用規約（第1.0版）'))
      throw new Error('Official PDL terms changed; review required');
    let counts: Map<string, number>;
    if (isStation) {
      const text =
        new JSDOM(indexBytes.toString('utf8')).window.document.body
          .textContent ?? '';
      if (!/令和8年9月4日現在で1,234駅/.test(text))
        throw new Error('Station publication date/total changed');
      counts = parseStationRows(
        await readStationWorkbook(bytes),
        input.nationalTotal
      );
    } else {
      const text = execFileSync('pdftotext', ['-layout', sourcePath, '-'], {
        encoding: 'utf8',
      });
      counts = parsePortText(text, input.nationalTotal);
      writeFileSync(path.join(work, 'ports.txt'), text);
    }
    const payload = buildStatsPayload({
      metricKey: config.key,
      unit: config.unit,
      yearCode: '2026',
      countsByPref: counts,
      generatedAt,
      recipe: buildRecipe(config),
    });
    const evidence = {
      metricKey: config.key,
      ...input,
      url,
      sha256,
      bytes: bytes.length,
      generatedAt,
      rowCount: counts.size,
      nationalTotal: [...counts.values()].reduce(
        (sum, value) => sum + value,
        0
      ),
      zeroCodes: [...counts]
        .filter(([, value]) => value === 0)
        .map(([code]) => code),
      termsSha256: createHash('sha256').update(termsBytes).digest('hex'),
    };
    prepared.push({
      config,
      payload: { ...payload, meta: { ...payload.meta, source: evidence } },
      evidence,
      bytes,
      indexBytes,
      termsBytes,
      isStation,
    });
  }
  // Validate BOTH before writing either app/stats file. No reads of old observations.
  mkdirSync(out, { recursive: true });
  const report = {
    status: 'PASS',
    generatedAt,
    work,
    targets: prepared.map((p) => p.evidence),
  };
  for (const p of prepared) {
    const dir = path.join(out, 'app/stats', p.config.key);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      path.join(dir, 'values.json'),
      JSON.stringify(p.payload, null, 2) + '\n'
    );
    const evidenceDir = path.join(out, 'evidence', p.config.key);
    mkdirSync(evidenceDir, { recursive: true });
    writeFileSync(
      path.join(evidenceDir, p.isStation ? 'source.xlsx' : 'source.pdf'),
      p.bytes
    );
    writeFileSync(path.join(evidenceDir, 'publication.html'), p.indexBytes);
    writeFileSync(path.join(evidenceDir, 'terms.html'), p.termsBytes);
  }
  writeFileSync(
    path.join(out, 'report.json'),
    JSON.stringify(report, null, 2) + '\n'
  );
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
