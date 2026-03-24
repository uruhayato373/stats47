import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { compareWithGolden } from "../../../../shared/__tests__/helpers/golden-compare";
import { svgToPng } from "../../../../shared/__tests__/helpers/svg-to-png";
import { D3BarChartRace } from "../D3BarChartRace";
import type { BarChartRaceFrame } from "../types";

const mockData: BarChartRaceFrame[] = [
    {
        date: "2020",
        items: [
            { name: "東京", value: 120 },
            { name: "神奈川", value: 80 },
            { name: "大阪", value: 90 },
        ],
    },
];

describe("D3BarChartRace PNG Golden Test", () => {
    it("landscape (1920x1080)", async () => {
        const width = 1920;
        const height = 1080;

        const { container } = render(
            <D3BarChartRace data={mockData} width={width} height={height} title="Landscape" />
        );

        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        const buffer = await svgToPng(svgString, width, height);

        await compareWithGolden("d3barchartrace-landscape", buffer, width, height);
    });

    it("portrait (1080x1920)", async () => {
        const width = 1080;
        const height = 1920;

        const { container } = render(
            <D3BarChartRace data={mockData} width={width} height={height} title="Portrait" />
        );

        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        const buffer = await svgToPng(svgString, width, height);

        await compareWithGolden("d3barchartrace-portrait", buffer, width, height);
    });
});
