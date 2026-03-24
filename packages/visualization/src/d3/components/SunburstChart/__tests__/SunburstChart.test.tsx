import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HierarchyDataNode } from "../../../types/base";
import { SunburstChart } from "../index";

const mockData: HierarchyDataNode = {
    name: "root",
    children: [
        { name: "A", value: 100 },
        { name: "B", value: 150 },
    ],
};

describe("SunburstChart SVG structure", () => {
    it("viewBox がサイズ props に追従する", () => {
        const { container } = render(
            <SunburstChart data={mockData} width={500} height={500} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 500 500");
    });

    it("path 要素（サンバーストのセグメント）が生成されていること", () => {
        const { container } = render(
            <SunburstChart data={mockData} />
        );
        const paths = container.querySelectorAll("path");
        // root は除外されるため、子ノードの数（2）と一致するはず
        expect(paths.length).toBe(2);
    });
});
