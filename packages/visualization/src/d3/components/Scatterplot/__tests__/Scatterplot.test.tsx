import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Scatterplot } from "../Scatterplot";
import type { ScatterplotDataNode } from "../types";

const mockData: ScatterplotDataNode[] = [
    { x: 10, y: 100, label: "Point 1" },
    { x: 20, y: 150, label: "Point 2" },
    { x: 30, y: 50, label: "Point 3" },
];

describe("Scatterplot SVG structure", () => {
    it("viewBox がサイズ props に追従する", () => {
        const { container } = render(
            <Scatterplot data={mockData} width={640} height={400} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 640 400");
    });

    it("circle 要素（プロット点）が生成されていること", () => {
        const { container } = render(
            <Scatterplot data={mockData} />
        );
        const circles = container.querySelectorAll("circle");
        expect(circles.length).toBe(3);
    });
});
