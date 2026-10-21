import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { listPublishableCitiesInPrefecture } from "../../constants/publishable-cities";
import { CitiesNavCard } from "../CitiesNavCard";

// 固定の高さでスクロールさせると続きがあると気づけなかった (北海道 179 件)。
// 先頭だけ並べ、残りは <details> で開く。リンクは全件を初期 HTML に残す (クロールと回遊のため)。
const HOKKAIDO = "01000";
const cities = listPublishableCitiesInPrefecture(HOKKAIDO);

function render(activeCityCode?: string) {
  return renderToStaticMarkup(
    <CitiesNavCard areaCode={HOKKAIDO} areaName="北海道" activeCityCode={activeCityCode} />,
  );
}

describe("CitiesNavCard", () => {
  it("件数が多い県は固定の高さのスクロールを使わず、残りを「すべて見る」で開く", () => {
    expect(cities.length).toBeGreaterThan(40);
    const html = render();

    expect(html).not.toContain("overflow-y-auto");
    expect(html).not.toMatch(/max-h-/);
    expect(html).toContain(`すべて見る（残り ${cities.length - 40} 件）`);
    expect(html).not.toMatch(/<details[^>]*open/);
  });

  it("閉じていても全市区町村のリンクを初期 HTML に持つ", () => {
    const html = render();
    for (const city of cities) {
      expect(html).toContain(`href="/areas/${HOKKAIDO}/cities/${city.code}"`);
    }
  });

  it("現在の市区町村が残り側にあるときは最初から開いておく", () => {
    expect(render(cities[0].code)).not.toMatch(/<details[^>]*open/);
    expect(render(cities[cities.length - 1].code)).toMatch(/<details[^>]*open/);
  });

  it("件数が少ない県は「すべて見る」を出さない", () => {
    const tottori = listPublishableCitiesInPrefecture("31000");
    expect(tottori.length).toBeLessThanOrEqual(40);
    const html = renderToStaticMarkup(<CitiesNavCard areaCode="31000" areaName="鳥取県" />);
    expect(html).not.toContain("<details");
  });
});
