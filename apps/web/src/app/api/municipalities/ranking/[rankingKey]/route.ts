/**
 * 市区町村ランキングの全行 (全国版ページの「すべて表示」と絞り込み用)。
 *
 *   /api/municipalities/ranking/<rankingKey> → { rankingKey, yearCode, unit, values }
 *
 * 全国版ページの HTML は上位 50 件だけを持ち、51 位以下と自治体名・都道府県の絞り込みは
 * 利用者が操作したときにブラウザがこの JSON を 1 回だけ読んで行う。絞り込みの条件は URL に載せないので、
 * 指標ごとに 1 URL でキャッシュできる (?pref= / ?page= をクローラーが総なめにしてページを毎回描画していた)。
 * R2 (storage.stats47.jp) は CORS ヘッダを返さないため、同一オリジンで返す。
 */
import { KNOWN_MUNICIPALITY_RANKING_KEYS } from "@stats47/data-configs/geo-scope";
import { readMunicipalityRankingValues } from "@stats47/ranking/server";

import { NO_STORE_CACHE_HEADERS, PUBLIC_DATA_CACHE_HEADERS } from "@/lib/cache-policy";

// revalidate を付けた route handler は 404 も保存し、R2 の一時失敗が 1 日固着しうる。200 の保持は応答ヘッダ (edge 1 日) に任せる。
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ rankingKey: string }> },
) {
  const { rankingKey } = await params;
  if (!KNOWN_MUNICIPALITY_RANKING_KEYS.has(rankingKey)) {
    return new Response("not found", { status: 404, headers: NO_STORE_CACHE_HEADERS });
  }

  const snapshot = await readMunicipalityRankingValues(rankingKey).catch(() => null);
  if (!snapshot) {
    return new Response("not found", { status: 404, headers: NO_STORE_CACHE_HEADERS });
  }

  return Response.json(
    {
      rankingKey: snapshot.rankingKey,
      yearCode: snapshot.yearCode,
      unit: snapshot.unit,
      values: snapshot.values,
    },
    // edge 1 日は全国版ページ (HTML) の保持と揃える。年度更新後に上位 50 件と全行 JSON で年度が食い違う期間を短くするため。
    { headers: PUBLIC_DATA_CACHE_HEADERS },
  );
}
