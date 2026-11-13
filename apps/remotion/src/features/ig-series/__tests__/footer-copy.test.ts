import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { assertMinimalChartCopy } from "../../../../../../.claude/scripts/media/lib/image-copy.mjs";
import { IgSeriesFrame } from "../IgSeriesFrame";
import { IgSeriesReelFrame } from "../IgSeriesReelFrame";
import { IG_SERIES_IDS } from "../tokens";

const SOURCE_LABEL = "総務省 家計調査 2024年";

/** HTML の可視テキストを 1 行ずつ <text> に写し、SVG 用の共通契約と同じ検査に通す。 */
const visibleLines = (html: string) =>
  html
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
const assertCopy = (html: string) =>
  assertMinimalChartCopy(`<svg>${visibleLines(html).map((line) => `<text>${line}</text>`).join("")}</svg>`);

describe("IG シリーズのフレームの可視テキスト（chart-image-copy.md）", () => {
  const frames = [
    ["カルーセル", IgSeriesFrame],
    ["リール", IgSeriesReelFrame],
  ] as const;

  for (const [label, Frame] of frames) {
    for (const series of IG_SERIES_IDS) {
      it(`${label}・${series}: 出典を残し、発行元（stats47・サイト名）を入れない`, () => {
        const html = renderToStaticMarkup(
          createElement(Frame, { series, tag: "予想クイズ", sourceLabel: SOURCE_LABEL, children: "本文" }),
        );
        expect(() => assertCopy(html)).not.toThrow();
        const lines = visibleLines(html);
        expect(lines.join(" ")).toContain(`出典: ${SOURCE_LABEL}`);
        expect(lines.some((line) => /stats47|統計で見る都道府県/i.test(line))).toBe(false);
      });
    }
  }

  it("検査は発行元を含む可視テキストを実際に拒否する", () => {
    expect(() => assertCopy("<div><span>stats47.jp</span><span>出典: 総務省</span></div>")).toThrow();
  });
});
