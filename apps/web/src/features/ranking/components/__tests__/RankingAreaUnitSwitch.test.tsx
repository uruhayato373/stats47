import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RankingAreaUnitSwitch } from "../RankingAreaUnitSwitch";

const PROPS = {
  prefectureHref: "/ranking/example",
  municipalityHref: "/municipalities/ranking/example-city",
  municipalityNavLabel: "municipality-ranking:example-city",
};

/**
 * 守る意図 (2026-11-26 オーナー決定): 都道府県と市区町村のランキングは、同じ形・同じ場所の切り替えで行き来する。
 * 以前は都道府県のページが青いボタン、市区町村のページが 3 択 (日本を含む) で、形も場所も違った。
 */
describe("RankingAreaUnitSwitch", () => {
  it("都道府県と市区町村の 2 つだけを出し、同じ指標のランキングが無い「日本」は出さない", () => {
    render(<RankingAreaUnitSwitch current="prefectures" {...PROPS} />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["47都道府県", "市区町村"]);
    expect(screen.queryByRole("link", { name: "日本" })).toBeNull();
  });

  it.each([
    ["prefectures", "47都道府県", "市区町村"],
    ["municipalities", "市区町村", "47都道府県"],
  ] as const)("%s のページでは現在地だけを aria-current にし、相手のページへ結ぶ", (current, here, there) => {
    render(<RankingAreaUnitSwitch current={current} {...PROPS} />);
    expect(screen.getByRole("link", { name: here })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: there })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "47都道府県" })).toHaveAttribute("href", PROPS.prefectureHref);
    expect(screen.getByRole("link", { name: "市区町村" })).toHaveAttribute("href", PROPS.municipalityHref);
  });

  // 灰色の文字では見落とされ、相手のページへの回遊が減る。押せる側だけを青い塗りにする (2026-11-26 オーナー判断)
  it.each([
    ["prefectures", "市区町村", "47都道府県"],
    ["municipalities", "47都道府県", "市区町村"],
  ] as const)("%s のページでは押せる側 (%s) だけを青い塗りにする", (current, there, here) => {
    render(<RankingAreaUnitSwitch current={current} {...PROPS} />);
    expect(screen.getByRole("link", { name: there })).toHaveClass("bg-blue-600", "text-white");
    expect(screen.getByRole("link", { name: here })).not.toHaveClass("bg-blue-600");
  });

  it("都道府県 → 市区町村の導線を測ってきた面とラベルで計測を続ける", () => {
    render(<RankingAreaUnitSwitch current="prefectures" {...PROPS} />);
    expect(screen.getByRole("navigation", { name: "統計の地域単位" })).toHaveAttribute("data-nav-surface", "ranking_municipality");
    expect(screen.getByRole("link", { name: "市区町村" })).toHaveAttribute("data-nav-label", PROPS.municipalityNavLabel);
  });
});
