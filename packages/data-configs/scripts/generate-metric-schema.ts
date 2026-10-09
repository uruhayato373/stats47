import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { checkMetricSchema, METRIC_SCHEMA_PATH } from './metric-schema';
import { checkThemePropsSchema } from './theme-props-schema';
mkdirSync(dirname(METRIC_SCHEMA_PATH), { recursive: true });
checkMetricSchema(process.argv.includes('--check'));
checkThemePropsSchema(process.argv.includes('--check'));
console.log('Metric schema matches the authoritative TypeScript contract.');
