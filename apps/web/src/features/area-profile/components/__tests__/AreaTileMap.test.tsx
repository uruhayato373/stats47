import { fetchPrefectures } from "@stats47/area";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";


import { buildAreaDirectoryData } from "../../utils/build-area-directory-data";
import { AreaTileMap, TILE_FONT_SIZE_CLASS } from "../AreaTileMap";

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

  it("1 マスの県の 3 文字名はスマホの幅で 2 文字に縮める (マスから切れない)", () => {
    renderMap();
    const link = screen.getByRole("link", { name: "神奈川県の統計を見る" });
    expect(link.querySelector(".\\@sm\\:hidden")).toHaveTextContent("神奈");
    expect(link).toHaveTextContent("神奈川");
  });

  it("スマホの幅でもマスの文字を固定の 9px にせず、地図の幅に合わせて 11px まで上げる (小さすぎる文字の検査)", () => {
    renderMap();
    const link = screen.getByRole("link", { name: "北海道の統計を見る" });
    expect(link.className).toContain(TILE_FONT_SIZE_CLASS);
    expect(link.className).not.toContain("text-[9px]");
    // 上限は検査の基準 (11px 未満を小さいと数える) と同じ 11px
    expect(TILE_FONT_SIZE_CLASS).toMatch(/,11px\)\]$/);
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
