import { buildMunicipalityEntityPolicy, resolveWardModeAreas, type WardMode } from "@stats47/area";

import { fetchMunicipalityTopology } from "../geoshape/services";
import { deriveWardModeTopology } from "./utils/ward-mode-topology";

import type { TopoJSONTopology } from "@stats47/types";

let mergeGroupsCache: ReadonlyMap<string, readonly string[]> | null = null;

function mergedGroups(): ReadonlyMap<string, readonly string[]> {
  mergeGroupsCache ??= resolveWardModeAreas(buildMunicipalityEntityPolicy(), "merged").mergeGroups;
  return mergeGroupsCache;
}

/**
 * 県内の市区町村の地図を、政令指定都市の見せ方 (`WardMode`) に合わせて返す (MUNI-DESIGNATED-CITY-WARDS-01)。
 *
 * 元は R2 の分割版だけ (`fetchMunicipalityTopology(pref, "split")`)。`merged` は分割版から行政区を親の市へまとめて作り、
 * 東京の特別区はまとめない。地図の部品は `"merged" | "split"` の境界ファイルを直接選ばず、これを呼ぶ。
 */
export async function fetchMunicipalityTopologyForWardMode(
  prefCode: string,
  mode: WardMode
): Promise<TopoJSONTopology> {
  const split = await fetchMunicipalityTopology(prefCode, "split");
  return mode === "split" ? split : deriveWardModeTopology(split, mergedGroups());
}
