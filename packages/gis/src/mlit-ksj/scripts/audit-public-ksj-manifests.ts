#!/usr/bin/env tsx

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverOfficialKsjArchives } from '../official-download-discovery';
import {
  EXPECTED_PUBLIC_ACQUISITION_COUNT,
  PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS,
  UNREGISTERED_KSJ_OFFICIAL_POLICY,
} from '../official-policy';

type Candidate = { id: string; name: string; source_url: string };

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../..'
);
const CANDIDATE_PATH = path.join(
  PROJECT_ROOT,
  'packages/database/seed/ksj-catalog.json'
);

async function main(): Promise<void> {
  const candidates = JSON.parse(await readFile(CANDIDATE_PATH, 'utf8')) as Candidate[];
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const targets = [...UNREGISTERED_KSJ_OFFICIAL_POLICY]
    .filter(([, policy]) => policy.decision === 'acquire')
    .map(([dataId]) => dataId)
    .sort();
  if (targets.length !== EXPECTED_PUBLIC_ACQUISITION_COUNT) {
    throw new Error(`公開取得対象数が不正です: ${targets.length}`);
  }

  let totalArchives = 0;
  let totalBytes = 0;
  for (const dataId of targets) {
    const candidate = candidateById.get(dataId);
    if (!candidate) throw new Error(`候補カタログにありません: ${dataId}`);
    const archives = await discoverOfficialKsjArchives({
      dataId,
      sourcePageUrl: candidate.source_url,
    });
    const versions = [...new Set(archives.map((archive) => archive.version))];
    if (versions.length !== 1) {
      throw new Error(`選択版が一意ではありません: ${dataId} ${versions.join(',')}`);
    }
    const expectedArchiveCount = PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS.get(dataId);
    if (expectedArchiveCount === undefined || archives.length !== expectedArchiveCount) {
      throw new Error(
        `公式アーカイブ数がSSOTと不一致です: ${dataId} expected=${expectedArchiveCount ?? 'undefined'} actual=${archives.length}`
      );
    }
    if (new Set(archives.map((archive) => archive.scope)).size !== archives.length) {
      throw new Error(`R2 scopeが一意ではありません: ${dataId}`);
    }
    const bytes = archives.reduce((sum, archive) => sum + archive.sizeBytes, 0);
    totalArchives += archives.length;
    totalBytes += bytes;
    console.log(
      [
        dataId,
        versions[0],
        archives[0].format,
        archives.length,
        (bytes / 1024 / 1024).toFixed(1),
        candidate.name,
      ].join('\t')
    );
  }
  console.log(
    `PASS datasets=${targets.length} archives=${totalArchives} compressedSource=${(
      totalBytes / 1024 / 1024 / 1024
    ).toFixed(2)}GiB`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
