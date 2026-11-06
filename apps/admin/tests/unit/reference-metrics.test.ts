import { describe, expect, it } from "vitest";

import { buildMetricDetail, buildMetricRows } from "@/lib/reference-metrics";

/** 守る意図: 参照型は指標が主で、記事は図の出典から記録した rankingKeys で自動でつながる。未公開のものを数えない */
const input = {
  pages: [
    { id: "ranking:a", kind: "ranking", key: "a", title: "A", href: "/ranking/a", published: true },
    { id: "ranking:b", kind: "ranking", key: "b", title: "B", href: "/ranking/b", published: true },
    { id: "ranking:c", kind: "ranking", key: "c", title: "C", href: "/ranking/c", published: false },
    { id: "municipality-ranking:a", kind: "municipality-ranking", key: "a", title: "A", href: "/municipalities/ranking/a", published: true },
    { id: "blog:x", kind: "blog", key: "x", title: "X", href: "/blog/x", published: true, rankingKeys: ["a", "b"] },
    { id: "blog:y", kind: "blog", key: "y", title: "Y", href: "/blog/y", published: false, rankingKeys: ["a"] },
  ],
  externalPages: [
    { id: "note:n", title: "N", published: true },
    { id: "sns:1", title: "S", published: true },
  ],
  externalLinks: [
    { from: "note:n", to: "ranking:a" },
    { from: "sns:1", to: "ranking:a" },
    { from: "note:n", to: "blog:x" },
    { from: "note:gone", to: "ranking:a" },
  ],
};

describe("指標の配線", () => {
  it("公開中のランキングだけを、つながりの多い順に並べる", () => {
    const rows = buildMetricRows(input);
    expect(rows.map((r) => r.key)).toEqual(["a", "b"]);
    expect(rows[0]).toMatchObject({ blogs: 1, notes: 1, posts: 1, hasMunicipality: true });
    expect(rows[1]).toMatchObject({ blogs: 1, notes: 0, posts: 0, hasMunicipality: false });
  });

  it("詳細は未公開の記事を含めず、市区町村の URL を返す", () => {
    const detail = buildMetricDetail("a", input);
    expect(detail?.blogs.map((b) => b.id)).toEqual(["blog:x"]);
    expect(detail?.municipalityHref).toBe("/municipalities/ranking/a");
    expect(detail?.notes.map((n) => n.id)).toEqual(["note:n"]);
  });

  it("無い指標は null を返す", () => {
    expect(buildMetricDetail("none", input)).toBeNull();
  });
});
