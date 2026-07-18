/**
 * MVP B-01 のビルド (汎用ビルダー buildProduct への薄いラッパー)。
 * 生成物は `.local/coconala-products/B-01/<version>/` (git 管理外)。
 */
import { ALL_PRODUCTS } from "../catalog/products";
import { JAPANESE_POPULATION_2024 } from "../data/datasets/japanese-population";
import { buildProduct, type ProductBuildOptions, type ProductBuildResult } from "./build-product";

export type BuildOptions = ProductBuildOptions;
export type BuildResult = ProductBuildResult;

export async function buildB01(opts: BuildOptions = {}): Promise<BuildResult> {
  const product = ALL_PRODUCTS.find((p) => p.id === "B-01");
  if (!product) throw new Error("B-01 が見つかりません");
  return buildProduct(product, JAPANESE_POPULATION_2024, opts);
}
