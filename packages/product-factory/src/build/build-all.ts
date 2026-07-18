/**
 * 全商品の一括ビルド。共有ジオメトリで ALL_PRODUCTS を順に生成する。
 * データは共通デモ (日本人人口 2024・実データ)。形式・枠組み・販売文で差別化する。
 */
import { loadPrefectureGeometry, JAPAN_CLIP } from "../maps/prefecture-geometry";
import { ALL_PRODUCTS } from "../catalog/products";
import { JAPANESE_POPULATION_2024 } from "../data/datasets/japanese-population";
import { buildProduct, type ProductBuildResult } from "./build-product";
import type { Dataset } from "../data/dataset";
import type { ProductDefinition } from "../catalog/types";

/** 商品 → デモデータセット。現状は全商品を日本人人口 2024 (実データ) で生成する。 */
export function resolveDataset(_product: ProductDefinition): Dataset {
  return JAPANESE_POPULATION_2024;
}

export interface BuildAllOptions {
  readonly version?: string;
  readonly outRoot?: string;
  readonly generatedAt?: string;
  readonly onProgress?: (done: number, total: number, res: ProductBuildResult) => void;
}

export async function buildAll(opts: BuildAllOptions = {}): Promise<ProductBuildResult[]> {
  const geo = loadPrefectureGeometry(1000, JAPAN_CLIP);
  const results: ProductBuildResult[] = [];
  let done = 0;
  for (const product of ALL_PRODUCTS) {
    const res = await buildProduct(product, resolveDataset(product), {
      version: opts.version,
      outRoot: opts.outRoot,
      generatedAt: opts.generatedAt,
      geo,
    });
    results.push(res);
    done += 1;
    opts.onProgress?.(done, ALL_PRODUCTS.length, res);
  }
  return results;
}
