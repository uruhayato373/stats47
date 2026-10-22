import 'server-only';

import { cache } from 'react';

import {
  readMunicipalityRankingAiContent,
  readMunicipalityRankingItem,
  readMunicipalityRankingValues,
} from '@stats47/ranking/server';

/** item と values をまとめて読む。generateMetadata とページ本体の重複 fetch を request scope で dedupe する。 */
export const readMunicipalityRanking = cache(async (rankingKey: string) => {
  const [item, values] = await Promise.all([
    readMunicipalityRankingItem(rankingKey),
    readMunicipalityRankingValues(rankingKey),
  ]);
  return { item, values };
});

/** 解説 (MUNI-AI-CONTENT-01)。読めない・形が違うときは null にしてランキング本体は出す。 */
export async function readMunicipalityRankingCommentary(rankingKey: string) {
  return readMunicipalityRankingAiContent(rankingKey).catch(() => null);
}
