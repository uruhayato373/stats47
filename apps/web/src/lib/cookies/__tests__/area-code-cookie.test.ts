import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  AREA_CODE_COOKIE_NAME,
  AREA_CODE_DEFAULT,
  setAreaCodeCookie,
} from "../area-code-cookie";

describe("area-code-cookie 定数", () => {
  it("Cookie 名が定義されている", () => {
    expect(AREA_CODE_COOKIE_NAME).toBe("area-code");
  });

  it("デフォルト地域コードが 00000", () => {
    expect(AREA_CODE_DEFAULT).toBe("00000");
  });
});

describe("setAreaCodeCookie", () => {
  beforeEach(() => {
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  it("Cookie を設定する", () => {
    setAreaCodeCookie("13000");

    expect(document.cookie).toContain("area-code=13000");
    expect(document.cookie).toContain("path=/");
    expect(document.cookie).toContain("SameSite=Lax");
  });
});
