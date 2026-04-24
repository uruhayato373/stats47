"use server";

import { fetchPrefectureTopology } from "@stats47/gis/geoshape";

import type { TopoJSONTopology } from "@stats47/types";

/**
 * 都道府県 TopoJSON を取得するサーバーアクション
 *
 * ランキング詳細ページのコロプレスマップで使用する。
 *
 * クライアント経由で取得する理由（LCP 改善、T1-PSI-LCP-01 / EXP-002）:
 * Server Component で取得して Client Component に prop として渡すと、Next.js が
 * HTML に JSON シリアライズして埋め込むため 1 ページあたり ~1.2MB の HTML が配信され
 * mobile LCP が 12s になっていた。クライアントから呼ぶ形に変えることで HTML から
 * TopoJSON を除去し、地図セクションのみ非同期ロードする。
 */
export async function fetchPrefectureTopologyAction(): Promise<TopoJSONTopology | null> {
  try {
    return await fetchPrefectureTopology();
  } catch {
    return null;
  }
}
