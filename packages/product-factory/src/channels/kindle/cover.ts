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

/**
 * 背景の**上部**(タイトルが載る領域) の明るさからインクを決める。
 *
 * 背景は明るい紙系も暗い夜景系もありうるので、白固定だと明るい背景で文字が消える
 * (2026-08-12 実測: クリーム地の候補で主題・続きがほぼ読めなかった)。
 * 判定は上 45% の平均輝度のみ — タイトルはそこにしか置かないため。
 */
export async function resolveInk(
  backgroundJpeg: Buffer | undefined,
  fallbackAccent: string,
): Promise<{ main: string; rest: string; sub: string; meta: string; band: string }> {
  const DARK_BG = {
    main: "#ffffff",
    rest: "#e8f2ff",
    sub: fallbackAccent,
    meta: "#ffffff",
    band: fallbackAccent,
  };
  if (!backgroundJpeg) return DARK_BG;
  try {
    const { data, info } = await sharp(backgroundJpeg)
      .extract({ left: 0, top: 0, width: W, height: Math.round(H * 0.45) })
      .resize(32, 32, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let sum = 0;
    const px = info.width * info.height;
    for (let i = 0; i < data.length; i += info.channels) {
      // Rec.709 相対輝度
      sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
    const mean = sum / px;
    if (mean < 128) return DARK_BG;
    // 明るい背景 = 濃紺インク。副題は可読性のため主題より一段薄い濃紺に留める。
    return { main: "#0d1f3c", rest: "#173254", sub: "#3d5a7d", meta: "#0d1f3c", band: "#0d1f3c" };
  } catch {
    return DARK_BG;
  }
}

export async function buildCoverPng(input: CoverInput): Promise<Buffer> {
  const c = SERIES_COLOR[input.series];
  const ink = await resolveInk(input.backgroundJpeg, c.accent);
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
      color: ink.meta,
      fontFamily: "NotoSansJP",
      padding: "120px 110px",
      // タイトルは上寄せ (space-between だと縦中央に落ち、上部に広い余白が残る)。
      // 著者ブロックだけ marginTop:auto で下端へ押す。
      justifyContent: "flex-start",
    },
    [
      // 上部: シリーズ帯
      node(
        "div",
        { display: "flex", flexDirection: "column" },
        [
          node("div", { width: "220px", height: "14px", backgroundColor: ink.band, marginBottom: "48px" }),
          node("div", { fontSize: "40px", color: ink.sub, letterSpacing: "0.2em" }, "STATS47 BOOKS"),
        ],
      ),
      // 上寄せ: タイトル (背景の主役は下部にあるので、上半分をタイトルに使う)。
      // 主題を最大級に 1 行で置き、続き・副題を段階的に小さくする。
      // 均等な大きさで折り返すとサムネイル (150×240px) で全部潰れて読めない。
      node(
        "div",
        { display: "flex", flexDirection: "column", marginTop: "120px" },
        [
          node(
            "div",
            {
              fontSize: `${mainTitleSize(main)}px`,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: `${TITLE_TRACKING_EM}em`,
              color: ink.main,
            },
            main,
          ),
          ...(rest
            ? [
                node(
                  "div",
                  { fontSize: "62px", fontWeight: 700, lineHeight: 1.35, marginTop: "36px", color: ink.rest },
                  rest,
                ),
              ]
            : []),
          ...(input.subtitle
            ? [node("div", { fontSize: "44px", color: ink.sub, marginTop: "48px", lineHeight: 1.45 }, input.subtitle)]
            : []),
        ],
      ),
      // 下部: 帯 + 著者 (marginTop:auto で下端へ)
      node(
        "div",
        { display: "flex", flexDirection: "column", marginTop: "auto" },
        [
          node("div", { width: "100%", height: "6px", backgroundColor: ink.band, marginBottom: "40px" }),
          node("div", { fontSize: "48px" }, input.author),
          node("div", { fontSize: "34px", color: ink.sub, marginTop: "16px" }, "統計で見る都道府県"),
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
