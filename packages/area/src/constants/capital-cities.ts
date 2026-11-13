import capitals from '../../../../data/areas/master/capital-cities.json';

/** 県庁所在市の名称と家計調査の原地域コードはJSON台帳を正本とする。 */
export const PREFECTURE_CAPITAL_CITIES: readonly {
  prefectureCode: string; name: string; estatAreaCode: string;
}[] = capitals;

export const PREFECTURE_CAPITAL_CITY_NAMES: Readonly<Record<string, string>> =
  Object.fromEntries(PREFECTURE_CAPITAL_CITIES.map(area => [area.prefectureCode, area.name]));
