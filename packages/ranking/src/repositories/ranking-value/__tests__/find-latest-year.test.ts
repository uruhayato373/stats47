import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  rankingData: {},
}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { findLatestYear } from "../find-latest-year";

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

describe("findLatestYear", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return the latest year code", async () => {
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery([{ maxYear: "2024" }])) } as any;

    const result = await findLatestYear("prefecture", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("2024");
    }
  });

  it("should return null when no data exists", async () => {
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery([{ maxYear: null }])) } as any;

    const result = await findLatestYear("prefecture", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("should return error on DB failure", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error("query error")),
        }),
      }),
    } as any;

    const result = await findLatestYear("prefecture", mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("query error");
    }
  });
});
