import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HierarchyDataNode } from "../../../types/base";
import { TreemapChart } from "../index";

const mockData: HierarchyDataNode = {
    name: "root",
    children: [
        { name: "A", value: 100 },
        { name: "B", value: 150 },
    ],
};

describe("TreemapChart SVG structure", () => {
    it("viewBox がサイズ props に追従する", () => {
        const { container } = render(
            <TreemapChart data={mockData} width={600} height={400} />
        );
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 600 400");
    });

    it("rect 要素（リーフノード）が生成されていること", () => {
        const { container } = render(
            <TreemapChart data={mockData} />
        );
        const rects = container.querySelectorAll("rect");
        // 2つのリーフノードがあればOK
        expect(rects.length).toBe(2);
    });
});
