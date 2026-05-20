/**
 * 過疎地域 × 医療機関 掛け合わせスナップショットを R2 に出力する。
 *
 * 統計 × GIS 掛け合わせ demo #1 (plan: stateless-stargazing-teapot)。
 * A17 過疎地域 (polygon) 内に P04 医療機関 (point) がいくつあるかを
 * 都道府県別に空間結合 (point-in-polygon) で集計する。
 *
 * 出力:
 *   app/gis-cross/depopulation-medical/summary.json   — 47 県サマリ (choropleth 用)
 *   app/gis-cross/depopulation-medical/pref/{NN}.json — 県別詳細 (オーバーレイ用)
 *
 * Usage:
 *   npx tsx apps/web/scripts/export-depopulation-medical-snapshot.ts
 */

import * as topojsonClient from "topojson-client";

import {
  fetchKsjTopologyFromLocal,
  listKsjFiles,
} from "../../../packages/gis/src/mlit-ksj/adapters/fetch-ksj-from-local";
import { saveToR2 } from "@stats47/r2-storage/server";

import {
  DEPOPULATION_MEDICAL_SUMMARY_KEY,
  depopulationMedicalPrefKey,
  type DepopulationMedicalFacility,
  type DepopulationMedicalPref,
  type DepopulationMedicalPrefDetail,
  type DepopulationMedicalSummary,
} from "../src/features/depopulation-medical/lib/types";

// A17 過疎地域 / P04 医療機関 の取得済みバージョン
const A17_VERSION = "17";
const P04_VERSION = "20";

// 表示用 GeoJSON の座標丸め桁数 (集計には影響させない。約 1m 精度)
const DISPLAY_COORD_PRECISION = 5;

const PREF_NAMES: Record<string, string> = {
  "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県",
  "06": "山形県", "07": "福島県", "08": "茨城県", "09": "栃木県", "10": "群馬県",
  "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県", "15": "新潟県",
  "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
  "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県", "25": "滋賀県",
  "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県",
  "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県",
  "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
  "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県",
  "46": "鹿児島県", "47": "沖縄県",
};

// ─── GeoJSON 型 (最小限) ──────────────────────────────────────────
type Ring = [number, number][];
interface PolygonFeature {
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
  properties: Record<string, unknown>;
}
interface FeatureCollection {
  type: "FeatureCollection";
  features: Array<{ geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> }>;
}

// ─── topojson → GeoJSON ──────────────────────────────────────────
function toGeoJson(
  topo: unknown,
  objectKey: string,
): FeatureCollection {
  const t = topo as { objects: Record<string, unknown> };
  const obj = t.objects[objectKey];
  if (!obj) {
    const keys = Object.keys(t.objects).join(", ");
    throw new Error(`objects['${objectKey}'] not found. available: ${keys}`);
  }
  return topojsonClient.feature(
    topo as never,
    obj as never,
  ) as unknown as FeatureCollection;
}

// ─── point-in-polygon (ray-casting) ──────────────────────────────
/** 単一リングに対する偶奇判定 */
function pointInRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

interface IndexedPolygon {
  /** Polygon のリング配列 ([0]=外環, [1..]=穴) */
  rings: Ring[];
  bbox: [number, number, number, number]; // minX,minY,maxX,maxY
}

function ringBbox(ring: Ring): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

/** Polygon/MultiPolygon feature を IndexedPolygon[] に展開 */
function indexPolygons(feature: PolygonFeature): IndexedPolygon[] {
  const result: IndexedPolygon[] = [];
  const { type, coordinates } = feature.geometry;
  const polygons: Ring[][] =
    type === "Polygon"
      ? [coordinates as Ring[]]
      : (coordinates as Ring[][]);
  for (const poly of polygons) {
    if (poly.length === 0) continue;
    result.push({ rings: poly, bbox: ringBbox(poly[0]) });
  }
  return result;
}

/** 点がいずれかの過疎ポリゴン内にあるか (外環 true かつ穴 false) */
function isInsideAny(
  lon: number,
  lat: number,
  polygons: IndexedPolygon[],
): boolean {
  for (const p of polygons) {
    const [minX, minY, maxX, maxY] = p.bbox;
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
    if (!pointInRing(lon, lat, p.rings[0])) continue;
    // 穴判定: いずれかの穴に入っていれば対象外
    let inHole = false;
    for (let h = 1; h < p.rings.length; h++) {
      if (pointInRing(lon, lat, p.rings[h])) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

// 出力型は load-depopulation-medical-data.ts に集約 (DepopulationMedical*)。

function round(n: number): number {
  const f = 10 ** DISPLAY_COORD_PRECISION;
  return Math.round(n * f) / f;
}

function roundCoords(coords: unknown): unknown {
  if (typeof coords === "number") return round(coords);
  if (Array.isArray(coords)) {
    // [lon, lat] か、ネストか
    if (typeof coords[0] === "number" && typeof coords[1] === "number" && coords.length === 2) {
      return [round(coords[0]), round(coords[1])];
    }
    return coords.map(roundCoords);
  }
  return coords;
}

// P04 プロパティはラベルがずれている (KSJ 取込時の既知問題)。
// 位置的意味で扱う: facilityType=施設名称, prefectureCode=診療科目。
function p04Name(props: Record<string, unknown>): string {
  return String(props.facilityType ?? props.P04_008 ?? "");
}
function p04Departments(props: Record<string, unknown>): string {
  return String(props.prefectureCode ?? "");
}
// A17 props: A17_006/A17_007 が市区町村名
function a17Municipality(props: Record<string, unknown>): string {
  return String(props.A17_006 ?? props.A17_007 ?? "");
}

async function main(): Promise<void> {
  const a17Files = listKsjFiles("A17", A17_VERSION);
  const p04Files = listKsjFiles("P04", P04_VERSION);
  console.log(`📁 A17: ${a17Files.length} files, P04: ${p04Files.length} files`);

  const summaries: DepopulationMedicalPref[] = [];
  let totalDetailBytes = 0;

  for (let i = 1; i <= 47; i++) {
    const nn = String(i).padStart(2, "0");
    const a17File = `${nn}.topojson`;
    const p04File = `${nn}.topojson`;

    if (!a17Files.includes(a17File) || !p04Files.includes(p04File)) {
      console.warn(`  ⚠ ${nn} (${PREF_NAMES[nn]}): ファイル欠落、skip`);
      continue;
    }

    // A17 過疎ポリゴン
    const a17Topo = fetchKsjTopologyFromLocal({
      dataId: "A17",
      version: A17_VERSION,
      filename: a17File,
    });
    const a17Geo = toGeoJson(a17Topo, "a17");
    const indexedPolygons: IndexedPolygon[] = [];
    for (const f of a17Geo.features) {
      if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
        indexedPolygons.push(...indexPolygons(f as PolygonFeature));
      }
    }

    // P04 医療機関 point
    const p04Topo = fetchKsjTopologyFromLocal({
      dataId: "P04",
      version: P04_VERSION,
      filename: p04File,
    });
    const p04Geo = toGeoJson(p04Topo, "p04");

    // 空間結合 (集計は原データで実施)
    const facilities: DepopulationMedicalFacility[] = [];
    let depopulationCount = 0;
    for (const f of p04Geo.features) {
      if (f.geometry.type !== "Point") continue;
      const [lon, lat] = f.geometry.coordinates as [number, number];
      const inside = isInsideAny(lon, lat, indexedPolygons);
      if (inside) depopulationCount++;
      facilities.push({
        lon: round(lon),
        lat: round(lat),
        name: p04Name(f.properties),
        departments: p04Departments(f.properties),
        inDepopulationArea: inside,
      });
    }

    const total = facilities.length;
    const summary: DepopulationMedicalPref = {
      prefCode: `${nn}000`,
      prefName: PREF_NAMES[nn],
      depopulationFacilities: depopulationCount,
      totalFacilities: total,
      outsideFacilities: total - depopulationCount,
      ratio: total > 0 ? depopulationCount / total : 0,
    };
    summaries.push(summary);

    // 県別詳細 (表示用、座標丸め + props 最小化)
    const detail: DepopulationMedicalPrefDetail = {
      prefCode: `${nn}000`,
      prefName: PREF_NAMES[nn],
      depopulationAreas: {
        type: "FeatureCollection",
        features: a17Geo.features
          .filter(
            (f) =>
              f.geometry.type === "Polygon" ||
              f.geometry.type === "MultiPolygon",
          )
          .map((f) => ({
            type: "Feature" as const,
            geometry: {
              type: f.geometry.type as "Polygon" | "MultiPolygon",
              coordinates: roundCoords(f.geometry.coordinates),
            },
            properties: { municipality: a17Municipality(f.properties) },
          })),
      },
      facilities,
    };
    const detailBody = JSON.stringify(detail);
    totalDetailBytes += detailBody.length;
    await saveToR2(depopulationMedicalPrefKey(nn), detailBody, {
      contentType: "application/json; charset=utf-8",
    });

    console.log(
      `  ✓ ${nn} ${PREF_NAMES[nn]}: 過疎内 ${depopulationCount} / 全 ${total} (${(summary.ratio * 100).toFixed(1)}%) detail=${(detailBody.length / 1024).toFixed(0)}KB`,
    );
  }

  // サマリ出力
  const snapshot: DepopulationMedicalSummary = {
    generatedAt: new Date().toISOString(),
    prefectures: summaries,
  };
  const summaryBody = JSON.stringify(snapshot);
  await saveToR2(DEPOPULATION_MEDICAL_SUMMARY_KEY, summaryBody, {
    contentType: "application/json; charset=utf-8",
  });

  console.log(`\n✅ 完了`);
  console.log(`   summary.json: ${(summaryBody.length / 1024).toFixed(1)}KB (${summaries.length} 県)`);
  console.log(`   県別詳細 計: ${(totalDetailBytes / 1024 / 1024).toFixed(1)}MB`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
