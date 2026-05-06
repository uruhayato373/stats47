import type { TopoJSONTopology } from "@stats47/types";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import jpPrefecturesData from "../../../../__tests__/fixtures/jp-prefectures.json";
import rankingData from "../../../../__tests__/fixtures/ranking-data.json";
import { PrefectureMapChart } from "../index";

const topology = jpPrefecturesData as unknown as TopoJSONTopology;

describe("PrefectureMapChart SVG structure", () => {
    it("viewBox がサイズ props に追従する", async () => {
        const { container } = render(
            <PrefectureMapChart
                data={rankingData as any}
                topology={topology}
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

    it("path 要素（都道府県）が生成されていること", async () => {
        const { container } = render(
            <PrefectureMapChart
                data={rankingData as any}
                topology={topology}
                colorConfig={{ colorSchemeType: "sequential", colorScheme: "interpolatePurples" }}
            />
        );

        await waitFor(() => {
            const paths = container.querySelectorAll("path");
            expect(paths.length).toBeGreaterThanOrEqual(47);
        }, { timeout: 3000 });
    });
});
