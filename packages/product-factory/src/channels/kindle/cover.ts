/**
 * 書籍カバー生成 (satori → sharp)。1600×2560 (Kindle 推奨比 1.6)。
 * satori は文字をグリフパス化した SVG を出すため、sharp のラスタライズにシステム CJK フォントは不要
 * (OGP と同じ経路)。@resvg は使わず sharp で PNG 化する。
 */
import satori from "satori";
import sharp from "sharp";
import { notoSansJpBytes } from "../../generators/jp-font";
import type { BookSeries } from "./types";

/**
 * シリーズ別のカバー色。
 *
 * Amazon ビジネス実用本の売れ筋30冊を 2026-08-30 に実画面で確認すると、全面写真より
 * 「明るい文字面 + 大きな書名 + 1〜2色のアクセント」が主流だった。背景画像を全面に敷く
 * 旧版はサムネイルで画像が先に立ったため、上58%を明るい文字面、下42%だけを画像にする。
 */
const SERIES_COLOR: Record<BookSeries, { bg: string; paper: string; ink: string; accent: string; meta: string }> = {
  "S1-issues": { bg: "#0f2540", paper: "#f2f6fa", ink: "#10243a", accent: "#1769a6", meta: "#536779" },
  "S2-theme-databook": { bg: "#123524", paper: "#f1f7f2", ink: "#153527", accent: "#217a49", meta: "#587064" },
  "S3-region": { bg: "#3a1f10", paper: "#faf3ec", ink: "#3a251a", accent: "#a95317", meta: "#786458" },
  "S4-ranking-compendium": { bg: "#2a1230", paper: "#f7f1f8", ink: "#321d38", accent: "#763798", meta: "#735f78" },
};

const W = 1600;
const H = 2560;

interface CoverInput {
  readonly title: string;
  readonly subtitle?: string;
  readonly series: BookSeries;
  readonly author: string;
  /**
   * 全面に敷く背景画像 (1600×2560 の JPEG バイト列)。
   * 家ルール (`.claude/rules/ogp-image-standards.md` §5) に従い、生成 AI が作るのは
   * **文字を含まない背景だけ**で、タイトル・著者は下の satori が実テキストとして重ねる
   * (AI に日本語や数字を焼き込ませない)。省略時はシリーズ基調色の無地。
   */
  readonly backgroundJpeg?: Buffer;
}

/** satori 用の vnode を素の JS オブジェクトで組む (React/JSX 非依存)。 */
function node(type: string, style: Record<string, unknown>, children?: unknown): Record<string, unknown> {
  return { type, props: { style, ...(children !== undefined ? { children } : {}) } };
}

/**
 * 書名を「主題」と「副題」に割る。
 *
 * Kindle ストアの表紙は PC でも 150×240px 程度、スマホではさらに小さい。この寸法で読めるのは
 * **短い主題を大きく置いたときだけ**なので、`—` / `−` / `:` で切って主題を最大級に、続きを
 * 中サイズの別行にする (長い一文を均等な大きさで 2 行に折り返すと、どの行も小さくなって
 * サムネイルで潰れる = 2026-08-12 の Previewer 実測)。区切りが無ければ全体を主題とする。
 */
export function splitTitle(title: string): { main: string; rest?: string } {
  const t = title.trim();
  const explicit = t.match(/^(.+?)\s*[—–―−:：]\s*(.+)$/);
  if (explicit) return { main: explicit[1].trim(), rest: explicit[2].trim() };
  // 明示の区切りが無い長い書名は空白で割る。「データで見る47都道府県 教育・子育て」のような
  // 21 文字の塊は下限 96px でも 1 行に収まらず折り返すため (2026-08-12 に 32 冊中 11 冊が該当)。
  const space = t.match(/^(.+?)[ 　]+(.+)$/);
  if (space && t.length > 12) return { main: space[1].trim(), rest: space[2].trim() };
  return { main: t };
}

/** 主題に効かせる字間 (em)。幅計算にも必ず同じ値を使う。 */
const TITLE_TRACKING_EM = 0.02;

/**
 * 主題の字数からフォントサイズを決める。1600px 幅に **1 行で** 収める前提。
 *
 * 日本語 1 文字 ≒ 1em。両側 padding (110px×2) を引いた 1380px に、字間 (0.02em/字) を
 * 含めて収まる最大値を選ぶ。**字間を勘定に入れないと 8 文字で 3% 溢れて 2 行に割れる**
 * (2026-08-12 実測: 172px×8字 は収まるのに letterSpacing 分で折り返した)。
 * さらに端で切れないよう 2% の安全余白を引く。
 */
export function mainTitleSize(main: string): number {
  const MAX_W = (W - 110 * 2) * 0.98;
  const perChar = 1 + TITLE_TRACKING_EM;
  const ideal = Math.floor(MAX_W / (Math.max(main.length, 1) * perChar));
  // 下限 96 は「これ以上小さいとサムネイルで読めない」ライン、上限 220 は 1 行の見た目の上限。
  return Math.max(96, Math.min(220, ideal));
}

export async function buildCoverPng(input: CoverInput): Promise<Buffer> {
  const c = SERIES_COLOR[input.series];
  const { main, rest } = splitTitle(input.title);
  const element = node(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      width: `${W}px`,
      height: `${H}px`,
      backgroundColor: c.bg,
      ...(input.backgroundJpeg
        ? {
            backgroundImage: `url(data:image/jpeg;base64,${input.backgroundJpeg.toString("base64")})`,
            backgroundSize: `${W}px ${H}px`,
          }
        : {}),
      color: c.ink,
      fontFamily: "NotoSansJP",
      // 文字面と画像面を明確に分離する。全面写真に文字を載せると、画像の明暗に依存し、
      // Amazon の 150×240px サムネイルで書名より画像が勝つため。
      justifyContent: "flex-start",
    },
    [
      // 上58%: 明るい文字面。旧版の STATS47 BOOKS と上下の装飾線は情報価値がなく、
      // 書名の面積を削っていたので置かない。
      node(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "1480px",
          backgroundColor: c.paper,
          padding: "126px 110px 92px",
        },
        [
          node(
            "div",
            {
              fontSize: `${mainTitleSize(main)}px`,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: `${TITLE_TRACKING_EM}em`,
              color: c.ink,
            },
            main,
          ),
          ...(rest
            ? [
                node(
                  "div",
                  { fontSize: "82px", fontWeight: 700, lineHeight: 1.3, marginTop: "44px", color: c.accent },
                  rest,
                ),
              ]
            : []),
          ...(input.subtitle
            ? [
                node(
                  "div",
                  { fontSize: "72px", fontWeight: 700, color: c.ink, marginTop: "52px", lineHeight: 1.35 },
                  input.subtitle,
                ),
              ]
            : []),
          // 著者は KDP 必須情報。装飾線を使わず文字面の下端にまとめる。
          node(
            "div",
            { display: "flex", flexDirection: "column", marginTop: "auto" },
            [
              node("div", { fontSize: "52px", fontWeight: 700, color: c.ink }, input.author),
              node("div", { fontSize: "32px", color: c.meta, marginTop: "12px" }, "統計で見る都道府県"),
            ],
          ),
        ],
      ),
      // 下42%: テーマ画像だけを見せる。文字を重ねず、タイトルとの競合を避ける。
      node("div", { display: "flex", width: "100%", height: `${H - 1480}px` }),
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
