import type { GeographicLevel } from "./types";
import { to5DigitPrefCode } from "../../../area/src/utils/prefecture-code";
import { NATIONAL_AREA_CODE, PREFECTURE_AREA_CODE_RE, PREFECTURE_CODE_2DIGIT_RE } from "../../../area/src/constants/prefecture-codes";

declare const areaCodeKind: unique symbol;
/** Codes receive these types only after format validation. */
export type OpenDataPrefectureCode = string & { readonly [areaCodeKind]: "prefecture" };
export type OpenDataMunicipalityCode = string & { readonly [areaCodeKind]: "municipality" };
type AreaCodes = {
  prefecture: OpenDataPrefectureCode;
  municipality: OpenDataMunicipalityCode;
  national: typeof NATIONAL_AREA_CODE;
} & Record<Exclude<GeographicLevel, "prefecture" | "municipality" | "national">, string>;
type NormalizedArea = { [L in GeographicLevel]: { readonly areaLevel: L; readonly areaCode: AreaCodes[L] } }[GeographicLevel];
const MUNICIPALITY_CODE_RE = new RegExp(`^${PREFECTURE_CODE_2DIGIT_RE.source.slice(1, -1)}(?!000$)[0-9]{3}$`);

/** Reuse the area package's canonical prefecture conversion; never map prefectures locally. */
export function normalizeOpenDataArea<L extends GeographicLevel>(areaLevel: L, input: string): { readonly areaLevel: L; readonly areaCode: AreaCodes[L] } {
  let code = input.trim();
  if (areaLevel === "prefecture") {
    if (!/^(?:[0-9]{1,2}|[0-9]{4,5})$/.test(code)) throw Error("Invalid prefecture code");
    code = to5DigitPrefCode(code);
    if (!PREFECTURE_AREA_CODE_RE.test(code)) throw Error("Invalid prefecture code");
  } else if (areaLevel === "national") {
    if (!/^0{1,5}$/.test(code)) throw Error("Invalid national code");
    code = NATIONAL_AREA_CODE;
  } else if (areaLevel === "municipality") {
    // Six-digit local-government input includes a trailing check digit; output never does.
    if (/^[0-9]{6}$/.test(code)) code = code.slice(0, 5);
    if (!MUNICIPALITY_CODE_RE.test(code)) throw Error("Invalid municipality code");
  } else if (!code) throw Error("Empty area code");
  return { areaLevel, areaCode: code as AreaCodes[L] };
}

export type OpenDataNormalizedRow = NormalizedArea & {
  readonly time: string;
  readonly dims: Readonly<Record<string, string>>;
  readonly value: number;
  readonly unit: string;
};

export interface OpenDataNormalizedTable {
  readonly datasetId: string;
  readonly version: string;
  readonly table: string;
  readonly columns: readonly (keyof OpenDataNormalizedRow)[];
  readonly rows: readonly OpenDataNormalizedRow[];
  readonly provenance: { readonly manifestKey: string; readonly manifestSha256: string; readonly recipeSha256: string };
}

/** Runtime Schema for derived tables; stored beside the type, not as a new ledger. */
export const OPEN_DATA_NORMALIZED_TABLE_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["datasetId", "version", "table", "columns", "rows", "provenance"],
  properties: {
    datasetId: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 },
    table: { type: "string", minLength: 1 },
    columns: { const: ["areaCode", "areaLevel", "time", "dims", "value", "unit"] },
    rows: {
      type: "array", minItems: 1,
      items: {
        type: "object", additionalProperties: false,
        required: ["areaCode", "areaLevel", "time", "dims", "value", "unit"],
        properties: {
          areaCode: { type: "string", minLength: 1 }, areaLevel: { type: "string" },
          time: { type: "string", minLength: 1 },
          dims: { type: "object", additionalProperties: { type: "string" } },
          value: { type: "number" }, unit: { type: "string", minLength: 1 },
        },
        oneOf: [
          { properties: { areaLevel: { const: "prefecture" }, areaCode: { pattern: PREFECTURE_AREA_CODE_RE.source } } },
          { properties: { areaLevel: { const: "municipality" }, areaCode: { pattern: MUNICIPALITY_CODE_RE.source } } },
          { properties: { areaLevel: { const: "national" }, areaCode: { const: NATIONAL_AREA_CODE } } },
          { properties: { areaLevel: { enum: ["district", "mesh", "point", "line", "polygon"] } } },
        ],
      },
    },
    provenance: {
      type: "object", additionalProperties: false,
      required: ["manifestKey", "manifestSha256", "recipeSha256"],
      properties: {
        manifestKey: { type: "string", minLength: 1 },
        manifestSha256: { type: "string", pattern: "^[a-f0-9]{64}$" },
        recipeSha256: { type: "string", pattern: "^[a-f0-9]{64}$" },
      },
    },
  },
} as const;
