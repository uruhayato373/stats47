import { permanentRedirect } from 'next/navigation';

import { POPULATION_BASELINE_RANKING_PATH } from '@/config/geo-redirects';

export default function LegacyPopulation2050GeoPage() {
  permanentRedirect(POPULATION_BASELINE_RANKING_PATH);
}
