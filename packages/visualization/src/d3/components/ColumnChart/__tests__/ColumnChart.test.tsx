import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChartDataNode } from "../../../types/base";
import { ColumnChart } from "../ColumnChart";

const mockData: ChartDataNode[] = [
    { name: "A", value: 100 },
    { name: "B", value: 150 },
];

describe("ColumnChart SVG structure", () => {
    it("viewBox がサイズ props に追従する", () => {
        const { container } = render(
            <ColumnChart data={mockData} indexBy="name" keys={["value"]} width={800} height={500} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 800 500");
    });

    it("rect 要素（バー）が生成されていること", () => {
        const { container } = render(
            <ColumnChart data={mockData} indexBy="name" keys={["value"]} />
        );
        const rects = container.querySelectorAll("rect");
        expect(rects.length).toBeGreaterThanOrEqual(2);
    });
});
