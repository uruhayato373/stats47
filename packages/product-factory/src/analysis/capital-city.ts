import { PREFECTURE_CAPITAL_CITIES } from '@stats47/area';

/** 家計調査の原地域コード・都市名を地域SSOTから読む。県コードへ変換しない。 */
export function listCapitalCityAreas(): { code: string; name: string; prefectureCode: string }[] {
  return PREFECTURE_CAPITAL_CITIES.map(({ prefectureCode, name, estatAreaCode }) => ({
    code: estatAreaCode,
    name, prefectureCode,
  }));
}

/** 原典の地域名を照合し、符号体系の変更や北九州市との取り違えを止める。 */
export function assertCapitalCityMetadata(classes: readonly { '@code': string; '@name': string }[]): void {
  const byCode = new Map(classes.map(item => [item['@code'], item['@name']]));
  for (const area of listCapitalCityAreas()) {
    if (byCode.get(area.code)?.replace(/^\d{5}\s+/, '') !== area.name)
      throw Error(`県庁所在市の原典地域が一致しません: ${area.code}/${area.name}`);
  }
}
