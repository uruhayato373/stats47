import 'server-only';

import { buildMunicipalityEntityPolicy, listSpecialWardCodes } from '@stats47/area';

let cache: ReadonlySet<string> | null = null;

/** 東京の特別区のコード。分類は公開方針 (`@stats47/area`) だけが持ち、地域マスタはサーバーでだけ読む */
export function getSpecialWardCodes(): ReadonlySet<string> {
  cache ??= listSpecialWardCodes(buildMunicipalityEntityPolicy());
  return cache;
}
