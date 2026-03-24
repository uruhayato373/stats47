import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { compareWithGolden } from "../../../../shared/__tests__/helpers/golden-compare";
import { svgToPng } from "../../../../shared/__tests__/helpers/svg-to-png";
import type { HierarchyDataNode } from "../../../types/base";
import { TreemapChart } from "../index";

const mockData: HierarchyDataNode = {
    name: "産業構造",
    children: [
        {
            name: "製造業",
            children: [
                { name: "自動車", value: 50 },
                { name: "電子機器", value: 70 },
            ],
        },
        { name: "サービス業", value: 40 },
    ],
};

describe("TreemapChart PNG Golden Test", () => {
    it("landscape (640x480)", async () => {
        const width = 640;
        const height = 480;

        const { container } = render(
            <TreemapChart data={mockData} width={width} height={height} />
        );

        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        const buffer = await svgToPng(svgString, width, height);

        await compareWithGolden("treemapchart-landscape", buffer, width, height);
    });
});
