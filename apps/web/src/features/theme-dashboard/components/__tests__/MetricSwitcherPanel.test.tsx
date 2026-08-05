import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";


/**
 * MetricSwitcherPanel の契約。
 *
 * 守りたいのは見た目ではなく、この UI を作った理由そのもの:
 *  (a) 全指標を一括取得しない (旧カードグリッドの一括 fetch を置き換えたのが目的)
 *  (b) 一度取った系列を取り直さない
 *  (c) 47 県平均を「全国」と称さない (2026-08-04 の不具合の回帰テスト)
 *  (d) 県選択時は全国を破線の比較系列として重ねる
 */

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock("../../actions", () => ({
  fetchMetricTimeseriesAction: (...args: unknown[]) => fetchMock(...args),
}));

const { trackNavClickMock } = vi.hoisted(() => ({ trackNavClickMock: vi.fn() }));
vi.mock("@/lib/analytics/events", () => ({
  trackNavClick: (...args: unknown[]) => trackNavClickMock(...args),
}));

/** LineChartClient は dynamic import + D3 なので、渡された lines を JSON で覗ける stub に差し替える */
vi.mock(
  "@/components/stat-charts/components/charts/LineChart/LineChartClient",
  () => ({
    LineChartClient: ({ chartData }: { chartData: unknown }) => (
      <div data-testid="line-chart" data-chart={JSON.stringify(chartData)} />
    ),
  }),
);

import { MetricSwitcherPanel } from "../MetricSwitcherPanel";

import type { MetricKpi } from "../metric-kpi";

const kpi = (metricKey: string, over: Partial<MetricKpi> = {}): MetricKpi => ({
  metricKey,
  title: `${metricKey} タイトル`,
  unit: "円",
  value: 100,
  rank: null,
  total: 47,
  series: [],
  isNationalAverage: false,
  isLoading: false,
  ...over,
});

const METRICS = [kpi("wage"), kpi("unemployment"), kpi("job-ratio")];
const LABELS = { wage: "賃金", unemployment: "失業率", "job-ratio": "有効求人倍率" };

/** Radix の TabsTrigger は mousedown で値が変わる (click だけでは発火しない) */
function selectTile(label: RegExp) {
  const tab = screen.getByRole("tab", { name: label });
  fireEvent.mouseDown(tab);
  fireEvent.click(tab);
}

/** 現在どの指標が選択されているかは、フッターのランキング導線で観測する */
function selectedRankingHref() {
  return screen
    .getByRole("link", { name: /ランキングを見る/ })
    .getAttribute("href");
}

const points = (values: number[]) =>
  values.map((v, i) => ({
    year: `${2020 + i}`,
    yearName: `${2020 + i}年`,
    value: v,
  }));

function renderPanel(over: Partial<React.ComponentProps<typeof MetricSwitcherPanel>> = {}) {
  return render(
    <MetricSwitcherPanel
      metrics={METRICS}
      tabLabels={LABELS}
      selectedPrefectureCode={null}
      areaName="全国"
      {...over}
    />,
  );
}

/** stub に渡った LineChartData を取り出す */
function readChartData() {
  const el = screen.getByTestId("line-chart");
  return JSON.parse(el.getAttribute("data-chart") ?? "{}");
}

beforeEach(() => {
  fetchMock.mockReset();
  trackNavClickMock.mockReset();
  fetchMock.mockResolvedValue({ points: points([1, 2, 3]), source: "national" });
});

describe("MetricSwitcherPanel — 取得の契約", () => {
  it("初期表示で取りに行くのは選択中の 1 指標だけ (全指標を一括取得しない)", async () => {
    renderPanel();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("wage", "00000");
    // 他 2 指標は 1 度も取りに行っていない
    const requested = fetchMock.mock.calls.map((c) => c[0]);
    expect(requested).not.toContain("unemployment");
    expect(requested).not.toContain("job-ratio");
  });

  it("タイル選択でその指標だけ追加取得し、戻ると再取得しない (キャッシュ)", async () => {
    renderPanel();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    selectTile(/失業率/);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith("unemployment", "00000");
    expect(selectedRankingHref()).toBe("/ranking/unemployment");

    // 最初のタイルへ戻す。選択が戻ったことを導線で確かめた上で、呼び出しが増えていないこと
    selectTile(/賃金/);
    await waitFor(() => expect(selectedRankingHref()).toBe("/ranking/wage"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("defaultMetricKey を初期選択にする", async () => {
    renderPanel({ defaultMetricKey: "job-ratio" });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("job-ratio", "00000"));
  });
});

describe("MetricSwitcherPanel — 平均を「全国」と称さない", () => {
  it("source=average なら凡例が「全国平均」であり「全国」ではない", async () => {
    fetchMock.mockResolvedValue({ points: points([1, 2, 3]), source: "average" });
    renderPanel();
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    expect(readChartData().lines[0].name).toBe("全国平均");
  });

  it("source=national なら凡例が「全国」", async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    expect(readChartData().lines[0].name).toBe("全国");
  });

  it("action が空を返す計算型指標は R2 平均へ退避し「全国平均」と示す", async () => {
    fetchMock.mockResolvedValue({ points: [], source: "none" });
    render(
      <MetricSwitcherPanel
        metrics={[kpi("calc", { series: [{ year: 2020, value: 5 }, { year: 2021, value: 6 }] })]}
        tabLabels={{ calc: "計算型" }}
        selectedPrefectureCode={null}
        areaName="全国"
      />,
    );
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    expect(readChartData().lines[0].name).toBe("全国平均");
  });
});

describe("MetricSwitcherPanel — 県選択時の比較系列", () => {
  it("実線=県 / 破線=全国 の 2 系列になり、比較系列は点を描かない", async () => {
    fetchMock.mockImplementation((_key: string, area: string) =>
      Promise.resolve(
        area === "00000"
          ? { points: points([10, 11, 12]), source: "national" }
          : { points: points([1, 2, 3]), source: "area" },
      ),
    );
    renderPanel({ selectedPrefectureCode: "13000", areaName: "東京都" });

    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
    const [primary, comparison] = readChartData().lines;
    expect(primary.name).toBe("東京都");
    expect(primary.strokeDasharray).toBeUndefined();
    expect(comparison.name).toBe("全国");
    expect(comparison.strokeDasharray).toBe("6,4");
    expect(comparison.hidePoints).toBe(true);
  });

  it("県選択時は自地域と全国の 2 本を取りに行く", async () => {
    renderPanel({ selectedPrefectureCode: "13000", areaName: "東京都" });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const areas = fetchMock.mock.calls.map((c) => c[1]).sort();
    expect(areas).toEqual(["00000", "13000"]);
  });
});

describe("MetricSwitcherPanel — チャートが空になる指標への退避", () => {
  /**
   * 国土数値情報など e-Stat パラメータを持たない external 種は、県を選ぶと
   * その県の系列が空で返る。旧実装は即「推移データがありません」にしていたが、
   * 全国系列があるならそれを描いた方が水準の文脈が残る。
   */
  it("県系列が空でも全国系列があればそれを描く", async () => {
    fetchMock.mockImplementation((_key: string, area: string) =>
      Promise.resolve(
        area === "00000"
          ? { points: points([10, 11, 12]), source: "national" }
          : { points: [], source: "none" },
      ),
    );
    renderPanel({ selectedPrefectureCode: "13000", areaName: "東京都" });

    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    const { lines } = readChartData();
    expect(lines).toHaveLength(1);
    expect(lines[0].name).toBe("全国");
  });

  it("県系列も全国系列も空なら空状態を出す", async () => {
    fetchMock.mockResolvedValue({ points: [], source: "none" });
    renderPanel({ selectedPrefectureCode: "13000", areaName: "東京都" });
    await waitFor(() =>
      expect(screen.getByText(/推移データがありません/)).toBeInTheDocument(),
    );
  });

  /**
   * 単年しか調査されていない指標 (鉄道駅数=2024年のみ 等) は、データが欠けているのでは
   * なく推移そのものが存在しない。取得失敗と同じ文面にすると読者が区別できない。
   */
  it("単年しかない指標は「単年データ」と理由を書く (取得失敗と区別する)", async () => {
    fetchMock.mockResolvedValue({ points: points([42]), source: "national" });
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText(/2020年の単年データのため/)).toBeInTheDocument(),
    );
    // 汎用文言に潰していないこと
    expect(screen.queryByText("推移データがありません")).toBeNull();
    // チャート枠は出さない
    expect(screen.queryByTestId("line-chart")).toBeNull();
  });

  it("単年のときは見出しも「推移」と言わない", async () => {
    fetchMock.mockResolvedValue({ points: points([42]), source: "national" });
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(/2020年時点の値/)).toBeInTheDocument(),
    );
  });
});

describe("MetricSwitcherPanel — 指数系は全国比較線を出さない", () => {
  /**
   * 「全国=100」の地域差指数は全国が定義上どの年も 100。比較線を引くと
   * 情報ゼロの水平線が縦軸を占有し、県の変化が読みにくくなる。
   */
  it("unit が「(全国=100)」なら県選択時も比較破線を描かない", async () => {
    fetchMock.mockImplementation((_key: string, area: string) =>
      Promise.resolve(
        area === "00000"
          ? { points: points([100, 100, 100]), source: "national" }
          : { points: points([98, 99, 101]), source: "area" },
      ),
    );
    render(
      <MetricSwitcherPanel
        metrics={[kpi("cpi", { unit: "(全国=100)" })]}
        tabLabels={{ cpi: "総合" }}
        selectedPrefectureCode="13000"
        areaName="東京都"
      />,
    );
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    const { lines } = readChartData();
    expect(lines).toHaveLength(1);
    expect(lines[0].name).toBe("東京都");
  });

  it("通常の単位なら比較破線を描く (抑制が効きすぎていない)", async () => {
    fetchMock.mockImplementation((_key: string, area: string) =>
      Promise.resolve(
        area === "00000"
          ? { points: points([10, 11, 12]), source: "national" }
          : { points: points([1, 2, 3]), source: "area" },
      ),
    );
    render(
      <MetricSwitcherPanel
        metrics={[kpi("wage", { unit: "円" })]}
        tabLabels={{ wage: "賃金" }}
        selectedPrefectureCode="13000"
        areaName="東京都"
      />,
    );
    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
  });
});

describe("MetricSwitcherPanel — 回遊と計測", () => {
  it("選択中指標のランキングへの導線を出す", async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    const link = screen.getByRole("link", { name: /ランキングを見る/ });
    expect(link).toHaveAttribute("href", "/ranking/wage");
  });

  it("タイルクリックで nav_click を theme_kpi_switcher surface として送る", async () => {
    renderPanel();
    selectTile(/失業率/);
    await waitFor(() => expect(trackNavClickMock).toHaveBeenCalled());
    expect(trackNavClickMock).toHaveBeenCalledWith({
      label: "unemployment",
      href: "/ranking/unemployment",
      surface: "theme_kpi_switcher",
    });
  });
});
