import React from "react";

import {
  parsePopulationCoreProfile,
  type MigrationDemographicsProfile,
  type SingleHouseholdsProfile,
  type FiveYearResidenceProfile,
} from "@stats47/data-configs/theme-catalog";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ThemeMigrationDemographicsClient } from "@/features/population-demographics/components/ThemeMigrationDemographicsClient";
import { ThemePopulationPartitionClient } from "@/features/population-demographics/components/ThemePopulationPartitionClient";
import {
  ThemeMigrationDemographicsSection,
  ThemeSingleHouseholdsSection,
  ThemeFiveYearResidenceSection,
  ThemeYoungMigrationLink,
} from "@/features/population-demographics/components/ThemePopulationProfileSections";
import {
  selectMigrationView,
  selectPartitionView,
  getPopulationProfileMetricValue,
} from "@/features/population-demographics/lib/population-profile-view";
import {
  ThemePrefectureProvider,
  useThemePrefecture,
} from "@/features/theme-dashboard/components/ThemePrefectureContext";

import {
  migrationFixture,
  householdsFixture,
  residenceFixture,
} from "./population-profile-fixtures";
vi.mock(
  "@/features/theme-dashboard",
  async () =>
    await import("@/features/theme-dashboard/components/ThemePrefectureContext"),
);
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@stats47/r2-storage/server", () => ({ fetchFromR2AsJson: fetchMock }));
const migration = parsePopulationCoreProfile(
  migrationFixture(),
) as MigrationDemographicsProfile;
const household = parsePopulationCoreProfile(
  householdsFixture(),
) as SingleHouseholdsProfile;
const residence = parsePopulationCoreProfile(
  residenceFixture(),
) as FiveYearResidenceProfile;
function SwitchPref() {
  const { setSelected } = useThemePrefecture();
  return (
    <>
      <button onClick={() => setSelected("13000")}>東京へ切替</button>
      <button onClick={() => setSelected("47000")}>沖縄へ切替</button>
      <button onClick={() => setSelected(null)}>全国へ切替</button>
    </>
  );
}
function Context({
  code = null,
  children,
}: {
  code?: string | null;
  children: React.ReactNode;
}) {
  return (
    <ThemePrefectureProvider initialAreaCode={code}>
      <SwitchPref />
      {children}
    </ThemePrefectureProvider>
  );
}
async function choose(label: string, value: string) {
  fireEvent.keyDown(screen.getByRole("combobox", { name: label }), {
    key: "ArrowDown",
  });
  await userEvent.click(await screen.findByRole("option", { name: value }));
}
beforeEach(() => {
  window.history.replaceState(null, "", "/");
  fetchMock.mockReset();
});
describe("synthetic profileとカードの同一計算", () => {
  it("6指標を既知の非対称な県値に射影する", () => {
    expect(
      getPopulationProfileMetricValue(
        migration,
        "interprefecture-net-migration-age15to24",
        "13000",
      ),
    ).toBe(30);
    expect(
      getPopulationProfileMetricValue(
        migration,
        "interprefecture-net-migration-age25to34",
        "13000",
      ),
    ).toBe(10);
    expect(
      getPopulationProfileMetricValue(
        household,
        "single-households-age65plus-male",
        "13000",
      ),
    ).toBe(150);
    expect(
      getPopulationProfileMetricValue(
        household,
        "single-households-age65plus-female",
        "13000",
      ),
    ).toBe(200);
    expect(
      getPopulationProfileMetricValue(
        residence,
        "five-year-residence-same-address",
        "13000",
      ),
    ).toBe(111);
    expect(
      getPopulationProfileMetricValue(
        residence,
        "five-year-residence-other-prefecture",
        "13000",
      ),
    ).toBe(54);
    expect(
      getPopulationProfileMetricValue(
        migration,
        "single-households-age65plus-male",
        "13000",
      ),
    ).toBeNull();
    expect(
      getPopulationProfileMetricValue(
        residence,
        "five-year-residence-other-prefecture",
        "99999",
      ),
    ).toBeNull();
  });
  it("全47県・3男女・21年齢の県間in/outが全相手県の合計に一致する", () => {
    let n = 0;
    for (const area of migration.areas)
      for (const sex of ["0", "1", "2"] as const)
        for (const age of migration.ages) {
          const view = selectMigrationView(
            migration,
            area.areaCode,
            sex,
            age.code,
          )!;
          expect(view.rows).toHaveLength(46);
          expect(view.rows.some((r) => r.areaCode === area.areaCode)).toBe(
            false,
          );
          const index = migration.ages.indexOf(age);
          const val = (x: number[][]) =>
            sex === "0" ? x[0][index] + x[1][index] : x[Number(sex) - 1][index];
          expect(view.total.inbound).toBe(val(area.inbound));
          expect(view.total.outbound).toBe(val(area.outbound));
          n++;
        }
    expect(n).toBe(2961);
  });
  it("県間の年齢残差2人・単独世帯の不詳・5年前居住地の不詳を保持する", () => {
    expect(
      selectMigrationView(migration, null, "0", "unallocated")?.total.inbound,
    ).toBe(2);
    expect(
      selectPartitionView(household, null, "0")?.rows.find(
        (r) => r.code === "17",
      )?.value,
    ).toBe(2402603);
    const r = selectPartitionView(residence, null, "0")!;
    expect(r.rows).toHaveLength(7);
    expect(r.rows.find((x) => x.code === "003")?.value).toBe(95);
    expect(r.rows.find((x) => x.code === "004")?.value).toBe(108);
    expect(r.rows.reduce((s, x) => s + x.value, 0)).toBe(r.total);
  });
});
describe("人口移動の共通県選択と男女・年齢・相手県", () => {
  it("全国47県から東京46相手県・沖縄・全国へ同じsnapshotで切り替わる", () => {
    const { container } = render(
      <Context>
        <ThemeMigrationDemographicsClient snapshot={migration} />
      </Context>,
    );
    expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(
      47,
    );
    expect(container.querySelector("[data-total-inbound]")?.textContent).toBe(
      "2,515,731",
    );
    fireEvent.click(screen.getByRole("button", { name: "東京へ切替" }));
    expect(
      container
        .querySelector("[data-area-code]")
        ?.getAttribute("data-area-code"),
    ).toBe("13000");
    expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(
      46,
    );
    expect(
      container.querySelector('[data-counterpart-code="13000"]'),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "沖縄へ切替" }));
    expect(screen.getByRole("table").getAttribute("aria-label")).toContain(
      "沖縄県",
    );
    fireEvent.click(screen.getByRole("button", { name: "全国へ切替" }));
    expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(
      47,
    );
  });
  it("男性20〜24歳・相手北海道の流入方向を取り違えない", async () => {
    const { container } = render(
      <Context code="13000">
        <ThemeMigrationDemographicsClient snapshot={migration} />
      </Context>,
    );
    await choose("男女", "男性");
    await choose("年齢", "20～24歳");
    await choose("相手の都道府県", "北海道");
    const v = selectMigrationView(migration, "13000", "1", "205", "01000")!;
    expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(
      1,
    );
    expect(
      Number(
        container
          .querySelector("[data-total-inbound]")
          ?.getAttribute("data-total-inbound"),
      ),
    ).toBe(v.total.inbound);
    expect(
      Number(
        container
          .querySelector("[data-total-outbound]")
          ?.getAttribute("data-total-outbound"),
      ),
    ).toBe(v.total.outbound);
  });
  it("相手県と現在県が同じになったとき全相手県へ戻す", async () => {
    render(
      <Context code="01000">
        <ThemeMigrationDemographicsClient snapshot={migration} />
      </Context>,
    );
    await choose("相手の都道府県", "東京都");
    fireEvent.click(screen.getByRole("button", { name: "東京へ切替" }));
    expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(
      46,
    );
    expect(
      screen.getByRole("combobox", { name: "相手の都道府県" }).textContent,
    ).toContain("すべての相手県");
  });
  it("年齢残差を選ぶと全国2人の内訳を表示する", async () => {
    const { container } = render(
      <Context>
        <ThemeMigrationDemographicsClient snapshot={migration} />
      </Context>,
    );
    await choose("年齢", "総数と年齢計の差");
    expect(container.querySelector("[data-total-inbound]")?.textContent).toBe(
      "2",
    );
    expect(container.querySelector("[data-total-outbound]")?.textContent).toBe(
      "2",
    );
  });
});
describe("単独世帯と5年前居住地の母集団", () => {
  for (const [snapshot, n] of [
    [household, 17],
    [residence, 7],
  ] as const) {
    it(snapshot.kind + " は県と男女で人数・分母を一緒に変える", async () => {
      const { container } = render(
        <Context>
          <ThemePopulationPartitionClient snapshot={snapshot} />
        </Context>,
      );
      expect(
        screen.getByRole("table").querySelectorAll("tbody tr"),
      ).toHaveLength(n);
      fireEvent.click(screen.getByRole("button", { name: "東京へ切替" }));
      await choose("男女", "女性");
      const v = selectPartitionView(snapshot, "13000", "2")!;
      expect(container.querySelector("[data-total]")?.textContent).toBe(
        v.total.toLocaleString("ja-JP"),
      );
      expect(
        Number(
          container
            .querySelector("tbody [data-share]")
            ?.getAttribute("data-share"),
        ),
      ).toBeCloseTo(v.rows[0].share!, 12);
      fireEvent.click(screen.getByRole("button", { name: "沖縄へ切替" }));
      expect(screen.getByRole("table").getAttribute("aria-label")).toContain(
        "沖縄県",
      );
      expect(screen.getByRole("table").parentElement?.className).toContain(
        "overflow-auto",
      );
    });
  }
  it("不正な県を全国で代用せず取得不能を表示する", () => {
    render(
      <Context code="99999">
        <ThemePopulationPartitionClient snapshot={household} />
      </Context>,
    );
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("選択した地域");
  });
});
describe("取得境界と出典", () => {
  for (const [fn, snapshot, key] of [
    [
      ThemeMigrationDemographicsSection,
      migration,
      "app/themes/population-dynamics/migration-demographics.json",
    ],
    [
      ThemeSingleHouseholdsSection,
      household,
      "app/themes/living-housing/single-households-demographics.json",
    ],
    [
      ThemeFiveYearResidenceSection,
      residence,
      "app/themes/population-dynamics/five-year-residence.json",
    ],
  ] as const) {
    it(key + "のみ取得し異なるprofile/破損/欠損を表示しない", async () => {
      fetchMock.mockResolvedValue(snapshot);
      const result = await fn();
      expect(fetchMock).toHaveBeenLastCalledWith(key);
      expect(result.props.snapshot.kind).toBe(snapshot.kind);
      for (const invalid of [
        snapshot.kind === "single-households-demographics"
          ? residence
          : household,
        { ...snapshot, period: "2099" },
        null,
      ]) {
        fetchMock.mockResolvedValue(invalid);
        const { unmount } = render(await fn());
        expect(screen.queryByRole("table")).toBeNull();
        expect(screen.getByRole("status")).toBeTruthy();
        unmount();
      }
      fetchMock.mockRejectedValue(Error("offline"));
      render(await fn());
      expect(screen.getByRole("status")).toBeTruthy();
    });
  }
  it("単独世帯・居住地のChartFooterが対応原表を指す", () => {
    render(
      <Context>
        <ThemePopulationPartitionClient snapshot={household} />
        <ThemePopulationPartitionClient snapshot={residence} />
      </Context>,
    );
    expect(
      screen.getByRole("link", { name: /12-1表/ }).getAttribute("href"),
    ).toContain("0003445081");
    expect(
      screen.getByRole("link", { name: /第1表/ }).getAttribute("href"),
    ).toContain("0003447398");
  });
  it("若年章は同じ人口移動表の章へリンクする", () => {
    render(<ThemeYoungMigrationLink />);
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "#theme-section-candidate-43",
    );
  });
});

describe("不詳と分母の表示", () => {
  it("0の分母から100%や無限大を作らない", () => {
    const view = selectPartitionView(household, "02000", "0")!;
    expect(view.total).toBe(0);
    expect(view.rows.every((row) => row.share === null)).toBe(true);
    render(
      <Context code="02000">
        <ThemePopulationPartitionClient snapshot={household} />
      </Context>,
    );
    expect(
      screen.getByRole("table").querySelector("tfoot tr")?.lastChild
        ?.textContent,
    ).toBe("—");
  });
});
