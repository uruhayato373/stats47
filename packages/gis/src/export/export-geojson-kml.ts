/**
 * TopoJSONからGeoJSONとKMLをエクスポートする汎用的な関数
 */

import * as d3 from "d3";
import * as fs from "fs";
import * as path from "path";
import * as topojson from "topojson-client";
// @ts-ignore
import type { TopoJSONTopology } from "@stats47/types";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import * as iconv from "iconv-lite";
import { JSDOM } from "jsdom";
/**
 * D3.jsカラースキーム型
 * @stats47/visualization から複製（JSX依存を避けるため）
 */
export type D3ColorScheme =
  | "interpolateBlues" | "interpolateGreens" | "interpolateGreys"
  | "interpolateOranges" | "interpolatePurples" | "interpolateReds"
  | "interpolateBuGn" | "interpolateBuPu" | "interpolateGnBu"
  | "interpolateOrRd" | "interpolatePuBuGn" | "interpolatePuBu"
  | "interpolatePuRd" | "interpolateRdPu" | "interpolateYlGnBu"
  | "interpolateYlGn" | "interpolateYlOrBr" | "interpolateYlOrRd"
  | "interpolateViridis" | "interpolatePlasma" | "interpolateInferno"
  | "interpolateMagma" | "interpolateCividis" | "interpolateWarm"
  | "interpolateCool" | "interpolateTurbo" | "interpolateCubehelix"
  | "interpolateBrBG" | "interpolatePRGn" | "interpolatePiYG"
  | "interpolatePuOr" | "interpolateRdBu" | "interpolateRdGy"
  | "interpolateRdYlBu" | "interpolateRdYlGn" | "interpolateSpectral"
  | "schemeCategory10" | "schemeAccent" | "schemeDark2"
  | "schemePaired" | "schemePastel1" | "schemePastel2"
  | "schemeSet1" | "schemeSet2" | "schemeSet3" | "schemeTableau10";

const tokml = require("tokml");

/**
 * ロガーインターフェース（呼び出し側からオプションで渡す）
 */
export interface ExportLogger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
}

/**
 * カラースキームがdivergingかどうかを判定
 */
function isDivergingColorScheme(colorScheme: string): boolean {
  const lowerScheme = colorScheme.toLowerCase();
  return lowerScheme.includes("rdbu") ||
         lowerScheme.includes("brbg") ||
         lowerScheme.includes("prgn") ||
         lowerScheme.includes("piyg") ||
         lowerScheme.includes("puor") ||
         lowerScheme.includes("rdgy") ||
         lowerScheme.includes("rdylbu") ||
         lowerScheme.includes("rdylgn") ||
         lowerScheme.includes("spectral");
}

/**
 * カラースケールを作成（divergingスキームに対応）
 */
function createColorScale(
  values: number[],
  colorScheme: string,
  minValue?: number,
  maxValue?: number
): (value: number) => string {
  const sortedValues = [...values].sort((a, b) => a - b);
  const minVal = minValue !== undefined ? minValue : (sortedValues.length > 0 ? sortedValues[0] : 0);
  const maxVal = maxValue !== undefined ? maxValue : (sortedValues.length > 0 ? sortedValues[sortedValues.length - 1] : 0);

  const interpolator = (d3 as any)[colorScheme] || d3.interpolateBlues;

  // divergingスキームの場合、中心を1に設定して絶対値でドメインを揃える
  if (isDivergingColorScheme(colorScheme)) {
    const center = 1;
    const maxAbs = Math.max(...values.map(v => Math.abs(v - center)));
    return d3.scaleDiverging(interpolator)
      .domain([center - maxAbs, center, center + maxAbs]) as unknown as (value: number) => string;
  } else {
    return d3.scaleSequential(interpolator).domain([minVal, maxVal]) as unknown as (value: number) => string;
  }
}

/**
 * GeoJSONエクスポートオプション
 */
export interface ExportGeoJsonOptions {
  /** 入力TopoJSONファイルのパス */
  inputTopoJsonPath: string;
  /** 出力GeoJSONファイルのパス */
  outputGeoJsonPath: string;
  /** TopoJSONのobjectキー（デフォルト: "pref"） */
  objectKey?: string;
  /** ロガー（オプション） */
  logger?: ExportLogger;
}

/**
 * KMLエクスポートオプション
 */
export interface ExportKmlOptions {
  /** 入力TopoJSONファイルのパス */
  inputTopoJsonPath: string;
  /** 出力KMLファイルのパス */
  outputKmlPath: string;
  /** TopoJSONのobjectキー（デフォルト: "pref"） */
  objectKey?: string;
  /** 色計算に使用する値フィールド名（デフォルト: "value"） */
  valueField?: string;
  /** 色スケールの最小値（自動計算する場合はundefined） */
  minValue?: number;
  /** 色スケールの最大値（自動計算する場合はundefined） */
  maxValue?: number;
  /** 色スケールの補間関数（デフォルト: d3.interpolateReds） */
  colorInterpolator?: (t: number) => string;
  /** D3.jsカラースキーム（デフォルト: "interpolateBlues"） */
  colorScheme?: D3ColorScheme;
  /** デフォルト色（値がない場合、デフォルト: "#cccccc"） */
  defaultColor?: string;
  /** 塗りつぶしの不透明度（デフォルト: 0.8） */
  fillOpacity?: number;
  /** 境界線の色（デフォルト: "#555555"） */
  strokeColor?: string;
  /** 境界線の幅（デフォルト: 1） */
  strokeWidth?: number;
  /** KMLドキュメント名 */
  documentName?: string;
  /** KMLドキュメントの説明 */
  documentDescription?: string;
  /** 説明文を生成する関数（オプション） */
  generateDescription?: (feature: Feature) => string;
  /** 都道府県名フィールド（デフォルト: "areaName"） */
  nameField?: string;
  /** 順位フィールド（オプション） */
  rankField?: string;
  /** 3D表示を有効にするか（デフォルト: false） */
  enable3D?: boolean;
  /** 高度モード（"relativeToGround" | "absolute" | "relativeToSeaFloor"、デフォルト: "relativeToGround"） */
  altitudeMode?: "relativeToGround" | "absolute" | "relativeToSeaFloor";
  /** ロガー（オプション） */
  logger?: ExportLogger;
}

/**
 * SVGエクスポートオプション
 */
export interface ExportSvgOptions {
  /** 入力TopoJSONファイルのパス */
  inputTopoJsonPath: string;
  /** 出力SVGファイルのパス（ヒートマップ） */
  outputSvgPath: string;
  /** TopoJSONのobjectキー（デフォルト: "pref"） */
  objectKey?: string;
  /** 色計算に使用する値フィールド名（デフォルト: "value"） */
  valueField?: string;
  /** D3.jsカラースキーム（デフォルト: "interpolateBlues"） */
  colorScheme?: D3ColorScheme;
  /** デフォルト色（値がない場合、デフォルト: "#cccccc"） */
  defaultColor?: string;
  /** 境界線の色（デフォルト: "#555555"） */
  strokeColor?: string;
  /** 境界線の幅（デフォルト: 1） */
  strokeWidth?: number;
  /** SVGの幅（デフォルト: 1000） */
  width?: number;
  /** SVGの高さ（デフォルト: 1000） */
  height?: number;
  /** 地方ごとにグループ化するか（デフォルト: true） */
  groupByRegion?: boolean;
  /** ロガー（オプション） */
  logger?: ExportLogger;
}

/**
 * 都道府県コードから地方名を取得
 */
function getRegionName(areaCode: string): string {
  const code = parseInt(areaCode.substring(0, 2), 10);
  const regions: Record<string, number[]> = {
    Hokkaido: [1],
    Tohoku: [2, 3, 4, 5, 6, 7],
    Kanto: [8, 9, 10, 11, 12, 13, 14],
    Chubu: [15, 16, 17, 18, 19, 20, 21, 22, 23],
    Kansai: [24, 25, 26, 27, 28, 29, 30],
    Chugoku: [31, 32, 33, 34, 35],
    Shikoku: [36, 37, 38, 39],
    Kyushu: [40, 41, 42, 43, 44, 45, 46, 47],
  };
  
  for (const [region, codes] of Object.entries(regions)) {
    if (codes.includes(code)) {
      return region;
    }
  }
  return "Other";
}


/**
 * 色文字列をWeb標準のHex形式（#RRGGBB）に変換
 * tokmlライブラリはWeb標準のカラーコードを期待し、内部でKML形式に自動変換します
 * 
 * @param colorStr 任意の色形式（rgb, hexなど）
 * @returns Hex形式のカラーコード（例: "#ff0000"）
 */
function toHexColor(colorStr: string): string {
  const c = d3.color(colorStr);
  if (!c) {
    return "#cccccc"; // デフォルト色
  }
  return c.formatHex(); // #RRGGBB 形式を返す
}

/**
 * TopoJSONをGeoJSONに変換して保存
 * 
 * @param options エクスポートオプション
 * @throws {Error} TopoJSONファイルが見つからない場合、または変換エラー
 */
export async function exportTopoJsonToGeoJson(
  options: ExportGeoJsonOptions
): Promise<void> {
  const {
    inputTopoJsonPath,
    outputGeoJsonPath,
    objectKey = "pref",
    logger,
  } = options;

  // TopoJSONファイルの存在確認
  if (!fs.existsSync(inputTopoJsonPath)) {
    throw new Error(`TopoJSONファイルが見つかりません: ${inputTopoJsonPath}`);
  }

  // TopoJSONファイルを読み込む
  const topoJsonContent = fs.readFileSync(inputTopoJsonPath, "utf-8");
  const topoJson: TopoJSONTopology = JSON.parse(topoJsonContent);

  // TopoJSONからGeoJSONに変換
  let geoJson: FeatureCollection;
  try {
    const prefObject = topoJson.objects[objectKey];
    if (!prefObject) {
      throw new Error(`TopoJSONにobjectキー "${objectKey}" が見つかりません`);
    }

    geoJson = topojson.feature(
      topoJson as any,
      prefObject as any
    ) as unknown as FeatureCollection;
  } catch (error) {
    throw new Error(
      `TopoJSONの変換エラー: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // 不要な属性を削除
  geoJson.features.forEach((feature) => {
    const props = feature.properties || {};
    delete props["N03_007"];
    delete props["N03_001"];
    delete props["description"];
  });

  // 出力ディレクトリを作成
  const outputDir = path.dirname(outputGeoJsonPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // GeoJSONを保存
  fs.writeFileSync(
    outputGeoJsonPath,
    JSON.stringify(geoJson, null, 2),
    "utf8"
  );

  logger?.info(`GeoJSONを保存しました: ${outputGeoJsonPath}`);
  logger?.info(`  - フィーチャー数: ${geoJson.features.length}`);
}

/**
 * TopoJSONを色付きKMLに変換して保存
 * 
 * @param options エクスポートオプション
 * @throws {Error} TopoJSONファイルが見つからない場合、または変換エラー
 */
export async function exportTopoJsonToKml(
  options: ExportKmlOptions
): Promise<void> {
  const {
    inputTopoJsonPath,
    outputKmlPath,
    objectKey = "pref",
    valueField = "value",
    minValue,
    maxValue,
    colorInterpolator = d3.interpolateReds,
    colorScheme = "interpolateBlues",
    defaultColor = "#cccccc",
    fillOpacity = 0.8,
    strokeColor = "#555555",
    strokeWidth = 1,
    documentName = "都道府県データ",
    documentDescription = "stats47作成",
    generateDescription,
    nameField = "areaName",
    rankField,
    enable3D = true,
    altitudeMode = "relativeToGround",
    logger,
  } = options;

  // TopoJSONファイルの存在確認
  if (!fs.existsSync(inputTopoJsonPath)) {
    throw new Error(`TopoJSONファイルが見つかりません: ${inputTopoJsonPath}`);
  }

  // TopoJSONファイルを読み込む
  const topoJsonContent = fs.readFileSync(inputTopoJsonPath, "utf-8");
  const topoJson: TopoJSONTopology = JSON.parse(topoJsonContent);

  // TopoJSONからGeoJSONに変換
  let geoJson: FeatureCollection;
  try {
    const prefObject = topoJson.objects[objectKey];
    if (!prefObject) {
      throw new Error(`TopoJSONにobjectキー "${objectKey}" が見つかりません`);
    }

    geoJson = topojson.feature(
      topoJson as any,
      prefObject as any
    ) as unknown as FeatureCollection;
  } catch (error) {
    throw new Error(
      `TopoJSONの変換エラー: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // 値の範囲を計算（D3.jsカラースキームベースの色分け用）
  const values: number[] = [];
  geoJson.features.forEach((feature) => {
    const props = feature.properties || {};
    const value = props[valueField];
    if (typeof value === "number" && !isNaN(value)) {
      values.push(value);
    }
  });

  // D3.jsカラースキームを使用してカラースケールを作成（divergingスキーム対応）
  const colorScale = createColorScale(values, colorScheme, minValue, maxValue);

  // 高さスケールを作成（3D表示が有効な場合、偏差値ベースで自動計算）
  let altitudeScale: ((value: number) => number) | null = null;
  if (enable3D && values.length > 0) {
    // 全国データを除外して偏差値を計算
    const prefectureFeatures = geoJson.features.filter((feature) => {
      const props = feature.properties || {};
      const areaCode = props.areaCode || "";
      return areaCode !== "00000";
    });

    // 都道府県データの値のみを取得
    const prefectureValues: number[] = [];
    prefectureFeatures.forEach((feature) => {
      const props = feature.properties || {};
      const value = props[valueField];
      if (typeof value === "number" && !isNaN(value)) {
        prefectureValues.push(value);
      }
    });

    if (prefectureValues.length > 0) {
      // 平均値と標準偏差を計算
      const mean = prefectureValues.reduce((sum, v) => sum + v, 0) / prefectureValues.length;
      const variance = prefectureValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / prefectureValues.length;
      const stdDev = Math.sqrt(variance);

      // 偏差値を計算する関数
      const calculateDeviationValue = (value: number): number => {
        if (stdDev === 0 || isNaN(value)) {
          return 50; // 標準偏差が0の場合は偏差値50を返す
        }
        return ((value - mean) / stdDev) * 10 + 50;
      };

      // 各都道府県の偏差値を計算
      const deviationValues = prefectureValues.map(calculateDeviationValue);

      // 高さスケール: 偏差値 × 500（メートル）
      // 値から偏差値を計算し、偏差値×500で高さを決定
      altitudeScale = (value: number): number => {
        const deviationValue = calculateDeviationValue(value);
        return deviationValue * 500;
      };
    }
  }

  // 各FeatureにKML用のスタイル情報を追加
  geoJson.features.forEach((feature) => {
    const props = feature.properties || {};
    const value = props[valueField];
    const name = props[nameField] || "不明";
    const rank = rankField ? props[rankField] : undefined;

    // 色を計算
    let hexColor: string;
    if (typeof value === "number" && !isNaN(value)) {
      // D3.jsカラースキームから色を取得
      const color = colorScale(value);
      hexColor = toHexColor(color);
    } else {
      // 値がない場合はデフォルト色
      hexColor = toHexColor(defaultColor);
    }

    // KML用のスタイル情報を追加 (simplestyle spec)
    // tokmlは #RRGGBB を受け取り、内部でKMLのAABBGGRRに変換します
    props["fill"] = hexColor;
    props["fill-opacity"] = fillOpacity;
    props["stroke"] = strokeColor;
    props["stroke-width"] = strokeWidth;

    // 3D表示が有効な場合、座標に高さ情報を追加
    if (enable3D && altitudeScale && typeof value === "number" && !isNaN(value)) {
      const altitude = altitudeScale(value);
      
      // GeoJSONの座標構造に応じて高さを追加
      if (feature.geometry.type === "Polygon") {
        const polygon = feature.geometry as Polygon;
        polygon.coordinates = polygon.coordinates.map((ring) =>
          ring.map((coord) => [coord[0], coord[1], altitude])
        );
      } else if (feature.geometry.type === "MultiPolygon") {
        const multiPolygon = feature.geometry as MultiPolygon;
        multiPolygon.coordinates = multiPolygon.coordinates.map((polygon) =>
          polygon.map((ring) =>
            ring.map((coord) => [coord[0], coord[1], altitude])
          )
        );
      }
    }

    // 不要な属性を削除
    delete props["N03_007"];
    delete props["N03_001"];
    delete props["description"];
  });

  // KML文字列に変換
  let kmlString = tokml(geoJson, {
    documentName,
    documentDescription,
    simplestyle: true, // propertiesのスタイル設定（fillなど）を有効化
  });

  // 3D表示が有効な場合、altitudeModeとextrudeを追加
  if (enable3D) {
    // 正規表現を使用して各Polygonタグの直後にaltitudeModeとextrudeを追加
    // 既存のaltitudeModeとextrudeを削除
    kmlString = kmlString.replace(/<altitudeMode>.*?<\/altitudeMode>/g, "");
    kmlString = kmlString.replace(/<extrude>.*?<\/extrude>/g, "");
    
    // 各<Polygon>タグの直後に<altitudeMode>と<extrude>を追加
    kmlString = kmlString.replace(
      /(<Polygon>)/g,
      `$1\n        <altitudeMode>${altitudeMode}</altitudeMode>\n        <extrude>1</extrude>`
    );
  }

  // 出力ディレクトリを作成
  const outputDir = path.dirname(outputKmlPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // KMLを保存
  fs.writeFileSync(outputKmlPath, kmlString, "utf8");

  logger?.info(`KMLを保存しました: ${outputKmlPath}`);
  logger?.info(`  - フィーチャー数: ${geoJson.features.length}`);
  if (values.length > 0) {
    logger?.info(`  - 値の範囲: ${Math.min(...values).toLocaleString()} ～ ${Math.max(...values).toLocaleString()}`);
  }
}

/**
 * TopoJSONを色付きSVGに変換して保存
 * デザイナー・クリエイター向け：Adobe IllustratorやFigmaで編集できるベクター地図素材
 * 
 * @param options エクスポートオプション
 * @throws {Error} TopoJSONファイルが見つからない場合、または変換エラー
 */
export async function exportTopoJsonToSvg(
  options: ExportSvgOptions
): Promise<void> {
  const {
    inputTopoJsonPath,
    outputSvgPath,
    objectKey = "pref",
    valueField = "value",
    colorScheme = "interpolateBlues",
    defaultColor = "#cccccc",
    strokeColor = "#555555",
    strokeWidth = 1,
    width = 1000,
    height = 1000,
    groupByRegion = true,
    logger,
  } = options;

  // TopoJSONファイルの存在確認
  if (!fs.existsSync(inputTopoJsonPath)) {
    throw new Error(`TopoJSONファイルが見つかりません: ${inputTopoJsonPath}`);
  }

  // TopoJSONファイルを読み込む
  const topoJsonContent = fs.readFileSync(inputTopoJsonPath, "utf-8");
  const topoJson: TopoJSONTopology = JSON.parse(topoJsonContent);

  // TopoJSONからGeoJSONに変換
  let geoJson: FeatureCollection;
  try {
    const prefObject = topoJson.objects[objectKey];
    if (!prefObject) {
      throw new Error(`TopoJSONにobjectキー "${objectKey}" が見つかりません`);
    }

    geoJson = topojson.feature(
      topoJson as any,
      prefObject as any
    ) as unknown as FeatureCollection;
  } catch (error) {
    throw new Error(
      `TopoJSONの変換エラー: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // 不要な属性を削除
  geoJson.features.forEach((feature) => {
    const props = feature.properties || {};
    delete props["N03_007"];
    delete props["N03_001"];
    delete props["description"];
  });

  // 値の範囲を計算（D3.jsカラースキームベースの色分け用）
  const values: number[] = [];
  geoJson.features.forEach((feature) => {
    const props = feature.properties || {};
    const value = props[valueField];
    if (typeof value === "number" && !isNaN(value)) {
      values.push(value);
    }
  });

  // D3.jsカラースキームを使用してカラースケールを作成（divergingスキーム対応）
  const colorScale = createColorScale(values, colorScheme);

  // jsdomで仮想DOMを作成
  const dom = new JSDOM();
  const document = dom.window.document;

  // 投影法を設定（日本全体が収まるように）
  const projection = d3.geoMercator().fitSize([width, height], geoJson);
  const pathGenerator = d3.geoPath().projection(projection);

  // SVG要素を作成
  const svg = d3.select(document.body)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  // 地方ごとにグループ化する場合
  if (groupByRegion) {
    const regionGroups = new Map<string, Feature[]>();
    
    geoJson.features.forEach((feature) => {
      const props = feature.properties || {};
      const areaCode = props.areaCode || "";
      const region = getRegionName(areaCode);
      
      if (!regionGroups.has(region)) {
        regionGroups.set(region, []);
      }
      regionGroups.get(region)!.push(feature);
    });

    // 地方ごとにグループを作成
    regionGroups.forEach((features, region) => {
      const regionGroup = svg.append("g").attr("id", region);
      
      features.forEach((feature) => {
        const props = feature.properties || {};
        const areaCode = props.areaCode || "";
        const areaName = props.areaName || "";
        const value = props[valueField];
        
        // 色を計算
        let fillColor: string;
        if (typeof value === "number" && !isNaN(value)) {
          // D3.jsカラースキームから色を取得
          const color = colorScale(value);
          fillColor = toHexColor(color);
        } else {
          fillColor = toHexColor(defaultColor);
        }

        // パスを追加（県名IDを付与）
        regionGroup
          .append("path")
          .attr("id", `pref-${areaCode}`)
          .attr("data-name", areaName)
          .attr("d", pathGenerator(feature as any))
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", strokeWidth);
      });
    });
  } else {
    // グループ化しない場合
    geoJson.features.forEach((feature) => {
      const props = feature.properties || {};
      const areaCode = props.areaCode || "";
      const areaName = props.areaName || "";
      const value = props[valueField];
      
      // 色を計算
      let fillColor: string;
      if (typeof value === "number" && !isNaN(value)) {
        // D3.jsカラースキームから色を取得
        const color = colorScale(value);
        fillColor = toHexColor(color);
      } else {
        fillColor = toHexColor(defaultColor);
      }

      // パスを追加
      svg
        .append("path")
        .attr("id", `pref-${areaCode}`)
        .attr("data-name", areaName)
        .attr("d", pathGenerator(feature as any))
        .attr("fill", fillColor)
        .attr("stroke", strokeColor)
        .attr("stroke-width", strokeWidth);
    });
  }

  // SVG文字列を取得
  const svgString = document.body.innerHTML;

  // 出力ディレクトリを作成
  const outputDir = path.dirname(outputSvgPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // SVGを保存
  fs.writeFileSync(outputSvgPath, svgString, "utf8");

  logger?.info(`SVGを保存しました: ${outputSvgPath}`);
  logger?.info(`  - フィーチャー数: ${geoJson.features.length}`);
  if (values.length > 0) {
    logger?.info(`  - 値の範囲: ${Math.min(...values).toLocaleString()} ～ ${Math.max(...values).toLocaleString()}`);
  }
}

/**
 * CSVエクスポートオプション
 */
export interface ExportCsvOptions {
  /** JSONデータの配列 */
  data: Array<Record<string, any>>;
  /** 出力CSVファイルのパス */
  outputCsvPath: string;
  /** 都道府県コードフィールド名（デフォルト: "areaCode"） */
  areaCodeField?: string;
  /** 都道府県名フィールド名（デフォルト: "areaName"） */
  areaNameField?: string;
  /** 値フィールド名（デフォルト: "value"） */
  valueField?: string;
  /** 順位フィールド名（オプション） */
  rankField?: string;
  /** 単位フィールド名（オプション） */
  unitField?: string;
  /** ソート方法（"rank" | "areaCode"、デフォルト: "rank"） */
  sortBy?: "rank" | "areaCode";
  /** ロガー（オプション） */
  logger?: ExportLogger;
}

/**
 * JSONデータをCSV形式に変換して保存
 * 
 * @param options エクスポートオプション
 * @throws {Error} データが空の場合、またはファイル保存エラー
 */
export async function exportDataToCsv(
  options: ExportCsvOptions
): Promise<void> {
  const {
    data,
    outputCsvPath,
    areaCodeField = "areaCode",
    areaNameField = "areaName",
    valueField = "value",
    rankField,
    unitField,
    sortBy = "rank",
    logger,
  } = options;

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("データが空です");
  }

  // 偏差値計算用：全国データ（areaCode: "00000"）を除外
  const prefectureData = data.filter(
    (item) => item[areaCodeField] !== "00000"
  );

  // 平均値と標準偏差を計算
  let mean = 0;
  let stdDev = 0;
  if (prefectureData.length > 0) {
    const values = prefectureData
      .map((item) => {
        const val = item[valueField];
        return typeof val === "number" ? val : parseFloat(String(val)) || 0;
      })
      .filter((v) => !isNaN(v));

    if (values.length > 0) {
      mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance =
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
        values.length;
      stdDev = Math.sqrt(variance);
    }
  }

  // 偏差値を計算する関数
  const calculateDeviationValue = (value: number): string => {
    if (stdDev === 0 || isNaN(value)) {
      return "";
    }
    const deviationValue = ((value - mean) / stdDev) * 10 + 50;
    return String(Math.round(deviationValue * 10) / 10);
  };

  // CSVヘッダー（列順序：都道府県コード、都道府県名、値、単位、順位、偏差値）
  const headers = ["都道府県コード", "都道府県名", "値"];
  if (unitField) {
    headers.push("単位");
  }
  if (rankField) {
    headers.push("順位");
  }
  headers.push("偏差値");
  const csvRows: string[] = [headers.join(",")];

  // データをソート
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === "rank" && rankField) {
      const aRank = a[rankField];
      const bRank = b[rankField];
      if (aRank !== undefined && bRank !== undefined) {
        return (aRank as number) - (bRank as number);
      }
    }
    // 順位がない場合、またはareaCodeでソートする場合
    const aCode = a[areaCodeField] || "";
    const bCode = b[areaCodeField] || "";
    return aCode.localeCompare(bCode);
  });

  // CSVエスケープ関数
  const escapeCsv = (str: string): string => {
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // CSV行を生成
  sortedData.forEach((item) => {
    const areaCode = item[areaCodeField] || "";
    const areaName = item[areaNameField] || "";
    const value = item[valueField] !== undefined ? String(item[valueField]) : "";
    const unit = unitField && item[unitField] ? String(item[unitField]) : "";
    const rank = rankField && item[rankField] !== undefined ? item[rankField] : null;
    const rankText = rank !== null ? `${rank}位` : "";
    
    // 偏差値を計算（全国データの場合は空文字）
    const numericValue =
      typeof item[valueField] === "number"
        ? item[valueField]
        : parseFloat(String(item[valueField])) || 0;
    const deviationValue =
      areaCode === "00000" ? "" : calculateDeviationValue(numericValue);

    const row: string[] = [
      escapeCsv(areaCode),
      escapeCsv(areaName),
      escapeCsv(value),
    ];

    if (unitField) {
      row.push(escapeCsv(unit));
    }
    if (rankField) {
      row.push(escapeCsv(rankText));
    }
    row.push(escapeCsv(deviationValue));

    csvRows.push(row.join(","));
  });

  // 出力ディレクトリを作成
  const outputDir = path.dirname(outputCsvPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ファイル名を生成（拡張子を除いたベース名を取得）
  const baseName = path.basename(outputCsvPath, ".csv");
  const utf8Path = path.join(outputDir, `${baseName}【utf-8】.csv`);
  const sjisPath = path.join(outputDir, `${baseName}【sjis】.csv`);

  // CSVコンテンツを生成
  const csvContent = csvRows.join("\n");

  // UTF-8版のCSVファイルを保存
  fs.writeFileSync(utf8Path, csvContent, "utf8");

  // Shift-JIS版のCSVファイルを保存
  const sjisBuffer = iconv.encode(csvContent, "shift_jis");
  fs.writeFileSync(sjisPath, sjisBuffer);

  logger?.info(`CSVを保存しました:`);
  logger?.info(`  - UTF-8版: ${utf8Path}`);
  logger?.info(`  - Shift-JIS版: ${sjisPath}`);
  logger?.info(`  - レコード数: ${sortedData.length}`);
}
