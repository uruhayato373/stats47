import { estatMetainfo, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger";
import { eq } from "drizzle-orm";
import { MetaInfoCacheDataR2 } from "../../types";

/**
 * R2から取得したキャッシュ情報をDB形式に変換（現在はR2のみを使用するため、メタデータ抽出などの用途）
 * 以前の D1 テーブル定義 estat_metainfo との互換性のためのロジックがあればここで処理
 */

/**
 * 統計表IDからキャッシュ情報を検索（R2ストレージなどを想定した名前だが、リポジトリ層として定義）
 */
export async function findMetaInfoByStatsId(
  statsDataId: string
): Promise<MetaInfoCacheDataR2 | null> {
  const db = getDrizzle();

  // 注意: 現状、メタ情報の詳細は R2 に保存されており、D1 には基本情報のみ保存されている
  // または静的ファイル管理に移行しているため、この関数が必要な場所を確認する必要がある。
  // ここでは型エラーを解消し、CamelCase を反映させる最小限の実装を行う。

  try {
    const result = await db
      .select({
        statsDataId: estatMetainfo.statsDataId,
        updatedAt: estatMetainfo.updatedAt,
      })
      .from(estatMetainfo)
      .where(eq(estatMetainfo.statsDataId, statsDataId))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    // 本来は R2 から取得するなどの処理が必要
    return null;
  } catch (error) {
    logger.error({ statsDataId, error }, "findMetaInfoByStatsId: エラー");
    return null;
  }
}
