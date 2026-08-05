import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GenderPairedKpiGrid } from "../GenderPairedKpiGrid";

/**
 * 男女 KPI の可読性契約。
 *
 * 経緯: 2026-08-05 の Lighthouse mobile 監査で、固定色 `#3b82f6` (白地 contrast 3.68) と
 * `#ec4899` (同 3.53) が本文文字に必要な 4.5:1 を満たしていなかった。単色では light と
 * dark の両立が不可能 (濃色は dark 地で 2 前後まで落ちる) なため、light / dark で
 * 明度を分ける。生 hex の任意値クラスへ戻す変更はここで落ちる。
 */

const PAIRS = [
  { label: "平均初婚年齢", maleKey: "marriage-age-male", femaleKey: "marriage-age-female" },
];

const DATABOOK = {
  metrics: {
    "marriage-age-male": { value: 31.2, rank: 12, unit: "歳" },
    "marriage-age-female": { value: 29.6, rank: 20, unit: "歳" },
  },
  // 本テストが読むのは metrics だけ
} as unknown as Parameters<typeof GenderPairedKpiGrid>[0]["databook"];

function markup() {
  return renderToStaticMarkup(
    <GenderPairedKpiGrid
      pairs={PAIRS as unknown as Parameters<typeof GenderPairedKpiGrid>[0]["pairs"]}
      databook={DATABOOK}
    />,
  );
}

describe("GenderPairedKpiGrid", () => {
  it("生 hex の任意値クラスを使わない", () => {
    const html = markup();
    expect(html).not.toContain("#3b82f6");
    expect(html).not.toContain("#ec4899");
    expect(html).not.toMatch(/text-\[#/);
  });

  it("light / dark それぞれで 4.5:1 を満たす明度クラスを当てる", () => {
    const html = markup();
    expect(html).toContain("text-blue-700");
    expect(html).toContain("dark:text-blue-400");
    expect(html).toContain("text-pink-700");
    expect(html).toContain("dark:text-pink-400");
  });

  it("男女を色以外でも判別できる (WCAG 1.4.1)", () => {
    const html = markup();
    expect(html).toContain("男性");
    expect(html).toContain("女性");
  });

  it("値と全国順位を維持する", () => {
    const html = markup();
    expect(html).toContain("31.2");
    expect(html).toContain("29.6");
    expect(html).toContain("全国12位");
    expect(html).toContain("全国20位");
  });
});
