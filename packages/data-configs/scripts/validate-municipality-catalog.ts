import { buildMunicipalityEntityPolicy } from '@stats47/area';

import {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  KNOWN_MUNICIPALITY_THEME_SLUGS,
  listMunicipalityMetricAvailability,
  validateMunicipalityCatalogs,
} from '../src/geo-scope';

const errors = validateMunicipalityCatalogs();
const entityPolicy = buildMunicipalityEntityPolicy();
const availability = listMunicipalityMetricAvailability();

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        entityPolicyKey: entityPolicy.key,
        sourceEntities: entityPolicy.entities.length,
        publishableEntities: entityPolicy.entities.filter(
          (entity) => entity.disposition === 'publishable'
        ).length,
        candidateMetrics: availability.length,
        publishedRankingKeys: KNOWN_MUNICIPALITY_RANKING_KEYS.size,
        publishedThemeSlugs: KNOWN_MUNICIPALITY_THEME_SLUGS.size,
      },
      null,
      2
    )
  );
}
