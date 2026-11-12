import data from '../../../../data/themes/sources/depopulated-settlements.json';
import { pinLiterals } from './source-literals';

const CATEGORY_KEYS = pinLiterals(
  'depopulated-settlements',
  'categories[].key',
  data.categories.map((category) => category.key),
  [
    'age65Share0',
    'age65Share1to19',
    'age65Share20to39',
    'age65Share40to49',
    'age65Share50to69',
    'age65Share70plus',
    'unknownAgeShare',
  ],
);

/** 区分のキーは、スナップショットの集落数の項目を引く添字の型として使う */
type DepopulatedSettlementsSource = Omit<typeof data, 'categories'> & {
  categories: ((typeof data.categories)[number] & { key: (typeof CATEGORY_KEYS)[number] })[];
};

/**
 * Source identity and the official survey geography (figure 1-5, rightmost column).
 * 記録の正本は台帳 `themes.sources` (data/themes/sources/depopulated-settlements.json + Schema)。
 */
export const DEPOPULATED_SETTLEMENTS_SOURCE = data as DepopulatedSettlementsSource;
