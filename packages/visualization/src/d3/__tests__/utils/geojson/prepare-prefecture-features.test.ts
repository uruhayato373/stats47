import { describe, it, expect, vi, beforeEach } from 'vitest';
import { preparePrefectureFeatures } from '@/d3/utils/geojson/prepare-prefecture-features';
import type { TopoJSONTopology } from "@stats47/types";
import type { FeatureCollection } from "geojson";
import type { TopojsonModule } from '@/d3/types/d3';

describe('preparePrefectureFeatures', () => {
  let topojsonModuleMock: TopojsonModule;

  beforeEach(() => {
    topojsonModuleMock = {
      feature: vi.fn((topology: any, object: any) => {
        // モックの feature 関数は、入力に基づいて単純な FeatureCollection を返す
        // 実際の topojson.feature の挙動を完全にエミュレートするのではなく、
        // テストに必要なプロパティを持つ GeoJSON を返す
        const features = object.geometries.map((geom: any) => ({
          type: 'Feature',
          properties: geom.properties,
          geometry: {
            type: 'Polygon', // または MultiPolygon
            coordinates: [[[0, 0], [1, 1], [0, 1], [0, 0]]] // ダミー座標
          }
        }));
        return {
          type: 'FeatureCollection',
          features: features
        } as any; // ここを any にキャスト
      }),
      mesh: vi.fn(), // mesh はこのテストでは使用しないが、TopojsonModule には必要
    } as any; // ここを any にキャスト
  });

  // TopoJSON の objects が空の場合、エラーをスローする
  it('should throw an error if TopoJSON objects is empty', () => {
    const emptyTopology: TopoJSONTopology = {
      type: 'Topology',
      objects: {},
      arcs: []
    };
    expect(() => preparePrefectureFeatures(topojsonModuleMock, emptyTopology)).toThrow("TopoJSON objects is empty");
  });

  // N03_007 プロパティから prefCode を正しく変換（ゼロ埋め）
  it('should correctly convert N03_007 to zero-padded prefCode', () => {
    const topology: TopoJSONTopology = {
      type: 'Topology',
      objects: {
        japan: {
          type: 'GeometryCollection',
          geometries: [
            { type: 'Polygon', properties: { N03_007: 1 } },
            { type: 'Polygon', properties: { N03_007: 47 } },
          ]
        }
      },
      arcs: []
    };
    const features = preparePrefectureFeatures(topojsonModuleMock, topology);
    expect(features[0].properties.prefCode).toBe('01000');
    expect(features[1].properties.prefCode).toBe('47000');
  });

  // prefCode, code など複数形式のプロパティキーに対応
  it('should handle multiple property keys for prefCode (prefCode, code)', () => {
    const topology: TopoJSONTopology = {
      type: 'Topology',
      objects: {
        japan: {
          type: 'GeometryCollection',
          geometries: [
            { type: 'Polygon', properties: { prefCode: 2 } },
            { type: 'Polygon', properties: { code: 3 } },
          ]
        }
      },
      arcs: []
    };
    const features = preparePrefectureFeatures(topojsonModuleMock, topology);
    expect(features[0].properties.prefCode).toBe('02000');
    expect(features[1].properties.prefCode).toBe('03000');
  });

  // N03_001, prefName, name から prefName を正しく取得
  it('should correctly get prefName from N03_001, prefName, or name', () => {
    const topology: TopoJSONTopology = {
      type: 'Topology',
      objects: {
        japan: {
          type: 'GeometryCollection',
          geometries: [
            { type: 'Polygon', properties: { N03_001: '北海道' } },
            { type: 'Polygon', properties: { prefName: '青森県' } },
            { type: 'Polygon', properties: { name: '岩手県' } },
          ]
        }
      },
      arcs: []
    };
    const features = preparePrefectureFeatures(topojsonModuleMock, topology);
    expect(features[0].properties.prefName).toBe('北海道');
    expect(features[1].properties.prefName).toBe('青森県');
    expect(features[2].properties.prefName).toBe('岩手県');
  });

  // プロパティが存在しない場合のデフォルト値（"00000", "不明"）
  it('should use default values if properties are missing', () => {
    const topology: TopoJSONTopology = {
      type: 'Topology',
      objects: {
        japan: {
          type: 'GeometryCollection',
          geometries: [
            { type: 'Polygon', properties: {} }, // 全てのプロパティが欠損
          ]
        }
      },
      arcs: []
    };
    const features = preparePrefectureFeatures(topojsonModuleMock, topology);
    expect(features[0].properties.prefCode).toBe('00000');
    expect(features[0].properties.prefName).toBe('不明');
  });

  // 優先順位のテスト (N03_007 > prefCode > code, N03_001 > prefName > name)
  it('should respect property priority for prefCode and prefName', () => {
    const topology: TopoJSONTopology = {
      type: 'Topology',
      objects: {
        japan: {
          type: 'GeometryCollection',
          geometries: [
            { type: 'Polygon', properties: { N03_007: 10, prefCode: 20, code: 30, N03_001: 'A', prefName: 'B', name: 'C' } },
          ]
        }
      },
      arcs: []
    };
    const features = preparePrefectureFeatures(topojsonModuleMock, topology);
    expect(features[0].properties.prefCode).toBe('10000');
    expect(features[0].properties.prefName).toBe('A');
  });
});
