import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE,
  BUSINESS_PLAN_M1_ANALYSES,
} from '../src/business-plan';
import type { BusinessPlanM1Analysis } from '../src/business-plan';

interface EvidenceManifest {
  schemaVersion: number;
  generatedAt: string;
  quality: {
    detailAreas: number;
    conservationChecks: number;
    sourceRecords: number;
    derivedRecords: number;
    maxDetailBytes: number;
  };
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const outputPath = path.join(
  repoRoot,
  '.local/geo-content-pipeline/items.json'
);
const legacyPublicStagingPath = path.join(
  repoRoot,
  '.local/r2/app/geo/content-pipeline/items.json'
);
const analyses = new Map<string, BusinessPlanM1Analysis>(
  BUSINESS_PLAN_M1_ANALYSES.map((analysis) => [analysis.id, analysis])
);

function sha256(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const items = BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE.map((content) => {
  const analysis = analyses.get(content.analysisId);
  if (!analysis) throw new Error(`analysis not found: ${content.analysisId}`);

  let evidence = null;
  if (analysis.evidenceManifestKey) {
    const manifestPath = path.join(
      repoRoot,
      '.local/r2',
      analysis.evidenceManifestKey
    );
    if (!fs.existsSync(manifestPath)) {
      throw new Error(
        `evidence manifest missing: ${analysis.evidenceManifestKey}`
      );
    }
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8')
    ) as EvidenceManifest;
    if (
      manifest.quality.detailAreas !== 47 ||
      manifest.quality.conservationChecks !== 47
    ) {
      throw new Error(
        `evidence gate failed: ${analysis.slug} detail=${manifest.quality.detailAreas} conservation=${manifest.quality.conservationChecks}`
      );
    }
    evidence = {
      manifestKey: analysis.evidenceManifestKey,
      sha256: sha256(manifestPath),
      generatedAt: manifest.generatedAt,
      quality: manifest.quality,
    };
  }

  return {
    ...content,
    analysisKind: analysis.analysisKind,
    metricKeys: analysis.metricKeys,
    sourceLayers: analysis.sourceLayers,
    spatialOperations: analysis.spatialOperations,
    aggregateKey: analysis.r2Key ?? null,
    evidence,
    publicationReady:
      content.free.status === 'ready' &&
      (analysis.analysisKind === 'baseline' || evidence !== null),
  };
});

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'packages/data-configs/src/business-plan/geo-content-lifecycle.ts',
  summary: {
    contents: items.length,
    publicationReady: items.filter((item) => item.publicationReady).length,
    evidenceComplete: items.filter((item) => item.evidence !== null).length,
    themeConnections: items.reduce(
      (sum, item) => sum + item.themeKeys.length,
      0
    ),
    paidProducts: items.length,
  },
  items,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
if (fs.existsSync(legacyPublicStagingPath)) {
  fs.rmSync(legacyPublicStagingPath);
}
console.log(
  `✅ Geo content pipeline: ${path.relative(repoRoot, outputPath)} (${items.length} contents)`
);
