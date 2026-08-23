import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";


/**
 * MetricSwitcherPanel の契約。
 *
 * 守りたいのは見た目ではなく、この UI を作った理由そのもの:
 *  (a) 全指標を一括取得しない (旧カードグリッドの一括 fetch を置き換えたのが目的)
 *  (b) 一度取った系列を取り直さない
 *  (c) 平均を「全国」と称さない (2026-08-04 の不具合の回帰テスト。呼称は「都道府県平均」)
 *  (d) 県選択かつ 1 本のときだけ全国を破線の比較系列として重ねる
 *  (e) 単位が 2 種なら左右 Y 軸に分ける (2026-08-06 の複数チェック化)
 *  (f) 最後の 1 本は外せない (系列ゼロの空カードを作らせない)
 *  (g) ★47都道府県 (未選択) は「全国」の代役ではない。fetch せず、タイルは実在する
 *      1位県の値をそのまま出す (GEO-SCOPE-SEPARATION-01 WP2)
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
  topRanked: { areaCode: "13000", areaName: "東京都", value: 999 },
  isLoading: false,
  ...over,
});

const METRICS = [kpi("wage"), kpi("unemployment"), kpi("job-ratio")];
const LABELS = { wage: "賃金", unemployment: "失業率", "job-ratio": "有効求人倍率" };

/** タイルはタイル全体が 1 つの role="checkbox" */
function tile(label: RegExp) {
  return screen.getByRole("checkbox", { name: label });
}

function toggleTile(label: RegExp) {
  fireEvent.click(tile(label));
}

/** チェック中の指標は「チャートに載っている系列」で観測する */
function chartedKeys(): string[] {
  return readChartData()
    .lines.map((l: { dataKey: string }) => l.dataKey)
    .filter((k: string) => k !== "national");
}

const points = (values: number[]) =>
  values.map((v, i) => ({
    year: `${2020 + i}`,
    yearName: `${2020 + i}年`,
    value: v,
  }));

/** 既定は「県選択時」(東京都) — fetch/chart 系のテストの大半はこの状態を扱う。
 *  47都道府県 (未選択) 固有の契約は別 describe で `selectedPrefectureCode: null` を明示する。 */
function renderPanel(over: Partial<React.ComponentProps<typeof MetricSwitcherPanel>> = {}) {
  return render(
    <MetricSwitcherPanel
      metrics={METRICS}
      tabLabels={LABELS}
      selectedPrefectureCode="13000"
      areaName="東京都"
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

describe("MetricSwitcherPanel — 47都道府県 (未選択) の既定表示", () => {
  function renderUnselected(over: Partial<React.ComponentProps<typeof MetricSwitcherPanel>> = {}) {
    return render(
      <MetricSwitcherPanel
        metrics={METRICS}
        tabLabels={LABELS}
        selectedPrefectureCode={null}
        areaName="47都道府県"
        {...over}
      />,
    );
  }

  it("★fetch を一切行わない (ネットワーク往復ゼロ)", async () => {
    renderUnselected();
    // 案内テキストが出るまで待ってから確認する (非同期の取りこぼしを避ける)
    await waitFor(() =>
      expect(
        screen.getByText(/都道府県を選択すると、その県の推移が表示されます/),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("複数チェックしても fetch は発生しない", async () => {
    renderUnselected({ defaultCheckedKeys: ["wage", "unemployment"] });
    await waitFor(() =>
      expect(
        screen.getByText(/都道府県を選択すると、その県の推移が表示されます/),
      ).toBeInTheDocument(),
    );
    toggleTile(/有効求人倍率/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("タイルは実在する1位県の値と県名を表示する (捏造・平均ではない)", async () => {
    renderUnselected();
    const wageTile = tile(/賃金/);
    expect(wageTile).toHaveTextContent("999");
    expect(wageTile).toHaveTextContent("東京都");
  });

  it("topRanked が無い指標はタイルの値が「—」になる (0 を捏造しない)", async () => {
    render(
      <MetricSwitcherPanel
        metrics={[kpi("unsupported-metric", { topRanked: null })]}
        tabLabels={{ "unsupported-metric": "県固有指標" }}
        selectedPrefectureCode={null}
        areaName="47都道府県"
      />,
    );
    expect(tile(/県固有指標/)).toHaveTextContent("—");
  });

  it("チャート領域は選択案内になる (エラー文言ではない)", async () => {
    renderUnselected();
    const prompt = await screen.findByText(
      "都道府県を選択すると、その県の推移が表示されます",
    );
    expect(prompt).toHaveStyle({ height: "80px" });
    expect(screen.queryByText("推移データがありません")).toBeNull();
    expect(screen.queryByTestId("line-chart")).toBeNull();
  });

  it("★画面のどこにも「全国」「全国平均」「（平均）」の文字列を含まない", async () => {
    const { container } = renderUnselected({
      defaultCheckedKeys: ["wage", "unemployment"],
    });
    await waitFor(() =>
      expect(
        screen.getByText(/都道府県を選択すると、その県の推移が表示されます/),
      ).toBeInTheDocument(),
    );
    const text = container.textContent ?? "";
    expect(text).not.toContain("全国");
    expect(text).not.toContain("（平均）");
  });
});

describe("MetricSwitcherPanel — 県選択時の取得の契約", () => {
  it("初期表示で取りに行くのは初期チェック分だけ (自地域+全国。全指標を一括取得しない)", async () => {
    renderPanel();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const requested = fetchMock.mock.calls.map((c) => [c[0], c[1]]);
    expect(requested).toEqual(
      expect.arrayContaining([
        ["wage", "13000"],
        ["wage", "00000"],
      ]),
    );
    // 他 2 指標は 1 度も取りに行っていない
    const requestedKeys = fetchMock.mock.calls.map((c) => c[0]);
    expect(requestedKeys).not.toContain("unemployment");
    expect(requestedKeys).not.toContain("job-ratio");
  });

  it("defaultCheckedKeys のぶんだけ初期取得する (指定した 2 本 × 自地域+全国 = 4 件)", async () => {
    renderPanel({ defaultCheckedKeys: ["unemployment", "job-ratio"] });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    const requestedKeys = fetchMock.mock.calls.map((c) => c[0]).sort();
    expect(requestedKeys).toEqual([
      "job-ratio",
      "job-ratio",
      "unemployment",
      "unemployment",
    ]);
    // 未チェックの wage は取りに行かない
    expect(requestedKeys).not.toContain("wage");
  });

  it("metrics に無い defaultCheckedKeys は無視し、全滅したら先頭 1 件に倒す", async () => {
    renderPanel({ defaultCheckedKeys: ["not-in-this-group"] });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const requestedKeys = fetchMock.mock.calls.map((c) => c[0]);
    expect(requestedKeys.every((k) => k === "wage")).toBe(true);
  });

  it("チェック追加はその指標だけ差分取得し、外して戻しても再取得しない (キャッシュ)", async () => {
    renderPanel();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    toggleTile(/失業率/);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    await waitFor(() => expect(chartedKeys()).toEqual(["wage", "unemployment"]));

    // 外して戻す → 呼び出しは増えない
    toggleTile(/失業率/);
    await waitFor(() => expect(chartedKeys()).toEqual(["wage"]));
    toggleTile(/失業率/);
    await waitFor(() => expect(chartedKeys()).toEqual(["wage", "unemployment"]));
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("系列の並びはチェックした順ではなく metrics の定義順", async () => {
    renderPanel({ defaultCheckedKeys: ["job-ratio"] });
    await waitFor(() => expect(chartedKeys()).toEqual(["job-ratio"]));
    toggleTile(/賃金/);
    // 後からチェックした wage が定義順で先に来る
    await waitFor(() => expect(chartedKeys()).toEqual(["wage", "job-ratio"]));
  });
});

describe("MetricSwitcherPanel — 最後の 1 本は外せない", () => {
  /**
   * 「系列ゼロにしない」は 2 段で守られている:
   *   (1) toggle の早期 return (押しても state を変えない)
   *   (2) checkedMetrics の導出フォールバック (空なら先頭 1 件に倒す)
   * (2) があるので (1) を外しても系列は消えない。下の描画テストは (2) を見ており、
   * (1) の存在は「ロック済みと読者に分かるか」= 下の affordance テストが見る。
   */
  it("1 本だけのときタイルはロック済みと分かる (aria-disabled + 理由)", async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    expect(tile(/賃金/)).toHaveAttribute("aria-disabled", "true");
    expect(tile(/賃金/)).toHaveAttribute("title", expect.stringContaining("外せません"));
    // 未チェックのタイルはロックされない
    expect(tile(/失業率/)).not.toHaveAttribute("aria-disabled");
  });

  it("2 本あるときはどちらもロック表示にならない (ロックが効きすぎていない)", async () => {
    renderPanel({ defaultCheckedKeys: ["wage", "unemployment"] });
    await waitFor(() => expect(chartedKeys()).toEqual(["wage", "unemployment"]));
    expect(tile(/賃金/)).not.toHaveAttribute("aria-disabled");
    expect(tile(/失業率/)).not.toHaveAttribute("aria-disabled");
  });

  it("1 本だけのときチェックを外しても系列は消えない", async () => {
    renderPanel();
    await waitFor(() => expect(chartedKeys()).toEqual(["wage"]));
    toggleTile(/賃金/);
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    expect(chartedKeys()).toEqual(["wage"]);
    expect(tile(/賃金/)).toHaveAttribute("aria-checked", "true");
  });

  it("2 本あるときは片方を外せる (ロックが効きすぎていない)", async () => {
    renderPanel({ defaultCheckedKeys: ["wage", "unemployment"] });
    await waitFor(() => expect(chartedKeys()).toEqual(["wage", "unemployment"]));
    toggleTile(/賃金/);
    await waitFor(() => expect(chartedKeys()).toEqual(["unemployment"]));
  });
});

describe("MetricSwitcherPanel — 2 軸 (単位が混在するグループ)", () => {
  it("単位 2 種なら 2 本目の単位を右軸に回し rightUnit を渡す", async () => {
    render(
      <MetricSwitcherPanel
        metrics={[kpi("wage", { unit: "円" }), kpi("ratio", { unit: "倍" })]}
        tabLabels={{ wage: "賃金", ratio: "有効求人倍率" }}
        selectedPrefectureCode="13000"
        areaName="東京都"
        defaultCheckedKeys={["wage", "ratio"]}
      />,
    );
    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
    const data = readChartData();
    expect(data.unit).toBe("円");
    expect(data.rightUnit).toBe("倍");
    expect(data.lines[0].yAxis).toBe("left");
    expect(data.lines[1].yAxis).toBe("right");
  });

  it("単位が 1 種なら右軸を作らない (単軸のまま)", async () => {
    renderPanel({ defaultCheckedKeys: ["wage", "unemployment"] });
    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
    const data = readChartData();
    expect(data.rightUnit).toBeUndefined();
    expect(data.lines.every((l: { yAxis: string }) => l.yAxis === "left")).toBe(true);
  });

  it("`%` と `％` は同じ単位として 1 軸に載せる (全半角で軸を割らない)", async () => {
    render(
      <MetricSwitcherPanel
        metrics={[kpi("gap", { unit: "%" }), kpi("unemp", { unit: "％" })]}
        tabLabels={{ gap: "男女賃金格差", unemp: "失業率" }}
        selectedPrefectureCode="13000"
        areaName="東京都"
        defaultCheckedKeys={["gap", "unemp"]}
      />,
    );
    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
    const data = readChartData();
    expect(data.rightUnit).toBeUndefined();
    expect(data.lines.every((l: { yAxis: string }) => l.yAxis === "left")).toBe(true);
  });

  it("右軸の指標だけを残したら左軸に戻す (目盛りだけの空軸を残さない)", async () => {
    // 全国 (00000) 側は空にして、1本に絞ったときの比較破線 (別テスト対象) を発生させない。
    // このテストの関心は軸割当だけなので、比較線の有無は無関係にする。
    fetchMock.mockImplementation((_key: string, area: string) =>
      Promise.resolve(
        area === "00000"
          ? { points: [], source: "none" }
          : { points: points([1, 2, 3]), source: "area" },
      ),
    );
    render(
      <MetricSwitcherPanel
        metrics={[kpi("wage", { unit: "円" }), kpi("ratio", { unit: "倍" })]}
        tabLabels={{ wage: "賃金", ratio: "有効求人倍率" }}
        selectedPrefectureCode="13000"
        areaName="東京都"
        defaultCheckedKeys={["wage", "ratio"]}
      />,
    );
    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
    toggleTile(/賃金/);
    await waitFor(() => expect(readChartData().lines).toHaveLength(1));
    const data = readChartData();
    expect(data.unit).toBe("倍");
    expect(data.rightUnit).toBeUndefined();
    expect(data.lines[0].yAxis).toBe("left");
  });
});

describe("MetricSwitcherPanel — 年表記が違う指標の突合", () => {
  /**
   * 指標によって yearName が「2020年」と「2020年度」で割れている。
   * ラベルで突き合わせると同じ年が別カテゴリになり、x 軸に "2020年2020年度" と
   * 重なって出たうえ 2 系列が半目盛りずれる (2026-08-06 に labor-wages で実際に出た)。
   * 突合キーは 4 桁の年コードでなければならない。
   */
  const fiscal = (y: number) => ({ year: `${y}`, yearName: `${y}年度`, value: y - 2000 });
  const calendar = (y: number) => ({ year: `${y}`, yearName: `${y}年`, value: (y - 2000) * 10 });

  beforeEach(() => {
    fetchMock.mockImplementation((key: string) =>
      Promise.resolve({
        points:
          key === "wage"
            ? [fiscal(2020), fiscal(2021), fiscal(2022)]
            : [calendar(2020), calendar(2021), calendar(2022)],
        source: "national",
      }),
    );
  });

  it("同じ年は 1 行に統合する (年表記の違いで行が倍にならない)", async () => {
    renderPanel({ defaultCheckedKeys: ["wage", "unemployment"] });
    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
    const rows = readChartData().data;
    expect(rows).toHaveLength(3);
    // 各行が両系列の値を持つ = 同じ x 位置に載っている
    for (const row of rows) {
      expect(typeof row.wage).toBe("number");
      expect(typeof row.unemployment).toBe("number");
    }
  });

  it("x 軸ラベルは編成順で先に来た系列の表記に揃える", async () => {
    renderPanel({ defaultCheckedKeys: ["wage", "unemployment"] });
    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
    // metrics の定義順は wage が先 = 年度表記
    expect(readChartData().data.map((r: { year: string }) => r.year)).toEqual([
      "2020年度",
      "2021年度",
      "2022年度",
    ]);
  });
});

describe("MetricSwitcherPanel — 平均を「都道府県平均」と称す (「全国」ではない)", () => {
  /**
   * このラベリングが実際に効くのは「県を選んでいるが、その県自身の系列が取れない」
   * 退避経路 (国土数値情報など external 種)。県系列があるときは県名 (東京都) が
   * 優先されるので、あえて自地域 (13000) を空にして退避を発生させる。
   */
  it("source=average なら凡例が「都道府県平均」であり「全国」を含まない", async () => {
    fetchMock.mockImplementation((_key: string, area: string) =>
      Promise.resolve(
        area === "00000"
          ? { points: points([1, 2, 3]), source: "average" }
          : { points: [], source: "none" },
      ),
    );
    renderPanel();
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    expect(readChartData().lines[0].name).toBe("都道府県平均");
  });

  it("source=national なら凡例が「全国」", async () => {
    fetchMock.mockImplementation((_key: string, area: string) =>
      Promise.resolve(
        area === "00000"
          ? { points: points([1, 2, 3]), source: "national" }
          : { points: [], source: "none" },
      ),
    );
    renderPanel();
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    expect(readChartData().lines[0].name).toBe("全国");
  });

  it("action が空を返す計算型指標は R2 平均へ退避し「都道府県平均」と示す", async () => {
    fetchMock.mockResolvedValue({ points: [], source: "none" });
    render(
      <MetricSwitcherPanel
        metrics={[kpi("calc", { series: [{ year: 2020, value: 5 }, { year: 2021, value: 6 }] })]}
        tabLabels={{ calc: "計算型" }}
        selectedPrefectureCode="13000"
        areaName="東京都"
      />,
    );
    await waitFor(() => expect(screen.getByTestId("line-chart")).toBeInTheDocument());
    expect(readChartData().lines[0].name).toBe("都道府県平均");
  });

  it("複数チェック時も R2 平均の系列は「（平均）」と明示する", async () => {
    fetchMock.mockResolvedValue({ points: [], source: "none" });
    render(
      <MetricSwitcherPanel
        metrics={[
          kpi("a", { series: [{ year: 2020, value: 5 }, { year: 2021, value: 6 }] }),
          kpi("b", { series: [{ year: 2020, value: 7 }, { year: 2021, value: 8 }] }),
        ]}
        tabLabels={{ a: "指標A", b: "指標B" }}
        selectedPrefectureCode="13000"
        areaName="東京都"
        defaultCheckedKeys={["a", "b"]}
      />,
    );
    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
    expect(readChartData().lines.map((l: { name: string }) => l.name)).toEqual([
      "指標A（平均）",
      "指標B（平均）",
    ]);
  });
});

describe("MetricSwitcherPanel — 県選択時の比較系列", () => {
  const prefAndNational = (_key: string, area: string) =>
    Promise.resolve(
      area === "00000"
        ? { points: points([10, 11, 12]), source: "national" }
        : { points: points([1, 2, 3]), source: "area" },
    );

  it("1 本のときは 実線=県 / 破線=全国 の 2 系列になり、比較系列は点を描かない", async () => {
    fetchMock.mockImplementation(prefAndNational);
    renderPanel({ selectedPrefectureCode: "13000", areaName: "東京都" });

    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
    const [primary, comparison] = readChartData().lines;
    expect(primary.name).toBe("東京都");
    expect(primary.strokeDasharray).toBeUndefined();
    expect(comparison.name).toBe("全国");
    expect(comparison.strokeDasharray).toBe("6,4");
    expect(comparison.hidePoints).toBe(true);
  });

  it("2 本以上チェックしたら比較破線は出さない (系列過密を避ける)", async () => {
    fetchMock.mockImplementation(prefAndNational);
    renderPanel({
      selectedPrefectureCode: "13000",
      areaName: "東京都",
      defaultCheckedKeys: ["wage", "unemployment"],
    });
    await waitFor(() => expect(readChartData().lines).toHaveLength(2));
    const lines = readChartData().lines;
    expect(lines.map((l: { dataKey: string }) => l.dataKey)).toEqual([
      "wage",
      "unemployment",
    ]);
    expect(lines.some((l: { strokeDasharray?: string }) => l.strokeDasharray)).toBe(
      false,
    );
    // 凡例は地域名ではなく指標名 (地域は見出しが言う)
    expect(lines.map((l: { name: string }) => l.name)).toEqual(["賃金", "失業率"]);
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

  it("単年のときも重複するカード説明を追加しない", async () => {
    fetchMock.mockResolvedValue({ points: points([42]), source: "national" });
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(/2020年の単年データのため/)).toBeInTheDocument(),
    );
    expect(screen.queryByText("2020年時点の値")).toBeNull();
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

describe("MetricSwitcherPanel — カード見出しと回遊と計測", () => {
  it("title を渡すとカード見出しになる (グループ名)", async () => {
    renderPanel({ title: "賃金の水準" });
    await waitFor(() => expect(screen.getByText("賃金の水準")).toBeInTheDocument());
  });

  it("title 未指定なら代表指標の見出しを読み上げ用だけに残す", async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "wage タイトル" })).toHaveClass("sr-only");
    });
  });

  it("代表指標 (編成順の先頭) のランキングへの導線を出す", async () => {
    renderPanel({ defaultCheckedKeys: ["unemployment", "job-ratio"] });
    const link = await screen.findByRole("link", { name: /ランキングを見る/ });
    expect(link).toHaveAttribute("href", "/ranking/unemployment");
  });

  it("チェック ON で nav_click を theme_kpi_switcher surface として送る", async () => {
    renderPanel();
    toggleTile(/失業率/);
    await waitFor(() => expect(trackNavClickMock).toHaveBeenCalled());
    expect(trackNavClickMock).toHaveBeenCalledWith({
      label: "unemployment",
      href: "/ranking/unemployment",
      surface: "theme_kpi_switcher",
    });
  });

  it("チェック OFF では nav_click を送らない (関心の表明ではない)", async () => {
    renderPanel({ defaultCheckedKeys: ["wage", "unemployment"] });
    await waitFor(() => expect(chartedKeys()).toEqual(["wage", "unemployment"]));
    trackNavClickMock.mockReset();
    toggleTile(/失業率/);
    await waitFor(() => expect(chartedKeys()).toEqual(["wage"]));
    expect(trackNavClickMock).not.toHaveBeenCalled();
  });
});
