/**
 * 市区町村エンティティ
 */
export interface City {
  /** 市区町村コード（5桁） */
  cityCode: string;
  /** 市区町村名 */
  cityName: string;
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 地域レベル（"2": 都道府県・政令指定都市, "3": 市区町村） */
  level: "2" | "3";
}
