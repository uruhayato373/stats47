/**
 * R2 Storage Domain Public API (Client)
 *
 * Cloudflare R2ストレージに関連する型を提供する統一インターフェース。
 * サーバー専用の機能は`@stats47/r2-storage/server`に分離されました。
 *
 * @module R2StorageDomain
 */

export type { R2Bucket } from "@cloudflare/workers-types";

export * from "./types";
