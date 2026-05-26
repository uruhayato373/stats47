import type { R2Bucket } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { logger } from "@stats47/logger";

/**
 * R2 クライアントを取得
 *
 * @param options - オプション (互換性のため残置、現在は常に async mode で取得)
 * @returns R2 バインディング
 * @throws {Error} R2 バインディングが見つからない場合
 *
 * 注: 過去は options.async でモード切替していたが、Next.js App Router の
 * static route から sync mode で呼ぶと SSG が崩れて Cloudflare Workers 上で
 * 500 を返す事故 (2026-05-27 EXP-006) があったため常に async に統一。
 * 全 caller は既に await 済なので副作用なし。
 * 詳細: .claude/rules/nextjs-ssg-preservation.md
 */
export async function getR2Client(_options?: {
  async?: boolean;
}): Promise<R2Bucket> {
  try {
    const context = await getCloudflareContext({ async: true });

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
