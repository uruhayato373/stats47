import data from '../../../../data/themes/sources/landslide-exposure.json';
import { pinLiterals } from './source-literals';

const [SLUG, DATA_VERSION] = pinLiterals('landslide-exposure', 'slug・dataVersion', [data.slug, data.dataVersion], [
  'population-landslide-exposure',
  'A33-25_m250r6-24_PTN2020_P05-22_center-v1',
]);

type Prefecture = (typeof data.prefectures)[number];
type PublishedField = 'bytes' | 'sha256' | 'members';

/**
 * Geo 分析の詳細の判別 (slug) と版の照合に、読み手がリテラル型を使う。県は、原典ファイルを持つ県
 * (bytes・sha256・members がある) と持たない県の 2 つの形を `'sha256' in p` で分ける
 */
type LandslideExposureSource = Omit<typeof data, 'slug' | 'dataVersion' | 'prefectures'> & {
  slug: typeof SLUG;
  dataVersion: typeof DATA_VERSION;
  prefectures: (Omit<Prefecture, PublishedField> | (Omit<Prefecture, PublishedField> & Required<Pick<Prefecture, PublishedField>>))[];
};

/**
 * Authored source definitions; observations are generated into canonical R2 artifacts.
 * 記録の正本は台帳 `themes.sources` (data/themes/sources/landslide-exposure.json + Schema)。
 */
export const LANDSLIDE_EXPOSURE_SOURCE = data as LandslideExposureSource;
