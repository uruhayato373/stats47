/**
 * TopoJSON型定義
 * 日本の都道府県境界データ（jp_pref.l.topojson）用の型定義
 */

// 基本の座標型
export type Coordinate = [number, number];

// アーク（弧）の型
export type Arc = Coordinate[];

// メタデータの型
export interface TopoJSONMetadata {
  type: string[];
  "dc:title": string;
  "dc:source": string;
  "dc:issued": string;
  "dc:subject": string[];
  "cc:license": string;
  "cc:useGuidelines": string;
  "cc:attributionText": string;
  "cc:attributionURL": string;
}

// 変換情報の型
export interface TopoJSONTransform {
  scale: [number, number];
  translate: [number, number];
}

// 都道府県のプロパティ型
export interface PrefectureProperties {
  N03_001: string; // 都道府県名
  N03_007: string; // 都道府県コード
}

// MultiPolygonジオメトリの型
export interface MultiPolygonGeometry {
  type: "MultiPolygon";
  arcs: number[][][];
  id: string;
  properties: PrefectureProperties;
}

// GeometryCollectionの型
export interface GeometryCollection {
  type: "GeometryCollection";
  geometries: MultiPolygonGeometry[];
}

// 都道府県オブジェクトの型（topojson-clientとの互換性のため）
export interface PrefectureObject {
  [key: string]: GeometryCollection;
  pref: GeometryCollection;
}

// メインのTopoJSON型
export interface JapanPrefectureTopoJSON {
  type: "Topology";
  id: string;
  metadata: TopoJSONMetadata;
  bbox: [number, number, number, number];
  transform: TopoJSONTransform;
  objects: PrefectureObject;
  arcs: Arc[];
}

// 都道府県データの簡易型（アプリケーション用）
export interface PrefectureData {
  id: string;
  name: string;
  code: string;
  geometry: MultiPolygonGeometry;
}

// 都道府県コード定数
export const PREFECTURE_CODES = {
  "01": "北海道",
  "02": "青森県",
  "03": "岩手県",
  "04": "宮城県",
  "05": "秋田県",
  "06": "山形県",
  "07": "福島県",
  "08": "茨城県",
  "09": "栃木県",
  "10": "群馬県",
  "11": "埼玉県",
  "12": "千葉県",
  "13": "東京都",
  "14": "神奈川県",
  "15": "新潟県",
  "16": "富山県",
  "17": "石川県",
  "18": "福井県",
  "19": "山梨県",
  "20": "長野県",
  "21": "岐阜県",
  "22": "静岡県",
  "23": "愛知県",
  "24": "三重県",
  "25": "滋賀県",
  "26": "京都府",
  "27": "大阪府",
  "28": "兵庫県",
  "29": "奈良県",
  "30": "和歌山県",
  "31": "鳥取県",
  "32": "島根県",
  "33": "岡山県",
  "34": "広島県",
  "35": "山口県",
  "36": "徳島県",
  "37": "香川県",
  "38": "愛媛県",
  "39": "高知県",
  "40": "福岡県",
  "41": "佐賀県",
  "42": "長崎県",
  "43": "熊本県",
  "44": "大分県",
  "45": "宮崎県",
  "46": "鹿児島県",
  "47": "沖縄県",
} as const;

// 都道府県コードの型
export type PrefectureCode = keyof typeof PREFECTURE_CODES;

// 都道府県名の型
export type PrefectureName = (typeof PREFECTURE_CODES)[PrefectureCode];
