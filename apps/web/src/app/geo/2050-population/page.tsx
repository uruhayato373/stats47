import { permanentRedirect } from 'next/navigation';

import { POPULATION_BASELINE_RANKING_PATH } from '@/config/geo-redirects';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '2050年人口増減率ランキングへ移動',
  alternates: { canonical: POPULATION_BASELINE_RANKING_PATH },
  robots: { index: false, follow: true },
};

export default function LegacyPopulation2050GeoPage() {
  permanentRedirect(POPULATION_BASELINE_RANKING_PATH);
}
