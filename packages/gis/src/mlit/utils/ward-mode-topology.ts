import * as topojsonClient from "topojson-client";

import type { TopoJSONGeometry, TopoJSONTopology } from "@stats47/types";

/** 国土数値情報 N03 の行政区域コード (5 桁) */
const CODE_PROPERTY = "N03_007";
/** N03 で政令指定都市の行政区の行に入る市の名前 (区の名前は N03_004) */
const DESIGNATED_CITY_NAME_PROPERTY = "N03_003";

function codeOf(geometry: TopoJSONGeometry): string {
  return String(geometry.properties?.[CODE_PROPERTY] ?? "");
}

/**
 * 分割版の市区町村の地図から、政令指定都市を市全体の 1 つの形にまとめた地図を作る
 * (2026-10-28 MUNI-DESIGNATED-CITY-WARDS-01)。
 *
 * これまで使っていた自前の統合版 (`<県>_city_dc.topojson`) は東京 23 区も「特別区部」13100 の 1 つにまとめていたので、
 * 区ごとのランキングを塗ると 23 区が灰色になった。統合版を別ファイルとして持たず、R2 の分割版 1 つを元にして
 * `mergeGroups` (親 → 行政区。`@stats47/area` の resolveWardModeAreas が決める) のとおりにだけまとめる。
 * まとめた形の境界は分割版と同じ arc を使う (topojson-client の mergeArcs) ので、隣の市町村との境目がずれない。
 *
 * `mergeGroups` が空なら入力をそのまま返す (split)。子が 1 つも地図に無い親は作らない。
 */
export function deriveWardModeTopology(
  split: TopoJSONTopology,
  mergeGroups: ReadonlyMap<string, readonly string[]>
): TopoJSONTopology {
  if (mergeGroups.size === 0) return split;
  const parentOfChild = new Map<string, string>();
  for (const [parent, children] of mergeGroups) {
    for (const child of children) parentOfChild.set(child, parent);
  }

  const objects: TopoJSONTopology["objects"] = {};
  for (const [name, collection] of Object.entries(split.objects)) {
    const kept: TopoJSONGeometry[] = [];
    const childrenByParent = new Map<string, TopoJSONGeometry[]>();
    for (const geometry of collection.geometries) {
      const parent = parentOfChild.get(codeOf(geometry));
      if (!parent) {
        kept.push(geometry);
        continue;
      }
      childrenByParent.set(parent, [...(childrenByParent.get(parent) ?? []), geometry]);
    }
    for (const [parent, children] of childrenByParent) {
      const merged = topojsonClient.mergeArcs(
        split as unknown as Parameters<typeof topojsonClient.mergeArcs>[0],
        children as unknown as Parameters<typeof topojsonClient.mergeArcs>[1]
      );
      const first = children[0]!.properties ?? {};
      kept.push({
        type: merged.type,
        arcs: merged.arcs as TopoJSONGeometry["arcs"],
        properties: {
          ...first,
          [CODE_PROPERTY]: parent,
          N03_004: first[DESIGNATED_CITY_NAME_PROPERTY] ?? parent,
        },
      });
    }
    objects[name] = { type: "GeometryCollection", geometries: kept };
  }
  return { ...split, objects };
}
