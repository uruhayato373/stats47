/** 商品の指標参照を台帳から抽出する。取得・描画・商品packageには依存しない。 */
export interface ProductMetricReferences {
  examples: readonly { metricKeys: readonly string[] }[];
  analysisPlan: { inputs: readonly { metricKey: string; decision: 'use' | 'investigate' | 'exclude' }[] };
  analysisRevision?: { sources: readonly { inputs: readonly { metricKey: string }[] }[] };
}

export function productMetricKeys(product: ProductMetricReferences): string[] {
  return [...new Set([
    ...product.examples.flatMap(example => example.metricKeys),
    ...product.analysisPlan.inputs.filter(input => input.decision !== 'exclude').map(input => input.metricKey),
    ...(product.analysisRevision?.sources.flatMap(source => source.inputs.map(input => input.metricKey)) ?? []),
  ])].sort();
}
