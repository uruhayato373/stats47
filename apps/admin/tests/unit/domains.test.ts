import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { allDocuments, docHref, domainList, domainOverview, readDocument } from "@/lib/server/domains";

/**
 * 領域の概要 (/domains/<id>) と文書 (/docs) の read model を守る。
 * 文書の領域は check-domains.cjs と同じ documentDomain で決め、画面側で別の判定を持たない。
 * /docs/<path> は URL から実ファイルを開くので、docs/ の外を開かないことをここで止める。
 */
const REPO = path.resolve(__dirname, "../../../..");

describe("domains (領域の概要と文書)", () => {
  afterEach(() => {
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("全文書が領域に決まり (check-domains と同じ判定)、どの領域の概要にも重複なく 1 回だけ出る", () => {
    process.env.STATS47_PROJECT_ROOT = REPO;
    const docs = allDocuments();
    expect(docs.length).toBeGreaterThan(10);
    expect(docs.filter((d) => d.domainId === null).map((d) => d.path)).toEqual([]);
    const listed = domainList().flatMap((d) => domainOverview(d.id)?.documents.map((x) => x.path) ?? []);
    expect([...listed].sort()).toEqual(docs.map((d) => d.path));
  }, 60_000);

  it("戦略の概要に収益化戦略の文書・§5 の構え・[領域:戦略] のカードが出る", () => {
    process.env.STATS47_PROJECT_ROOT = REPO;
    const o = domainOverview("strategy");
    expect(o?.documents.map((d) => d.path)).toContain("docs/00_プロジェクト管理/02_収益化戦略.md");
    expect(o?.stance).toBe("維持");
    expect(o?.cards.length).toBeGreaterThan(0);
    expect(domainOverview("nope")).toBeNull();
  }, 30_000);

  it("docHref は区切りごとに符号化し、readDocument は同じパスで本文を開く", () => {
    process.env.STATS47_PROJECT_ROOT = REPO;
    const href = docHref("docs/00_プロジェクト管理/02_収益化戦略.md");
    expect(href).toBe(`/docs/${encodeURIComponent("00_プロジェクト管理")}/${encodeURIComponent("02_収益化戦略")}`);
    const doc = readDocument(href.replace(/^\/docs\//, "").split("/"));
    expect(doc?.title).toBe("収益化戦略");
    expect(doc?.domainId).toBe("strategy");
    expect(doc?.body.startsWith("---")).toBe(false);
  });

  it("docs/ の外・存在しない文書は開かない (.. と符号化した .. の両方)", () => {
    process.env.STATS47_PROJECT_ROOT = REPO;
    expect(readDocument(["..", "CLAUDE"])).toBeNull();
    expect(readDocument(["%2E%2E", "CLAUDE"])).toBeNull();
    expect(readDocument(["..", ".claude", "todo", "backlog"])).toBeNull();
    expect(readDocument(["存在しない文書"])).toBeNull();
    expect(readDocument([])).toBeNull();
  });
});
