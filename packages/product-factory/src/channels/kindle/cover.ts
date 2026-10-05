/**
 * 書籍カバー生成 (satori → sharp)。1600×2560 (Kindle 推奨比 1.6)。
 * satori は文字をグリフパス化した SVG を出すため、sharp のラスタライズにシステム CJK フォントは不要
 * (OGP と同じ経路)。@resvg は使わず sharp で PNG 化する。
 */
import satori from "satori";
import sharp from "sharp";
import { notoSansJpBytes } from "../../generators/jp-font";
import type { BookSeries, KindleCoverDesign, KindleCoverPalette } from "./types";
import { SITE } from "@stats47/data-configs";

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

const PALETTE_COLOR: Record<KindleCoverPalette, { bg: string; paper: string; ink: string; accent: string; accent2: string; titleMarker: string; meta: string }> = {
  "navy-yellow": { bg: "#071426", paper: "#fff9e8", ink: "#071426", accent: "#ffd21f", accent2: "#1a63d8", titleMarker: "#ffd21f", meta: "#536173" },
  "coral-cream": { bg: "#451818", paper: "#fff7ee", ink: "#371817", accent: "#ff6b57", accent2: "#ffc928", titleMarker: "#ffc928", meta: "#765d56" },
  "teal-red": { bg: "#073c3d", paper: "#f2fbf8", ink: "#0b3536", accent: "#00a69b", accent2: "#ef4056", titleMarker: "#ef4056", meta: "#53706f" },
  "blue-orange": { bg: "#102c63", paper: "#f5f8ff", ink: "#10254f", accent: "#2166db", accent2: "#ff8a22", titleMarker: "#ff8a22", meta: "#596985" },
  "green-gold": { bg: "#123822", paper: "#f6faef", ink: "#173723", accent: "#2d8a4e", accent2: "#e7b51e", titleMarker: "#e7b51e", meta: "#5b705f" },
  "sky-coral": { bg: "#174d72", paper: "#f4fbff", ink: "#163c57", accent: "#27aee4", accent2: "#ff6f61", titleMarker: "#ff6f61", meta: "#587386" },
  "orange-navy": { bg: "#10233e", paper: "#fff7eb", ink: "#14263d", accent: "#f47b20", accent2: "#174f91", titleMarker: "#f47b20", meta: "#6f665d" },
  "purple-gold": { bg: "#28143a", paper: "#fbf6ff", ink: "#321942", accent: "#7b3fb1", accent2: "#e7b51e", titleMarker: "#e7b51e", meta: "#735f79" },
};

const SERIES_BADGE: Record<BookSeries, string> = {
  "S1-issues": "数字で答える 都道府県の論点",
  "S2-theme-databook": "47都道府県 テーマ別データ",
  "S3-region": "地域別 県データブック",
  "S4-ranking-compendium": "47都道府県 ランキング大全",
};

const THEME_BADGE: Record<KindleCoverDesign["visualTheme"], string> = {
  "household-money": "家計",
  "food-consumption": "食卓・消費",
  "population-households": "人口・世帯",
  "health-care": "医療・介護",
  "education-childcare": "教育・子育て",
  "public-finance": "財政",
  tourism: "観光",
  "energy-infrastructure": "インフラ",
  "industry-economy": "産業・経済",
  "safety-environment": "安全・防災",
  "culture-leisure": "文化・余暇",
  "digital-life": "デジタル生活",
  "migration-living": "移住・生活",
  "retail-market": "商圏",
  "regional-profile": "地域",
  "ranking-discovery": "ランキング",
};

const W = 1600;
const H = 2560;

interface CoverInput {
  readonly title: string;
  readonly subtitle?: string;
  readonly series: BookSeries;
  readonly author: string;
  /** 商品別の配色と「この1冊でわかる」表示。 */
  readonly coverDesign?: KindleCoverDesign;
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
  // 問い型の書名 (「年収が高い県は、暮らしも豊かなのか」17 字) は読点が自然な折り目 (2026-09-19)。
  const comma = t.match(/^(.+?、)(.+)$/);
  if (comma && t.length > 12) return { main: comma[1].trim(), rest: comma[2].trim() };
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

/** 添付の基準案に合わせた、極太見出し・マーカー強調・データ枠・黄色フッターのポップ表紙。 */
async function buildPopCoverPng(
  input: CoverInput & { readonly coverDesign: KindleCoverDesign },
): Promise<Buffer> {
  const c = PALETTE_COLOR[input.coverDesign.palette];
  const { main, rest } = splitTitle(input.title);
  const primary = c.accent2;
  const secondary = c.accent;
  const chipColors = ["#ffd21f", "#ff6b57", "#35b96f", "#29a8df", "#7a55d9", "#ff982e"];
  const rays = [-48, -32, -16, 16, 32, 48].map((deg) =>
    node("div", {
      position: "absolute",
      width: "92px",
      height: "1050px",
      left: "754px",
      top: "-120px",
      backgroundColor: primary,
      opacity: 0.07,
      transform: `rotate(${deg}deg)`,
      transformOrigin: "46px 1050px",
    }),
  );
  const dots = Array.from({ length: 28 }, (_, index) =>
    node("div", {
      position: "absolute",
      left: `${10 + (index % 7) * 38}px`,
      top: `${8 + Math.floor(index / 7) * 38}px`,
      width: `${10 + Math.floor(index / 7) * 5}px`,
      height: `${10 + Math.floor(index / 7) * 5}px`,
      borderRadius: "50%",
      backgroundColor: primary,
      opacity: 0.15,
    }),
  );
  const element = node(
    "div",
    {
      display: "flex",
      position: "relative",
      width: `${W}px`,
      height: `${H}px`,
      overflow: "hidden",
      backgroundColor: c.bg,
      ...(input.backgroundJpeg
        ? {
            backgroundImage: `url(data:image/jpeg;base64,${input.backgroundJpeg.toString("base64")})`,
            backgroundSize: `${W}px ${H}px`,
          }
        : {}),
      color: c.ink,
      fontFamily: "NotoSansJP",
    },
    [
      node("div", { position: "absolute", inset: "0 0 auto 0", width: "100%", height: "1120px", backgroundColor: c.paper }),
      // 楕円を重ね、文字面から画像面へ大きな弧で切り替える。
      node("div", {
        position: "absolute",
        left: "-260px",
        top: "-900px",
        width: "2120px",
        height: "2240px",
        borderRadius: "50%",
        backgroundColor: c.paper,
        borderBottom: `16px solid ${secondary}`,
      }),
      ...rays,
      ...dots,
      node(
        "div",
        { display: "flex", flexDirection: "column", position: "absolute", left: "48px", top: "54px", width: "1504px", height: "1080px" },
        [
          node(
            "div",
            {
              display: "flex",
              alignSelf: "flex-start",
              backgroundColor: primary,
              color: "#ffffff",
              border: `5px solid ${c.ink}`,
              borderRadius: "22px",
              padding: "16px 30px 20px",
              fontSize: "47px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              marginBottom: "42px",
            },
            `47都道府県 × ${input.coverDesign.dataLabels.length}つの${THEME_BADGE[input.coverDesign.visualTheme]}データ`,
          ),
          node(
            "div",
            { fontSize: `${Math.min(166, mainTitleSize(main))}px`, fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.035em", color: c.ink },
            main,
          ),
          ...(rest
            ? [
                node(
                  "div",
                  {
                    display: "flex",
                    position: "relative",
                    alignSelf: "flex-start",
                    padding: "8px 20px 18px 10px",
                    marginTop: "6px",
                  },
                  [
                    node("div", {
                      position: "absolute",
                      left: "0",
                      right: "0",
                      bottom: "8px",
                      height: "28px",
                      borderRadius: "8px",
                      backgroundColor: c.titleMarker,
                      opacity: 0.32,
                      transform: "skewX(-5deg)",
                    }),
                    node(
                      "div",
                      {
                        position: "relative",
                        color: c.ink,
                        fontSize: `${Math.min(142, mainTitleSize(rest))}px`,
                        fontWeight: 700,
                        lineHeight: 1.04,
                        letterSpacing: "-0.035em",
                      },
                      rest,
                    ),
                  ],
                ),
              ]
            : []),
          ...(input.subtitle
            ? [
                node(
                  "div",
                  { fontSize: "50px", fontWeight: 700, color: c.ink, marginTop: "26px", lineHeight: 1.3 },
                  input.subtitle,
                ),
              ]
            : []),
          node(
            "div",
            {
              display: "flex",
              flexDirection: "column",
              alignSelf: "flex-start",
              backgroundColor: c.ink,
              border: `5px solid ${primary}`,
              borderRadius: "22px",
              padding: "22px 24px 12px",
              marginTop: "28px",
              width: "840px",
              boxShadow: "12px 14px 0 rgba(7,20,38,0.18)",
            },
            [
              node("div", { fontSize: "38px", fontWeight: 700, color: secondary, marginBottom: "12px" }, "この1冊でわかるデータ"),
              node(
                "div",
                { display: "flex", flexWrap: "wrap", width: "100%" },
                input.coverDesign.dataLabels.map((label, index) =>
                  node(
                    "div",
                    {
                      backgroundColor: chipColors[index % chipColors.length],
                      color: index === 0 ? c.ink : "#ffffff",
                      borderRadius: "999px",
                      padding: "11px 20px 14px",
                      marginRight: "12px",
                      marginBottom: "12px",
                      fontSize: "38px",
                      fontWeight: 700,
                      lineHeight: 1.05,
                    },
                    label,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      node(
        "div",
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "absolute",
          left: "0",
          bottom: "0",
          width: "100%",
          height: "150px",
          padding: "0 52px",
          backgroundColor: secondary,
          borderTop: `6px solid ${c.ink}`,
          color: c.ink,
        },
        [
          node("div", { fontSize: "52px", fontWeight: 700 }, input.author),
          node("div", { fontSize: "42px", fontWeight: 700 }, SITE.name),
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

export async function buildCoverPng(input: CoverInput): Promise<Buffer> {
  if (input.coverDesign) {
    return buildPopCoverPng(input as CoverInput & { readonly coverDesign: KindleCoverDesign });
  }
  const c = {
    ...SERIES_COLOR[input.series],
    accent2: SERIES_COLOR[input.series].accent,
  };
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
          borderTop: `28px solid ${c.accent}`,
          padding: "78px 110px 72px",
        },
        [
          node(
            "div",
            {
              display: "flex",
              alignSelf: "flex-start",
              backgroundColor: c.accent,
              color: "#ffffff",
              borderRadius: "999px",
              padding: "14px 30px 16px",
              fontSize: "34px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              marginBottom: "36px",
            },
            SERIES_BADGE[input.series],
          ),
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
                  { fontSize: "82px", fontWeight: 700, lineHeight: 1.3, marginTop: "34px", color: c.accent2 },
                  rest,
                ),
              ]
            : []),
          ...(input.subtitle
            ? [
                node(
                  "div",
                  { fontSize: "66px", fontWeight: 700, color: c.ink, marginTop: "36px", lineHeight: 1.35 },
                  input.subtitle,
                ),
              ]
            : []),
          // 著者は KDP 必須情報。文字面の下端にまとめる。
          node(
            "div",
            { display: "flex", flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" },
            [
              node("div", { fontSize: "52px", fontWeight: 700, color: c.ink }, input.author),
              node("div", { fontSize: "32px", color: c.meta }, SITE.name),
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
