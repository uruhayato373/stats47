import { describe, it, expect, vi } from "vitest";

vi.mock("@stats47/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { extractDashboardProps } from "../extractDashboardProps";

import type { DashboardComponent } from "../../types";
import type { Area } from "@stats47/area";

const mockArea: Area = {
  areaCode: "13000",
  areaName: "東京都",
  areaNameKana: "トウキョウト",
  prefCode: "13",
  regionCode: "03",
  regionName: "関東",
};

const baseComponent: DashboardComponent = {
  id: "comp-1",
  pageKey: "test-page",
  componentType: "line-chart",
  chartKey: "test-chart",
  title: "テストチャート",
  sortOrder: 1,
  componentProps: JSON.stringify({ annotation: "注釈テスト", rankingLinkLabel: "詳細" }),
  rankingLink: "/ranking/test",
  sourceLink: "https://example.com",
  sourceName: "テストソース",
  dataSource: "estat",
};

describe("extractDashboardProps", () => {
  it("componentProps を正しくパースして common と config を返す", () => {
    const { common, config } = extractDashboardProps(baseComponent, mockArea);

    expect(common.title).toBe("テストチャート");
    expect(common.area).toBe(mockArea);
    expect(common.rankingLink).toBe("/ranking/test");
    expect(common.rankingLinkLabel).toBe("詳細");
    expect(common.sourceLink).toBe("https://example.com");
    expect(common.sourceName).toBe("テストソース");
    expect(common.dataSource).toBe("estat");
    expect(common.annotation).toBe("注釈テスト");
    expect(config).toMatchObject({ annotation: "注釈テスト", rankingLinkLabel: "詳細" });
  });

  it("componentProps が null の場合に空オブジェクトを使用する", () => {
    const component = { ...baseComponent, componentProps: null };
    const { common, config } = extractDashboardProps(component, mockArea);

    expect(common.title).toBe("テストチャート");
    expect(common.annotation).toBeUndefined();
    expect(config).toEqual({});
  });

  it("componentProps が不正な JSON の場合にワーニングを出して空オブジェクトを使用する", async () => {
    const { logger } = await import("@stats47/logger");
    const component = { ...baseComponent, componentProps: "invalid-json" };
    const { config } = extractDashboardProps(component, mockArea);

    expect(config).toEqual({});
    expect(logger.warn).toHaveBeenCalled();
  });

  it("title が null の場合に空文字列を返す", () => {
    const component = { ...baseComponent, title: null };
    const { common } = extractDashboardProps(component, mockArea);

    expect(common.title).toBe("");
  });

  it("dataSource が null の場合にデフォルト estat を返す", () => {
    const component = { ...baseComponent, dataSource: null };
    const { common } = extractDashboardProps(component, mockArea);

    expect(common.dataSource).toBe("estat");
  });
});
