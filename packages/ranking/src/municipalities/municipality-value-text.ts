import { formatReadableMagnitude, formatUnitForDisplay, parseUnit } from '@stats47/data-configs/unit';

/** これより小さい値は万・億に寄せず、桁区切りで書く (「1万人」ではなく「10,352人」) */
const MAGNITUDE_MIN_BASE_VALUE = 100_000;
/** 単位名を値の後ろに付けると読めない無次元の単位 (「1.48指数」) */
const DIMENSIONLESS_UNITS: ReadonlySet<string> = new Set(['指数', '倍']);

function plain(value: number): string {
  return value.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
}

/**
 * 市区町村ランキング・市区町村ページの title・説明文・要約で値を書く (MUNI-TITLE-MAGNITUDE-01・2026-10-28)。
 *
 * 共通の整形 (formatReadableMagnitude) は万の位に寄せて小数 1 桁で丸めるので、札幌市の出生数 10,352 人が「1万人」、
 * 財政力指数 1.48 が「1.48指数」になっていた。共通の整形はほかの面でも使うので変えず、市区町村の文だけ
 * 10 万未満を桁区切りで書き、無次元の単位は付けない。換算 (百万円 → 万円など) は共通の整形のまま。
 */
export function formatMunicipalityValueText(value: number, unit: string): string {
  if (DIMENSIONLESS_UNITS.has(unit.trim())) return plain(value);
  const parsed = parseUnit(unit);
  if (parsed.baseUnit && !parsed.hasDenominator) {
    const base = value * 10 ** parsed.scaleExponent;
    if (Math.abs(base) < MAGNITUDE_MIN_BASE_VALUE && parsed.scaleExponent === 0) {
      return `${plain(base)}${formatUnitForDisplay(unit)}`;
    }
  }
  return formatReadableMagnitude(value, unit);
}
