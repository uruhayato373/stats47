import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { compareWithGolden } from "../../../../shared/__tests__/helpers/golden-compare";
import type { ChartDataNode } from "../../../types/base";
import { BarChart } from "../BarChart";

const mockData: ChartDataNode[] = [
    { name: "東京", value: 500, "20代": 120, "30代": 150, "40代": 130, "50代": 100 },
    { name: "神奈川", value: 340, "20代": 80, "30代": 100, "40代": 90, "50代": 70 },
    { name: "大阪", value: 380, "20代": 90, "30代": 110, "40代": 100, "50代": 80 },
];

const keys = ["20代", "30代", "40代", "50代"];

describe("BarChart PNG Golden Test", () => {
    it("landscape (1920x1080) が期待通りに画像化される", async () => {
        const width = 1920;
        const height = 1080;

        // JS環境でレンダリング
        const { container } = render(
            <BarChart data={mockData} keys={keys} width={width} height={height} title="Landscape Test" />
        );

        // SVG文字列を取得 (D3の描画を待つため少し待つ必要があるかもしれないが、jsdomでは同期的)
        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        // SVG文字列に namespace を追加 (sharpで必要)
        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');

        // PNGバッファに変換
        const buffer = Buffer.from(svgString);

        // ゴールデン比較
        await compareWithGolden("barchart-landscape", buffer, width, height);
    });

    it("portrait (1080x1920) が期待通りに画像化される", async () => {
        const width = 1080;
        const height = 1920;

        const { container } = render(
            <BarChart data={mockData} keys={keys} width={width} height={height} title="Portrait Test" />
        );

        const svgElement = container.querySelector("svg");
        if (!svgElement) throw new Error("SVG not found");

        const svgString = svgElement.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
        const buffer = Buffer.from(svgString);

        await compareWithGolden("barchart-portrait", buffer, width, height);
    });
});
