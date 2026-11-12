import fs from 'node:fs';
import path from 'node:path';
import { buildMunicipalityEntityPolicy, listPublishableMunicipalities, PREFECTURE_AREA_CODES } from '@stats47/area';
import { METRICS_REGISTRY } from '@stats47/data-configs/registry';
import { datasetDir, datasetPath } from '../../../../config/datasets.mjs';
import type { SourceVariant } from './catalog';
import type { AnalysisCatalogContext, AnalysisCatalogProduct } from './validate-catalog';
import { NOTE_PRODUCT_MAPPINGS } from '../channels/note/product-note-mapping';

/** CLIとCIが同じ台帳集合を読み、新商品を固定リストから取りこぼさない。 */
export function readAnalysisCatalog(root: string): { products: AnalysisCatalogProduct[]; context: AnalysisCatalogContext } {
  const read = (id: string) => JSON.parse(fs.readFileSync(path.join(root, datasetPath(id)), 'utf8'));
  const directory = path.join(root, datasetDir('products.landings'));
  const products = fs.readdirSync(directory).filter(file => file.endsWith('.json')).sort()
    .map(file => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')) as AnalysisCatalogProduct);
  const packs = read('products.packs').packs as Record<string, { price: { initialYen: number } }>;
  const standalone = read('products.standalone-note').products as { id: string; articleKey: string }[];
  const articles = read('note.articles').articles as { key: string; isPaid?: boolean }[];
  const analyses = read('content.analyses').analyses as { id: string }[];
  const figures = read('content.figures').figures as { id: string; analysis: string }[];
  return { products, context: {
    registry: METRICS_REGISTRY,
    variants: read('metrics.analysis-source-variants').variants as SourceVariant[],
    paidProductIds: [...Object.entries(packs).filter(([, pack]) => pack.price.initialYen > 0).map(([id]) => id), ...standalone.map(product => product.id)],
    articleKeysByProduct: new Map([...NOTE_PRODUCT_MAPPINGS.map(mapping => [mapping.productId, mapping.canonicalSlug] as const), ...standalone.map(product => [product.id, product.articleKey] as const)]),
    paidArticleKeys: new Set(articles.filter(article => article.isPaid).map(article => article.key)),
    analysisIds: new Set(analyses.map(analysis => analysis.id)),
    figures: new Map(figures.map(figure => [figure.id, figure])),
    areaCodes: {
      prefecture: new Set(PREFECTURE_AREA_CODES),
      municipality: new Set(listPublishableMunicipalities(buildMunicipalityEntityPolicy()).map(area => area.code)),
    },
  } };
}
