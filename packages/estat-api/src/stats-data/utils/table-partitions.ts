/** Catalog-order partition contract shared by inventory, writer and future readers. */
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

/** Preserve CLASS_OBJ order and literal codes (including leading zeroes and '#'). */
export function makeSliceKey(statsDataId: string, axes: readonly Axis[], codes: Record<string, string>, depth: number, prefDim: string | null = null): string {
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
  return { depth, partitionAxes: eligible.slice(0, depth).map((axis) => axis.id),
    rowLimit, fileCount, maxRowsPerFileEstimate, fitsRowLimit: maxRowsPerFileEstimate <= rowLimit };
}
