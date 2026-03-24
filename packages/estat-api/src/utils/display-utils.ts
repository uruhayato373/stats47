/**
 * 表示単位を決定
 */
export function determineDisplayUnit(
  propUnit?: string,
  dataUnit?: string
): string | undefined {
  return propUnit || dataUnit;
}
