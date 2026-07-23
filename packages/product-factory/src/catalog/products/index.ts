/**
 * 全パックカタログのバレル。
 * 2026-07-23: 旧 family 別 12 ファイル (asset..entry) を廃し、テーマ別 14 パック (packs.ts) に集約。
 */
import type { ProductDefinition } from "../types";
import { PACKS } from "./packs";

export { PACKS };

/** テーマパック P-01〜P-14 の全定義。 */
export const ALL_PRODUCTS: readonly ProductDefinition[] = [...PACKS];
