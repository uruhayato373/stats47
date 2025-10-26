/**
 * Geoshapeドメイン - TopoJSON変換ユーティリティ
 * TopoJSONの妥当性検証を提供
 */

import type { TopoJSONTopology } from "../types/index";

// ============================================================================
// TopoJSONの妥当性を検証（validate動詞）
// ============================================================================

/**
 * TopoJSON の妥当性を検証
 * @param topology TopoJSONトポロジー
 * @returns 妥当性チェック結果
 */
export function validateTopojson(
  topology: unknown
): topology is TopoJSONTopology {
  if (topology === null || typeof topology !== "object") {
    return false;
  }

  const obj = topology as Record<string, unknown>;

  return (
    obj.type === "Topology" &&
    obj.objects &&
    typeof obj.objects === "object" &&
    Array.isArray(obj.arcs)
  );
}
