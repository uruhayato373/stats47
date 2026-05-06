import type { AreaProfileData } from "./index";

export function areaProfileKeyPath(areaCode: string): string {
  return `area-profile/${areaCode}.json`;
}

/** @deprecated areaProfileKeyPath を使用してください */
export const AREA_PROFILE_SNAPSHOT_KEY = "area-profile/all.json";

/** @deprecated areaProfileKeyPath を使用してください */
export interface AreaProfileSnapshot {
  generatedAt: string;
  /** key: areaCode (5桁) → AreaProfileData */
  byAreaCode: Record<string, AreaProfileData>;
}
