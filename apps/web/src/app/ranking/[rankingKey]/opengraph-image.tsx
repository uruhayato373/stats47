import { ImageResponse } from 'next/og';

import { readRankingItemFromR2, readRankingValuesFromR2 } from '@stats47/ranking/server';
import { isOk } from '@stats47/types';

import { loadOgpFonts } from '@/features/ogp/font-loader';
import { RankingOgp, type RankingOgpData } from '@/features/ogp/RankingOgp';

export const alt = 'ランキング';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 604800; // 7d

export default async function OGImage({
  params,
}: {
  params: Promise<{ rankingKey: string }>;
}) {
  const { rankingKey } = await params;

  const itemResult = await readRankingItemFromR2(rankingKey, 'prefecture').catch(() => null);
  const item = itemResult && isOk(itemResult) ? itemResult.data : null;

  if (!item) {
    const fallback: RankingOgpData = {
      title: 'ランキング',
      unit: '',
      source: 'e-Stat',
      top3: [],
    };
    return new ImageResponse(<RankingOgp data={fallback} />, {
      ...size,
      fonts: await loadOgpFonts(),
    });
  }

  const latestYear = item.availableYears?.[item.availableYears.length - 1]?.yearCode ?? '';
  const valuesResult = latestYear
    ? await readRankingValuesFromR2(rankingKey, 'prefecture', latestYear).catch(() => null)
    : null;
  const values = valuesResult && isOk(valuesResult) ? valuesResult.data : [];

  const sorted = [...values]
    .filter((v) => v.value !== null)
    .sort((a, b) => a.rank - b.rank);

  const top3 = sorted.slice(0, 3).map((v) => ({
    rank: v.rank,
    name: v.areaName,
    value: v.value as number,
  }));
  const last = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  const source = item.source?.name ?? 'e-Stat';

  const data: RankingOgpData = {
    title: item.seoTitle ?? item.title,
    unit: item.unit,
    source,
    top3,
    last: last
      ? { rank: last.rank, name: last.areaName, value: last.value as number }
      : null,
  };

  return new ImageResponse(<RankingOgp data={data} />, {
    ...size,
    fonts: await loadOgpFonts(),
  });
}
