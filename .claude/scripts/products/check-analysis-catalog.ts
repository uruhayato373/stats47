/** 全有料商品の分析計画・原典参照・図・再利用関係を通信なしで検査する。 */
import path from 'node:path';
import fs from 'node:fs';
import { datasetPath } from '../../../config/datasets.mjs';
import { assertDatasetShape } from '../lib/dataset-shape.mjs';
import { readAnalysisCatalog } from '../../../packages/product-factory/src/analysis/catalog-files';
import { validateAnalysisCatalog } from '../../../packages/product-factory/src/analysis/validate-catalog';
import { recipeShowcaseMetadata, resolveAnalysisReuse } from '../../../packages/product-factory/src/analysis/reuse';
import { ANALYSIS_PREVIEWS } from '../../../apps/web/src/features/products/analysis-previews.generated';

const ROOT = path.resolve(__dirname, '../../..');
const { products, context } = readAnalysisCatalog(ROOT);
assertDatasetShape('metrics.analysis-source-variants', JSON.parse(fs.readFileSync(path.join(ROOT, datasetPath('metrics.analysis-source-variants')), 'utf8')));
for (const product of products) assertDatasetShape('products.landings', product);
const errors = validateAnalysisCatalog(products, context);
// CIにも原票は不要。テーマ改訂時に未公開LPだけ古い見出し・章のまま残ることを止める。
for (const product of products.filter(item => item.analysisRevision || item.analysisReuse)) {
  const expected = product.analysisRevision ? product.analysisRevision.recipes.map(recipeShowcaseMetadata) :
    resolveAnalysisReuse(product, products).map(selection => selection.metadata);
  const actual = ANALYSIS_PREVIEWS.find(item => item.id === product.productId)?.showcase
    ?.filter(section => section.kind === 'chart')
    .map(({ id, heading, lead, note, themeRefs }) => ({ id, heading, lead, note, themeRefs }));
  if (JSON.stringify(expected) !== JSON.stringify(actual)) errors.push(`${product.productId}: 改訂案の作成例・テーマ参照が古くなっています (products:analysis:build)`);
}
if (errors.length) throw Error(errors.join('\n'));
console.log(`Product analysis catalog PASS: ${products.length} paid products, ${products.filter(product => product.analysisRevision || product.analysisReuse).length} revisions; metric/scope/source/recipe/reuse references.`);
