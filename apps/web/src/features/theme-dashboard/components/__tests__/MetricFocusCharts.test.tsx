import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * MetricFocusCharts の契約 (GEO-SCOPE-SEPARATION-01 WP2)。
 *
 * 47都道府県 (未選択) では:
 *  (a) 時系列の fetch を一切行わない (ネットワーク往復ゼロ)
 *  (b) 時系列の代わりに選択案内を出す (エラー文言ではない)
 *  (c) 上下位 5 県の ranking は常に表示する (ranking を主役にする)
 *  (d) 画面のどこにも「全国」を含まない
 * 都道府県選択後は:
 *  (e) その県の推移だけを fetch する
 */

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock("../../actions", () => ({
  fetchMetricTimeseriesAction: (...args: unknown[]) => fetchMock(...args),
}));

vi.mock(
  "@/components/stat-charts/components/charts/LineChart/LineChartClient",
  () => ({
    LineChartClient: ({ chartData }: { chartData: unknown }) => (
      <div data-testid="line-chart" data-chart={JSON.stringify(chartData)} />
    ),
  }),
);

import { MetricFocusCharts } from "../MetricFocusCharts";

import type { RankingItem, RankingValue } from "@stats47/ranking";

const rankingItem = { title: "賃金", unit: "円" } as unknown as RankingItem;

const currentValues: RankingValue[] = Array.from({ length: 47 }, (_, i) => ({
  areaCode: String(i + 1).padStart(5, "0"),
  value: 100 + i,
  rank: 47 - i,
})) as unknown as RankingValue[];

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ points: [{ year: "2020", yearName: "2020年", value: 1 }] });
});

describe("MetricFocusCharts — 47都道府県 (未選択)", () => {
  it("★時系列の fetch を一切行わない", async () => {
    render(
      <MetricFocusCharts
        metricKey="wage"
        selectedPrefectureCode={null}
        rankingItem={rankingItem}
        currentValues={currentValues}
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByText(/都道府県を選択すると、その県の推移が表示されます/),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("上下位 5 県の ranking は表示する (ranking を主役にする)", () => {
    render(
      <MetricFocusCharts
        metricKey="wage"
        selectedPrefectureCode={null}
        rankingItem={rankingItem}
        currentValues={currentValues}
      />,
    );
    expect(screen.getByText(/上位 5 \/ 下位 5/)).toBeInTheDocument();
    // 実データの最上位県 (areaCode "00047") が bar として出ている
    expect(screen.getAllByText(/00047|00001/).length).toBeGreaterThan(0);
  });

  it("★画面のどこにも「全国」を含まない", () => {
    const { container } = render(
      <MetricFocusCharts
        metricKey="wage"
        selectedPrefectureCode={null}
        rankingItem={rankingItem}
        currentValues={currentValues}
      />,
    );
    expect(container.textContent ?? "").not.toContain("全国");
  });
});

describe("MetricFocusCharts — 都道府県選択時", () => {
  it("選択した県の時系列だけを fetch する", async () => {
    render(
      <MetricFocusCharts
        metricKey="wage"
        selectedPrefectureCode="13000"
        rankingItem={rankingItem}
        currentValues={currentValues}
      />,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("wage", "13000");
  });

  it("取得できたら時系列チャートを描く", async () => {
    render(
      <MetricFocusCharts
        metricKey="wage"
        selectedPrefectureCode="13000"
        rankingItem={rankingItem}
        currentValues={currentValues}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
  });
});
