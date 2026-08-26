import { describe, expect, it } from "vitest";

import { assertDiffPushComplete } from "../diff-push-result";

describe("assertDiffPushComplete", () => {
  it("全upload成功だけを通す", () => {
    expect(() =>
      assertDiffPushComplete({ attempted: 2258, success: 2258, errors: 0 }),
    ).not.toThrow();
  });

  it("1件でもupload errorがあれば失敗する", () => {
    expect(() =>
      assertDiffPushComplete({ attempted: 2258, success: 2257, errors: 1 }),
    ).toThrow(/R2差分同期が不完全/);
  });

  it("error集計漏れでも成功件数が不足すれば失敗する", () => {
    expect(() =>
      assertDiffPushComplete({ attempted: 2258, success: 2257, errors: 0 }),
    ).toThrow(/R2差分同期が不完全/);
  });
});
