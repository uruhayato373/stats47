/**
 * ピアソン相関係数と散布図データの純粋関数
 */

export interface PearsonResult {
  r: number;
}

export interface MatchedPearsonResult extends PearsonResult {
  count: number;
}

export interface RankValueWithArea {
  areaCode: string;
  areaName: string;
  value: number;
}

/**
 * ピアソン相関係数を計算する
 * r = (nΣxy - ΣxΣy) / √((nΣx² - (Σx)²)(nΣy² - (Σy)²))
 *
 * @param xValues - X軸の値配列
 * @param yValues - Y軸の値配列（xValues と同長であること）
 * @returns 相関係数 r (-1.0 ~ +1.0) とデータポイント数。データ不足・分散0の場合は r=0
 */
export function calculatePearsonR(
  xValues: number[],
  yValues: number[]
): PearsonResult {
  const n = Math.min(xValues.length, yValues.length);
  if (n < 2) {
    return { r: 0 };
  }

  const x = xValues.slice(0, n);
  const y = yValues.slice(0, n);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denomX = n * sumX2 - sumX * sumX;
  const denomY = n * sumY2 - sumY * sumY;
  const denominator = Math.sqrt(denomX * denomY);

  if (denominator === 0) {
    return { r: 0 };
  }

  const r = numerator / denominator;
  const clamped = Math.max(-1, Math.min(1, r));
  return { r: clamped };
}

/**
 * X行とYのvalue mapをareaCodeで照合し、配列やscatter objectを作らずPearson rを計算する。
 * X側に同一areaCodeの複数行がある場合もbuildScatterDataと同じ順序・件数で集計するため、
 * 既存snapshotの計算意味を変えずに大量metric pairの一時allocationを抑えられる。
 */
export function calculateMatchedPearsonR(
  xRows: Iterable<Pick<RankValueWithArea, 'areaCode' | 'value'>>,
  yByKey: ReadonlyMap<string, number>
): MatchedPearsonResult {
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  for (const xRow of xRows) {
    const x = xRow.value;
    const y = yByKey.get(xRow.areaCode);
    if (y === undefined) continue;
    count++;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }
  if (count < 2) return { r: 0, count };
  const numerator = count * sumXY - sumX * sumY;
  const denomX = count * sumX2 - sumX * sumX;
  const denomY = count * sumY2 - sumY * sumY;
  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return { r: 0, count };
  return {
    r: Math.max(-1, Math.min(1, numerator / denominator)),
    count,
  };
}

/**
 * 偏相関係数を計算する
 * r(AB|Z) = (r(AB) - r(AZ)*r(BZ)) / sqrt((1-r(AZ)²)(1-r(BZ)²))
 */
export function calculatePartialR(
  rAB: number,
  rAZ: number,
  rBZ: number
): number | null {
  const denominator = Math.sqrt((1 - rAZ * rAZ) * (1 - rBZ * rBZ));
  if (denominator === 0) return null;
  return Math.max(-1, Math.min(1, (rAB - rAZ * rBZ) / denominator));
}

export interface ScatterDataPoint {
  areaCode: string;
  areaName: string;
  x: number;
  y: number;
}

/**
 * X軸・Y軸のランキングデータを areaCode でマッチングし、散布図用のデータポイント配列を生成する
 *
 * @param xData - X軸のデータ（都道府県ごとの値）
 * @param yData - Y軸のデータ（都道府県ごとの値）
 * @returns 両方に存在する areaCode のみの ScatterDataPoint[]（x, y の順序は揃う）
 */
export function buildScatterData(
  xData: RankValueWithArea[],
  yData: RankValueWithArea[]
): ScatterDataPoint[] {
  const yByArea = new Map(
    yData.map((d) => [d.areaCode, { areaName: d.areaName, value: d.value }])
  );
  const points: ScatterDataPoint[] = [];

  for (const x of xData) {
    const yEntry = yByArea.get(x.areaCode);
    if (yEntry == null) continue;
    points.push({
      areaCode: x.areaCode,
      areaName: x.areaName,
      x: x.value,
      y: yEntry.value,
    });
  }

  return points;
}
