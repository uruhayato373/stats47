import { fetchPrefectures } from "@stats47/area";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/events", () => ({ trackNavClick: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

import { PrefectureNavigator } from "../PrefectureNavigator";

const PREFS = fetchPrefectures();

describe("PrefectureNavigator (SSR / 初期 HTML)", () => {
  it("full は全47県の直接リンクと検索を SSR する", () => {
    const html = renderToStaticMarkup(
      <PrefectureNavigator
        prefectures={PREFS}
        variant="full"
        surface="areas"
        heading="都道府県を選ぶ"
      />,
    );

    for (const pref of PREFS) {
      expect(html).toContain(`href="/areas/${pref.prefCode}"`);
    }
    expect(html).toContain("都道府県名を検索");
    expect(html).toContain("地図から都道府県を選ぶ");
  });

  it("embedded も地図の47県から直接遷移できる", () => {
    const html = renderToStaticMarkup(
      <PrefectureNavigator
        prefectures={PREFS}
        variant="embedded"
        surface="home"
      />,
    );

    expect(html.match(/href="\/areas\/\d{5}"/g)).toHaveLength(94);
    expect(html).toContain("都道府県一覧から選ぶ");
  });

  it("ItemList JSON-LD 用の県配列が47件", () => {
    const itemListElement = PREFS.map((pref, i) => ({
      position: i + 1,
      name: pref.prefName,
      url: `/areas/${pref.prefCode}`,
    }));
    expect(itemListElement).toHaveLength(47);
    expect(new Set(itemListElement.map((entry) => entry.url)).size).toBe(47);
  });
});
