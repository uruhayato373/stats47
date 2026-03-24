import { logger } from "@stats47/logger";
import { listFromR2 } from "@stats47/r2-storage/server";

/**
 * すべてのキャッシュされたメタ情報の統計表IDを一覧取得
 *
 * R2ストレージから保存されているすべてのメタ情報の統計表IDを取得します。
 *
 * @returns statsDataId の配列
 */
export async function listCacheKeys(): Promise<string[]> {
  try {
    const keys = await listFromR2("estat-api/meta-info/");

    const statsDataIds = keys
      .map((key) => {
        // 新形式: "estat-api/meta-info/{statsDataId}/json"
        let match = key.match(/estat-api\/meta-info\/([^/]+)\/json$/);
        if (match) return match[1];

        // 旧形式: "estat-api/meta-info/{statsDataId}.json"
        match = key.match(/estat-api\/meta-info\/([^/]+)\.json$/);
        return match ? match[1] : null;
      })
      .filter((id): id is string => id !== null);

    // 重複排除 (新旧両方ある場合など)
    return Array.from(new Set(statsDataIds));
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "R2メタ情報キャッシュ一覧取得エラー"
    );
    return [];
  }
}
