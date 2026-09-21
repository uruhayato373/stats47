/**
 * 編集設計 (design) の validator を固定する。
 * 共通事業方針「分類しただけで需要ありと判定しない」を機械で守る: 空文字・1 案だけ・同じ型 2 案・title 不一致を弾く。
 */
import { describe, expect, it } from "vitest";

import { KINDLE_BOOKS } from "../book-catalog";
import type { EditorialDesign, KindleBook } from "../types";
import { validateEditorialDesign, validateKindleCatalog } from "../validator";

const base = KINDLE_BOOKS.find((b) => b.id === "K-S1-01")!;
const good: EditorialDesign = base.design!;

function run(book: KindleBook, design: EditorialDesign) {
  const errors: { code: string }[] = [];
  const warnings: { code: string }[] = [];
  validateEditorialDesign(book, design, errors as never, warnings as never);
  return { errors: errors.map((e) => e.code), warnings: warnings.map((w) => w.code) };
}

describe("validateEditorialDesign", () => {
  it("K-S1-01 の設計は error 0", () => {
    expect(run(base, good).errors).toEqual([]);
  });
  it("読者の悩みが短い・需要の証拠が空・案が 1 つ・title 不一致を弾く", () => {
    const bad: EditorialDesign = { ...good, readerProblem: "家計", demandEvidence: "", titleCandidates: [good.titleCandidates[0]] };
    const r = run({ ...base, title: "別の書名" }, bad);
    expect(r.errors).toEqual(expect.arrayContaining(["design-reader-problem", "design-demand", "design-title-candidates", "design-title-mismatch"]));
  });
  it("同じ型の 2 案は弾き、型の上限を超えるタイトルは warn", () => {
    const sameType: EditorialDesign = {
      ...good,
      titleCandidates: [
        { type: "問い・気づき", title: base.title },
        { type: "問い・気づき", title: "なぜ年収が高い県ほど貯蓄が少ないのか、家賃と物価と世帯構成から四十七都道府県を読み直す長い書名" },
      ],
    };
    const r = run(base, sameType);
    expect(r.errors).toContain("design-title-types");
    expect(r.warnings).toContain("design-title-long");
  });
  it("HARM 対象外でも理由が無ければ弾く", () => {
    expect(run(base, { ...good, harm: [], harmReason: "" }).errors).toContain("design-harm-reason");
  });
});

describe("validateKindleCatalog × design", () => {
  it("design の無い manuscript 以降の書籍は warn (error にはしない・generate が拒否する)", () => {
    const v = validateKindleCatalog();
    const missing = v.warnings.filter((w) => w.code === "design-missing").map((w) => w.ref);
    expect(missing).not.toContain("K-S1-01");
    expect(v.errors.filter((e) => e.code.startsWith("design-"))).toEqual([]);
  });
});
