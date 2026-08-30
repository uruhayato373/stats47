import type { GeoAnalysisSnapshot } from './geo-cross-analysis';

export interface GeoDecisionRow {
  readonly areaCode: string;
  readonly areaName: string;
  readonly population2050: number;
  readonly populationChangeRate: number;
  readonly landPriceChange: number;
  readonly medianResidentialLandPrice: number;
  readonly floodExposurePopulation: number;
  readonly floodExposureShare: number;
  readonly stationAccessPopulation: number;
  readonly stationAccessShare: number;
}

const EXPECTED_PREFECTURES = 47;

function numberValue(
  values: Readonly<Record<string, number | null>>,
  key: string,
): number | null {
  const value = values[key];
  return typeof value === 'number' ? value : null;
}

/** 3つの空間分析を都道府県コードで結び、1県を横断して読むモデルを作る。 */
export function buildGeoDecisionRows(
  landPrice: GeoAnalysisSnapshot,
  floodRisk: GeoAnalysisSnapshot,
  stationAccess: GeoAnalysisSnapshot,
): readonly GeoDecisionRow[] {
  const floodByCode = new Map(
    floodRisk.rows.map((row) => [row.areaCode, row] as const),
  );
  const stationByCode = new Map(
    stationAccess.rows.map((row) => [row.areaCode, row] as const),
  );

  const rows = landPrice.rows.flatMap((landRow) => {
    const floodRow = floodByCode.get(landRow.areaCode);
    const stationRow = stationByCode.get(landRow.areaCode);
    if (!floodRow || !stationRow) return [];

    const population2050 = numberValue(landRow.values, 'population2050');
    const populationChangeRate = numberValue(
      landRow.values,
      'populationChangeRate',
    );
    const landPriceChange = numberValue(
      landRow.values,
      'medianLandPriceChange',
    );
    const medianResidentialLandPrice = numberValue(
      landRow.values,
      'medianResidentialLandPrice',
    );
    const floodExposurePopulation = numberValue(
      floodRow.values,
      'exposedPopulation2050',
    );
    const floodExposureShare = numberValue(
      floodRow.values,
      'floodExposureShare2050',
    );
    const stationAccessPopulation = numberValue(
      stationRow.values,
      'accessiblePopulation2050',
    );
    const stationAccessShare = numberValue(
      stationRow.values,
      'stationAccessShare2050',
    );

    if (
      population2050 === null ||
      populationChangeRate === null ||
      landPriceChange === null ||
      medianResidentialLandPrice === null ||
      floodExposurePopulation === null ||
      floodExposureShare === null ||
      stationAccessPopulation === null ||
      stationAccessShare === null
    ) {
      return [];
    }

    return [
      {
        areaCode: landRow.areaCode,
        areaName: landRow.areaName,
        population2050,
        populationChangeRate,
        landPriceChange,
        medianResidentialLandPrice,
        floodExposurePopulation,
        floodExposureShare,
        stationAccessPopulation,
        stationAccessShare,
      },
    ];
  });

  if (rows.length !== EXPECTED_PREFECTURES) return [];
  return [...rows].sort((left, right) =>
    left.areaCode.localeCompare(right.areaCode),
  );
}
