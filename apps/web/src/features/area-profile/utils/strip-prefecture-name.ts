/**
 * 市区町村名から先頭の都道府県名を外す。`@stats47/area` の cityName は「奈良県 田原本町」と県名込みで、
 * 県が分かっている見出し・一覧でそのまま出すと「奈良県 奈良県 田原本町」のように重なる (2026-10-04 週次 UI 検査)。
 */
export function stripPrefectureName(cityName: string, prefName: string): string {
  const prefix = `${prefName} `;
  return cityName.startsWith(prefix) ? cityName.slice(prefix.length) : cityName;
}
