import { describe, expect, it } from "vitest";

import { analysisInputs, articleFigures, frontmatterValue, outlineOf, verdictOf } from "@/lib/question-detail";

/** 守る意図: 下書きの中身 (題名・構成・図・審査) を、ファイルを開かずに画面で確かめられる */
const markdown = `---
title: "記事の題名"
description: 説明文
---

本文

## 最初の節

![図](data/a.svg)

## 次の節

![別の図](data/b.svg)
![画像](images/c.png)
`;

describe("下書きの読み取り", () => {
  it("frontmatter の値から引用符を外し、本文の同名の語を拾わない", () => {
    expect(frontmatterValue(markdown, "title")).toBe("記事の題名");
    expect(frontmatterValue(markdown, "description")).toBe("説明文");
    expect(frontmatterValue("title: 本文", "title")).toBeNull();
  });

  it("h2 を本文の順に返す", () => {
    expect(outlineOf(markdown)).toEqual(["最初の節", "次の節"]);
  });

  it("本文で使う SVG の図だけを順に返す", () => {
    expect(articleFigures(markdown)).toEqual(["a.svg", "b.svg"]);
  });

  it("審査が無ければ null を返す", () => {
    expect(verdictOf("---\nverdict: PASS\n---")).toBe("PASS");
    expect(verdictOf("")).toBeNull();
  });
});

describe("分析に使ったデータ", () => {
  const pages = new Map([
    ["ranking:a", { title: "指標 A", href: "/ranking/a", published: true }],
    ["municipality-ranking:a", { title: "指標 A", href: "/municipalities/ranking/a", published: true }],
    ["ranking:b", { title: "指標 B", href: "/ranking/b", published: true }],
    ["ranking:c", { title: "指標 C", href: "/ranking/c", published: false }],
  ]);

  it("無いページと未公開のページはリンクを出さない", () => {
    const rows = analysisInputs(["a", "c"], [{ key: "b", label: "計算した指標" }], (id) => pages.get(id));
    expect(rows[0]).toMatchObject({ key: "a", rankingHref: "/ranking/a", municipalityHref: "/municipalities/ranking/a", derived: false });
    expect(rows[1]).toMatchObject({ key: "c", rankingHref: null, municipalityHref: null });
    expect(rows[2]).toMatchObject({ key: "b", title: "計算した指標", municipalityHref: null, derived: true });
  });

  it("入力と求めた指標が重なっても 1 回だけ並べる", () => {
    expect(analysisInputs(["a"], [{ key: "a", label: "重複" }], (id) => pages.get(id)).map((r) => r.derived)).toEqual([false]);
  });
});
