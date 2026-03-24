import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { compareWithGolden } from "../../../../shared/__tests__/helpers/golden-compare";
import { svgToPng } from "../../../../shared/__tests__/helpers/svg-to-png";
import { Scatterplot } from "../Scatterplot";
import type { ScatterplotDataNode } from "../types";

const mockData: ScatterplotDataNode[] = [
    { x: 10, y: 100, label: "Point 1", category: "A" },
    { x: 20, y: 150, label: "Point 2", category: "B" },
    { x: 30, y: 50, label: "Point 3", category: "A" },
];

describe("Scatterplot PNG Golden Test", () => {
    it("landscape (1920x1080)", async () => {
        const width = 1920;
        const height = 1080;

        const { container } = render(
            <Scatterplot data={mockData} width={width} height={height} title="Landscape Scatter" />
        );

        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        const buffer = await svgToPng(svgString, width, height);

        await compareWithGolden("scatterplot-landscape", buffer, width, height);
    });
});
