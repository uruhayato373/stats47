import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { compareWithGolden } from "../../../../shared/__tests__/helpers/golden-compare";
import { svgToPng } from "../../../../shared/__tests__/helpers/svg-to-png";
import type { HierarchyDataNode } from "../../../types/base";
import { SunburstChart } from "../index";

const mockData: HierarchyDataNode = {
    name: "歳出",
    children: [
        {
            name: "民生費",
            children: [
                { name: "児童福祉", value: 50 },
                { name: "高齢者福祉", value: 70 },
            ],
        },
        { name: "教育費", value: 40 },
    ],
};

describe("SunburstChart PNG Golden Test", () => {
    it("square (1080x1080)", async () => {
        const width = 1080;
        const height = 1080;

        const { container } = render(
            <SunburstChart data={mockData} width={width} height={height} />
        );

        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        const buffer = await svgToPng(svgString, width, height);

        await compareWithGolden("sunburstchart-square", buffer, width, height);
    });
});
