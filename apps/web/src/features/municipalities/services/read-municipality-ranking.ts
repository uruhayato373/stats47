import 'server-only';

import { cache } from 'react';

import {
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
