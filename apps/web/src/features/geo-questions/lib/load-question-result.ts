import 'server-only';

import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

/** build-geo-questions.ts の出力 (R2 app/geo/questions/<slug>.json) */
export interface GeoQuestionResult {
  readonly slug: string;
  readonly generatedAt: string;
  readonly unitOfArea: 'municipality' | 'prefecture';
  readonly measure: { readonly label: string; readonly unit: string; readonly note: string };
  readonly groups: readonly { code: string; label: string; color: string; count: number }[];
  readonly years: readonly number[];
  readonly series: Readonly<Record<string, readonly (number | null)[]>>;
  readonly areas: Readonly<Record<string, string>>;
  readonly names: Readonly<Record<string, string>>;
  readonly points: readonly { name: string; lon: number; lat: number; year: number }[];
  readonly conservation: { readonly areasWithData: number; readonly grouped: number; readonly note: string };
  readonly inputs: readonly string[];
}

export async function loadGeoQuestionResult(slug: string): Promise<GeoQuestionResult | null> {
  try {
    const result = await fetchFromR2AsJson<GeoQuestionResult>(`app/geo/questions/${slug}.json`);
    return result?.slug === slug && Array.isArray(result.years) ? result : null;
  } catch {
    return null;
  }
}
