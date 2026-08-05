import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { StrengthWeaknessItem } from "../../types";
import { AreaProfileSidebar } from "../AreaProfileSidebar";

/**
 * 右レールの DOM 上限契約。
 *
 * 経緯: 2026-08-05 の Chrome DevTools trace で `/areas/13000` の DOM は 9,101、
 * レール内の単一 `nav` が children 873 を持っていた。1 項目ごとに Tooltip +
 * Link + span×2 を生成し、それを全件描いていたため。PageShell は右レールを
 * desktop / mobile の 2 箇所へ描く (page-shell-rail-contract で固定) ので、
 * ここでの件数はそのまま 2 倍で効く。
 */

const makeItems = (count: number, offset = 0): StrengthWeaknessItem[] =>
  Array.from({ length: count }, (_, i) => ({
    rankingKey: `metric-${offset + i}`,
    indicator: `指標 ${offset + i}`,
    rank: i + 1,
    value: 1000 + i,
    unit: "人",
    year: "2020",
  }));

function countRankingLinks(html: string): number {
  return [...html.matchAll(/href="\/ranking\//g)].length;
}

describe("AreaProfileSidebar の描画件数", () => {
  it("上限を超える項目を渡しても各カード 12 件までしか描かない", () => {
    const html = renderToStaticMarkup(
      <AreaProfileSidebar
        strengths={makeItems(40)}
        weaknesses={makeItems(40, 100)}
      />,
    );
    // 上位カード 12 + 下位カード 12
    expect(countRankingLinks(html)).toBe(24);
  });

  it("上限以下ならすべて描く", () => {
    const html = renderToStaticMarkup(
      <AreaProfileSidebar strengths={makeItems(5)} weaknesses={[]} />,
    );
    expect(countRankingLinks(html)).toBe(5);
  });

  it("見出しの件数は切り詰め後ではなく総数を示す", () => {
    const html = renderToStaticMarkup(
      <AreaProfileSidebar strengths={makeItems(40)} weaknesses={[]} />,
    );
    // 「全国上位に 40 件入っている」という事実は切り詰めても変わらない
    expect(html).toContain("40件");
    expect(html).not.toContain("12件");
  });

  it("項目が無ければカードごと描かない", () => {
    const html = renderToStaticMarkup(
      <AreaProfileSidebar strengths={[]} weaknesses={[]} />,
    );
    expect(countRankingLinks(html)).toBe(0);
    expect(html).not.toContain("全国上位");
  });
});
