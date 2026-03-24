/**
 * KSJ データセット定義レジストリ
 *
 * 国土数値情報の全データセット定義を管理する。
 * URL パターン参照: https://jpksj-api.kmproj.com/datasets.json
 */

import type { KsjDatasetDef } from "./types";

// === ジオメトリ型別の簡略化パラメータ ===
const SIMPLIFY_POINT = { quantize: 1e6, simplifyQuantile: 0 };
const SIMPLIFY_LINE = { quantize: 1e5, simplifyQuantile: 0.01 };
const SIMPLIFY_POLYGON = { quantize: 1e5, simplifyQuantile: 0.01 };
const SIMPLIFY_MESH = { quantize: 1e4, simplifyQuantile: 0.02 };

// === URL ベース ===
const BASE = "https://nlftp.mlit.go.jp/ksj/gml/data";

/** 全国ダウンロード URL テンプレート */
const nat = (id: string, sep = "-") =>
  `${BASE}/${id}/${id}${sep}{VERSION}/${id}${sep}{VERSION}_GML.zip`;

/** 都道府県別ダウンロード URL テンプレート */
const pref = (id: string, sep = "-") =>
  `${BASE}/${id}/${id}${sep}{VERSION}/${id}${sep}{VERSION}_{PREF}_GML.zip`;

export const KSJ_REGISTRY = new Map<string, KsjDatasetDef>([
  // ============================================================
  //  1. 国土（水・土地）
  // ============================================================

  // --- 水域 ---
  ["W09", {
    dataId: "W09", name: "湖沼", nameEn: "Lakes",
    category: "land", geometryType: "polygon", coverage: "national",
    license: "commercial-ok", latestVersion: "05",
    downloadUrlPattern: `${BASE}/W09/W09-05/W09-05_GML.zip`,
    geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~2MB", stats47Category: "landweather",
  }],
  ["W01", {
    dataId: "W01", name: "ダム", nameEn: "Dams",
    category: "land", geometryType: "point", coverage: "national",
    license: "non-commercial", latestVersion: "14",
    downloadUrlPattern: nat("W01"), geojsonDirInZip: "UTF-8/",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~1MB",
  }],
  ["W05", {
    dataId: "W05", name: "河川", nameEn: "Rivers",
    category: "land", geometryType: "line", coverage: "prefecture",
    license: "non-commercial", latestVersion: "08",
    downloadUrlPattern: pref("W05"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_LINE,
    estimatedSize: "~10MB/県",
  }],
  ["C23", {
    dataId: "C23", name: "海岸線", nameEn: "Coastline",
    category: "land", geometryType: "line", coverage: "prefecture",
    license: "non-commercial", latestVersion: "06",
    downloadUrlPattern: pref("C23"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_LINE,
    estimatedSize: "~5MB/県",
  }],

  // --- 地形 ---
  ["G04-a", {
    dataId: "G04-a", name: "標高・傾斜度3次メッシュ", nameEn: "Elevation 3rd Mesh",
    category: "land", geometryType: "mesh", coverage: "mesh",
    license: "commercial-ok", latestVersion: "10",
    downloadUrlPattern: `${BASE}/G04-a/G04-a-{VERSION}/{PREF}_GML.zip`,
    geojsonDirInZip: "", propertyMap: {}, simplifyOptions: SIMPLIFY_MESH,
    estimatedSize: "~100MB",
  }],

  // --- 土地利用 ---
  ["L03-a", {
    dataId: "L03-a", name: "土地利用3次メッシュ", nameEn: "Land Use 3rd Mesh",
    category: "land", geometryType: "mesh", coverage: "mesh",
    license: "cc-by-4.0", latestVersion: "21",
    downloadUrlPattern: `${BASE}/L03-a/L03-a-21/{PREF}_GML.zip`,
    geojsonDirInZip: "", propertyMap: {}, simplifyOptions: SIMPLIFY_MESH,
    estimatedSize: "~30MB",
  }],

  // --- 地価 ---
  ["L01", {
    dataId: "L01", name: "地価公示", nameEn: "Official Land Prices",
    category: "land", geometryType: "point", coverage: "national",
    license: "cc-by-4.0", latestVersion: "25",
    downloadUrlPattern: `${BASE}/L01/L01-25/L01-25_GML.zip`,
    geojsonDirInZip: "UTF-8/", propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~10MB", stats47Category: "economy",
  }],
  ["L02", {
    dataId: "L02", name: "都道府県地価調査", nameEn: "Prefectural Land Price Survey",
    category: "land", geometryType: "point", coverage: "national",
    license: "cc-by-4.0", latestVersion: "25",
    downloadUrlPattern: `${BASE}/L02/L02-25/L02-25_GML.zip`,
    geojsonDirInZip: "UTF-8/", propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~8MB", stats47Category: "economy",
  }],
  ["A13", {
    dataId: "A13", name: "森林地域", nameEn: "Forest Areas",
    category: "land", geometryType: "polygon", coverage: "prefecture",
    license: "cc-by-4.0-partial", latestVersion: "15",
    downloadUrlPattern: pref("A13"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~10MB/県", stats47Category: "agriculture",
  }],
  ["A12", {
    dataId: "A12", name: "農業地域", nameEn: "Agricultural Areas",
    category: "land", geometryType: "polygon", coverage: "prefecture",
    license: "cc-by-4.0-partial", latestVersion: "15",
    downloadUrlPattern: pref("A12"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~5MB/県", stats47Category: "agriculture",
  }],

  // ============================================================
  //  2. 政策区域
  // ============================================================

  // --- 行政地域 ---
  ["N03", {
    dataId: "N03", name: "行政区域", nameEn: "Administrative Boundaries",
    category: "policy", geometryType: "polygon", coverage: "national",
    license: "cc-by-4.0", latestVersion: "20250101",
    downloadUrlPattern: `${BASE}/N03/N03-2025/N03-{VERSION}_GML.zip`,
    geojsonDirInZip: "UTF-8/", propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~600MB",
  }],
  ["A16", {
    dataId: "A16", name: "DID人口集中地区", nameEn: "Densely Inhabited Districts",
    category: "policy", geometryType: "polygon", coverage: "national",
    license: "commercial-ok", latestVersion: "15",
    downloadUrlPattern: nat("A16"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~20MB", stats47Category: "population",
  }],
  ["A38", {
    dataId: "A38", name: "医療圏", nameEn: "Medical Service Areas",
    category: "policy", geometryType: "polygon", coverage: "national",
    license: "cc-by-4.0", latestVersion: "22",
    downloadUrlPattern: nat("A38"), geojsonDirInZip: "UTF-8/",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~3MB", stats47Category: "socialsecurity",
  }],
  ["A29", {
    dataId: "A29", name: "用途地域", nameEn: "Zoning Districts",
    category: "policy", geometryType: "polygon", coverage: "prefecture",
    license: "cc-by-4.0-partial", latestVersion: "22",
    downloadUrlPattern: pref("A29"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~10MB/県", stats47Category: "infrastructure",
  }],
  ["A27", {
    dataId: "A27", name: "小学校区", nameEn: "Elementary School Districts",
    category: "policy", geometryType: "polygon", coverage: "prefecture",
    license: "cc-by-4.0-partial", latestVersion: "16",
    downloadUrlPattern: pref("A27"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~5MB/県", stats47Category: "educationsports",
  }],
  ["A32", {
    dataId: "A32", name: "中学校区", nameEn: "Junior High School Districts",
    category: "policy", geometryType: "polygon", coverage: "prefecture",
    license: "cc-by-4.0-partial", latestVersion: "16",
    downloadUrlPattern: pref("A32"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~3MB/県", stats47Category: "educationsports",
  }],

  // --- 大都市圏・条件不利地域 ---
  ["A17", {
    dataId: "A17", name: "過疎地域", nameEn: "Depopulated Areas",
    category: "policy", geometryType: "polygon", coverage: "prefecture",
    license: "commercial-ok", latestVersion: "22",
    downloadUrlPattern: pref("A17"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~3MB/県", stats47Category: "population",
  }],
  ["A22", {
    dataId: "A22", name: "豪雪地帯", nameEn: "Heavy Snow Areas",
    category: "policy", geometryType: "polygon", coverage: "prefecture",
    license: "commercial-ok", latestVersion: "15",
    downloadUrlPattern: pref("A22"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~3MB/県", stats47Category: "landweather",
  }],

  // --- 災害・防災 ---
  ["A31b", {
    dataId: "A31b", name: "洪水浸水想定区域", nameEn: "Flood Inundation Areas",
    category: "policy", geometryType: "polygon", coverage: "mesh",
    license: "cc-by-4.0", latestVersion: "22",
    downloadUrlPattern: `${BASE}/A31b/A31b-22/{PREF}_GML.zip`,
    geojsonDirInZip: "", propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~20MB", stats47Category: "safetyenvironment",
  }],
  ["A33", {
    dataId: "A33", name: "土砂災害警戒区域", nameEn: "Sediment Disaster Warning Areas",
    category: "policy", geometryType: "polygon", coverage: "prefecture",
    license: "cc-by-4.0-partial", latestVersion: "23",
    downloadUrlPattern: pref("A33"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~15MB/県", stats47Category: "safetyenvironment",
  }],
  ["A40", {
    dataId: "A40", name: "津波浸水想定", nameEn: "Tsunami Inundation Estimates",
    category: "policy", geometryType: "polygon", coverage: "prefecture",
    license: "cc-by-4.0-partial", latestVersion: "22",
    downloadUrlPattern: pref("A40"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~10MB/県", stats47Category: "safetyenvironment",
  }],
  ["A10", {
    dataId: "A10", name: "自然公園地域", nameEn: "Natural Park Areas",
    category: "policy", geometryType: "polygon", coverage: "prefecture",
    license: "cc-by-4.0-partial", latestVersion: "15",
    downloadUrlPattern: pref("A10"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~5MB/県", stats47Category: "safetyenvironment",
  }],

  // ============================================================
  //  3. 施設
  // ============================================================
  ["P04", {
    dataId: "P04", name: "医療機関", nameEn: "Medical Facilities",
    category: "facility", geometryType: "point", coverage: "prefecture",
    license: "cc-by-4.0", latestVersion: "20",
    downloadUrlPattern: pref("P04"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~1MB/県", stats47Category: "socialsecurity",
  }],
  ["P29", {
    dataId: "P29", name: "学校", nameEn: "Schools",
    category: "facility", geometryType: "point", coverage: "prefecture",
    license: "cc-by-4.0", latestVersion: "16",
    downloadUrlPattern: pref("P29"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~1MB/県", stats47Category: "educationsports",
  }],
  ["P05", {
    dataId: "P05", name: "市町村役場等・公的集会施設", nameEn: "Municipal Offices & Public Assembly",
    category: "facility", geometryType: "point", coverage: "prefecture",
    license: "cc-by-4.0", latestVersion: "14",
    downloadUrlPattern: pref("P05"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~0.5MB/県",
  }],
  ["P14", {
    dataId: "P14", name: "福祉施設", nameEn: "Welfare Facilities",
    category: "facility", geometryType: "point", coverage: "prefecture",
    license: "cc-by-4.0-partial", latestVersion: "22",
    downloadUrlPattern: pref("P14"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~0.5MB/県", stats47Category: "socialsecurity",
  }],
  ["P11", {
    dataId: "P11", name: "バス停留所", nameEn: "Bus Stops",
    category: "facility", geometryType: "point", coverage: "prefecture",
    license: "cc-by-4.0", latestVersion: "22",
    downloadUrlPattern: pref("P11"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~2MB/県", stats47Category: "infrastructure",
  }],
  ["P36", {
    dataId: "P36", name: "高速バス停留所", nameEn: "Express Bus Stops",
    category: "facility", geometryType: "point", coverage: "prefecture",
    license: "cc-by-4.0", latestVersion: "22",
    downloadUrlPattern: pref("P36"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~0.3MB/県", stats47Category: "infrastructure",
  }],
  ["P17", {
    dataId: "P17", name: "消防署", nameEn: "Fire Stations",
    category: "facility", geometryType: "point", coverage: "prefecture",
    license: "non-commercial", latestVersion: "22",
    downloadUrlPattern: pref("P17"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~0.2MB/県", stats47Category: "safetyenvironment",
  }],
  ["P18", {
    dataId: "P18", name: "警察署", nameEn: "Police Stations",
    category: "facility", geometryType: "point", coverage: "prefecture",
    license: "non-commercial", latestVersion: "22",
    downloadUrlPattern: pref("P18"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~0.2MB/県", stats47Category: "safetyenvironment",
  }],
  ["P03", {
    dataId: "P03", name: "発電施設", nameEn: "Power Plants",
    category: "facility", geometryType: "point", coverage: "national",
    license: "non-commercial", latestVersion: "13",
    downloadUrlPattern: `${BASE}/P03/P03-13/P03-13.zip`,
    geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~1MB", stats47Category: "energy",
  }],
  ["P35", {
    dataId: "P35", name: "道の駅", nameEn: "Roadside Stations",
    category: "facility", geometryType: "point", coverage: "national",
    license: "non-commercial", latestVersion: "18",
    downloadUrlPattern: `${BASE}/P35/P35-18/P35-18_GML.zip`,
    geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~1MB", stats47Category: "tourism",
  }],
  ["P12", {
    dataId: "P12", name: "観光資源", nameEn: "Tourism Resources",
    category: "facility", geometryType: "point", coverage: "national",
    license: "non-commercial", latestVersion: "14",
    downloadUrlPattern: nat("P12"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~2MB", stats47Category: "tourism",
  }],
  ["P13", {
    dataId: "P13", name: "都市公園", nameEn: "Urban Parks",
    category: "facility", geometryType: "polygon", coverage: "prefecture",
    license: "non-commercial", latestVersion: "14",
    downloadUrlPattern: pref("P13"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POLYGON,
    estimatedSize: "~3MB/県", stats47Category: "infrastructure",
  }],

  // ============================================================
  //  4. 交通
  // ============================================================
  ["N02", {
    dataId: "N02", name: "鉄道", nameEn: "Railways",
    category: "transport", geometryType: "line", coverage: "national",
    license: "cc-by-4.0", latestVersion: "24",
    downloadUrlPattern: nat("N02"), geojsonDirInZip: "UTF-8/",
    propertyMap: {}, simplifyOptions: SIMPLIFY_LINE,
    estimatedSize: "~17MB", stats47Category: "infrastructure",
  }],
  ["S12", {
    dataId: "S12", name: "駅別乗降客数", nameEn: "Station Passenger Counts",
    category: "transport", geometryType: "point", coverage: "national",
    license: "cc-by-4.0", latestVersion: "24",
    downloadUrlPattern: nat("S12"), geojsonDirInZip: "UTF-8/",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~4MB", stats47Category: "infrastructure",
  }],
  ["N06", {
    dataId: "N06", name: "高速道路時系列", nameEn: "Expressway Time Series",
    category: "transport", geometryType: "line", coverage: "national",
    license: "cc-by-4.0-partial", latestVersion: "20",
    downloadUrlPattern: nat("N06"), geojsonDirInZip: "UTF-8/",
    propertyMap: {}, simplifyOptions: SIMPLIFY_LINE,
    estimatedSize: "~10MB", stats47Category: "infrastructure",
  }],
  ["N07", {
    dataId: "N07", name: "バスルート", nameEn: "Bus Routes",
    category: "transport", geometryType: "line", coverage: "prefecture",
    license: "cc-by-4.0", latestVersion: "22",
    downloadUrlPattern: pref("N07"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_LINE,
    estimatedSize: "~5MB/県", stats47Category: "infrastructure",
  }],
  ["C28", {
    dataId: "C28", name: "空港", nameEn: "Airports",
    category: "transport", geometryType: "point", coverage: "national",
    license: "commercial-ok", latestVersion: "07",
    downloadUrlPattern: nat("C28"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~0.5MB", stats47Category: "infrastructure",
  }],
  ["C02", {
    dataId: "C02", name: "港湾", nameEn: "Ports",
    category: "transport", geometryType: "point", coverage: "national",
    license: "non-commercial", latestVersion: "07",
    downloadUrlPattern: nat("C02"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~1MB", stats47Category: "infrastructure",
  }],
  ["C09", {
    dataId: "C09", name: "漁港", nameEn: "Fishing Ports",
    category: "transport", geometryType: "point", coverage: "national",
    license: "non-commercial", latestVersion: "06",
    downloadUrlPattern: nat("C09"), geojsonDirInZip: "",
    propertyMap: {}, simplifyOptions: SIMPLIFY_POINT,
    estimatedSize: "~1MB", stats47Category: "agriculture",
  }],

  // ============================================================
  //  5. 各種統計
  // ============================================================
  ["mesh1000r6", {
    dataId: "mesh1000r6", name: "1kmメッシュ将来推計人口(R6)", nameEn: "Future Population 1km Mesh (R6)",
    category: "statistics", geometryType: "mesh", coverage: "prefecture",
    license: "cc-by-4.0", latestVersion: "24",
    downloadUrlPattern: `${BASE}/mesh1000r6/mesh1000r6-24/{PREF}_GML.zip`,
    geojsonDirInZip: "", propertyMap: {}, simplifyOptions: SIMPLIFY_MESH,
    estimatedSize: "~50MB/全国", stats47Category: "population",
  }],
]);

export function getDatasetDef(dataId: string): KsjDatasetDef {
  const def = KSJ_REGISTRY.get(dataId);
  if (!def) {
    throw new Error(
      `Unknown KSJ dataset: ${dataId}. Available: ${[...KSJ_REGISTRY.keys()].join(", ")}`
    );
  }
  return def;
}

export function listDatasets(): KsjDatasetDef[] {
  return [...KSJ_REGISTRY.values()];
}

export function listDatasetsByCategory(
  category: string
): KsjDatasetDef[] {
  return [...KSJ_REGISTRY.values()].filter((d) => d.category === category);
}
