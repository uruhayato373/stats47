import 'server-only';

import {
  buildMunicipalityEntityPolicy,
  listPublishableMunicipalities,
  listSpecialWardCodes,
} from '@stats47/area';

let cache: ReadonlySet<string> | null = null;
let comparableCache: ReadonlySet<string> | null = null;

/** 東京の特別区のコード。分類は公開方針 (`@stats47/area`) だけが持ち、地域マスタはサーバーでだけ読む */
export function getSpecialWardCodes(): ReadonlySet<string> {
  cache ??= listSpecialWardCodes(buildMunicipalityEntityPolicy());
  return cache;
}

/** ランキングの比較対象の自治体 (市町村と特別区。行政区と特別区部を除く) のコード */
export function getComparableMunicipalityCodes(): ReadonlySet<string> {
  comparableCache ??= new Set(
    listPublishableMunicipalities(buildMunicipalityEntityPolicy()).map((entity) => entity.code)
  );
  return comparableCache;
}
