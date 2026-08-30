import { describe, expect, it } from "vitest";

import { buildDownloadUrl } from "../downloader";
import { extractMeshCodesFromHtml } from "../mesh-discovery";

describe("KSJ mesh acquisition contract", () => {
  it("resolves the exact version and first-mesh code", () => {
    expect(
      buildDownloadUrl(
        { downloadUrlPattern: "https://example.test/G04-a-{VERSION}_{MESHCODE}.zip" },
        "11",
        undefined,
        "5339",
      ),
    ).toBe("https://example.test/G04-a-11_5339.zip");
  });

  it("fails closed when a URL placeholder is unresolved", () => {
    expect(() =>
      buildDownloadUrl(
        { downloadUrlPattern: "https://example.test/L03-a-{VERSION}_{MESHCODE}.zip" },
        "21",
      ),
    ).toThrow("未解決の変数");
  });

  it("deduplicates and sorts only files from the requested version", () => {
    const html = [
      "L03-a-21_5339-jgd2011_GML.zip",
      "L03-a-20_5338-jgd2011_GML.zip",
      "L03-a-21_3036-jgd2011_GML.zip",
      "L03-a-21_5339-jgd2011_GML.zip",
    ].join("\n");
    expect(extractMeshCodesFromHtml(html, "L03-a", "21")).toEqual(["3036", "5339"]);
  });
});
