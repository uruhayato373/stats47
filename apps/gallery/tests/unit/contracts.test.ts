import { describe, expect, it } from "vitest";

import {
  CreatePost,
  PatchPost,
  ProbeR2,
  PublishX,
  Regenerate,
  ScheduleIg,
  WritePlatform,
  parseLimit,
} from "@/lib/contracts/schemas";

describe("PatchPost (Zod)", () => {
  it("scheduled_at: null を許容する", () => {
    const r = PatchPost.safeParse({ scheduled_at: null });
    expect(r.success).toBe(true);
  });

  it("日本語 caption を許容する", () => {
    const r = PatchPost.safeParse({ caption: "都道府県ランキング【最新】" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.caption).toBe("都道府県ランキング【最新】");
  });

  it("余剰キーは passthrough で保持 (400 判定は server 側 updatePost)", () => {
    const r = PatchPost.safeParse({ status: "posted", caption: "x" });
    expect(r.success).toBe(true);
    if (r.success) expect((r.data as Record<string, unknown>).status).toBe("posted");
  });
});

describe("CreatePost (Zod)", () => {
  it("platform enum + 必須 3 フィールドで成功", () => {
    const r = CreatePost.safeParse({
      platform: "x",
      domain: "ranking",
      content_key: "taxable-income",
    });
    expect(r.success).toBe(true);
  });

  it("comma 区切り content_key を許容する (文字列として)", () => {
    const r = CreatePost.safeParse({
      platform: "instagram",
      domain: "ranking",
      content_key: "key-a,key-b",
    });
    expect(r.success).toBe(true);
  });

  it("platform が enum 外 → 失敗", () => {
    const r = CreatePost.safeParse({
      platform: "tiktok",
      domain: "ranking",
      content_key: "k",
    });
    expect(r.success).toBe(false);
  });

  it("必須欠落 (domain 無し) → 失敗", () => {
    const r = CreatePost.safeParse({ platform: "x", content_key: "k" });
    expect(r.success).toBe(false);
  });

  it("空文字 content_key (min 1) → 失敗", () => {
    const r = CreatePost.safeParse({ platform: "x", domain: "ranking", content_key: "" });
    expect(r.success).toBe(false);
  });
});

describe("WritePlatform enum (書込側は厳密)", () => {
  it("x / instagram のみ許容", () => {
    expect(WritePlatform.safeParse("x").success).toBe(true);
    expect(WritePlatform.safeParse("instagram").success).toBe(true);
  });
  it("note / tiktok / youtube は拒否 (YouTube は撤退済で新規作成不可)", () => {
    expect(WritePlatform.safeParse("note").success).toBe(false);
    expect(WritePlatform.safeParse("tiktok").success).toBe(false);
    expect(WritePlatform.safeParse("youtube").success).toBe(false);
  });
});

describe("parseLimit", () => {
  it("null / 空文字 → null (指定なし)", () => {
    expect(parseLimit(null)).toBeNull();
    expect(parseLimit("")).toBeNull();
  });

  it("0 と正整数を許容", () => {
    expect(parseLimit("0")).toBe(0);
    expect(parseLimit("25")).toBe(25);
  });

  it("負数を 'invalid'", () => {
    expect(parseLimit("-1")).toBe("invalid");
  });

  it("NaN (非数値文字列) を 'invalid'", () => {
    expect(parseLimit("abc")).toBe("invalid");
  });

  it("Infinity を 'invalid'", () => {
    expect(parseLimit("Infinity")).toBe("invalid");
  });

  it("小数を 'invalid'", () => {
    expect(parseLimit("1.5")).toBe("invalid");
  });
});

describe("AssetsCheck limit (Zod int nonnegative)", () => {
  // AssetsCheck は schemas から re-export されていないケースに備え PublishX 等と同様に個別 import 済。
  it("Regenerate は kind/keys 任意", () => {
    expect(Regenerate.safeParse({}).success).toBe(true);
    expect(Regenerate.safeParse({ kind: "ogp-ranking", keys: "a,b" }).success).toBe(true);
  });
});

describe("action schemas", () => {
  it("PublishX は content_key 必須", () => {
    expect(PublishX.safeParse({}).success).toBe(false);
    expect(PublishX.safeParse({ content_key: "k" }).success).toBe(true);
  });
  it("ScheduleIg は date/type/domain/content_key 必須", () => {
    expect(ScheduleIg.safeParse({ date: "2026-07-20" }).success).toBe(false);
    expect(
      ScheduleIg.safeParse({
        date: "2026-07-20",
        type: "carousel",
        domain: "ranking",
        content_key: "k",
      }).success,
    ).toBe(true);
  });
  it("ProbeR2 は domain/content_key 必須", () => {
    expect(ProbeR2.safeParse({ domain: "ranking" }).success).toBe(false);
    expect(ProbeR2.safeParse({ domain: "ranking", content_key: "k" }).success).toBe(true);
  });
});
