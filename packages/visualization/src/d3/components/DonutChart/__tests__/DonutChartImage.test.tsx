import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { compareWithGolden } from "../../../../shared/__tests__/helpers/golden-compare";
import { svgToPng } from "../../../../shared/__tests__/helpers/svg-to-png";
import { DonutChart } from "../DonutChart";
import type { DonutChartDataNode } from "../types";

const mockData: DonutChartDataNode[] = [
    { name: "10代", value: 120 },
    { name: "20代", value: 80 },
    { name: "30代", value: 90 },
];

describe("DonutChart PNG Golden Test", () => {
    it("square (1080x1080)", async () => {
        const width = 1080;
        const height = 1080;

        const { container } = render(
            <DonutChart data={mockData} width={width} height={height} title="Square Donut" />
        );

        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        const buffer = await svgToPng(svgString, width, height);

        await compareWithGolden("donutchart-square", buffer, width, height);
    });
});
