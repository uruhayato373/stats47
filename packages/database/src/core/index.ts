/**
 * Core Database Module Exports
 *
 * @module database/core
 */

export {
  checkD1Available,
  getCloudflareEnv,
  getStaticDatabase,
  runQuery,
  type D1Database
} from "./d1-database";

export {
  clearAllDbCache, clearCachedStaticDb,
  getCachedStaticDb,
  getStaticDbFromContext,
  isCloudflareWorkers,
  isDevelopmentEnv,
  isEdgeRuntime,
  isServerSide,
  setCachedStaticDb
} from "./d1-context";
