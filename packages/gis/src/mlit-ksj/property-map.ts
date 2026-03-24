/**
 * KSJ プロパティ名 → 人間可読名のマッピング
 *
 * 各データセットの属性コード（N02_001 等）を英語名にマッピングする。
 * 参照: https://nlftp.mlit.go.jp/ksj/gml/codelist/shape_property_table2.xlsx
 */

const N02_PROPERTY_MAP: Record<string, string> = {
  N02_001: "railwayType",
  N02_002: "serviceProviderType",
  N02_003: "lineName",
  N02_004: "operatorName",
  N02_005: "stationName",
  N02_005c: "stationCode",
  N02_005g: "stationGroupCode",
};

const S12_PROPERTY_MAP: Record<string, string> = {
  S12_001: "stationName",
  S12_001c: "stationCode",
  S12_001g: "stationGroupCode",
  S12_002: "operatorName",
  S12_003: "lineName",
  S12_004: "railwayType",
  S12_005: "serviceProviderType",
};

const P04_PROPERTY_MAP: Record<string, string> = {
  P04_001: "facilityName",
  P04_002: "facilityType",
  P04_003: "address",
  P04_004: "prefectureCode",
  P04_005: "administratorType",
  P04_006: "beds",
};

const PROPERTY_MAPS: Record<string, Record<string, string>> = {
  N02: N02_PROPERTY_MAP,
  S12: S12_PROPERTY_MAP,
  P04: P04_PROPERTY_MAP,
};

export function getPropertyMap(dataId: string): Record<string, string> {
  return PROPERTY_MAPS[dataId] ?? {};
}
