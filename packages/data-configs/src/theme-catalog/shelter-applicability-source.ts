import data from '../../../../data/themes/sources/shelter-applicability.json';
import { pinLiterals } from './source-literals';

const HAZARD_KEYS = pinLiterals('shelter-applicability', 'hazards[].key', data.hazards.map((hazard) => hazard.key), [
  'flood',
  'landslide',
  'storm-surge',
  'earthquake',
  'tsunami',
  'large-fire',
  'inland-flood',
  'volcanic',
]);

/** 災害種別のキーは、スナップショットの件数を引く添字の型として使う */
type ShelterApplicabilitySource = Omit<typeof data, 'hazards'> & {
  hazards: ((typeof data.hazards)[number] & { key: (typeof HAZARD_KEYS)[number] })[];
};

/**
 * GSI public snapshot contract. Counts are source-cohort validation pins.
 * 記録の正本は台帳 `themes.sources` (data/themes/sources/shelter-applicability.json + Schema)。
 */
export const SHELTER_APPLICABILITY_SOURCE = data as ShelterApplicabilitySource;
