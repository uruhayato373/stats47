import { buildElement } from './blog-thumbnail-render';

export function buildRankingOgpFallbackElement(options: {
  title: string;
  latestYearName: string;
}) {
  return buildElement(
    {
      title: options.title,
      subtitle: options.latestYearName
        ? `都道府県ランキング（${options.latestYearName}）`
        : '都道府県ランキング',
      category: 'RANKING',
      domainPath: 'stats47.jp/ranking',
    },
    false
  );
}
