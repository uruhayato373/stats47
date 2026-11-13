/**
 * ライセンス定義。
 * 記録の正本は台帳 `products.licenses` (data/products/packs/licenses.json + Schema)。ここは型を付けて export するだけ。
 * どのライセンスでも「テンプレート・shape・SVG・元データ単体の再販売 / 再配布」は禁止 (resale: false)。
 */
import type { LicenseDefinition } from "./types";
import data from "../../../../data/products/packs/licenses.json";

/** 有効なライセンス ID の union。 */
export type LicenseId = keyof typeof data.licenses;

export const LICENSE_REGISTRY = Object.fromEntries(
  Object.entries(data.licenses).map(([id, license]) => [id, { id, ...license }]),
) as { [K in LicenseId]: LicenseDefinition };

/** 有効なライセンス ID 一覧。 */
export const LICENSE_IDS: readonly string[] = Object.keys(LICENSE_REGISTRY);
