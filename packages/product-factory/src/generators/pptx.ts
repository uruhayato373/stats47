/**
 * 商品 PowerPoint (.pptx) ジェネレータ。pptxgenjs で以下を生成する:
 * - 県別に**個別再着色できる編集可能 custGeom shape** の日本地図 (Phase 0 採用方式)
 * - 埋め込み Excel を持つネイティブチャート (購入者が値を編集すると再計算)
 * - 表・使い方・出典・利用許諾スライド
 * 日本語は購入者環境のフォントで表示される (Office 実機検証は Phase 4)。
 */
import PptxGenJS from "pptxgenjs";
import type { Dataset } from "../data/dataset";
import type { PrefectureGeometry } from "../maps/prefecture-geometry";
import { classifyChoropleth, rankingBarSpec, rankItems } from "../charts/chart-spec";
import { PREFECTURE_BY_CODE5, REGIONS } from "../data/prefectures";
import { BRAND } from "../design/tokens";
import { SEMANTIC_COLORS } from "../design/tokens";

type PptxPoint = { x: number; y: number; moveTo?: boolean } | { close: true };

// pptxgenjs の SHAPE_NAME union に custGeom が漏れているが、実行時は受理され OOXML <a:custGeom> を出力する。
const CUSTGEOM = "custGeom" as unknown as PptxGenJS.SHAPE_NAME;

const JP_FONT = "Meiryo";
const hex = (c: string): string => c.replace("#", "");
const nameOf = (code5: string): string => PREFECTURE_BY_CODE5.get(code5)?.name ?? code5;

const MAP = { x: 3.1, y: 1.35, w: 7.0, h: 5.6 } as const;

// custGeom の点数を抑えてファイルサイズを現実的に保つ (高解像度海岸線をそのまま入れると数十MBになる)。
const SIMPLIFY_MIN_DIST = 0.02; // インチ

function simplifyRing(ring: readonly { x: number; y: number }[]): { x: number; y: number }[] {
  if (ring.length <= 5) return [...ring];
  const out: { x: number; y: number }[] = [ring[0]];
  const min2 = SIMPLIFY_MIN_DIST * SIMPLIFY_MIN_DIST;
  for (let i = 1; i < ring.length - 1; i += 1) {
    const last = out[out.length - 1];
    const dx = ring[i].x - last.x;
    const dy = ring[i].y - last.y;
    if (dx * dx + dy * dy >= min2) out.push(ring[i]);
  }
  out.push(ring[ring.length - 1]);
  return out.length >= 3 ? out : [...ring];
}

/** geometry(画素) を MAP ボックス内の box-相対インチ点列に変換する (アスペクト保持・中央寄せ・簡略化)。 */
function buildMapPoints(geo: PrefectureGeometry): Map<string, PptxPoint[]> {
  const scale = Math.min(MAP.w / geo.width, MAP.h / geo.height);
  const offX = (MAP.w - geo.width * scale) / 2;
  const offY = (MAP.h - geo.height * scale) / 2;
  const byCode = new Map<string, PptxPoint[]>();
  for (const s of geo.shapes) {
    const pts: PptxPoint[] = [];
    for (const ring of s.rings) {
      const scaled = ring.map((p) => ({ x: offX + p.x * scale, y: offY + p.y * scale }));
      const simplified = simplifyRing(scaled);
      simplified.forEach((p, i) => pts.push(i === 0 ? { x: p.x, y: p.y, moveTo: true } : { x: p.x, y: p.y }));
      pts.push({ close: true });
    }
    byCode.set(s.code5, pts);
  }
  return byCode;
}

function addTitle(slide: PptxGenJS.Slide, title: string, subtitle?: string): void {
  slide.addText(title, { x: 0.5, y: 0.3, w: 12.3, h: 0.6, fontSize: 24, fit: "shrink", bold: true, color: hex(BRAND.text), fontFace: JP_FONT });
  if (subtitle) {
    slide.addText(subtitle, { x: 0.5, y: 0.92, w: 12.3, h: 0.4, fontSize: 13, color: hex(BRAND.subtext), fontFace: JP_FONT });
  }
}

function footerText(ds: Dataset): string {
  return ds.isSample
    ? "架空サンプル（実データではありません）／ stats47.jp"
    : `出典：${ds.source.surveyName}（${ds.year}）／ stats47.jp`;
}

function addFooter(slide: PptxGenJS.Slide, ds: Dataset): void {
  slide.addText(footerText(ds), {
    x: 0.5, y: 7.05, w: 12.3, h: 0.3, fontSize: 10, color: hex(BRAND.subtext), fontFace: JP_FONT,
  });
}

function addMapSlide(
  pptx: PptxGenJS,
  ds: Dataset,
  mapPoints: Map<string, PptxPoint[]>,
  colorByCode: Map<string, string>,
  title: string,
  subtitle: string,
): void {
  const slide = pptx.addSlide();
  addTitle(slide, title, subtitle);
  for (const [code5, points] of mapPoints) {
    slide.addShape(CUSTGEOM, {
      x: MAP.x, y: MAP.y, w: MAP.w, h: MAP.h,
      points,
      fill: { color: hex(colorByCode.get(code5) ?? BRAND.mapNoData) },
      line: { color: hex(BRAND.mapBorder), width: 0.5 },
    });
  }
  addFooter(slide, ds);
}

function choroplethColorMap(ds: Dataset, classes: number, paletteId: string): Map<string, string> {
  const spec = classifyChoropleth(ds, { classes, paletteId });
  return new Map(spec.bins.map((b) => [b.code5, b.color]));
}

function regionColorMap(): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of REGIONS) for (const code5 of r.prefCodes5) m.set(code5, r.color);
  return m;
}

function highlightColorMap(ds: Dataset, target: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const d of ds.values) m.set(d.code5, d.code5 === target ? SEMANTIC_COLORS.danger : BRAND.mapNoData);
  return m;
}

function addBarChartSlide(pptx: PptxGenJS, ds: Dataset, title: string, subtitle: string, items: { code5: string; value: number }[]): void {
  const slide = pptx.addSlide();
  addTitle(slide, title, subtitle);
  slide.addChart("bar", [{ name: ds.indicator, labels: items.map((i) => nameOf(i.code5)), values: items.map((i) => i.value) }], {
    x: 0.6, y: 1.4, w: 12.1, h: 5.4, barDir: "bar", showValue: true,
    chartColors: [hex(SEMANTIC_COLORS.population)], catAxisLabelFontFace: JP_FONT, valAxisLabelFontFace: JP_FONT,
    dataLabelFontFace: JP_FONT, showLegend: false,
  });
  addFooter(slide, ds);
}

function addScatterSlide(pptx: PptxGenJS, ds: Dataset, title: string, subtitle: string): void {
  const slide = pptx.addSlide();
  addTitle(slide, title, subtitle);
  const pts = ds.values.filter((d): d is typeof d & { value: number } => d.value !== null);
  const xs = pts.map((d) => d.value);
  const ys = pts.map((d) => (d.value * 1.3 + (Number(d.code5.slice(0, 2)) % 7) * 2)); // 派生の第2指標 (サンプル)
  slide.addChart("scatter", [
    { name: "X: サンプル指標", values: xs },
    { name: "Y: 関連サンプル指標", values: ys },
  ], { x: 0.8, y: 1.4, w: 11.7, h: 5.4, chartColors: [hex(SEMANTIC_COLORS.special)], catAxisLabelFontFace: JP_FONT, valAxisLabelFontFace: JP_FONT, showLegend: true, legendFontFace: JP_FONT });
  addFooter(slide, ds);
}

function addTableSlide(pptx: PptxGenJS, ds: Dataset, title: string): void {
  const slide = pptx.addSlide();
  addTitle(slide, title, "全 47 都道府県（差し替え用データは data.csv）");
  const ranked = rankItems(ds, "desc");
  const cols = 3;
  const per = Math.ceil(ranked.length / cols);
  const headerRow = Array.from({ length: cols }).flatMap(() => [
    { text: "都道府県", options: { bold: true, fill: { color: "eef2f7" }, fontFace: JP_FONT } },
    { text: "値", options: { bold: true, fill: { color: "eef2f7" }, fontFace: JP_FONT, align: "right" as const } },
  ]);
  const rows: PptxGenJS.TableRow[] = [headerRow];
  for (let r = 0; r < per; r += 1) {
    const row: PptxGenJS.TableCell[] = [];
    for (let c = 0; c < cols; c += 1) {
      const item = ranked[c * per + r];
      row.push({ text: item ? nameOf(item.code5) : "", options: { fontFace: JP_FONT } });
      row.push({ text: item ? String(item.value) : "", options: { fontFace: JP_FONT, align: "right" as const } });
    }
    rows.push(row);
  }
  slide.addTable(rows, { x: 0.5, y: 1.4, w: 12.3, colW: [1.4, 0.65, 1.4, 0.65, 1.4, 0.65], fontSize: 10, border: { type: "solid", color: "d1d5db", pt: 0.5 } });
  addFooter(slide, ds);
}

function addTextSlide(pptx: PptxGenJS, title: string, body: string[]): void {
  const slide = pptx.addSlide();
  addTitle(slide, title);
  slide.addText(body.map((t) => ({ text: t, options: { bullet: true, fontSize: 15, color: hex(BRAND.text), fontFace: JP_FONT, paraSpaceAfter: 8 } })), {
    x: 0.7, y: 1.4, w: 12.0, h: 5.4,
  });
}

/** 商品 PowerPoint を outPath に書き出す。coverTitle で表紙見出しを差し替える。 */
export async function buildProductPptx(
  ds: Dataset,
  geo: PrefectureGeometry,
  outPath: string,
  coverTitle = "47都道府県 データ図表テンプレート",
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 (16:9)
  pptx.author = "stats47";
  pptx.company = "stats47";
  pptx.title = "47都道府県データ図表テンプレート（サンプル）";

  const mapPoints = buildMapPoints(geo);
  const ranked = rankItems(ds, "desc");

  // 1. 表紙
  const cover = pptx.addSlide();
  cover.background = { color: "0b1f3a" };
  cover.addText(coverTitle, { x: 0.8, y: 2.4, w: 11.7, h: 1.4, fontSize: 30, bold: true, color: "ffffff", fontFace: JP_FONT });
  cover.addText("地図・ランキング・グラフがすぐ使える PowerPoint 素材集", { x: 0.8, y: 3.5, w: 11.7, h: 0.6, fontSize: 16, color: "cbd5e1", fontFace: JP_FONT });
  cover.addText(
    `stats47.jp ／ ${ds.isSample ? "架空サンプル・実データではありません" : `収録データ：${ds.indicator}（${ds.year}）`}`,
    { x: 0.8, y: 6.6, w: 11.7, h: 0.4, fontSize: 12, color: "94a3b8", fontFace: JP_FONT },
  );

  // 2. 概要
  addTextSlide(pptx, "このテンプレートについて", [
    "47 都道府県を同じ定義で比較できる地図・ランキング・グラフのスライド集です。",
    "地図は都道府県ごとに色を変更できる編集可能な図形（Office 図形）です。",
    "グラフの数値は埋め込み Excel を編集すると更新されます。",
    "配色は色覚多様性に配慮した複数パレットを用意しています。",
    ds.isSample
      ? "本サンプルは架空データです。販売版では実データに差し替えます。"
      : `収録データは「${ds.indicator}」（${ds.year}・出典 ${ds.source.surveyName}）です。別テーマも同じ手順で差し替えられます。`,
  ]);

  // 3-7. 地図 5 パターン
  addMapSlide(pptx, ds, mapPoints,choroplethColorMap(ds, 9, "blues-sequential"), "地図：連続値（青・9段階）", "値が高いほど濃い青");
  addMapSlide(pptx, ds, mapPoints,choroplethColorMap(ds, 5, "blues-sequential"), "地図：5段階クラス", "分位で 5 クラスに区分");
  addMapSlide(pptx, ds, mapPoints,choroplethColorMap(ds, 7, "viridis-sequential"), "地図：連続値（Viridis）", "色覚多様性に配慮した連続配色");
  addMapSlide(pptx, ds, mapPoints,regionColorMap(), "地図：地方ブロック別", "7 ブロックで色分け");
  addMapSlide(pptx, ds, mapPoints,highlightColorMap(ds, "13000"), "地図：特定県の強調", "選択した県（例：東京都）だけを強調");

  // 8-10. チャート
  addBarChartSlide(pptx, ds, "ランキング：上位 10", "値の大きい順", ranked.slice(0, 10));
  addBarChartSlide(pptx, ds, "ランキング：上位 5 + 下位 5", "上位と下位の対比", [...rankingBarSpec(ds, { topN: 5, bottomN: 5 }).top, ...rankingBarSpec(ds, { topN: 5, bottomN: 5 }).bottom]);
  if (ds.isSample) {
    // 架空サンプルのみ散布図を描く (第2軸が説明用のダミー値のため、実データ商品では誤解を避けて出さない)
    addScatterSlide(pptx, ds, "散布図：2 指標の関係", "サンプル指標 × 関連サンプル指標（説明用）");
  } else {
    addTextSlide(pptx, "散布図（2 指標の相関）", [
      "本テンプレートには 2 指標の散布図スライドが含まれます。",
      "2 つ目の実指標データを差し替えると、都道府県ごとの相関を可視化できます。",
      "相関は因果ではありません。読み解きの注意もあわせて記載できます。",
    ]);
  }

  // 11. 表
  addTableSlide(pptx, ds, "47 都道府県一覧");

  // 12-13. 使い方
  addTextSlide(pptx, "使い方①：地図の色を変える", [
    "地図の各都道府県は独立した図形です。クリックして選択できます。",
    "図形を選び「図形の塗りつぶし」から任意の色に変更できます。",
    "複数県を選んで一括で色を変えることもできます。",
    "凡例の色は本文の配色に合わせて調整してください。",
  ]);
  addTextSlide(pptx, "使い方②：グラフのデータを差し替える", [
    "グラフを選び「グラフのデザイン → データの編集」で埋め込み Excel を開きます。",
    "数値を書き換えるとグラフが自動で更新されます。",
    "同梱の data.csv を貼り付けると 47 県分を一括で差し替えられます。",
    "基準年・出典は SOURCES.csv を参照してください。",
  ]);

  // 14. 出典
  addTextSlide(
    pptx,
    "出典・注記",
    ds.isSample
      ? [
          `指標：${ds.indicator}（${ds.year}）`,
          "本サンプルは架空データです（実在の調査ではありません）。",
          "販売版は e-Stat 等の公的統計を基に stats47 が集計・指標化・可視化します。",
          "詳細な出典・調査年・加工方法は SOURCES.csv に記載します。",
        ]
      : [
          `指標：${ds.indicator}（${ds.year}）`,
          `出典：${ds.source.surveyName}`,
          `表：${ds.source.tableName}（statsDataId ${ds.source.statsDataId}）`,
          `取得日：${ds.source.retrievedAt}／加工：${ds.source.transform}`,
          "詳細は同梱の SOURCES.csv。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。",
        ],
  );

  // 15. 利用許諾
  addTextSlide(pptx, "利用許諾（要約）", [
    "業務資料・提案書・記事・動画への組み込みは可能です（ライセンス条件による）。",
    "本商品の独自編集物単体の再販売 / 再配布は禁止です。原データの利用条件は提供元に従ってください。",
    "国・府省・自治体や e-Stat の公認・推奨と誤認させる表示はできません。",
    "詳細は同梱の LICENSE-ja.txt を参照してください。",
  ]);

  await pptx.writeFile({ fileName: outPath });
}

/**
 * データブック PowerPoint (.pptx) を outPath に書き出す。
 * buildProductPptx が単一データセット向けなのに対し、こちらは複数の実データセット (指標) を
 * 束ね、指標ごとに「地図 + ランキング + 一覧」のセクションを並べる。
 */
export async function buildDatabookPptx(
  datasets: readonly Dataset[],
  geo: PrefectureGeometry,
  outPath: string,
  coverTitle = "47都道府県 データブック",
): Promise<void> {
  if (datasets.length === 0) throw new Error("buildDatabookPptx: datasets が空です");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "stats47";
  pptx.company = "stats47";
  pptx.title = coverTitle;

  const mapPoints = buildMapPoints(geo);
  const indicatorSummary = `${datasets.length} 指標。指標名・分母・対象範囲は各ページと SOURCES.csv を参照`;

  // 1. 表紙
  const cover = pptx.addSlide();
  cover.background = { color: "0b1f3a" };
  cover.addText(coverTitle, { x: 0.8, y: 2.4, w: 11.7, h: 1.4, fontSize: 30, bold: true, color: "ffffff", fontFace: JP_FONT });
  cover.addText(`${datasets.length} 指標 × 47 都道府県（地図・ランキング・一覧）`, { x: 0.8, y: 3.5, w: 11.7, h: 0.6, fontSize: 16, color: "cbd5e1", fontFace: JP_FONT });
  cover.addText(`stats47.jp ／ 収録指標：${indicatorSummary}`, { x: 0.8, y: 6.6, w: 11.7, h: 0.4, fontSize: 12, color: "94a3b8", fontFace: JP_FONT });

  // 2. 概要
  addTextSlide(pptx, "このデータブックについて", [
    "県コードで整理した複数指標のデータブックです。県庁所在市・特定世帯・観測地点の値を含み、県全体を表さない指標があります。",
    `収録指標：${indicatorSummary}。`,
    "地図は都道府県ごとに色を変更できる編集可能な図形（Office 図形）です。",
    "グラフの数値は埋め込み Excel を編集すると更新されます。",
    "各指標の基準年・出典・加工方法は同梱の SOURCES.csv を参照してください。",
  ]);

  // 3+. 指標ごとのセクション (地図 + ランキング + 一覧)
  for (const ds of datasets) {
    addMapSlide(pptx, ds, mapPoints, choroplethColorMap(ds, 5, "blues-sequential"), `地図：${ds.indicator}（${ds.year}）`, "分位で 5 クラスに区分（都道府県ごとに色を変更可）");
    const ranked = rankItems(ds, "desc");
    addBarChartSlide(pptx, ds, `ランキング：${ds.indicator}（上位 10）`, `単位：${ds.unit}／値の大きい順`, ranked.slice(0, 10));
    addTableSlide(pptx, ds, `一覧：${ds.indicator}（47 都道府県）`);
  }

  // 使い方
  addTextSlide(pptx, "使い方①：地図の色を変える", [
    "地図の各都道府県は独立した図形です。クリックして選択できます。",
    "図形を選び「図形の塗りつぶし」から任意の色に変更できます。",
    "複数県を選んで一括で色を変えることもできます。",
    "凡例の色は本文の配色に合わせて調整してください。",
  ]);
  addTextSlide(pptx, "使い方②：グラフのデータを差し替える", [
    "グラフを選び「グラフのデザイン → データの編集」で埋め込み Excel を開きます。",
    "数値を書き換えるとグラフが自動で更新されます。",
    "同梱の data.csv を貼り付けると 47 県分を一括で差し替えられます。",
    "基準年・出典は SOURCES.csv を参照してください。",
  ]);

  // 出典
  addTextSlide(
    pptx,
    "出典・注記",
    [
      `収録 ${datasets.length} 指標の調査名・統計表ID・基準年・分母・対象範囲は同梱の SOURCES.csv に収録しています。`,
      "人口当たりの数値と総数、県庁所在市と県全体の値を混同しないでください。",
      "詳細は同梱の SOURCES.csv。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。",
    ],
  );

  // 利用許諾
  addTextSlide(pptx, "利用許諾（要約）", [
    "業務資料・提案書・記事・動画への組み込みは可能です（ライセンス条件による）。",
    "本商品の独自編集物単体の再販売 / 再配布は禁止です。原データの利用条件は提供元に従ってください。",
    "国・府省・自治体や e-Stat の公認・推奨と誤認させる表示はできません。",
    "詳細は同梱の LICENSE-ja.txt を参照してください。",
  ]);

  await pptx.writeFile({ fileName: outPath });
}
