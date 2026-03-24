/**
 * Geoshapeドメイン - TopoJSON検証ユーティリティ
 *
 * TopoJSONの妥当性検証機能を提供。
 */

import type { TopoJSONTopology } from "@stats47/types";

/**
 * TopoJSONの妥当性を検証
 *
 * 型ガード関数として、指定されたデータが有効なTopoJSONトポロジーかどうかを判定する。
 *
 * @param topology - 検証対象のデータ
 * @returns 有効なTopoJSONトポロジーの場合 `true`、それ以外は `false`
 *
 * @example
 * ```typescript
 * const data: unknown = await fetchTopology();
 * if (validateTopojson(data)) {
 *   // data は TopoJSONTopology 型として扱える
 * }
 * ```
 */
export function validateTopojson(
  topology: unknown
): topology is TopoJSONTopology {
  if (topology === null || typeof topology !== "object") {
    return false;
  }

  const obj = topology as Record<string, unknown>;

  return (
    (obj.type === "Topology" &&
      obj.objects !== null &&
      typeof obj.objects === "object" &&
      Array.isArray(obj.arcs)) as boolean
  );
}
