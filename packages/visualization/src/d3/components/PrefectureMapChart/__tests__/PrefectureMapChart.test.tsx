import { geoshape, ranking } from "@stats47/mock";
import type { TopoJSONTopology } from "@stats47/types";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrefectureMapChart } from "../index";

const jpPrefecturesData = geoshape.jpPrefectures as unknown as TopoJSONTopology;
const mockData = ranking.annualSalesAmountPerEmployeeData;

describe("PrefectureMapChart SVG structure", () => {
    it("viewBox がサイズ props に追従する", async () => {
        const { container } = render(
            <PrefectureMapChart
                data={mockData as any}
                topology={jpPrefecturesData}
                width={600}
                height={900}
                colorConfig={{ colorSchemeType: "sequential", colorScheme: "interpolatePurples" }}
            />
        );

        // 非同期ロードを待機
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
                data={mockData as any}
                topology={jpPrefecturesData}
                colorConfig={{ colorSchemeType: "sequential", colorScheme: "interpolatePurples" }}
            />
        );

        await waitFor(() => {
            const paths = container.querySelectorAll("path");
            // 日本の都道府県は47
            expect(paths.length).toBeGreaterThanOrEqual(47);
        }, { timeout: 3000 });
    });
});
