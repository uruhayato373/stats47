import { afterEach, describe, expect, it, vi } from "vitest";

import {
  __resetHomeFeaturedAssignmentForTest,
  HOME_FEATURED_EXPERIMENT_ID,
  HOME_FEATURED_STORAGE_KEY,
  pickHomeFeaturedVariant,
  resolveHomeFeaturedAssignment,
  type StorageLike,
} from "../home-featured-experiment";

/** sticky assignment の unit test (仕様 doc 28 §8.2 / §13.4) */
describe("home-featured-experiment", () => {
  afterEach(() => {
    __resetHomeFeaturedAssignmentForTest();
  });

  it("experiment_id / storage key が仕様どおり", () => {
    expect(HOME_FEATURED_EXPERIMENT_ID).toBe("home-featured-v1");
    expect(HOME_FEATURED_STORAGE_KEY).toBe("stats47_exp_home_featured_v1");
  });

  it("pickHomeFeaturedVariant は 50/50 (random 境界)", () => {
    expect(pickHomeFeaturedVariant(() => 0)).toBe("control");
    expect(pickHomeFeaturedVariant(() => 0.4999)).toBe("control");
    expect(pickHomeFeaturedVariant(() => 0.5)).toBe("editorial");
    expect(pickHomeFeaturedVariant(() => 0.9999)).toBe("editorial");
  });

  it("初回割当を storage へ保存し、以後は保存値を再利用する (sticky)", () => {
    const store = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => void store.set(k, v),
    };

    const first = resolveHomeFeaturedAssignment({ storage, random: () => 0.9 });
    expect(first).toBe("editorial");
    expect(store.get(HOME_FEATURED_STORAGE_KEY)).toBe("editorial");

    __resetHomeFeaturedAssignmentForTest();
    // random が control 側でも保存値 editorial を再利用する
    const second = resolveHomeFeaturedAssignment({ storage, random: () => 0 });
    expect(second).toBe("editorial");
  });

  it("保存値が不正なら再割当して上書きする", () => {
    const store = new Map<string, string>([[HOME_FEATURED_STORAGE_KEY, "broken-value"]]);
    const storage: StorageLike = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => void store.set(k, v),
    };
    const assigned = resolveHomeFeaturedAssignment({ storage, random: () => 0 });
    expect(assigned).toBe("control");
    expect(store.get(HOME_FEATURED_STORAGE_KEY)).toBe("control");
  });

  it("storage が null (localStorage 不可) でも crash せず session 内で固定する", () => {
    const first = resolveHomeFeaturedAssignment({ storage: null, random: () => 0.9 });
    expect(first).toBe("editorial");
    // session cache により、以後の呼び出しは random に関わらず同じ variant
    const second = resolveHomeFeaturedAssignment({ storage: null, random: () => 0 });
    expect(second).toBe("editorial");
  });

  it("getItem / setItem が throw しても crash しない (§8.2 例外耐性)", () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    const assigned = resolveHomeFeaturedAssignment({ storage: throwing, random: () => 0.9 });
    expect(assigned).toBe("editorial");
    // session cache で固定される
    expect(resolveHomeFeaturedAssignment({ storage: throwing, random: () => 0 })).toBe("editorial");
  });

  it("乱数値そのものを保存しない (保存値は variant 名のみ)", () => {
    const setItem = vi.fn();
    const storage: StorageLike = { getItem: () => null, setItem };
    resolveHomeFeaturedAssignment({ storage, random: () => 0.25 });
    expect(setItem).toHaveBeenCalledWith(HOME_FEATURED_STORAGE_KEY, "control");
  });
});
