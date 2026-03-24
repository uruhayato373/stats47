import type { R2Bucket } from "@stats47/r2-storage";
import { getR2Client } from "@stats47/r2-storage/server";

/**
 * e-Stat API キャッシュ用の R2 ストレージを取得する。
 * R2 が利用できない環境（ローカル開発等）では undefined を返す。
 */
export async function getEstatCacheStorage(): Promise<R2Bucket | undefined> {
  try {
    return await getR2Client();
  } catch {
    return undefined;
  }
}
