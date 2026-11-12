import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { datasetDir } from '../../../config/datasets.mjs';
import {
  KAKEI_ANALYSES,
  validateKakeiAnalyses,
} from '../src/kakei-analysis-catalog';
import { METRICS_REGISTRY } from '../src/registry';
import { metricSourceReferences } from '../src/metric-linkage';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const pages = new Map<string, { published: boolean }>();
// 日本全体のテーマ (japan-theme) は 2026-11-12 に全国のテーマへまとめた。分析の置き場は theme:<テーマ> を指す
for (const kind of ['ranking', 'theme', 'survey']) {
  const file = path.join(root, datasetDir('content.pages'), `${kind}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    pages: { id: string; published: boolean }[];
  };
  for (const page of data.pages) pages.set(page.id, page);
}
const metrics = new Map(
  Object.values(METRICS_REGISTRY)
    .filter((metric) => metric.source.kind === 'kakei-chousa')
    .flatMap((metric) => {
      const ref = metricSourceReferences(metric).find(
        (source) => source.role === 'primary'
      );
      return ref
        ? [
            [
              metric.key,
              {
                statsDataId: ref.statsDataId,
                filters: ref.filters,
                latestYear:
                  metric.years === 'all'
                    ? Number.POSITIVE_INFINITY
                    : metric.years && 'years' in metric.years
                      ? Math.max(...metric.years.years)
                      : (metric.years?.to ?? 0),
              },
            ] as const,
          ]
        : [];
    })
);
const errors = validateKakeiAnalyses(KAKEI_ANALYSES, { pages, metrics });
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  const configured = KAKEI_ANALYSES.filter(
    (row) => row.placement.state === 'configured'
  ).length;
  const staged = KAKEI_ANALYSES.filter(
    (row) => row.placement.state === 'staged'
  ).length;
  const published = KAKEI_ANALYSES.filter(
    (row) => row.placement.state === 'published'
  ).length;
  console.log(
    `家計調査の分析単位の台帳: ${KAKEI_ANALYSES.length}件、既存指標に配線済み${configured}、全国の図で公開済み${published}、ローカル生成済み${staged}、制作候補${KAKEI_ANALYSES.length - configured - published - staged}。参照・粒度・重複検査 PASS`
  );
  if (process.argv.includes('--list'))
    for (const row of KAKEI_ANALYSES)
      console.log(
        [
          row.id,
          row.source.statsDataId,
          row.source.geography,
          row.source.axis,
          row.evidence,
          row.placement.state,
          row.placement.pageId,
        ].join('\t')
      );
}
