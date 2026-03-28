import { describe, it, expect } from "vitest";

import { extractPageTypeFromPath } from "../page-type";

describe("extractPageTypeFromPath", () => {
  it("ranking パスで ranking を返す", () => {
    expect(extractPageTypeFromPath("/ranking/total-population")).toBe("ranking");
  });

  it("blog パスで blog を返す", () => {
    expect(extractPageTypeFromPath("/blog/my-article")).toBe("blog");
  });

  it("未知のパスで null を返す", () => {
    expect(extractPageTypeFromPath("/unknown/path")).toBeNull();
  });

  it("ルートパスで null を返す", () => {
    expect(extractPageTypeFromPath("/")).toBeNull();
  });

  it("ranking 直下のパスでも ranking を返す", () => {
    expect(extractPageTypeFromPath("/ranking")).toBe("ranking");
  });
});
