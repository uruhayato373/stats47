import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BUSINESS_PLAN_M1_ANALYSES,
  BUSINESS_PLAN_M1_X_POSTS,
} from '../src/business-plan';
import type { BusinessPlanM1Analysis } from '../src/business-plan/types';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const outputPath = path.join(
  repoRoot,
  '.local/r2/sns/_queue/business-plan-m1-x.json'
);

const analysesById = new Map<string, BusinessPlanM1Analysis>(
  BUSINESS_PLAN_M1_ANALYSES.map((analysis) => [analysis.id, analysis])
);

const queue = BUSINESS_PLAN_M1_X_POSTS.map((post) => ({
  key: post.contentKey,
  template: post.template,
  category: 'population',
  title: post.title,
  geoRole: post.geoRole,
  analysisIds: post.analysisIds,
  analyses: post.analysisIds.map((analysisId) => {
    const analysis = analysesById.get(analysisId);
    if (!analysis) throw new Error(`未定義のGeo分析です: ${analysisId}`);
    return {
      id: analysis.id,
      slug: analysis.slug,
      title: analysis.title,
      analysisKind: analysis.analysisKind,
      r2Key: analysis.r2Key,
      sourceName: analysis.sourceName,
      sourceLayers: analysis.sourceLayers,
      spatialOperations: analysis.spatialOperations,
      metricKeys: analysis.metricKeys,
    };
  }),
  claimMetricKey: post.claimMetricKey,
  caption: post.caption,
  scheduledAt: post.scheduledAt,
  imageKind: post.imageKind,
  mediaKey: post.mediaKey,
  mediaPath: post.mediaPath,
  visual: post.visual,
  canonicalUrl: post.canonicalUrl,
  campaign: post.campaign,
  domain: 'geo',
  metricKeys: post.metricKeys,
}));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
console.log(
  `✅ M1 X queue: ${path.relative(repoRoot, outputPath)} (${queue.length}件)`
);
