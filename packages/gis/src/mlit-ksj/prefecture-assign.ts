/**
 * KSJ feature → 都道府県コードの帰属解決。
 *
 * ## なぜこのモジュールがあるか
 *
 * 旧実装 (`register-ksj-rankings.ts` の `findNearestPref`) は施設座標から
 * **最も近い県庁所在地**で県を決めていた。距離は行政境界と無関係なので、県境や
 * 離島で系統的に取り違える。2026-08-17 に本番で実測した被害:
 *
 * - `nuclear-power-plant-count`: 高浜(4)+大飯(4) が福井県から京都府へ流れ、
 *   **原子炉の無い京都府に 8 基**、福井県は 15 → 7 と過少。
 * - `geothermal-power-plant-count`: 八丈島(東京都)が神奈川県に付き、
 *   秋田県(澄川・上の岱)と福島県が 0 になっていた。
 *
 * ## 解決の順序
 *
 * 1. **属性** (`PrefectureSource` で明示宣言) — KSJ の多くは住所・県名・
 *    行政区域コードを持つ。一次資料が答えを持っているので最優先。
 * 2. **空間結合** (point-in-polygon) — 属性を持たないデータセット
 *    (C28 空港 / N06 IC・JCT / N02 駅など) のフォールバック。
 *
 * どちらでも決まらなければ **null を返す**。推測で埋めない — 呼び出し側が
 * 未解決件数を必ず表に出し、黙って別の県へ計上しないこと (旧実装の失敗はまさに
 * 「決まらないので近い方にした」だった)。
 *
 * 属性フィールドは**データセットごとに明示宣言する**。全プロパティを走査して
 * それらしい値を拾う設計にはしない — 実データに罠がある (P12 観光資源の
 * `P12_001` は資源 ID だが `10022` と 5 桁で、市区町村コードとして読むと
 * 群馬県に化ける。実際は北海道)。
 */

import { fetchPrefectures } from "@stats47/area";
import * as topojsonClient from "topojson-client";

/** 2 桁県コード → 県名 (`@stats47/area` の 5 桁 SSOT から導出) */
export const PREF_NAME_BY_CODE: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      fetchPrefectures().map((p) => [p.prefCode.slice(0, 2), p.prefName]),
    ),
  );

/** "01" 〜 "47" */
export const PREF_CODES: readonly string[] = Object.freeze(
  Object.keys(PREF_NAME_BY_CODE).sort(),
);

const CODE_BY_PREF_NAME: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    Object.entries(PREF_NAME_BY_CODE).map(([code, name]) => [name, code]),
  ),
);

/** 県名を長い順に見る (「京都府」より先に「京都」を拾わないため) */
const PREF_NAMES_LONGEST_FIRST: readonly string[] = Object.freeze(
  Object.keys(CODE_BY_PREF_NAME).sort((a, b) => b.length - a.length),
);

/**
 * 住所らしさの判定に使う行政区画の語。
 *
 * 「北海道」は接尾辞を持たない県名なので、これが無いと
 * 「北海道電力株式会社」のような**事業者名**を住所と誤読する。
 */
const MUNICIPALITY_MARKERS = ["市", "区", "町", "村", "郡"] as const;

/** どのフィールドから県を取るかの宣言 (データセットごとに明示する) */
export type PrefectureSource =
  /** 「山口県熊毛郡上関町大字長島」のような住所 */
  | { readonly kind: "address"; readonly field: string }
  /** 「北海道」のような県名そのもの */
  | { readonly kind: "prefName"; readonly field: string }
  /** 「01」のような 2 桁県コード */
  | { readonly kind: "prefCode"; readonly field: string }
  /** 「01222」のような 5 桁市区町村コード */
  | { readonly kind: "muniCode"; readonly field: string };

function asTrimmedString(value: unknown): string | null {
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/**
 * 住所文字列から県コードを取る。
 *
 * 県名で始まり、**かつ**残りに市区町村郡のいずれかを含むときだけ採用する。
 * 「北海道電力株式会社」は残りが「電力株式会社」なので採用しない。
 */
export function prefCodeFromAddress(value: unknown): string | null {
  const s = asTrimmedString(value);
  if (!s) return null;
  for (const name of PREF_NAMES_LONGEST_FIRST) {
    if (!s.startsWith(name)) continue;
    const rest = s.slice(name.length);
    if (!MUNICIPALITY_MARKERS.some((m) => rest.includes(m))) return null;
    return CODE_BY_PREF_NAME[name];
  }
  return null;
}

/** 県名そのもの (完全一致) から県コードを取る */
export function prefCodeFromPrefName(value: unknown): string | null {
  const s = asTrimmedString(value);
  if (!s) return null;
  return CODE_BY_PREF_NAME[s] ?? null;
}

/**
 * 数値コードから県コードを取る。
 *
 * 2 桁 (県コード) と 5 桁 (市区町村コード) のみ受け付ける。桁数を限定するのは、
 * 別の意味を持つ ID を市区町村コードとして読んでしまう事故を防ぐため。
 */
export function prefCodeFromNumericCode(
  value: unknown,
  expect: "prefCode" | "muniCode",
): string | null {
  const s = asTrimmedString(value);
  if (!s) return null;
  const digits = expect === "prefCode" ? 2 : 5;
  // 数値型で先頭 0 が落ちた市区町村コード (1222 → 01222) を戻す
  const padded = /^\d+$/.test(s) ? s.padStart(digits, "0") : s;
  if (padded.length !== digits) return null;
  const code = padded.slice(0, 2);
  return PREF_NAME_BY_CODE[code] ? code : null;
}

/** 宣言された属性フィールドから県コードを取る */
export function prefCodeFromSource(
  properties: Readonly<Record<string, unknown>> | null | undefined,
  source: PrefectureSource,
): string | null {
  if (!properties) return null;
  const raw = properties[source.field];
  switch (source.kind) {
    case "address":
      return prefCodeFromAddress(raw);
    case "prefName":
      return prefCodeFromPrefName(raw);
    case "prefCode":
      return prefCodeFromNumericCode(raw, "prefCode");
    case "muniCode":
      return prefCodeFromNumericCode(raw, "muniCode");
  }
}

// ─── 空間結合 (point-in-polygon) ────────────────────────────────

type Ring = ReadonlyArray<readonly [number, number]>;

interface IndexedPolygon {
  readonly prefCode: string;
  /** [0]=外環, [1..]=穴 */
  readonly rings: readonly Ring[];
  readonly bbox: readonly [number, number, number, number];
}

function ringBbox(ring: Ring): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

/** 単一リングに対する ray-casting の偶奇判定 */
function pointInRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export interface PrefectureLocator {
  /** 点を含む県コードを返す。どの県にも入らなければ null */
  locate(lon: number, lat: number): string | null;
}

/**
 * 県ポリゴン TopoJSON から locator を作る。
 *
 * `prefCodeProperty` は N03_007 (2 桁県コード) を既定とする。
 */
export function createPrefectureLocator(
  topology: unknown,
  options: { objectKey?: string; prefCodeProperty?: string } = {},
): PrefectureLocator {
  const t = topology as { objects: Record<string, unknown> };
  const objectKey = options.objectKey ?? Object.keys(t.objects)[0];
  const obj = t.objects[objectKey];
  if (!obj) {
    throw new Error(
      `objects['${objectKey}'] がありません (available: ${Object.keys(t.objects).join(", ")})`,
    );
  }
  const prefCodeProperty = options.prefCodeProperty ?? "N03_007";
  const fc = topojsonClient.feature(
    topology as never,
    obj as never,
  ) as unknown as {
    features: Array<{
      geometry: { type: string; coordinates: unknown } | null;
      properties: Record<string, unknown> | null;
    }>;
  };

  const polygons: IndexedPolygon[] = [];
  for (const f of fc.features) {
    const rawCode = asTrimmedString(f.properties?.[prefCodeProperty]);
    const prefCode = rawCode ? rawCode.padStart(2, "0").slice(0, 2) : null;
    if (!prefCode || !PREF_NAME_BY_CODE[prefCode]) continue;
    if (!f.geometry) continue;
    const { type, coordinates } = f.geometry;
    const polys: Ring[][] =
      type === "Polygon"
        ? [coordinates as Ring[]]
        : type === "MultiPolygon"
          ? (coordinates as Ring[][])
          : [];
    for (const poly of polys) {
      if (poly.length === 0 || poly[0].length === 0) continue;
      polygons.push({ prefCode, rings: poly, bbox: ringBbox(poly[0]) });
    }
  }
  if (polygons.length === 0) {
    throw new Error(
      `県ポリゴンを 1 つも取り出せませんでした (prefCodeProperty=${prefCodeProperty})`,
    );
  }

  return {
    locate(lon: number, lat: number): string | null {
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      for (const p of polygons) {
        const [minX, minY, maxX, maxY] = p.bbox;
        if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
        if (!pointInRing(lon, lat, p.rings[0])) continue;
        let inHole = false;
        for (let h = 1; h < p.rings.length; h++) {
          if (pointInRing(lon, lat, p.rings[h])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return p.prefCode;
      }
      return null;
    },
  };
}

// ─── 解決 ──────────────────────────────────────────────────────

export type PrefectureAssignMethod = "attribute" | "polygon";

export interface PrefectureAssignment {
  readonly prefCode: string;
  readonly method: PrefectureAssignMethod;
}

/**
 * feature を都道府県へ帰属させる。属性 → 空間結合の順で試し、
 * どちらでも決まらなければ null (推測しない)。
 */
export function resolvePrefecture(args: {
  readonly properties?: Readonly<Record<string, unknown>> | null;
  readonly source?: PrefectureSource | null;
  readonly coord?: readonly [number, number] | null;
  readonly locator?: PrefectureLocator | null;
}): PrefectureAssignment | null {
  const { properties, source, coord, locator } = args;
  if (source) {
    const code = prefCodeFromSource(properties, source);
    if (code) return { prefCode: code, method: "attribute" };
  }
  if (locator && coord) {
    const code = locator.locate(coord[0], coord[1]);
    if (code) return { prefCode: code, method: "polygon" };
  }
  return null;
}
