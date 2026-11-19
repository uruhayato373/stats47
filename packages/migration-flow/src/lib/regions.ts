import { REGIONS as AREA_REGIONS, to5DigitPrefCode } from "@stats47/area";

/**
 * 地図の外の県をまとめる地方の名前。正本 `@stats47/area` の 7 区分 (北海道・東北 / 関東 / 中部 / 近畿 / 中国 / 四国 / 九州・沖縄) を使う。
 * 2026-11-19 までは独自の 10 区分 (北陸甲信越・東海・沖縄を分ける) を県コードの表で持っていた。オーナー判断で正本に寄せた。
 */
export type Region = (typeof AREA_REGIONS)[number]["regionName"];

export const REGIONS: readonly Region[] = AREA_REGIONS.map((region) => region.regionName);

const REGION_BY_PREF_CODE = new Map<string, Region>(
  AREA_REGIONS.flatMap((region) => region.prefectures.map((code) => [code, region.regionName] as const)),
);

/** 県コード (2 桁・5 桁・市区町村コード) の地方。県でないコードは例外にする (黙って別の地方に寄せない)。 */
export function regionOf(prefCode: string): Region {
  const region = REGION_BY_PREF_CODE.get(to5DigitPrefCode(prefCode));
  if (!region) throw new Error(`地方を決められない地域コード: ${prefCode}`);
  return region;
}
