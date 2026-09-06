import { describe, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({ fetch: vi.fn(), svg: vi.fn((_items: unknown, _options: unknown) => '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="white"/></svg>') }));
vi.mock("../src/data/load-ranking-values", () => ({
  fetchRankingValues: mock.fetch,
}));
vi.mock("../src/channels/kindle/ai-content-composer", () => ({
  fetchRankingAiContent: async () => { throw new Error("Unreviewed source prose must not be fetched"); },
  composeChapterBody: () => { throw new Error("Unreviewed source prose must not be composed"); },
}));
vi.mock("@stats47/svg-builder", () => ({
  generateBarChartSvg: mock.svg,
}));
import { buildRankingSection, buildRankingSections } from "../src/channels/kindle/ranking-databook";
import { mdToXhtml } from "../src/channels/kindle/md-to-xhtml";

describe("Kindle indicator definitions", () => {
  it("escapes generated table cells and preserves surrounding paragraphs", () => {
    const xhtml = mdToXhtml('前文\n\n| 県 | 値 |\n| --- | ---: |\n| <script> | 1 & 2 |\n\n後文');
    expect(xhtml).toContain('<td>&lt;script&gt;</td>');
    expect(xhtml).toContain('<td>1 &amp; 2</td>');
    expect(xhtml).toContain('<p>前文</p>');
    expect(xhtml).toContain('<p>後文</p>');
    expect(xhtml).not.toContain('<script>');
  });
  it("does not invent tables for ordinary pipe characters", () => {
    expect(mdToXhtml('A | B\n続き')).toBe('<p>A | B 続き</p>');
  });
  it("keeps the official denominator and labels arithmetic mean honestly", async () => {
    mock.fetch.mockResolvedValue({
      year: "2024",
      unit: "件",
      values: Array.from({ length: 47 }, (_, i) => ({
        code5: `${String(i + 1).padStart(2, "0")}000`,
        value: i + 1,
      })),
    });
    const section = await buildRankingSection("marriages-per-total-population");
    expect(section?.title).toContain("人口千人当たり");
    expect(section?.bodyMd).toContain("47地域の単純平均");
    expect(mock.svg.mock.calls[mock.svg.mock.calls.length - 1]?.[1]).toMatchObject({ unit: "", showBars: false });
    expect(section?.bodyMd).not.toContain("全国平均は");
    expect(section?.source.year).toBe("2024");
    expect(section?.source.rawUrl).toContain("marriages-per-total-population/values.json");
    expect(section?.bodyMd).toContain("全県の収録値");
    expect(section?.bodyMd?.split("\n").filter(line => /^\| \d+ \|/.test(line))).toHaveLength(47);
    expect(section?.aiUsed).toEqual([]);
    expect(section?.aiDropped?.[0].reason).toBe("unreviewed-site-prose-excluded-from-book-edition");
    const xhtml = mdToXhtml(section!.bodyMd);
    expect(xhtml).toContain('<th scope="col">都道府県</th>');
    expect(xhtml.match(/<tr>/g)).toHaveLength(48);
    expect(xhtml).not.toContain("| ---");
  });
  it("reports failed keys rather than silently dropping them", async () => {
    mock.fetch.mockRejectedValue(new Error("offline"));
    const missing: string[] = [];
    const result = await buildRankingSections(["marriages-per-total-population", "unknown-key"], undefined, {
      onMissing: (key) => missing.push(key),
    });
    expect(result).toEqual([]);
    expect(missing).toEqual(["marriages-per-total-population", "unknown-key"]);
  });
  it("keeps ties consistent in charts and regional prose, including a shared minimum", async () => {
    mock.svg.mockClear();
    mock.fetch.mockResolvedValue({ year: "2024", unit: "件", values: Array.from({ length: 47 }, (_, i) => ({
      code5: `${String(i + 1).padStart(2, "0")}000`, value: i === 0 ? 20 : 0,
    })) });
    const section = await buildRankingSection("marriages-per-total-population", {
      highlightRegionLabel: "沖縄", highlightCodes: ["47000"],
    });
    expect(section?.bodyMd).toContain("沖縄県が全国2位");
    expect(section?.bodyMd).toContain("同値は同順位");
    expect(section?.bodyMd).toContain("を含む46地域）");
    const rows = mock.svg.mock.calls[0][0] as unknown as Array<{ value: number; rank: number; isSeparator?: boolean }>;
    expect(rows.filter(row => !row.isSeparator && row.value === 0).every(row => row.rank === 2)).toBe(true);
    expect(rows[0].rank).toBe(1);
  });
});
