import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { D3PyramidChartData } from "../../../types/d3";
import { D3PyramidChart } from "../index";

const mockData: D3PyramidChartData[] = [
    { ageGroup: "0〜4歳", male: -100, female: 100 },
    { ageGroup: "5〜9歳", male: -120, female: 110 },
];

describe("D3PyramidChart SVG structure", () => {
    it("viewBox がサイズ props に追従する", () => {
        const { container } = render(
            <D3PyramidChart chartData={mockData} width={928} height={300} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 928 300");
    });

    it("rect 要素が生成されていること", () => {
        const { container } = render(
            <D3PyramidChart chartData={mockData} />
        );
        const rects = container.querySelectorAll("rect");
        // 2年齢階級 x 2性別 = 4つ以上の rect
        expect(rects.length).toBeGreaterThanOrEqual(4);
    });
});
