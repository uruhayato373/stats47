/**
 * TopoJSONにJSONデータをマージする汎用的な関数
 */

import type { TopoJSONTopology } from "@stats47/types";
import * as fs from "fs";
import * as path from "path";
import { getPrefectureTopojsonPath } from "../server";

/**
 * ロガーインターフェース（呼び出し側からオプションで渡す）
 */
export interface MergeLogger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
}

/**
 * TopoJSONマージオプション
 */
export interface MergeTopoJsonOptions {
  /** 入力TopoJSONファイルのパス（デフォルト: gis/geoshape/prefecture.topojson） */
  inputTopoJsonPath?: string;
  /** 出力TopoJSONファイルのパス */
  outputTopoJsonPath: string;
  /** マージするJSONデータ（areaCodeを持つオブジェクトの配列） */
  data: Array<Record<string, any>>;
  /** 全国データのareaCode（デフォルト: "00000"） */
  nationalAreaCode?: string;
  /** TopoJSONのobjectキー（デフォルト: "pref"） */
  objectKey?: string;
  /** propertiesに追加する際のフィールド名マッピング（オプション） */
  fieldMapping?: Record<string, string>;
  /** ロガー（オプション） */
  logger?: MergeLogger;
}

/**
 * TopoJSONにJSONデータをマージする
 * 
 * @param options マージオプション
 * @throws {Error} TopoJSONファイルが見つからない場合、またはデータにareaCodeが含まれていない場合
 */
export async function mergeTopoJson(
  options: MergeTopoJsonOptions
): Promise<void> {
  const {
    inputTopoJsonPath,
    outputTopoJsonPath,
    data,
    nationalAreaCode = "00000",
    objectKey = "pref",
    fieldMapping,
    logger,
  } = options;

  // 入力TopoJSONファイルのパスを決定
  let topoJsonPath: string;
  if (inputTopoJsonPath) {
    topoJsonPath = inputTopoJsonPath;
  } else {
    topoJsonPath = getPrefectureTopojsonPath();
  }

  // TopoJSONファイルの存在確認
  if (!fs.existsSync(topoJsonPath)) {
    throw new Error(`TopoJSONファイルが見つかりません: ${topoJsonPath}`);
  }

  // TopoJSONファイルを読み込む
  const topoJsonContent = fs.readFileSync(topoJsonPath, "utf-8");
  const topoJson: TopoJSONTopology = JSON.parse(topoJsonContent);

  // データのバリデーション
  if (!Array.isArray(data)) {
    throw new Error("データは配列である必要があります");
  }

  if (data.length === 0) {
    throw new Error("データが空です");
  }

  // 最初のデータにareaCodeが含まれているか確認
  const firstData = data[0];
  if (!firstData || typeof firstData !== "object" || !("areaCode" in firstData)) {
    throw new Error("データにareaCodeフィールドが含まれていません");
  }

  // JSONデータをareaCodeをキーにしたMapに変換（全国データを除外）
  const dataMap = new Map<string, Record<string, any>>();
  const unmatchedAreaCodes: string[] = [];

  data.forEach((item) => {
    const areaCode = item.areaCode;
    if (typeof areaCode !== "string") {
      logger?.warn(`警告: areaCodeが文字列ではありません。スキップします: ${JSON.stringify(item)}`);
      return;
    }

    // 全国データを除外
    if (areaCode === nationalAreaCode) {
      return;
    }

    dataMap.set(areaCode, item);
  });

  // TopoJSONのobjectsを取得
  const objects = topoJson.objects;
  if (!objects || typeof objects !== "object") {
    throw new Error("TopoJSONにobjectsが含まれていません");
  }

  // 指定されたobjectキーを取得
  const prefObject = objects[objectKey];
  if (!prefObject) {
    throw new Error(`TopoJSONにobjectキー "${objectKey}" が見つかりません`);
  }

  // GeometryCollectionの場合
  if (prefObject.type === "GeometryCollection" && prefObject.geometries) {
    const geometries = prefObject.geometries;
    let matchedCount = 0;
    let unmatchedCount = 0;

    // 各geometryにデータをマージ
    geometries.forEach((geometry: any, index: number) => {
      // 既存のpropertiesを取得
      const existingProperties = geometry.properties || {};

      // areaCodeを取得（既存のpropertiesから、または生成）
      let areaCode: string | undefined;

      // 既存のpropertiesにareaCodeがある場合
      if (existingProperties.areaCode) {
        areaCode = String(existingProperties.areaCode);
      } else {
        // TopoJSONのgeometry順序からareaCodeを生成（1-47を2桁の文字列に変換して"000"を追加）
        const prefCode = String(index + 1).padStart(2, "0");
        areaCode = `${prefCode}000`;
      }

      // データを取得
      const dataItem = dataMap.get(areaCode);

      if (dataItem) {
        // フィールド名マッピングを適用
        const mergedProperties: Record<string, any> = { ...existingProperties };

        // JSONデータの全フィールドをpropertiesに追加
        Object.keys(dataItem).forEach((key) => {
          const mappedKey = fieldMapping?.[key] || key;
          mergedProperties[mappedKey] = dataItem[key];
        });

        // areaCodeを確実に設定
        mergedProperties.areaCode = areaCode;

        // 不要な属性を削除
        delete mergedProperties["N03_007"];
        delete mergedProperties["N03_001"];
        delete mergedProperties["description"];

        geometry.properties = mergedProperties;
        matchedCount++;
      } else {
        // マッチしない場合
        unmatchedCount++;
        unmatchedAreaCodes.push(areaCode);
        
        // areaCodeが既存のpropertiesにない場合は設定
        if (!existingProperties.areaCode) {
          const props = {
            ...existingProperties,
            areaCode: areaCode,
          };
          // 不要な属性を削除
          delete props["N03_007"];
          delete props["N03_001"];
          delete props["description"];
          geometry.properties = props;
        } else {
          // areaCodeが既にある場合も不要な属性を削除
          delete existingProperties["N03_007"];
          delete existingProperties["N03_001"];
          delete existingProperties["description"];
        }
      }
    });

    // 結果をログ出力
    logger?.info(`マージ完了:`);
    logger?.info(`  - マッチした都道府県: ${matchedCount}`);
    logger?.info(`  - マッチしなかった都道府県: ${unmatchedCount}`);

    if (unmatchedAreaCodes.length > 0) {
      logger?.warn(`警告: 以下のareaCodeのデータが見つかりませんでした: ${unmatchedAreaCodes.join(", ")}`);
    }

    // データに含まれているが、TopoJSONにマッチしないareaCodeを確認
    const topoAreaCodes = new Set(
      geometries.map((g: any, i: number) => {
        const props = g.properties || {};
        return props.areaCode || `${String(i + 1).padStart(2, "0")}000`;
      })
    );

    const unmatchedDataAreaCodes: string[] = [];
    dataMap.forEach((_, areaCode) => {
      if (!topoAreaCodes.has(areaCode)) {
        unmatchedDataAreaCodes.push(areaCode);
      }
    });

    if (unmatchedDataAreaCodes.length > 0) {
      logger?.warn(`警告: データに含まれているが、TopoJSONにマッチしないareaCode: ${unmatchedDataAreaCodes.join(", ")}`);
    }
  } else {
    throw new Error(`TopoJSONのobject "${objectKey}" はGeometryCollectionではありません`);
  }

  // マージされたTopoJSONを保存
  const outputDir = path.dirname(outputTopoJsonPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    outputTopoJsonPath,
    JSON.stringify(topoJson, null, 2),
    "utf8"
  );

  logger?.info(`マージされたTopoJSONを保存しました: ${outputTopoJsonPath}`);
}
