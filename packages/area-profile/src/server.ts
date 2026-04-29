import "server-only";

/**
 * @stats47/area-profile/server
 *
 * サーバーサイド専用: リポジトリ、バッチサービスを提供。
 */

export type {
  AreaProfileBatchProgress,
  AreaProfileData,
  AreaProfileSummary,
  BatchLog,
  StrengthWeaknessItem,
} from "./types";

export { extractStrengthsAndWeaknesses } from "./utils";

export {
  deleteAllAreaProfileRankings,
  getAreaProfileByCode,
  getAreaProfileCount,
  listAreaProfileRankings,
  listAreaProfileSummaries,
  replaceAreaProfileRankings,
} from "./repositories";

export { runBatchAreaProfile } from "./services";
export type { BatchCallbacks } from "./services";

export { readAreaProfileFromR2 } from "./repositories/read-area-profile-snapshot";
export { exportAreaProfileSnapshot } from "./exporters/area-profile-snapshot";
