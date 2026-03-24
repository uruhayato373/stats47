import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChartDataNode } from "../../../types/base";
import { BarChart } from "../BarChart";

const mockData: ChartDataNode[] = [
    { name: "A", value: 100, val1: 100, val2: 200 },
    { name: "B", value: 150, val1: 150, val2: 100 },
];

const keys = ["val1", "val2"];

describe("BarChart SVG structure", () => {
    it("viewBox がサイズ props に追従する", () => {
        const { container } = render(
            <BarChart data={mockData} keys={keys} width={1920} height={1080} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 1920 1080");
    });

    it("Tailwind クラスが正しく適用されている", () => {
        const { container } = render(
            <BarChart data={mockData} keys={keys} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.classList.contains("w-full")).toBe(true);
        expect(svg?.classList.contains("h-auto")).toBe(true);
    });

    it("portrait サイズでもレンダリングできる", () => {
        const { container } = render(
            <BarChart data={mockData} keys={keys} width={1080} height={1920} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 1080 1920");
        // rect 要素（バー）が生成されていること
        // 2データ点 x 2系列 = 4つの rect (背景除く)
        const rects = container.querySelectorAll("rect");
        expect(rects.length).toBeGreaterThanOrEqual(4);
    });

    it("不要な width/height HTML 属性がないこと", () => {
        const { container } = render(
            <BarChart data={mockData} keys={keys} width={800} height={500} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.hasAttribute("width")).toBe(false);
        expect(svg?.hasAttribute("height")).toBe(false);
    });
});
