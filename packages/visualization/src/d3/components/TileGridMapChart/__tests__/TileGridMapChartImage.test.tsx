import { ranking } from "@stats47/mock";
import { render, waitFor } from "@testing-library/react";
import { describe, it } from "vitest";
import { compareWithGolden } from "../../../../shared/__tests__/helpers/golden-compare";
import { svgToPng } from "../../../../shared/__tests__/helpers/svg-to-png";
import { TileGridMap } from "../index";

const mockData = ranking.annualSalesAmountPerEmployeeData;

describe("TileGridMap PNG Golden Test", () => {
    it("standard (600x900)", async () => {
        const width = 600;
        const height = 900;

        const { container } = render(
            <TileGridMap
                data={mockData as any}
                width={width}
                height={height}
                colorConfig={{ colorSchemeType: "sequential", colorScheme: "interpolatePurples" }}
            />
        );

        await waitFor(() => {
            const svg = container.querySelector("svg");
            if (!svg || svg.querySelectorAll("rect").length < 47) throw new Error("Loading...");
        }, { timeout: 3000 });

        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        const buffer = await svgToPng(svgString, width, height);

        await compareWithGolden("tilegridmap-standard", buffer, width, height);
    });
});
