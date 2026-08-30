import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveLocalR2ObjectPath } from "../local-r2-path";

describe("resolveLocalR2ObjectPath", () => {
  const root = "/tmp/stats47-r2";

  it("正当なR2 keyをローカルミラー配下へ解決する", () => {
    expect(
      resolveLocalR2ObjectPath(
        root,
        "gis/geoshape/20230101/13/13_city_dc.i.topojson",
      ),
    ).toBe(
      join(root, "gis/geoshape/20230101/13/13_city_dc.i.topojson"),
    );
  });

  it.each([
    "../secret",
    "gis/../../secret",
    "/absolute/path",
    "gis\\windows\\secret",
    "gis//empty",
  ])("パスとして危険なR2 keyを拒否する: %s", (key) => {
    expect(() => resolveLocalR2ObjectPath(root, key)).toThrow();
  });
});
