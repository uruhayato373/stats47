import { buildExternalCard } from './external-card-render';

export function buildRankingOgpFallbackElement(options: {
  title: string;
  latestYearName: string;
}) {
  return buildExternalCard({title:options.title,eyebrow:'都道府県ランキング',detail:options.latestYearName?`${options.latestYearName} · stats47`:'stats47'});
}
