/**
 * 全商品カタログの結合バレル。
 * 各 family ファイル (asset..entry) を A→L 順に連結して ALL_PRODUCTS を作る。
 * family ファイルは 1 file = 1 family で編集競合を避ける (Phase 1 の並列作成方針)。
 */
import type { ProductDefinition } from "../types";
import { ASSET_PRODUCTS } from "./asset";
import { POWERPOINT_PRODUCTS } from "./powerpoint";
import { EXCEL_PRODUCTS } from "./excel";
import { DATA_PRODUCTS } from "./data";
import { INDUSTRY_PRODUCTS } from "./industry";
import { GOVERNMENT_PRODUCTS } from "./government";
import { MEDIA_PRODUCTS } from "./media";
import { EDUCATION_PRODUCTS } from "./education";
import { CONSUMER_PRODUCTS } from "./consumer";
import { SERVICE_PRODUCTS } from "./service";
import { LICENSE_PRODUCTS } from "./license";
import { ENTRY_PRODUCTS } from "./entry";

export {
  ASSET_PRODUCTS,
  POWERPOINT_PRODUCTS,
  EXCEL_PRODUCTS,
  DATA_PRODUCTS,
  INDUSTRY_PRODUCTS,
  GOVERNMENT_PRODUCTS,
  MEDIA_PRODUCTS,
  EDUCATION_PRODUCTS,
  CONSUMER_PRODUCTS,
  SERVICE_PRODUCTS,
  LICENSE_PRODUCTS,
  ENTRY_PRODUCTS,
};

/** レビュー A-01〜L-07 の全商品定義 (A→L / 連番昇順)。 */
export const ALL_PRODUCTS: readonly ProductDefinition[] = [
  ...ASSET_PRODUCTS,
  ...POWERPOINT_PRODUCTS,
  ...EXCEL_PRODUCTS,
  ...DATA_PRODUCTS,
  ...INDUSTRY_PRODUCTS,
  ...GOVERNMENT_PRODUCTS,
  ...MEDIA_PRODUCTS,
  ...EDUCATION_PRODUCTS,
  ...CONSUMER_PRODUCTS,
  ...SERVICE_PRODUCTS,
  ...LICENSE_PRODUCTS,
  ...ENTRY_PRODUCTS,
];
