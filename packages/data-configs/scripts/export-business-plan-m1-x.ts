import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BUSINESS_PLAN_M1_X_POSTS } from '../src/business-plan';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const outputPath = path.join(
  repoRoot,
  '.local/r2/sns/_queue/business-plan-m1-x.json'
);

const queue = BUSINESS_PLAN_M1_X_POSTS.map((post) => ({
  key: post.contentKey,
  template: post.template,
  category: 'population',
  title: post.title,
  caption: post.caption,
  scheduledAt: post.scheduledAt,
  imageKind: post.imageKind,
  mediaKey: post.mediaKey,
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
