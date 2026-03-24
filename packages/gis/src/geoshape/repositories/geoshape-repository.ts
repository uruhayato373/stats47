/**
 * Geoshapeドメイン - リポジトリ
 *
 * 注意: logger は外部から注入される必要があるため、このパッケージでは logger に依存しない。
 * ログ記録は呼び出し側で行う。
 */

import { fetchFromExternalAPI } from "../adapters";

import type { GeoshapeOptions } from "../types/index";
import type { TopoJSONTopology } from "@stats47/types";

/**
 * TopoJSONデータを取得
 */
export async function fetchTopology(
  options: GeoshapeOptions
): Promise<TopoJSONTopology> {
  const data = await fetchFromExternalAPI(options);
  return data;
}
