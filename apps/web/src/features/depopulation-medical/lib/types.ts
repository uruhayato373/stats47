// 過疎地域 × 医療機関 掛け合わせ demo の共有型 + R2 キー。
// server-only に依存しないため client / server 双方から import 可能。

export const DEPOPULATION_MEDICAL_SUMMARY_KEY =
  "app/gis-cross/depopulation-medical/summary.json";

export function depopulationMedicalPrefKey(prefCode2: string): string {
  return `app/gis-cross/depopulation-medical/pref/${prefCode2}.json`;
}

/** 47 県サマリの 1 県分 (choropleth + ランキング表用) */
export interface DepopulationMedicalPref {
  prefCode: string; // 5 桁 (例 "13000")
  prefName: string;
  depopulationFacilities: number; // 過疎地域内の医療機関数
  totalFacilities: number; // 県内全医療機関数
  outsideFacilities: number; // 過疎地域外
  ratio: number; // depopulation / total (0-1)
}

export interface DepopulationMedicalSummary {
  generatedAt: string;
  prefectures: DepopulationMedicalPref[];
}

/** 県別詳細 (オーバーレイマップ用、server action で遅延取得) */
export interface DepopulationMedicalFacility {
  lon: number;
  lat: number;
  name: string;
  departments: string;
  inDepopulationArea: boolean;
}

export interface DepopulationMedicalPrefDetail {
  prefCode: string;
  prefName: string;
  depopulationAreas: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
      properties: { municipality: string };
    }>;
  };
  facilities: DepopulationMedicalFacility[];
}
