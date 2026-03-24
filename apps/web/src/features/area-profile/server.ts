import "server-only";

import { cache } from "react";

/**
 * Area Profile Domain Server API
 *
 * サーバーサイドでのみ使用可能なアクション・コンポーネント。
 *
 * @module AreaProfileDomain/Server
 */

// cache() でリクエストレベル dedupe（generateMetadata + ページ本体の重複排除）
import { getAreaProfileAction as getAreaProfileActionRaw } from "./actions/get-area-profile";
export const getAreaProfileAction = cache(getAreaProfileActionRaw);

// サーバーコンポーネント
export { AreaDashboardSection } from "./components/AreaDashboardSection";
