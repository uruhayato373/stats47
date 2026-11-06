import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildContentCoverage, classifyBlog, classifyNote, classifyPost, openFitItems, type ContentTypesLedger, type CoverageInput, type FitItem } from "@/lib/content-coverage";

/**
 * 展開状況が守る意図:
 *   - 型の決め方は 個別の指定 → 問いへの答え → 規則 の順で、決まらないものは推測せず未分類に残す
 *   - 削除・取り下げたものを展開済みに数えない。ナビ用のページを数えない
 *   - 全件が 4 型か未分類のどちらかに 1 回ずつ入る (件数が消えない)
 *   - 事業の判断を画面へ持ち込まない
 */

const root = resolve(__dirname, "../../../..");
const readRoot = <T>(rel: string): T => JSON.parse(readFileSync(resolve(root, rel), "utf8")) as T;
const ledger = readRoot<ContentTypesLedger>("data/content/content-types.json");
const { rules } = ledger;
const none = new Map<string, string>();

const input = (over: Partial<CoverageInput> = {}): CoverageInput => ({
  ledger,
  pages: [
    { id: "ranking:a", kind: "ranking", key: "a", title: "A", href: "/ranking/a", published: true },
    { id: "ranking:b", kind: "ranking", key: "b", title: "B", href: "/ranking/b", published: false },
    { id: "tag:t", kind: "tag", key: "t", title: "T", href: "/tag/t", published: true },
    { id: "blog:q", kind: "blog", key: "q", title: "Q", href: "/blog/q", published: true },
  ],
  answerPages: new Set(["blog:q"]),
  notes: [
    { key: "a-x", title: "ランキング", status: "published", series: "A", vertical: "stats47-note" },
    { key: "pack", title: "商品", status: "draft", vertical: "product-sales" },
  ],
  posts: [
    { id: 1, status: "posted", platform: "x", domain: "ranking" },
    { id: 2, status: "deleted", platform: "x", domain: "ranking" },
    { id: 3, status: "draft", platform: "x", domain: "blog", content_key: "q" },
    { id: 4, status: "posted", platform: "x", domain: "other" },
  ],
  products: [
    { channel: "kdp", key: "live", title: "本", status: "live" },
    { channel: "kdp", key: "gone", title: "取り下げ", status: "withdrawn" },
    { channel: "kdp", key: "wait", title: "保留", status: "blocked-design" },
    { channel: "note", key: "a-x", title: "ランキング", status: "published" },
  ],
  ...over,
});

const row = (m: ReturnType<typeof buildContentCoverage>, type: string) => m.rows.find((r) => r.type === type)!;

describe("型の決め方", () => {
  it("問いへの答えは URL の規則より強く、個別の指定はさらに強い", () => {
    expect(classifyBlog("rice-prefecture-gap", "blog:r", true, rules, none).type).toBe("type:paper");
    expect(classifyBlog("rice-prefecture-gap", "blog:r", false, rules, none).type).toBe("type:reference");
    expect(classifyBlog("rice-prefecture-gap", "blog:r", true, rules, new Map([["blog:r", "type:howto"]])).type).toBe("type:howto");
  });

  it("規則で決まらないブログと note は推測せず未分類にする", () => {
    expect(classifyBlog("free-form-essay", "blog:e", false, rules, none).type).toBeNull();
    expect(classifyNote({ key: "x", title: "", status: "published", series: "Z" }, rules, none).type).toBeNull();
  });

  it("URL の中の規則は末尾の規則より弱い", () => {
    expect(classifyBlog("a-vs-b", "blog:v", false, rules, none).type).toBe("type:paper");
    expect(classifyBlog("a-vs-b-prefecture-gap", "blog:w", false, rules, none).type).toBe("type:reference");
  });

  it("マガジンはシリーズより強い", () => {
    expect(classifyNote({ key: "k", title: "", status: "published", series: "A", vertical: "koumuin-gis" }, rules, none).type).toBe("type:howto");
  });

  it("記事を指す投稿は記事の型を継ぎ、投稿の種類の規則より優先する", () => {
    const resolved = new Map([["blog:q", { type: "type:paper", how: "問いへの答え" }]]);
    expect(classifyPost({ id: 1, status: "draft", platform: "x", domain: "blog", content_key: "q" }, rules, none, resolved).type).toBe("type:paper");
  });
});

describe("buildContentCoverage", () => {
  it("公開と未公開を分け、ナビ用のページを数えない", () => {
    const cells = row(buildContentCoverage(input()), "type:reference").cells;
    expect(cells.site).toEqual({ published: 1, preparing: 1 });
  });

  it("削除した投稿と取り下げた本を数えず、保留の本は未公開にする", () => {
    const m = buildContentCoverage(input());
    expect(m.items.filter((i) => i.channel === "sns")).toHaveLength(3);
    expect(row(m, "type:reference").cells.kindle).toEqual({ published: 1, preparing: 1 });
  });

  it("全件が 4 型か未分類のどれかに 1 回ずつ入る", () => {
    const m = buildContentCoverage(input());
    const counted = m.rows.flatMap((r) => Object.values(r.cells)).reduce((n, c) => n + c.published + c.preparing, 0);
    expect(counted).toBe(m.items.length);
    expect(row(m, "unclassified").cells.note.preparing).toBe(1);
    expect(row(m, "unclassified").cells.sns.published).toBe(1);
  });
});

describe("処置の案", () => {
  it("処置を決めたものを外し、読まれている記事を先に出す", () => {
    const item = (id: string, clicks: number): FitItem => ({ id, title: id, type: "type:paper", proposal: "rewrite", signals: ["s"], clicks, impressions: 0 });
    const open = openFitItems({ observedAt: "2026-11-06", gscWeeks: [], articlesRead: 3, articlesUnobserved: 0, items: [item("blog:a", 1), item("blog:b", 9), item("blog:c", 5)], decisions: [{ id: "blog:c", action: "keep" }] });
    expect(open.map((i) => i.id)).toEqual(["blog:b", "blog:a"]);
  });
});

describe("台帳の配線", () => {
  it("公開するページの種別は、型か対象外のどちらかに必ず決まっている", () => {
    const dir = resolve(root, "data/content/pages");
    const kinds = new Set(readdirSync(dir).flatMap((f) => readRoot<{ pages: Array<{ kind: string }> }>(`data/content/pages/${f}`).pages.map((p) => p.kind)));
    const undecided = [...kinds].filter((k) => k !== "blog" && !rules.pageKinds[k] && !rules.excludedPageKinds.includes(k));
    expect(undecided).toEqual([]);
  });

  it("同じものを二度指定しない", () => {
    const ids = ledger.assignments.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("事業イシューマップの 4 行は同じ定義の型を指す", () => {
    const { rows } = readRoot<{ rows: Array<{ contentType: string; title: string; question: string }> }>("data/business/issue-map.json");
    expect(rows.map((r) => r.contentType)).toEqual(ledger.types.map((t) => t.id));
    expect(rows.map((r) => r.title)).toEqual(ledger.types.map((t) => t.title));
  });

  it("展開状況のコードは事業の台帳と収益の判断を読まない", () => {
    for (const file of ["lib/content-coverage.ts", "lib/server/content-coverage.ts", "app/content/expansion/page.tsx"]) {
      const code = readFileSync(resolve(__dirname, "../..", file), "utf8").split("\n").filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join("\n");
      expect(code, file).not.toMatch(/business\.|issue-map|biz:|revenue|priceYen|salesYen/);
    }
  });
});
