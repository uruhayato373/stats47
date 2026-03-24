"use server";


import { logger } from "@/lib/logger";
import { findFirstKeyByTag } from "@stats47/ranking/server";

/**
 * タグから最初のランキングキーを取得
 *
 * 指定タグに属するランキング項目のうち、最初のランキング項目のキーを返す。
 *
 * @param tag - タグ文字列
 * @returns ランキングキー、見つからない場合はnull
 */
export async function findFirstRankingKeyByTag(
  tag: string
): Promise<string | null> {
  try {
    const result = await findFirstKeyByTag(tag);

    if (result.success === false) {
       if (result.error.message.includes("not found")) {
         logger.debug({ tag }, "タグの最初のランキングキーが見つかりませんでした");
       } else {
         const errorMessage = result.error instanceof Error ? result.error.message : String(result.error);
         if (errorMessage.includes("not found")) {
             logger.debug({ tag }, "タグの最初のランキングキーが見つかりませんでした");
         } else {
             logger.error({ tag, error: result.error }, "タグの最初のランキングキー取得エラー");
         }
       }
       return null;
    }

    return result.data;
  } catch (error) {
    logger.error(
      {
        tag,
        error: error instanceof Error ? error.message : String(error),
      },
      "タグの最初のランキングキー取得エラー (Unexpected)"
    );
    return null;
  }
}
