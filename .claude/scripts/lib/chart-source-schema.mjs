/**
 * ブログ図の source.json の形の検査。形の正典は config/schema/blog.chart-source.schema.json、
 * 再取得できるかの判定は chart-provenance.mjs の inspectChartSourceManifest。
 *
 * 呼び元: quality-gate.mjs (公開前) / audit-chart-axes.ts (週次)。既存の公開分は generatedBy に
 * /tmp を書いた行が残るので、検査は「source.json を新しく作る経路」と週次の集計で使う。
 */
import Ajv from 'ajv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../config/schema/blog.chart-source.schema.json');

export const CHART_SOURCE_SCHEMA = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

const validate = new Ajv({ allErrors: true }).compile(CHART_SOURCE_SCHEMA);

/** @param {unknown} manifest @returns {string[]} 形の違反。無ければ空 */
export function chartSourceShapeErrors(manifest) {
  if (validate(manifest)) return [];
  return (validate.errors ?? []).map((e) => `${e.dataPath || '/'} ${e.message}`);
}
