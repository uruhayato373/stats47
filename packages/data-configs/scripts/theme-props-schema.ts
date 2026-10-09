import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { REPO_ROOT } from './_lib';
import { generateTypeSchemas } from './metric-schema';
import { datasetPath } from '../../../config/datasets.mjs';

const schemaPath = resolve(REPO_ROOT, datasetPath('themes.catalog-schema'));
const types = {
  'line-chart': 'LineChartComponentProps',
  'mixed-chart': 'MixedChartComponentProps',
  'composition-chart': 'CompositionChartComponentProps',
  'donut-chart': 'DonutChartComponentProps',
  'cpi-profile': 'CpiChartComponentProps',
  'cpi-heatmap': 'CpiChartComponentProps',
  'pyramid-chart': 'PyramidChartComponentProps',
  'kpi-card': 'KpiChartComponentProps',
  'markdown-section': 'MarkdownChartComponentProps',
};

/** Keep JSON authoring and runtime component types on the same strict props contract. */
export function checkThemePropsSchema(check: boolean): void {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const definitions = generateTypeSchemas(
    'packages/data-configs/src/theme-catalog/stat-series-ref.ts',
    [...new Set(Object.values(types))]
  );
  const clauses = Object.entries(types).map(([componentType, type]) => ({
    if: {
      properties: { componentType: { const: componentType } },
      required: ['componentType'],
    },
    then: { properties: { componentProps: definitions[type] } },
  }));
  if (check) {
    if (
      JSON.stringify(schema.definitions.chart.allOf) !== JSON.stringify(clauses)
    )
      throw new Error('Stale theme props schema. Run metrics:generate-schema.');
  } else {
    schema.definitions.chart.allOf = clauses;
    const content = JSON.stringify(schema, null, 2) + '\n';
    if (readFileSync(schemaPath, 'utf8') !== content)
      writeFileSync(schemaPath, content);
  }
}
