import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CorrelationSectionClient } from "../CorrelationSectionClient";

function item(rankingKey: string, title: string, populationAdjustedR: number) {
    return {
        rankingKey,
        title,
        subtitle: null,
        unit: "％",
        pearsonR: populationAdjustedR,
        populationAdjustedR,
        partialRPopulation: populationAdjustedR,
        partialRArea: null,
        partialRAging: null,
        partialRDensity: null,
        scatterData: [],
    };
}

describe("CorrelationSectionClient", () => {
    // 相関記事はタグが空で関連記事カードにしか出ない。ペアを解説した記事がある行にだけ導線を置く
    it("解説記事のある相手指標の行にだけ記事リンクを出し、ランキングへのリンクは残す", () => {
        render(
            <CorrelationSectionClient
                correlatedItems={[item("natural-increase-rate", "自然増減率", -0.97), item("ratio-65-plus", "65歳以上人口割合", 0.96)]}
                articleByPairKey={{ "ratio-65-plus": { slug: "aging-death-rate", title: "高齢化と死亡率" } }}
            />,
        );

        // 指標・解説記事・順位相関は同じ行に並ぶ (共通の静的な表。2026-11-03)
        const withArticle = screen.getByRole("row", { name: /65歳以上人口割合/ });
        expect(within(withArticle).getByRole("link", { name: "解説記事" })).toHaveAttribute("href", "/blog/aging-death-rate");
        expect(screen.getByRole("link", { name: "65歳以上人口割合" })).toHaveAttribute("href", "/ranking/ratio-65-plus");

        const withoutArticle = screen.getByRole("row", { name: /自然増減率/ });
        expect(within(withoutArticle).queryByRole("link", { name: "解説記事" })).toBeNull();
        expect(screen.getAllByRole("link", { name: "解説記事" })).toHaveLength(1);
    });
});
