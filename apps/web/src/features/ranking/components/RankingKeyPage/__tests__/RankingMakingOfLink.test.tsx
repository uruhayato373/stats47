/**
 * 雑学ランキングの末尾に「作り方」の 1 行を出す (RANKING-MAKING-OF-LINK-01・2026-10-19)。
 * 守ること: 対象の 5 件だけに出す (全ランキングに一括で出さない) / 共通のクリック監視が ranking_making_of で数える。
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RANKING_MAKING_OF_KEYS, RankingMakingOfLink } from "../RankingMakingOfLink";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

describe("RankingMakingOfLink", () => {
  it("対象のランキングでは連載への 1 行を出し、導線名 ranking_making_of を付ける", () => {
    const { container } = render(<RankingMakingOfLink rankingKey="natto-consumption-expenditure" />);
    const link = container.querySelector('a[href="/blog/cc-estat-01-setup"]');
    expect(link).not.toBeNull();
    expect(link?.closest("[data-nav-surface]")?.getAttribute("data-nav-surface")).toBe("ranking_making_of");
  });

  it("対象外のランキングでは何も出さない", () => {
    const { container } = render(<RankingMakingOfLink rankingKey="annual-sunshine-duration" />);
    expect(container.innerHTML).toBe("");
  });

  it("対象は 5 件に限る", () => {
    expect(RANKING_MAKING_OF_KEYS.size).toBe(5);
  });
});
