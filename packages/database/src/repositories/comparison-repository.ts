import { logger } from "@stats47/logger";
import { and, asc, eq } from "drizzle-orm";
import type { D1Database } from "../core";
import { createDrizzleClient, type DrizzleClient } from "../drizzle";
import { type ComparisonComponent, comparisonComponents } from "../schema";
import { err, ok, type Result } from "../utils/result";

export class ComparisonRepository {
  private db: DrizzleClient;

  constructor(d1: D1Database) {
    this.db = createDrizzleClient(d1);
  }

  /**
   * 指定 areaType の全カテゴリのコンポーネントを一括取得する
   *
   * `isActive = true` のコンポーネントを `categoryKey` → `displayOrder` 昇順で返す。
   * 市区町村ダッシュボード（全カテゴリ一覧表示）用。
   */
  async listComponentsByAreaType(
    areaType: "prefecture" | "city"
  ): Promise<Result<ComparisonComponent[], Error>> {
    try {
      const result = await this.db
        .select()
        .from(comparisonComponents)
        .where(
          and(
            eq(comparisonComponents.areaType, areaType),
            eq(comparisonComponents.isActive, true)
          )
        )
        .orderBy(
          asc(comparisonComponents.categoryKey),
          asc(comparisonComponents.displayOrder)
        );

      return ok(result);
    } catch (error) {
      logger.error(
        { error, areaType },
        "ComparisonRepository: listComponentsByAreaType failed"
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * カテゴリキーに紐づく比較コンポーネント一覧を取得する
   *
   * `isActive = true` のコンポーネントを `displayOrder` 昇順で返す。
   */
  async listComponentsByCategory(
    categoryKey: string,
    areaType?: "prefecture" | "city"
  ): Promise<Result<ComparisonComponent[], Error>> {
    try {
      const conditions = [
        eq(comparisonComponents.categoryKey, categoryKey),
        eq(comparisonComponents.isActive, true),
      ];

      if (areaType) {
        conditions.push(eq(comparisonComponents.areaType, areaType));
      }

      const result = await this.db
        .select()
        .from(comparisonComponents)
        .where(and(...conditions))
        .orderBy(asc(comparisonComponents.displayOrder));

      return ok(result);
    } catch (error) {
      logger.error(
        { error, categoryKey },
        "ComparisonRepository: listComponentsByCategory failed"
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
