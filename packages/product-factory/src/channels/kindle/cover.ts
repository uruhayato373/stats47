/**
 * 書籍カバー生成 (satori → sharp)。1600×2560 (Kindle 推奨比 1.6)。
 * satori は文字をグリフパス化した SVG を出すため、sharp のラスタライズにシステム CJK フォントは不要
 * (OGP と同じ経路)。@resvg は使わず sharp で PNG 化する。
 */
import satori from "satori";
import sharp from "sharp";
import { notoSansJpBytes } from "../../generators/jp-font";
import type { BookSeries } from "./types";

/** シリーズ別のカバー基調色 (帯・地色)。 */
const SERIES_COLOR: Record<BookSeries, { bg: string; band: string; accent: string }> = {
  "S1-issues": { bg: "#0f2540", band: "#1d6fb8", accent: "#7fc4ff" },
  "S2-theme-databook": { bg: "#123524", band: "#1f8a4c", accent: "#8fe0ac" },
  "S3-region": { bg: "#3a1f10", band: "#b8641d", accent: "#ffc38f" },
  "S4-ranking-compendium": { bg: "#2a1230", band: "#7b3ea8", accent: "#d4a4ff" },
};

const W = 1600;
const H = 2560;

interface CoverInput {
  readonly title: string;
  readonly subtitle?: string;
  readonly series: BookSeries;
  readonly author: string;
}

/** satori 用の vnode を素の JS オブジェクトで組む (React/JSX 非依存)。 */
function node(type: string, style: Record<string, unknown>, children?: unknown): Record<string, unknown> {
  return { type, props: { style, ...(children !== undefined ? { children } : {}) } };
}

export async function buildCoverPng(input: CoverInput): Promise<Buffer> {
  const c = SERIES_COLOR[input.series];
  const element = node(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      width: `${W}px`,
      height: `${H}px`,
      backgroundColor: c.bg,
      color: "#ffffff",
      fontFamily: "NotoSansJP",
      padding: "120px 110px",
      justifyContent: "space-between",
    },
    [
      // 上部: シリーズ帯
      node(
        "div",
        { display: "flex", flexDirection: "column" },
        [
          node("div", { width: "220px", height: "14px", backgroundColor: c.accent, marginBottom: "48px" }),
          node("div", { fontSize: "40px", color: c.accent, letterSpacing: "0.2em" }, "STATS47 BOOKS"),
        ],
      ),
      // 中央: タイトル
      node(
        "div",
        { display: "flex", flexDirection: "column" },
        [
          node("div", { fontSize: "104px", fontWeight: 700, lineHeight: 1.35 }, input.title),
          ...(input.subtitle
            ? [node("div", { fontSize: "48px", color: c.accent, marginTop: "56px", lineHeight: 1.4 }, input.subtitle)]
            : []),
        ],
      ),
      // 下部: 帯 + 著者
      node(
        "div",
        { display: "flex", flexDirection: "column" },
        [
          node("div", { width: "100%", height: "6px", backgroundColor: c.band, marginBottom: "40px" }),
          node("div", { fontSize: "48px" }, input.author),
          node("div", { fontSize: "34px", color: c.accent, marginTop: "16px" }, "統計で見る都道府県"),
        ],
      ),
    ],
  );

  const svg = await satori(element as never, {
    width: W,
    height: H,
    fonts: [
      { name: "NotoSansJP", data: Buffer.from(notoSansJpBytes()), weight: 400, style: "normal" },
      { name: "NotoSansJP", data: Buffer.from(notoSansJpBytes()), weight: 700, style: "normal" },
    ],
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
