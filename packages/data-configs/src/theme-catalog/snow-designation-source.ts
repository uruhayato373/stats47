import data from '../../../../data/themes/sources/snow-designation.json';
import { pinLiterals } from './source-literals';

const [SLUG, DATA_VERSION] = pinLiterals('snow-designation', 'slug・dataVersion', [data.slug, data.dataVersion], [
  'population-snow-designation',
  'A22-16_m250r6-24_PTN2020_center-v1',
]);

/** Geo 分析の詳細の判別 (slug) と版の照合に、読み手がリテラル型を使う */
type SnowDesignationSource = Omit<typeof data, 'slug' | 'dataVersion'> & {
  slug: typeof SLUG;
  dataVersion: typeof DATA_VERSION;
};

/**
 * Official fixed inputs and reference documents; observations are derived, not authored here.
 * 記録の正本は台帳 `themes.sources` (data/themes/sources/snow-designation.json + Schema)。
 */
export const SNOW_DESIGNATION_SOURCE = data as SnowDesignationSource;
