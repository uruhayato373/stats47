import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartLegendLeadProvider } from "../chart-legend-lead";
import { D3ChartLegend } from "../D3ChartLegend";

describe("D3ChartLegend", () => {
  it("items がない場合は何も描画しない", () => {
    const { container } = render(<D3ChartLegend items={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("square と line のマーカーを描画できる", () => {
    const { getByText } = render(
      <D3ChartLegend
        items={[
          { key: "income", label: "歳入", color: "#2563eb" },
          { key: "trend", label: "推移", color: "#dc2626", marker: "line", opacity: 0.7 },
        ]}
      />,
    );

    const incomeMarker = getByText("歳入").previousElementSibling;
    const trendMarker = getByText("推移").previousElementSibling;

    expect(incomeMarker?.classList.contains("h-3")).toBe(true);
    expect(incomeMarker?.classList.contains("w-3")).toBe(true);
    expect(trendMarker?.classList.contains("h-[3px]")).toBe(true);
    expect(trendMarker?.classList.contains("w-4")).toBe(true);
    expect((trendMarker as HTMLElement | null)?.style.opacity).toBe("0.7");
  });

  // 2026-10-29: 地域・期間・単位を凡例と同じ 1 行に置く (見本のチャートのカードの「左に名前、右に凡例」)
  it("説明を渡されたときは、左に説明・右に凡例の 1 行にする", () => {
    const { container, getByText } = render(
      <ChartLegendLeadProvider lead="東京都 · 1983年〜2023年 · %">
        <D3ChartLegend items={[{ key: "a", label: "空き家率", color: "#dc2626", marker: "line" }]} />
      </ChartLegendLeadProvider>,
    );
    const row = container.querySelector("[data-chart-legend-lead]");
    expect(row).not.toBeNull();
    expect(row?.firstElementChild?.textContent).toBe("東京都 · 1983年〜2023年 · %");
    expect(row?.contains(getByText("空き家率"))).toBe(true);
  });

  it("説明が無ければ従来どおり凡例だけを右寄せで描く", () => {
    const { container } = render(
      <D3ChartLegend items={[{ key: "a", label: "空き家率", color: "#dc2626" }]} />,
    );
    expect(container.querySelector("[data-chart-legend-lead]")).toBeNull();
  });
});
