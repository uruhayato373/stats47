import { describe, expect, it } from "vitest";
import { getRankingTitle } from "../get-ranking-title";

describe("getRankingTitle", () => {
  it("title がある場合は title を優先する", () => {
    const item = {
      title: "表示用タイトル",
      rankingName: "正式名称",
    };
    expect(getRankingTitle(item)).toBe("表示用タイトル");
  });

  it("title が空の場合は rankingName を返す", () => {
    const item = {
      title: "",
      rankingName: "正式名称",
    };
    expect(getRankingTitle(item)).toBe("正式名称");
  });
});
