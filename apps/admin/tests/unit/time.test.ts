import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  jstDateStr,
  jstNow,
  monthStartJst,
  weekStartJst,
} from "@/lib/server/time";

/**
 * time.ts は Date.now() + 9h を使い getUTC* で JST の曜日/日付を得る。
 * vi.useFakeTimers + setSystemTime で UTC 時刻を固定し、JST 境界を検証する。
 */
describe("time (JST)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function freeze(iso: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  }

  it("jstNow は UTC より 9 時間進む", () => {
    freeze("2026-07-15T00:00:00Z");
    // 00:00 UTC → 09:00 JST。jstNow の内部表現は UTC+9 を UTC として持つので getUTCHours=9。
    expect(jstNow().getUTCHours()).toBe(9);
  });

  it("jstDateStr は JST 日付 (UTC 深夜でも翌日にならない)", () => {
    // 2026-07-15 14:59 UTC = 2026-07-15 23:59 JST → まだ 07-15
    freeze("2026-07-15T14:59:00Z");
    expect(jstDateStr()).toBe("2026-07-15");
    // 2026-07-15 15:00 UTC = 2026-07-16 00:00 JST → 07-16 に変わる
    freeze("2026-07-15T15:00:00Z");
    expect(jstDateStr()).toBe("2026-07-16");
  });

  describe("weekStartJst (月曜始まり)", () => {
    it("週の途中 (水曜) → 直近の月曜", () => {
      // 2026-07-15 は水曜 (JST)。週初は 2026-07-13 (月)。
      freeze("2026-07-15T03:00:00Z"); // 12:00 JST 水
      expect(weekStartJst()).toBe("2026-07-13");
    });

    it("日曜は前週の月曜になる (dow=7 → 6 日戻す)", () => {
      // 2026-07-19 は日曜 (JST)。dow=7 → -6 日 = 2026-07-13 (月)。
      freeze("2026-07-19T03:00:00Z"); // 12:00 JST 日
      expect(weekStartJst()).toBe("2026-07-13");
    });

    it("月曜自身はその日を返す", () => {
      freeze("2026-07-13T03:00:00Z"); // 12:00 JST 月
      expect(weekStartJst()).toBe("2026-07-13");
    });

    it("UTC 深夜 (JST では翌日) の週境界を正しく扱う", () => {
      // 2026-07-12 16:00 UTC = 2026-07-13 01:00 JST (月曜)。UTC のままだと日曜に見える。
      freeze("2026-07-12T16:00:00Z");
      expect(weekStartJst()).toBe("2026-07-13");
    });
  });

  describe("monthStartJst (月初)", () => {
    it("月の途中 → 当月 1 日", () => {
      freeze("2026-07-15T03:00:00Z");
      expect(monthStartJst()).toBe("2026-07-01");
    });

    it("月末の UTC 深夜 (JST では翌月) を正しく扱う", () => {
      // 2026-07-31 15:00 UTC = 2026-08-01 00:00 JST → 08-01
      freeze("2026-07-31T15:00:00Z");
      expect(monthStartJst()).toBe("2026-08-01");
    });

    it("月初日 (1 日) はその月を返す", () => {
      freeze("2026-08-01T03:00:00Z");
      expect(monthStartJst()).toBe("2026-08-01");
    });
  });
});
