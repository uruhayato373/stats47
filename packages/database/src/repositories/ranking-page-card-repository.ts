import { logger } from "@stats47/logger";
import { and, asc, eq } from "drizzle-orm";
import type { D1Database } from "../core";
import { createDrizzleClient, type DrizzleClient } from "../drizzle";
import { type RankingPageCard, rankingPageCards } from "../schema";
import { err, ok, type Result } from "../utils/result";

export class RankingPageCardRepository {
  private db: DrizzleClient;

  constructor(d1: D1Database) {
    this.db = createDrizzleClient(d1);
  }

  /**
   * ランキングキーに紐づくページカード一覧を取得する
   *
   * `isActive = true` のカードを `displayOrder` 昇順で返す。
   */
  async listCardsByRankingKey(
    rankingKey: string
  ): Promise<Result<RankingPageCard[], Error>> {
    try {
      const result = await this.db
        .select()
        .from(rankingPageCards)
        .where(
          and(
            eq(rankingPageCards.rankingKey, rankingKey),
            eq(rankingPageCards.isActive, true)
          )
        )
        .orderBy(asc(rankingPageCards.displayOrder));

      return ok(result);
    } catch (error) {
      logger.error(
        { error, rankingKey },
        "RankingPageCardRepository: listCardsByRankingKey failed"
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
