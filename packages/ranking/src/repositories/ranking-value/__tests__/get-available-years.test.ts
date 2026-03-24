import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  rankingData: {},
}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getAvailableYears } from "../get-available-years";

function mockQuery(resolvedValue: unknown): any {
  const p: any = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "then") return (resolve: any) => resolve(resolvedValue);
        return vi.fn().mockReturnValue(p);
      },
    }
  );
  return p;
}

describe("getAvailableYears", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return available years sorted by yearCode desc", async () => {
    const dbRows = [
      { yearCode: "2023", yearName: "2023年" },
      { yearCode: "2022", yearName: "2022年" },
    ];
    const mockDb = { selectDistinct: vi.fn().mockReturnValue(mockQuery(dbRows)) } as any;

    const result = await getAvailableYears("gdp", "prefecture", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].yearCode).toBe("2023");
    }
  });

  it("should return empty array when no years exist", async () => {
    const mockDb = { selectDistinct: vi.fn().mockReturnValue(mockQuery([])) } as any;

    const result = await getAvailableYears("none", "prefecture", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("should provide default yearName when null", async () => {
    const dbRows = [{ yearCode: "2023", yearName: null }];
    const mockDb = { selectDistinct: vi.fn().mockReturnValue(mockQuery(dbRows)) } as any;

    const result = await getAvailableYears("gdp", "prefecture", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].yearName).toBe("2023年度");
    }
  });

  it("should return error on DB failure", async () => {
    const mockDb = {
      selectDistinct: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      }),
    } as any;

    const result = await getAvailableYears("gdp", "prefecture", mockDb);

    expect(result.success).toBe(false);
  });
});
