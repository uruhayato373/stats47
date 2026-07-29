import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NationalTrendCard } from "../NationalTrendCard";

import type { RankingNationalTrendSnapshot } from "@stats47/ranking";

// D3 ツールチップは jsdom で不要 (描画ロジックのみ検証する)
vi.mock("@stats47/visualization", () => ({
  useD3Tooltip: () => ({
    showTooltip: vi.fn(),
    showStackedTooltip: vi.fn(),
    hideTooltip: vi.fn(),
    updateTooltipPosition: vi.fn(),
  }),
}));

const snapshot: RankingNationalTrendSnapshot = {
  generatedAt: "2026-07-29T00:00:00.000Z",
  rankingKey: "total-population",
  areaType: "prefecture",
  series: [
    {
      basis: "original",
      label: "総数",
      unit: "人",
      points: [
        { yearCode: "2024", yearName: "2024年", average: 2_634_106, total: 123_803_000, count: 47 },
        { yearCode: "2015", yearName: "2015年", average: 2_700_000, total: 126_900_000, count: 47 },
      ],
    },
    {
      basis: "per_area",
      label: "面積100km²あたり",
      unit: "人/100km²",
      points: [
        { yearCode: "2024", yearName: "2024年", average: 64_949.9, total: 3_052_647, count: 47 },
        { yearCode: "2015", yearName: "2015年", average: 65_469.5, total: 3_077_066, count: 47 },
      ],
    },
  ],
};

describe("NationalTrendCard", () => {
  it("正規化なしのとき original series を表示すること", () => {
    render(<NationalTrendCard nationalTrend={snapshot} />);
    expect(screen.getByText("全国平均の推移 (総数)")).toBeInTheDocument();
  });

  it("per_area 選択時に対応する series へ切り替わること (追加 fetch なし)", () => {
    render(<NationalTrendCard nationalTrend={snapshot} normalizationType="per_area" />);
    expect(screen.getByText("全国平均の推移 (面積100km²あたり)")).toBeInTheDocument();
  });

  it("該当 series が無い基準では original にフォールバックすること", () => {
    render(<NationalTrendCard nationalTrend={snapshot} normalizationType="per_population" />);
    expect(screen.getByText("全国平均の推移 (総数)")).toBeInTheDocument();
  });

  it("snapshot が無ければ何も描画しないこと (未生成キーの段階導入)", () => {
    const { container } = render(<NationalTrendCard nationalTrend={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("点が 1 つしか無い series は描画しないこと (推移にならない)", () => {
    const single: RankingNationalTrendSnapshot = {
      ...snapshot,
      series: [{ ...snapshot.series[0], points: [snapshot.series[0].points[0]] }],
    };
    const { container } = render(<NationalTrendCard nationalTrend={single} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("最新年の値と対象期間を表示すること", () => {
    render(<NationalTrendCard nationalTrend={snapshot} normalizationType="per_area" decimalPlaces={1} />);
    // 最新年 (2024) の average
    expect(screen.getByText(/64,?949\.9人\/100km²/)).toBeInTheDocument();
    expect(screen.getByText(/2015〜2024年/)).toBeInTheDocument();
    expect(screen.getByText(/47都道府県の単純平均/)).toBeInTheDocument();
  });
});
