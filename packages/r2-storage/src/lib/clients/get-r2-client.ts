import type { R2Bucket } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { logger } from "@stats47/logger";

/**
 * R2 クライアントを取得
 *
 * @param options - オプション
 * @returns R2 バインディング
 * @throws {Error} R2 バインディングが見つからない場合
 */
export async function getR2Client(options?: {
  async?: boolean;
}): Promise<R2Bucket> {
  try {
    const context = options?.async
      ? await getCloudflareContext({ async: true })
      : getCloudflareContext();

    const { env } = context;

    if (!(env as any).STATS47_BUCKET) {
      logger.error(
        {
          availableBindings: Object.keys(env),
        },
        "STATS47_BUCKET binding not found"
      );
      throw new Error("STATS47_BUCKET binding not found");
    }

    return (env as any).STATS47_BUCKET;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to get R2 client"
    );
    throw error;
  }
}
