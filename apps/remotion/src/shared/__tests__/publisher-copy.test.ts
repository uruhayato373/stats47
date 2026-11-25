import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ThumbHookMap } from "../../features/ranking-youtube/ThumbHookMap";
import { RankingTable } from "../components/tables/RankingTable";

// ランキング表 (ショート・リールの 47 県の表) と YouTube のサムネイル地図の可視テキストに、
// 発行元 (stats47・stats47.jp・サイト名) を入れない (.claude/rules/chart-image-copy.md・IMAGE-PUBLISHER-REMOVAL-01)。
// 値は架空の固定値で、通信もしない。
const entries = Array.from({ length: 47 }, (_, i) => ({
  rank: i + 1,
  areaCode: `${String(i + 1).padStart(2, "0")}000`,
  areaName: `県${i + 1}`,
  value: 1000 - i,
}));
const meta = { title: "架空データの見本", unit: "円", yearName: "2024年", sourceLabel: "架空の出典" };

const visibleText = (html: string) => html.replace(/<[^>]+>/g, "\n");

describe("発行元を入れない (ランキング表・サムネイル地図)", () => {
  it("RankingTable: 47 県の表に発行元が出ない (右列の 24 枠目は空き枠)", () => {
    const text = visibleText(renderToStaticMarkup(createElement(RankingTable, { meta, entries })));
    expect(text).toContain("県47");
    expect(text).not.toMatch(/stats47/i);
  });

  it("ThumbHookMap: サムネイル地図に発行元・サイト名が出ない", () => {
    const text = visibleText(
      renderToStaticMarkup(createElement(ThumbHookMap, { hookText: "1位は意外なあの県", title: "架空データの見本", entries })),
    );
    expect(text).toContain("1位は意外なあの県");
    expect(text).not.toMatch(/stats47|統計で見る/i);
  });
});
