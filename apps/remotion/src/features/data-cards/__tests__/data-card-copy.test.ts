import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { assertMinimalChartCopy } from "@stats47/ops/media/image-copy.mjs";

// 同梱フォントの読み込み (FontFace API) は Node に無い。可視テキストの検査には要らないので止める
vi.mock("../../buzz-map/useBuzzMapFonts", () => ({ useBuzzMapFonts: () => true }));
import { DataCard } from "../DataCard";
import type { DataCard as Card } from "../model";

// 家計レシート・県の図鑑・順位の乗り換え図の可視テキストに発行元 (stats47・stats47.jp) を入れない
// (.claude/rules/chart-image-copy.md・IMAGE-PUBLISHER-REMOVAL-01)。値は架空の固定値で、通信もしない。
const base = {
  key: "fixture",
  title: "架空データの見本",
  scope: "県庁所在市",
  canonicalPath: "/areas/28000",
  sources: [{ name: "総務省 家計調査", url: "https://www.e-stat.go.jp/" }],
  notes: ["二人以上の世帯"],
  metricKeys: ["fixture-metric"],
};
const cell = (i: number) => ({ key: `k${i}`, label: `費目${i}`, value: 1000 + i, unit: "円", year: "2024" });

const CARDS: Card[] = [
  {
    ...base,
    kind: "household-receipt",
    areaName: "神戸市",
    period: "2024年",
    rows: Array.from({ length: 10 }, (_, i) => cell(i + 1)),
    total: 10055,
    difference: 0,
  },
  {
    ...base,
    kind: "area-atlas",
    areaName: "兵庫県",
    areaCode: "28000",
    shape: "M0 0 L10 0 L10 10 Z",
    shapeNote: "県の形",
    rows: Array.from({ length: 4 }, (_, i) => cell(i + 1)),
  },
  {
    ...base,
    kind: "rank-routes",
    unit: "円",
    beforeYear: "2014",
    afterYear: "2024",
    population: 47,
    direction: "descending",
    routes: [
      { code: "28000", name: "兵庫県", before: { rank: 3, value: 300 }, after: { rank: 1, value: 330 } },
      { code: "27000", name: "大阪府", before: { rank: 1, value: 320 }, after: { rank: 2, value: 310 } },
    ],
  },
];

/** HTML の可視テキストを 1 行ずつ <text> に写し、SVG 用の共通契約と同じ検査に通す (ig-series の footer-copy.test.ts と同じ形) */
const visibleLines = (html: string) =>
  html
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

describe("SNS データカードの可視テキスト", () => {
  for (const card of CARDS) {
    for (const slide of ["detail", "cover", "source"] as const) {
      it(`${card.kind}・${slide}: 発行元を入れない`, () => {
        const html = renderToStaticMarkup(createElement(DataCard, { card, slide }));
        const lines = visibleLines(html);
        expect(lines.length).toBeGreaterThan(0);
        expect(lines.some((line) => /stats47/i.test(line))).toBe(false);
        // 表紙の「スワイプして、データを見る →」は行動案内で共通契約に当たる (発行元とは別の既存の課題)。
        // 表紙は発行元だけを確かめ、本体と出典の頁は共通契約の全体を通す
        if (slide === "cover") return;
        expect(() =>
          assertMinimalChartCopy(`<svg>${lines.map((line) => `<text>${line}</text>`).join("")}</svg>`),
        ).not.toThrow();
      });
    }
  }
});
