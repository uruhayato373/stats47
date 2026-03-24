// @ts-ignore
import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { applyD1Schema } from "./testing/apply-schema";
import { createDrizzleClient } from "./drizzle";
import * as schema from "./schema";

describe("Drizzle D1 統合テスト", () => {
  beforeEach(async () => {
    await applyD1Schema(env.STATS47_STATIC_DB);
  });

  it("D1に接続してクエリを実行できること", async () => {
    const db = createDrizzleClient(env.STATS47_STATIC_DB);
    
    // データ登録
    const newCategory = {
      categoryKey: "test-integration",
      categoryName: "Integration Test Category",
      displayOrder: 100
    };

    await db.insert(schema.categories).values(newCategory).run();

    // データ検索
    const result = await db.select().from(schema.categories).where(eq(schema.categories.categoryKey, "test-integration")).get();

    expect(result).toBeDefined();
    expect(result?.categoryName).toBe("Integration Test Category");
  });

});
