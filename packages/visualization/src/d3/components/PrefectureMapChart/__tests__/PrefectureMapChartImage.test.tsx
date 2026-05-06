import type { TopoJSONTopology } from "@stats47/types";
import { render, waitFor } from "@testing-library/react";
import { describe, it } from "vitest";
import jpPrefecturesData from "../../../../__tests__/fixtures/jp-prefectures.json";
import rankingData from "../../../../__tests__/fixtures/ranking-data.json";
import { compareWithGolden } from "../../../../shared/__tests__/helpers/golden-compare";
import { svgToPng } from "../../../../shared/__tests__/helpers/svg-to-png";
import { PrefectureMapChart } from "../index";

const topology = jpPrefecturesData as unknown as TopoJSONTopology;

describe("PrefectureMapChart PNG Golden Test", () => {
    it("standard (600x900)", async () => {
        const width = 600;
        const height = 900;

        const { container } = render(
            <PrefectureMapChart
                data={rankingData as any}
                topology={topology}
                width={width}
                height={height}
                colorConfig={{ colorSchemeType: "sequential", colorScheme: "interpolatePurples" }}
            />
        );

        await waitFor(() => {
            const svg = container.querySelector("svg");
            if (!svg || svg.querySelectorAll("path").length < 47) throw new Error("Loading...");
        }, { timeout: 3000 });

        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        const buffer = await svgToPng(svgString, width, height);

        await compareWithGolden("prefecturemapchart-standard", buffer, width, height);
    });
});
