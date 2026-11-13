import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { datasetDir } from '../../../../config/datasets.mjs';
import { productMetricKeys, type ProductMetricReferences } from '../product-metric-keys';
import type { MetricLinkageIndex } from '../metric-linkage';

describe('商品から指標への逆引き', () => {
  it('見本・採用・調査中の入力を一意に収集し、除外のみの参照を消費先と扱わない', () => {
    expect(productMetricKeys({
      examples: [{ metricKeys: ['population'] }],
      analysisPlan: { inputs: [
        { metricKey: 'population', decision: 'use' },
        { metricKey: 'households', decision: 'investigate' },
        { metricKey: 'excluded', decision: 'exclude' },
      ] },
      analysisRevision: { sources: [{ inputs: [{ metricKey: 'population' }, { metricKey: 'clinic' }] }] },
    })).toEqual(['clinic', 'households', 'population']);
  });
  it('全商品の台帳変更が逆引きへ反映され、改訂候補を現行LPの見本と区別する', () => {
    const root = path.resolve(__dirname, '../../../..');
    const indexDirectory = path.join(root, datasetDir('metrics.index'));
    const entries = fs.readdirSync(indexDirectory).filter(file => /^linkage-\d{3}\.json$/.test(file))
      .flatMap(file => (JSON.parse(fs.readFileSync(path.join(indexDirectory, file), 'utf8')) as MetricLinkageIndex).entries);
    const byKey = new Map(entries.map(entry => [entry.metricKey, entry]));
    const directory = path.join(root, datasetDir('products.landings'));
    for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.json'))) {
      const product = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')) as ProductMetricReferences & { productId: string };
      const examples = new Set(product.examples.flatMap(example => example.metricKeys));
      for (const metricKey of productMetricKeys(product)) expect(byKey.get(metricKey)?.consumers, `${product.productId}/${metricKey}`).toContainEqual({
        pageId: `product:data-${product.productId.toLowerCase()}`,
        kind: examples.has(metricKey) ? 'product' : 'product-analysis',
      });
    }
  });
});
