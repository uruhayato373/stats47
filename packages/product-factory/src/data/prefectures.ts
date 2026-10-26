/**
 * 47 都道府県マスタ (Reference)。地図・データは**都道府県コードで結合**し、名称文字列をキーにしない。
 * 名称・地方区分・色は `@stats47/area` (prefectures.json / REGIONS) から導出する (独自の表を持たない)。
 * `@stats47/area` は workspace の node_modules 経由で tsx 単体実行でも解決できる。
 */
import {
  fetchPrefectures,
  PREFECTURE_TO_REGION_MAP,
  REGIONS as AREA_REGIONS,
  to2DigitPrefCode,
} from "@stats47/area";

export type RegionCode =
  | "hokkaido_tohoku"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kyushu";

export interface Prefecture {
  /** 5 桁コード (estat-api.md 準拠。例 "01000")。 */
  readonly code5: string;
  /** 2 桁コード (topojson N03_007 と一致。例 "01")。 */
  readonly code2: string;
  readonly name: string;
  readonly region: RegionCode;
}

export interface RegionDef {
  readonly code: RegionCode;
  readonly name: string;
  readonly color: string;
  readonly prefCodes5: readonly string[];
}

const REGION_CODES: readonly RegionCode[] = [
  "hokkaido_tohoku",
  "kanto",
  "chubu",
  "kinki",
  "chugoku",
  "shikoku",
  "kyushu",
];

function asRegionCode(code: string | undefined): RegionCode {
  const found = REGION_CODES.find((c) => c === code);
  if (!found) throw new Error(`未知の地方区分: ${code}`);
  return found;
}

/** 地方ブロック (A-04 地方ブロック別地図の色分け根拠)。 */
export const REGIONS: readonly RegionDef[] = AREA_REGIONS.map((r) => ({
  code: asRegionCode(r.regionCode),
  name: r.regionName,
  color: r.color,
  prefCodes5: [...r.prefectures],
}));

export const PREFECTURES: readonly Prefecture[] = fetchPrefectures().map((p) => ({
  code2: to2DigitPrefCode(p.prefCode),
  code5: p.prefCode,
  name: p.prefName,
  region: asRegionCode(PREFECTURE_TO_REGION_MAP[p.prefCode]),
}));

/** 47 県の 5 桁コード (昇順)。データ整合検証の基準集合。 */
export const PREFECTURE_CODES5: readonly string[] = PREFECTURES.map((p) => p.code5);

export const PREFECTURE_BY_CODE5: ReadonlyMap<string, Prefecture> = new Map(
  PREFECTURES.map((p) => [p.code5, p]),
);

/** 任意のコード表記 ("1" / "01" / "01000") を 5 桁へ正規化する。範囲外は throw。 */
export function toCode5(input: string | number): string {
  const s = String(input).trim();
  if (/^\d{5}$/.test(s)) {
    if (!PREFECTURE_BY_CODE5.has(s)) throw new Error(`未知の都道府県コード: ${input}`);
    return s;
  }
  const n = Number.parseInt(s, 10);
  const code5 = Number.isFinite(n) && n >= 1 ? `${String(n).padStart(2, "0")}000` : "";
  if (!PREFECTURE_BY_CODE5.has(code5)) throw new Error(`都道府県コードが不正: ${input}`);
  return code5;
}

/** 任意のコード表記を 2 桁 (topojson N03_007) へ正規化する。 */
export function toCode2(input: string | number): string {
  return toCode5(input).slice(0, 2);
}
