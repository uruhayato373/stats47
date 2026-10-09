import { formatValueWithPrecision } from '@stats47/utils';

/** Legend boundaries need enough precision to remain distinct after unit conversion. */
export function createLegendFormatter(
  values: number[],
  factor = 1,
  decimalPlaces?: number
): (value: number) => string {
  const unique = [...new Set(values.map((value) => value * factor))];
  // Preserve meaningful decimal boundaries, including distinct labels like 0.1 and 2.1.
  // Twelve significant digits discard floating-point calculation noise.
  const decimalPrecision = (value: number): number => {
    const [coefficient, exponent = '0'] = Number(value.toPrecision(12))
      .toString()
      .split('e');
    return Math.max(
      0,
      (coefficient.split('.')[1]?.length ?? 0) - Number(exponent)
    );
  };
  let precision =
    decimalPlaces === undefined
      ? Math.max(0, ...unique.map(decimalPrecision))
      : Math.max(0, decimalPlaces);
  const format = (value: number) =>
    formatValueWithPrecision(value, precision);
  while (precision < 20 && new Set(unique.map(format)).size < unique.length)
    precision++;
  return (value) => format(value * factor);
}
