/** Catalog-order partition contract shared by inventory, writer and future readers. */
import { to2DigitPrefCode } from '@stats47/area';
const REQUEST_LIMIT = 100_000;
/** Owner decision 2026-11-14: the single default for stored rows per file. */
export const DEFAULT_TABLE_FILE_ROW_LIMIT = 50_000;
type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected JSON object");
  return value as JsonObject;
}

function array(value: unknown): unknown[] {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

function string(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function safeProduct(values: readonly number[]): number {
  return values.reduce((product, n) => {
    const result = product * n;
    if (!Number.isSafeInteger(n) || n < 0 || !Number.isSafeInteger(result)) throw new Error("Unsafe cardinality");
    return result;
  }, 1);
}

export interface Axis {
  id: string;
  name: string | null;
  codes: string[];
}

/** CLASS singleton and array forms are equivalent; repeated codes are not extra coordinates. */
export function readAxes(classObjects: unknown): Axis[] {
  const axes = array(classObjects).map((value) => {
    const co = object(value);
    const id = string(co["@id"]);
    if (!id || !/^(tab|cat\d+|area|time)$/.test(id)) throw new Error(`Unknown axis: ${id}`);
    const codes = array(co.CLASS).map((entry) => {
      const code = object(entry)["@code"];
      if (typeof code !== "string" || !code) throw new Error(`Missing string code: ${id}`);
      return code;
    });
    if (codes.length === 0) throw new Error(`Empty axis: ${id}`);
    return { id, name: string(co["@name"]), codes: [...new Set(codes)] };
  });
  if (!axes.length || new Set(axes.map((axis) => axis.id)).size !== axes.length) throw new Error("Missing/duplicate axes");
  return axes;
}

/** Empty area/time dimensions mean one implicit coordinate, not zero data rows. */
export function countSlices(axes: readonly Axis[], prefDim: string | null = null) {
  if (prefDim && !axes.some((axis) => axis.id === prefDim)) throw new Error(`Missing region axis: ${prefDim}`);
  if (prefDim === "tab" || prefDim === "time") throw new Error(`Invalid region axis: ${prefDim}`);
  const regionAxes = axes.filter((axis) => axis.id === "area" || axis.id === prefDim);
  const timeAxes = axes.filter((axis) => axis.id === "time");
  const sliceAxes = axes.filter((axis) => axis.id !== "area" && axis.id !== "time" && axis.id !== prefDim);
  const cardinality = (items: readonly Axis[]) => safeProduct(items.map((axis) => new Set(axis.codes).size));
  const sliceCount = cardinality(sliceAxes);
  const regionCount = cardinality(regionAxes);
  const timeCount = cardinality(timeAxes);
  const rowsPerSliceEstimate = safeProduct([regionCount, timeCount]);
  const rowCountEstimate = safeProduct([sliceCount, rowsPerSliceEstimate]);
  return {
    sliceAxes: sliceAxes.map((axis) => axis.id),
    regionAxes: regionAxes.map((axis) => axis.id),
    implicitRegion: regionAxes.length === 0,
    implicitTime: timeAxes.length === 0,
    sliceCount, regionCount, timeCount, rowsPerSliceEstimate, rowCountEstimate,
    wholeTableRequestsEstimate: Math.ceil(rowCountEstimate / REQUEST_LIMIT),
    requestsPerSliceEstimate: Math.ceil(rowsPerSliceEstimate / REQUEST_LIMIT),
    fetchStrategy: rowCountEstimate <= REQUEST_LIMIT ? "丸ごと" as const : "軸で分ける" as const,
  };
}

/** Inclusive `cdAreaFrom`/`cdAreaTo` request range; whole prefectures only (owner decision 2026-11-15). */
export interface AreaRange { from: string; to: string; codeCount: number }

/** Preserve CLASS_OBJ order and literal codes (including leading zeroes and '#'). */
export function makeSliceKey(statsDataId: string, axes: readonly Axis[], codes: Record<string, string>, depth: number, prefDim: string | null = null,
  areaRange: AreaRange | null = null): string {
  if (!/^\d{10}$/.test(statsDataId)) throw new Error("Invalid statsDataId");
  const eligible = countSlices(axes, prefDim).sliceAxes;
  if (!Number.isInteger(depth) || depth < 0 || depth > eligible.length) throw new Error("Invalid partition depth");
  const sliceAxes = eligible.slice(0, depth);
  if (Object.keys(codes).some((id) => !sliceAxes.includes(id))) throw new Error("Unexpected slice axis");
  const parts = sliceAxes.map((id) => {
    const code = codes[id];
    if (!code || /[\/\\\u0000-\u001f]/.test(code)) throw new Error(`Unsafe/missing code: ${id}`);
    if (!axes.find((axis) => axis.id === id)?.codes.includes(code)) throw new Error(`Unknown code: ${id}=${code}`);
    return `${id}=${code}`;
  });
  if (areaRange) {
    if (!/^\d{5}$/.test(areaRange.from) || !/^\d{5}$/.test(areaRange.to) || areaRange.from > areaRange.to) throw new Error("Invalid area range");
    parts.push(`area=${areaRange.from}-${areaRange.to}`);
  }
  return `estat-tables/${statsDataId}/data/${parts.length ? parts.join("/") : "all"}.json.gz`;
}

/** Smallest prefix depth whose dense per-file grid fits; never split region/time. */
export function planTablePartitions(axes: readonly Axis[], prefDim: string | null = null, rowLimit = DEFAULT_TABLE_FILE_ROW_LIMIT) {
  if (!Number.isSafeInteger(rowLimit) || rowLimit < 1) throw new Error("Invalid row limit");
  const counts = countSlices(axes, prefDim);
  const eligible = axes.filter((axis) => counts.sliceAxes.includes(axis.id));
  let depth = 0;
  let fileCount = 1;
  let maxRowsPerFileEstimate = counts.rowCountEstimate;
  while (maxRowsPerFileEstimate > rowLimit && depth < eligible.length) {
    fileCount = safeProduct([fileCount, new Set(eligible[depth].codes).size]);
    depth++;
    maxRowsPerFileEstimate = counts.rowCountEstimate / fileCount;
  }
  const base = { depth, partitionAxes: eligible.slice(0, depth).map((axis) => axis.id), rowLimit };
  if (maxRowsPerFileEstimate <= rowLimit || counts.regionAxes.join() !== "area") {
    return { ...base, fileCount, maxRowsPerFileEstimate, fitsRowLimit: maxRowsPerFileEstimate <= rowLimit };
  }
  // Every non-region axis is exhausted: pack whole prefectures (first two code digits) in code order.
  const areaRanges = packAreaRanges(axes.find((axis) => axis.id === "area")!.codes, maxRowsPerFileEstimate / counts.regionCount, rowLimit);
  if (!areaRanges) return { ...base, fileCount, maxRowsPerFileEstimate, fitsRowLimit: false };
  const rowsPerArea = maxRowsPerFileEstimate / counts.regionCount;
  const largest = Math.max(...areaRanges.map((range) => range.codeCount)) * rowsPerArea;
  return { ...base, fileCount: safeProduct([fileCount, areaRanges.length]), maxRowsPerFileEstimate: largest,
    fitsRowLimit: largest <= rowLimit, areaRanges };
}

/** Null when codes are not 5-digit or one prefecture alone exceeds the limit. */
export function packAreaRanges(codes: readonly string[], rowsPerArea: number, rowLimit: number): AreaRange[] | null {
  const sorted = [...new Set(codes)].sort();
  if (sorted.some((code) => !/^\d{5}$/.test(code))) return null;
  const prefectures = new Map<string, string[]>();
  for (const code of sorted) {
    const prefCode = to2DigitPrefCode(code);
    prefectures.set(prefCode, [...prefectures.get(prefCode) ?? [], code]);
  }
  const ranges: AreaRange[] = [];
  let current: string[] = [];
  for (const group of prefectures.values()) {
    if (group.length * rowsPerArea > rowLimit) return null;
    if (current.length && (current.length + group.length) * rowsPerArea > rowLimit) {
      ranges.push({ from: current[0], to: current[current.length - 1], codeCount: current.length });
      current = [];
    }
    current = [...current, ...group];
  }
  if (current.length) ranges.push({ from: current[0], to: current[current.length - 1], codeCount: current.length });
  return ranges;
}
