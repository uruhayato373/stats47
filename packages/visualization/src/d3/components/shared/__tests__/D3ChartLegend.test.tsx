import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
