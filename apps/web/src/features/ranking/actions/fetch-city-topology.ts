"use server";

import { fetchAllCitiesTopology } from "@stats47/gis/geoshape";

import type { TopoJSONTopology } from "@stats47/types";

/**
 * 全国市区町村 TopoJSON を取得するサーバーアクション
 *
 * 市区町村コロプレスマップ表示時にクライアントから呼び出す。
 * 都道府県トグル → 市区町村トグル切替時にオンデマンドで取得する。
 */
export async function fetchCityTopologyAction(): Promise<TopoJSONTopology | null> {
  try {
    return await fetchAllCitiesTopology();
  } catch {
    return null;
  }
}
