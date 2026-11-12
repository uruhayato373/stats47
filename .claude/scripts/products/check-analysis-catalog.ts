/** 全有料商品の分析計画・原典参照・図・再利用関係を通信なしで検査する。 */
import path from 'node:path';
import fs from 'node:fs';
import { datasetPath } from '../../../config/datasets.mjs';
import { assertDatasetShape } from '../lib/dataset-shape.mjs';
import { readAnalysisCatalog } from '../../../packages/product-factory/src/analysis/catalog-files';
import { validateAnalysisCatalog } from '../../../packages/product-factory/src/analysis/validate-catalog';

const ROOT = path.resolve(__dirname, '../../..');
const { products, context } = readAnalysisCatalog(ROOT);
assertDatasetShape('metrics.analysis-source-variants', JSON.parse(fs.readFileSync(path.join(ROOT, datasetPath('metrics.analysis-source-variants')), 'utf8')));
for (const product of products) assertDatasetShape('products.landings', product);
const errors = validateAnalysisCatalog(products, context);
if (errors.length) throw Error(errors.join('\n'));
console.log(`Product analysis catalog PASS: ${products.length} paid products, ${products.filter(product => product.analysisRevision).length} revisions; metric/scope/source/recipe/reuse references.`);
