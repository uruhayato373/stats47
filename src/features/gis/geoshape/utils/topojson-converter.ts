/**
 * Geoshapeドメイン - TopoJSON変換ユーティリティ
 * TopoJSONをGeoJSONに変換する機能を提供
 */

import * as topojson from "topojson-client";
import type {
  TopoJSONTopology,
  PrefectureFeatureCollection,
  PrefectureFeature,
} from "../types";

/**
 * TopoJSON変換クラス
 */
export class TopojsonConverter {
  /**
   * TopoJSONをGeoJSON FeatureCollectionに変換
   * @param topology TopoJSONトポロジー
   * @returns GeoJSON FeatureCollection
   */
  static toGeoJSON(topology: TopoJSONTopology): PrefectureFeatureCollection {
    // TopoJSONオブジェクトの最初のキーを取得
    const objectName = Object.keys(topology.objects)[0];

    if (!objectName) {
      throw new Error("TopoJSON objects is empty");
    }

    // topojson-clientライブラリで変換
    const geojson = topojson.feature(
      topology as any,
      topology.objects[objectName] as any
    ) as GeoJSON.FeatureCollection;

    // 都道府県コードと名前を正規化
    const features = geojson.features.map((feature) => {
      const properties = feature.properties || {};

      // プロパティから都道府県コードと名前を抽出
      // Geoshapeデータの実際の構造に応じて調整が必要
      const prefCode = this.extractPrefCode(properties);
      const prefName = this.extractPrefName(properties);

      return {
        ...feature,
        properties: {
          ...properties,
          prefCode,
          prefName,
        },
      } as PrefectureFeature;
    });

    return {
      type: "FeatureCollection",
      features,
    };
  }

  /**
   * 都道府県コードを抽出（5桁形式に正規化）
   * @param properties Featureプロパティ
   * @returns 都道府県コード
   */
  private static extractPrefCode(properties: Record<string, any>): string {
    // Geoshapeデータの構造に基づいて抽出
    // N03_001: 都道府県名
    // N03_007: 都道府県コード（2桁）
    const code = properties.N03_007 || properties.prefCode || properties.code;

    if (!code) {
      console.warn("Prefecture code not found in properties", properties);
      return "00000";
    }

    // 2桁コードを5桁に変換（例: "01" -> "01000"）
    const codeStr = String(code).padStart(2, "0");
    return `${codeStr}000`;
  }

  /**
   * 都道府県名を抽出
   * @param properties Featureプロパティ
   * @returns 都道府県名
   */
  private static extractPrefName(properties: Record<string, any>): string {
    // Geoshapeデータの構造に基づいて抽出
    return (
      properties.N03_001 ||
      properties.prefName ||
      properties.name ||
      "不明"
    );
  }

  /**
   * GeoJSONをTopoJSONに変換（将来の機能）
   * @param geojson GeoJSON FeatureCollection
   * @returns TopoJSONトポロジー
   */
  static toTopoJSON(
    geojson: PrefectureFeatureCollection
  ): TopoJSONTopology {
    // topojson-serverライブラリが必要（オプション）
    throw new Error("TopoJSON conversion not implemented yet");
  }

  /**
   * TopoJSON の妥当性を検証
   * @param topology TopoJSONトポロジー
   * @returns 妥当性チェック結果
   */
  static validate(topology: any): topology is TopoJSONTopology {
    return (
      topology &&
      topology.type === "Topology" &&
      topology.objects &&
      typeof topology.objects === "object" &&
      Array.isArray(topology.arcs)
    );
  }
}

