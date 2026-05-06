import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import rankingData from "../../../../__tests__/fixtures/ranking-data.json";
import { TileGridMap } from "../index";

describe("TileGridMap SVG structure", () => {
    it("viewBox がサイズ props に追従する", async () => {
        const { container } = render(
            <TileGridMap
                data={rankingData as any}
                width={600}
                height={900}
                colorConfig={{ colorSchemeType: "sequential", colorScheme: "interpolatePurples" }}
            />
        );

        await waitFor(() => {
            const svg = container.querySelector("svg");
            expect(svg).not.toBeNull();
        }, { timeout: 3000 });

        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 600 900");
    });

    it("rect 要素（タイル）が47個生成されていること", async () => {
        const { container } = render(
            <TileGridMap
                data={rankingData as any}
                colorConfig={{ colorSchemeType: "sequential", colorScheme: "interpolatePurples" }}
            />
        );

        await waitFor(() => {
            const rects = container.querySelectorAll("rect");
            expect(rects.length).toBe(47);
        }, { timeout: 3000 });
    });
});
