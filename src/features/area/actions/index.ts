/**
 * 地域データ（都道府県・市区町村）のServer Actions
 *
 * このモジュールは、Next.js Server Actionsを使用して地域データを取得・管理します。
 * R2ストレージから取得したデータはNext.jsのキャッシュ機能により最適化されています。
 */

"use server";

import { revalidateTag } from "next/cache";

import { fetchCities, fetchPrefectures } from "../repositories/area-repository";

import type { City, Prefecture } from "../types";

/**
 * 都道府県一覧を取得するServer Action
 *
 * R2ストレージから都道府県データを取得します。
 * Next.jsのキャッシュ機能により、24時間キャッシュが有効です。
 * 開発環境では常に最新データを取得します。
 *
 * @returns {Promise<Prefecture[]>} 都道府県一覧の配列
 * @throws {Error} R2ストレージからの取得に失敗した場合（開発環境以外）
 */
export async function listPrefecturesAction(): Promise<Prefecture[]> {
  // Edge Runtimeでは"use cache"が使用できないため削除
  // キャッシュはNext.jsのfetch cacheを使用
  return await fetchPrefectures();
}

/**
 * 市区町村一覧を取得するServer Action
 *
 * R2ストレージから市区町村データを取得します。
 * Next.jsのキャッシュ機能により、24時間キャッシュが有効です。
 * 開発環境では常に最新データを取得します。
 *
 * @returns {Promise<City[]>} 市区町村一覧の配列
 * @throws {Error} R2ストレージからの取得に失敗した場合（開発環境以外）
 */
export async function listCitiesAction(): Promise<City[]> {
  // Edge Runtimeでは"use cache"が使用できないため削除
  // キャッシュはNext.jsのfetch cacheを使用
  return await fetchCities();
}

/**
 * 都道府県データのキャッシュを無効化するServer Action
 *
 * Next.jsのキャッシュタグ "area-prefectures" を無効化します。
 * データ更新後にキャッシュを再構築したい場合に使用します。
 *
 * @returns {Promise<void>}
 */
export async function revalidatePrefecturesAction(): Promise<void> {
  revalidateTag("area-prefectures");
}

/**
 * 市区町村データのキャッシュを無効化するServer Action
 *
 * Next.jsのキャッシュタグ "area-cities" を無効化します。
 * データ更新後にキャッシュを再構築したい場合に使用します。
 *
 * @returns {Promise<void>}
 */
export async function revalidateCitiesAction(): Promise<void> {
  revalidateTag("area-cities");
}
