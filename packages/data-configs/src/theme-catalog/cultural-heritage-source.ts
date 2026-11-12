import data from '../../../../data/themes/sources/cultural-heritage.json';
import { pinLiterals } from './source-literals';

const CATEGORY_KEYS = pinLiterals('cultural-heritage', 'categories[].key', data.categories.map((category) => category.key), [
  'special-historic',
  'special-scenic',
  'special-natural',
]);

/** 種別のキーは、スナップショットの検査と表示の絞り込みが型として使う */
type CulturalHeritageSource = Omit<typeof data, 'categories'> & {
  categories: ((typeof data.categories)[number] & { key: (typeof CATEGORY_KEYS)[number] })[];
};

/**
 * Fixed scope and source identity; observations are R2 snapshots.
 * 記録の正本は台帳 `themes.sources` (data/themes/sources/cultural-heritage.json + Schema)。
 */
export const CULTURAL_HERITAGE_SOURCE = data as CulturalHeritageSource;
