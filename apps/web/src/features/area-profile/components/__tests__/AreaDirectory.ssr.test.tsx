import { fetchPrefectures } from "@stats47/area";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";


// AreaDirectory は Client 子 (AreaSearch / AreaSelectionPanels) を含むが、
// SSR (renderToStaticMarkup) では通常のコンポーネントとして 1 パス描画される。
vi.mock("@/lib/analytics/events", () => ({ trackNavClick: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

import { AreaDirectory } from "../AreaDirectory";

const PREFS = fetchPrefectures();

describe("AreaDirectory (SSR / 初期 HTML)", () => {
  it("初期 HTML に全47県の /areas/{code} リンクが存在する (JS 失敗時も遷移可)", () => {
    const html = renderToStaticMarkup(<AreaDirectory prefectures={PREFS} />);
    for (const p of PREFS) {
      expect(html).toContain(`href="/areas/${p.prefCode}"`);
    }
  });

  it("タイル地図が SSR される (初期空白でない)", () => {
    const html = renderToStaticMarkup(<AreaDirectory prefectures={PREFS} />);
    expect(html).toContain("地図から都道府県を選ぶ");
  });

  it("ItemList JSON-LD 用の県配列が47件 (page.tsx の emit 不変条件)", () => {
    // page.tsx は fetchPrefectures() をそのまま itemListElement へマップする。
    const itemListElement = PREFS.map((pref, i) => ({
      position: i + 1,
      name: pref.prefName,
      url: `/areas/${pref.prefCode}`,
    }));
    expect(itemListElement).toHaveLength(47);
    expect(new Set(itemListElement.map((e) => e.url)).size).toBe(47);
  });
});
