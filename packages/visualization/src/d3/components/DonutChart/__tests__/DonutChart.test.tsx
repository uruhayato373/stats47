import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DonutChart } from "../DonutChart";
import type { DonutChartDataNode } from "../types";

const mockData: DonutChartDataNode[] = [
    { name: "A", value: 100 },
    { name: "B", value: 150 },
    { name: "C", value: 50 },
];

describe("DonutChart SVG structure", () => {
    it("viewBox がサイズ props に追従する", () => {
        const { container } = render(
            <DonutChart data={mockData} width={500} height={500} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 500 500");
    });

    it("path 要素（ドーナツのセグメント）が生成されていること", () => {
        const { container } = render(
            <DonutChart data={mockData} />
        );
        const paths = container.querySelectorAll("path");
        // 3セグメント分あればOK
        expect(paths.length).toBeGreaterThanOrEqual(3);
    });
});
