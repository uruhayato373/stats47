import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { D3BarChartRace } from "../D3BarChartRace";
import type { BarChartRaceFrame } from "../types";

const mockData: BarChartRaceFrame[] = [
    {
        date: "2020",
        items: [
            { name: "A", value: 100 },
            { name: "B", value: 150 },
        ],
    },
    {
        date: "2021",
        items: [
            { name: "A", value: 200 },
            { name: "B", value: 100 },
        ],
    },
];

describe("D3BarChartRace SVG structure", () => {
    it("viewBox がサイズ props に追従する", () => {
        const { container } = render(
            <D3BarChartRace data={mockData} width={800} height={500} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 800 500");
    });

    it("SVG 要素がレンダリングされていること", () => {
        const { container } = render(
            <D3BarChartRace data={mockData} />
        );
        const svg = container.querySelector("svg");
        expect(svg).not.toBeNull();
    });
});
