/** SSDSの都道府県表から廃置分合処理済みの市区町村表を解決する。 */
export function prefToCityStatsDataId(prefId: string): string | null {
  if (/^000002(02|03)\d{2}$/.test(prefId)) return prefId;
  const match = /^0000010([12])(\d{2})$/.exec(prefId);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 11) return null;
  return `0000020${match[1] === '1' ? '2' : '3'}${match[2]}`;
}
