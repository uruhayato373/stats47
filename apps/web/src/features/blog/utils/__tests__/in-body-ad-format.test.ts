import { describe, expect, it } from "vitest";

import { IN_BODY_AD_EXPERIMENT_ID, pickInBodyAdFormat } from "../in-body-ad-format";

describe("pickInBodyAdFormat", () => {
  it("同じ slug には常に同じフォーマットを返す (記事ごとに固定)", () => {
    // 再訪した読者に別フォーマットが出ると計測が混ざるため、決定性が要件。
    const slug = "real-disposable-income-reversal";
    const first = pickInBodyAdFormat(slug);
    for (let i = 0; i < 50; i++) expect(pickInBodyAdFormat(slug)).toBe(first);
  });

  it("slug が無ければ text にフォールバックする", () => {
    expect(pickInBodyAdFormat(undefined)).toBe("text");
    expect(pickInBodyAdFormat("")).toBe("text");
  });

  it("text / banner のいずれかしか返さない", () => {
    for (const slug of ["a", "bb", "ccc", "日本語スラッグ", "x-y-z-1234"]) {
      expect(["text", "banner"]).toContain(pickInBodyAdFormat(slug));
    }
  });

  it("代表 slug の割当が変わらない (ハッシュ回帰防止)", () => {
    // ここが変わると A/B の割当が全記事で組み替わり、計測が不連続になる。
    // 変更する場合は実験を締めてから (experiments.json の blog-inbody-format)。
    expect(pickInBodyAdFormat("real-disposable-income-reversal")).toBe(
      pickInBodyAdFormat("real-disposable-income-reversal"),
    );
    const sample = ["a", "b", "c", "d", "e"].map((s) => pickInBodyAdFormat(s));
    expect(sample.join(",")).toMatchInlineSnapshot(`"banner,text,banner,text,banner"`);
  });

  it("十分な数の slug でおおよそ半々に割れる", () => {
    // 実測: 公開 432 記事で text 219 / banner 213 (49.3% banner)。
    const slugs = Array.from({ length: 400 }, (_, i) => `article-${i}-slug`);
    const banner = slugs.filter((s) => pickInBodyAdFormat(s) === "banner").length;
    expect(banner).toBeGreaterThan(400 * 0.35);
    expect(banner).toBeLessThan(400 * 0.65);
  });

  it("実験 ID は GA4 に送る値と一致している", () => {
    expect(IN_BODY_AD_EXPERIMENT_ID).toBe("blog-inbody-format");
  });
});
