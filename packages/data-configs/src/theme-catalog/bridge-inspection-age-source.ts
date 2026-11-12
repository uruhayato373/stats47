import data from '../../../../data/themes/sources/bridge-inspection-age.json';
import { pinLiterals } from './source-literals';

const BAND_KEYS = pinLiterals('bridge-inspection-age', 'bands[].key', data.bands.map((band) => band.key), [
  '0-9',
  '10-19',
  '20-29',
  '30-39',
  '40-49',
  '50-plus',
  'unknown',
]);
const SOURCE_IDS = pinLiterals('bridge-inspection-age', 'sources[].id', data.sources.map((source) => source.id), [
  'mlit',
  'highway',
  'local',
]);

/** 年数の帯のキーと管理者の id は、スナップショットの検査と表示が添字の型として使う */
type BridgeInspectionAgeSource = Omit<typeof data, 'bands' | 'sources'> & {
  bands: ((typeof data.bands)[number] & { key: (typeof BAND_KEYS)[number] })[];
  sources: ((typeof data.sources)[number] & { id: (typeof SOURCE_IDS)[number] })[];
};

/**
 * Authored definition. Observations are generated from the three SHA-pinned public XLSX files.
 * 記録の正本は台帳 `themes.sources` (data/themes/sources/bridge-inspection-age.json + Schema)。
 */
export const BRIDGE_INSPECTION_AGE_SOURCE = data as BridgeInspectionAgeSource;
