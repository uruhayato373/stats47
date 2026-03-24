import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { compareWithGolden } from "../../../../shared/__tests__/helpers/golden-compare";
import { svgToPng } from "../../../../shared/__tests__/helpers/svg-to-png";
import type { D3PyramidChartData } from "../../../types/d3";
import { D3PyramidChart } from "../index";

const mockData: D3PyramidChartData[] = [
    { ageGroup: "0〜4歳", male: -100, female: 100 },
    { ageGroup: "5〜9歳", male: -120, female: 110 },
    { ageGroup: "10〜14歳", male: -130, female: 120 },
];

describe("D3PyramidChart PNG Golden Test", () => {
    it("landscape (1920x1080)", async () => {
        // PyramidChart はデフォルト 928x300 だが、プリセットに合わせる
        const width = 1920;
        const height = 1080;

        const { container } = render(
            <D3PyramidChart chartData={mockData} width={width} height={height} />
        );

        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        const buffer = await svgToPng(svgString, width, height);

        await compareWithGolden("pyramidchart-landscape", buffer, width, height);
    });
});
