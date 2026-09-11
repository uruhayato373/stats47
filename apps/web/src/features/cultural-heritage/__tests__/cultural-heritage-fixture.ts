import { lookupArea } from '@stats47/area';
import { CULTURAL_HERITAGE_SOURCE as source } from '@stats47/data-configs/theme-catalog';

import type { CulturalHeritageSnapshot } from '../lib/cultural-heritage-snapshot';
/** Synthetic names/addresses; tests require no local or remote observations. */
export function culturalHeritageFixture(): CulturalHeritageSnapshot {
  return {
    schemaVersion: 1,
    seriesKey: source.seriesKey,
    scope: source.scope,
    observedDate: source.observedDate,
    generatedAt: '2026-09-11T00:00:00.000Z',
    source: {
      title: source.title,
      url: source.url,
      factsSha256: source.factsSha256,
      rawManifestSha256: 'a'.repeat(64),
    },
    records: Object.entries(source.recordPrefectures)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([id, codes]) => {
        const officialUrl = `${source.detailUrlPrefix}${id}`;
        const geo = (
          source.geographyEvidence as Readonly<
            Record<
              string,
              { url: string; sha256?: string; basis: string; pdfPage?: number }
            >
          >
        )[id];
        const supplement = geo && geo.url !== officialUrl ? geo : null;
        return {
          id,
          name: `検査用文化財${id}`,
          kinds: source.categories
            .filter((category) =>
              (category.recordIds as readonly string[]).includes(id)
            )
            .map((category) => category.key),
          rawPrefecture:
            codes.length === 0
              ? '地域を定めない'
              : codes.length > 1
                ? '２県以上'
                : lookupArea(codes[0])!.areaName,
          location: (source.missingLocationIds as readonly string[]).includes(
            id
          )
            ? null
            : '検査用所在地',
          geography:
            codes.length === 0
              ? 'unspecified'
              : codes.length > 1
                ? 'multi-prefecture'
                : 'prefecture',
          prefectureCodes: [...codes],
          officialUrl,
          evidence: [
            {
              url: officialUrl,
              sha256: 'a'.repeat(64),
              retrievedAt: '2026-09-10T15:30:00+00:00',
              basis:
                '名称・種別1/2・所在都道府県・所在地（市区町村）欄を照合。' +
                (id === '3081'
                  ? '同ページの青森・秋田両県にまたがる説明の事実から県帰属を確認。'
                  : ''),
            },
            ...(supplement
              ? [
                  {
                    url: supplement.url,
                    sha256: supplement.sha256!,
                    retrievedAt: '2026-09-10T15:30:00+00:00',
                    basis: supplement.basis,
                    ...(supplement.pdfPage
                      ? { pdfPage: supplement.pdfPage }
                      : {}),
                  },
                ]
              : []),
          ],
        };
      }),
  };
}
