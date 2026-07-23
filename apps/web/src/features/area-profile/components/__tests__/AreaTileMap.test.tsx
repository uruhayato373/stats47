import { fetchPrefectures } from "@stats47/area";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";


import { buildAreaDirectoryData } from "../../utils/build-area-directory-data";
import { AreaTileMap } from "../AreaTileMap";

const data = buildAreaDirectoryData(fetchPrefectures());
const legend = data.regionGroups.map((r) => ({
  regionCode: r.regionCode,
  regionName: r.regionName,
}));

function renderMap(onSelect?: (t: unknown) => void) {
  return render(
    <AreaTileMap
      tiles={data.tiles}
      gridCols={data.gridCols}
      gridRows={data.gridRows}
      regionLegend={legend}
      onSelect={onSelect as never}
    />,
  );
}

describe("AreaTileMap", () => {
  it("全47タイルを /areas/{code} リンク + アクセシブルネームで描画", () => {
    renderMap();
    const links = screen.getAllByRole("link", { name: /の統計を見る$/ });
    expect(links).toHaveLength(47);
    expect(
      screen.getByRole("link", { name: "東京都の統計を見る" }),
    ).toHaveAttribute("href", "/areas/13000");
  });

  it("凡例に地方名を表示する (色のみに依存しない)", () => {
    renderMap();
    expect(screen.getByLabelText("地方区分の凡例")).toBeInTheDocument();
    expect(screen.getByText("関東")).toBeInTheDocument();
    expect(screen.getByText("九州・沖縄")).toBeInTheDocument();
  });

  it("onSelect がタイルクリックで tile を受け取る", () => {
    const onSelect = vi.fn();
    renderMap(onSelect);
    fireEvent.click(screen.getByRole("link", { name: "東京都の統計を見る" }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ prefCode: "13000", prefName: "東京都" }),
    );
  });
});
