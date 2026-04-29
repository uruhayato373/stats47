import type { AreaProfileData } from "./index";

export const AREA_PROFILE_SNAPSHOT_KEY = "snapshots/area-profile/all.json";

export interface AreaProfileSnapshot {
  generatedAt: string;
  /** key: areaCode (5桁) → AreaProfileData */
  byAreaCode: Record<string, AreaProfileData>;
}
