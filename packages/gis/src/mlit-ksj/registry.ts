/**
 * KSJ データセット コード設定レジストリ (slim 版)
 *
 * Phase 2 of GIS dataset management refactor (plan: stateless-stargazing-teapot):
 * 純メタデータ (name / category / license / latestVersion 等) は D1 gis_datasets に
 * 寄せた。本ファイルは pipeline 実行時のみ必要な「コードに残さざるを得ない設定」
 * (downloadUrlPattern / geojsonDirInZip / propertyMap / simplifyOptions) だけを持つ。
 *
 * 新規データセットを stats47 に取り込む場合:
 *   1. KSJ_CODE_CONFIG にエントリを追加 (本ファイル)
 *   2. D1 gis_datasets に行を INSERT (status='registered')
 *      または Phase 3 で seed 済みなら status='available' → 'registered' に UPDATE
 *   3. registry の純メタ (name 等) は D1 側で UPDATE
 *   4. `npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts <ID>` を実行
 */

import type { KsjCodeConfig } from "./types";

export const KSJ_CODE_CONFIG = new Map<string, KsjCodeConfig>([
  ["W09", {
    dataId: "W09",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/W09/W09-05/W09-05_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["W01", {
    dataId: "W01",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/W01/W01-{VERSION}/W01-{VERSION}_GML.zip",
    geojsonDirInZip: "UTF-8/",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["W05", {
    dataId: "W05",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/W05/W05-{VERSION}/W05-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["C23", {
    dataId: "C23",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/C23/C23-{VERSION}/C23-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["G04-a", {
    dataId: "G04-a",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/G04-a/G04-a-{VERSION}/G04-a-{VERSION}_{MESHCODE}-jgd_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 10000, simplifyQuantile: 0.02 },
  }],
  ["L03-a", {
    dataId: "L03-a",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/L03-a/L03-a-21/L03-a-21_{MESHCODE}-jgd2011_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 10000, simplifyQuantile: 0.02 },
  }],
  ["L01", {
    dataId: "L01",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/L01/L01-25/L01-25_GML.zip",
    geojsonDirInZip: "UTF-8/",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["L02", {
    dataId: "L02",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/L02/L02-25/L02-25_GML.zip",
    geojsonDirInZip: "UTF-8/",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["A13", {
    dataId: "A13",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A13/A13-{VERSION}/A13-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A12", {
    dataId: "A12",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A12/A12-{VERSION}/A12-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["N03", {
    dataId: "N03",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-{VERSION}_GML.zip",
    geojsonDirInZip: "UTF-8/",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A16", {
    dataId: "A16",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A16/A16-{VERSION}/A16-{VERSION}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A38", {
    dataId: "A38",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A38/A38-{VERSION}/A38-{VERSION}_GML.zip",
    geojsonDirInZip: "UTF-8/",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A29", {
    dataId: "A29",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A29/A29-{VERSION}/A29-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A27", {
    dataId: "A27",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A27/A27-{VERSION}/A27-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A32", {
    dataId: "A32",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A32/A32-{VERSION}/A32-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A17", {
    dataId: "A17",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A17/A17-{VERSION}/A17-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A22", {
    dataId: "A22",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-{VERSION}/A22-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A31b", {
    dataId: "A31b",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A31b/A31b-22/{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A33", {
    dataId: "A33",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-{VERSION}/A33-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A40", {
    dataId: "A40",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-{VERSION}/A40-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["A10", {
    dataId: "A10",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/A10/A10-{VERSION}/A10-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["P04", {
    dataId: "P04",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P04/P04-{VERSION}/P04-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P29", {
    dataId: "P29",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P29/P29-{VERSION}/P29-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P05", {
    dataId: "P05",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-{VERSION}/P05-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P14", {
    dataId: "P14",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P14/P14-{VERSION}/P14-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P11", {
    dataId: "P11",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P11/P11-{VERSION}/P11-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P36", {
    dataId: "P36",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P36/P36-{VERSION}/P36-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P17", {
    dataId: "P17",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P17/P17-{VERSION}/P17-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P18", {
    dataId: "P18",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P18/P18-{VERSION}/P18-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P03", {
    dataId: "P03",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P03/P03-13/P03-13.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P35", {
    dataId: "P35",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P35/P35-18/P35-18_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P12", {
    dataId: "P12",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P12/P12-{VERSION}/P12-{VERSION}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["P13", {
    dataId: "P13",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/P13/P13-{VERSION}/P13-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["N02", {
    dataId: "N02",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/N02/N02-{VERSION}/N02-{VERSION}_GML.zip",
    geojsonDirInZip: "UTF-8/",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["S12", {
    dataId: "S12",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/S12/S12-{VERSION}/S12-{VERSION}_GML.zip",
    geojsonDirInZip: "UTF-8/",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["N06", {
    dataId: "N06",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/N06/N06-{VERSION}/N06-{VERSION}_GML.zip",
    geojsonDirInZip: "UTF-8/",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["N07", {
    dataId: "N07",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/N07/N07-{VERSION}/N07-{VERSION}_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 100000, simplifyQuantile: 0.01 },
  }],
  ["C28", {
    dataId: "C28",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/C28/C28-{VERSION}/C28-{VERSION}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["C02", {
    dataId: "C02",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/C02/C02-{VERSION}/C02-{VERSION}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["C09", {
    dataId: "C09",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/C09/C09-{VERSION}/C09-{VERSION}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 1000000, simplifyQuantile: 0 },
  }],
  ["mesh1000r6", {
    dataId: "mesh1000r6",
    downloadUrlPattern: "https://nlftp.mlit.go.jp/ksj/gml/data/m1kr6/m1kr6-24/1km_mesh_2024_{PREF}_GML.zip",
    geojsonDirInZip: "",
    propertyMap: {},
    simplifyOptions: { quantize: 10000, simplifyQuantile: 0.02 },
  }],
]);

export function getCodeConfig(dataId: string): KsjCodeConfig | null {
  return KSJ_CODE_CONFIG.get(dataId) ?? null;
}

export function listCodeConfigDataIds(): string[] {
  return [...KSJ_CODE_CONFIG.keys()];
}
