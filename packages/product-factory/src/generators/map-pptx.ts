/**
 * 塗り分け地図だけの PowerPoint (.pptx)。1 指標 1 スライドで、47 都道府県が県ごとに色を変えられる図形 (custGeom) になる。
 * 選択ウィンドウには県名が出る (objectName)。比較表・ランキングの入った `product.pptx` とは別ファイルで、
 * パックの全指標を分野ごと・約 50 指標ごとに分けて作る (`pack-bundle.ts` が分割を決める)。
 */
import { writeFileSync } from "node:fs";
import PptxGenJS from "pptxgenjs";
import type { Dataset } from "../data/dataset";
import type { PrefectureGeometry } from "../maps/prefecture-geometry";
import { PREFECTURE_BY_CODE5 } from "../data/prefectures";
import { classifyChoropleth, legendEntries } from "../charts/chart-spec";
import { BRAND } from "../design/tokens";
import { SITE } from "@stats47/data-configs";
import { PREFECTURE_BOUNDARY_NOTICE, PREFECTURE_BOUNDARY_SHORT } from "../maps/prefecture-boundary";
import { CUSTGEOM, JP_FONT, MAP, addTextSlide, addTitle, buildMapPoints, hex } from "./pptx";

/** 区分数と配色 (地図 SVG と同じ)。 */
export const MAP_CLASSES = 5;
export const MAP_PALETTE = "blues-sequential";

const LEGEND = { x: 0.5, y: 1.55, w: 2.5 } as const;
const LEGEND_ROW_H = 0.34;

export interface MapPptxOptions {
  readonly title: string;
  /** 表紙の 2 行目 (分野名・何枚目のファイルか)。 */
  readonly subtitle: string;
  /** 指標の通し番号の開始 (ファイルをまたいで 1 から続ける)。 */
  readonly firstNumber?: number;
}

function addMapFooter(slide: PptxGenJS.Slide, ds: Dataset): void {
  slide.addText(`出典：${ds.source.surveyName}（${ds.year}）／ ${PREFECTURE_BOUNDARY_SHORT}／ ${SITE.domain}`, {
    x: 0.5, y: 7.0, w: 12.3, h: 0.35, fontSize: 9, color: hex(BRAND.subtext), fontFace: JP_FONT, fit: "shrink",
  });
}

/** 指標ごとの地図スライドを 1 枚足す。 */
export function addIndicatorMapSlide(
  pptx: PptxGenJS,
  ds: Dataset,
  mapPoints: ReturnType<typeof buildMapPoints>,
  numberLabel: string,
): void {
  const spec = classifyChoropleth(ds, { classes: MAP_CLASSES, paletteId: MAP_PALETTE });
  const colorByCode = new Map(spec.bins.map((b) => [b.code5, b.color]));
  const slide = pptx.addSlide();
  addTitle(slide, `${numberLabel} ${ds.indicator}`, `単位：${ds.unit}／${ds.year}年／${MAP_CLASSES} 区分（分位）で塗り分け・都道府県ごとに色を変更できます`);
  for (const [code5, points] of mapPoints) {
    slide.addShape(CUSTGEOM, {
      x: MAP.x, y: MAP.y, w: MAP.w, h: MAP.h,
      points,
      fill: { color: hex(colorByCode.get(code5) ?? BRAND.mapNoData) },
      line: { color: hex(BRAND.mapBorder), width: 0.5 },
      objectName: PREFECTURE_BY_CODE5.get(code5)?.name ?? code5,
    });
  }
  const entries = legendEntries(spec);
  slide.addText("凡例", { x: LEGEND.x, y: LEGEND.y, w: LEGEND.w, h: 0.3, fontSize: 12, bold: true, color: hex(BRAND.text), fontFace: JP_FONT });
  entries.forEach((e, i) => {
    const y = LEGEND.y + 0.4 + i * LEGEND_ROW_H;
    slide.addShape("rect", { x: LEGEND.x, y, w: 0.3, h: 0.24, fill: { color: hex(e.color) }, line: { color: hex(BRAND.mapBorder), width: 0.5 }, objectName: `凡例 ${i + 1}` });
    slide.addText(e.label, { x: LEGEND.x + 0.4, y: y - 0.03, w: LEGEND.w - 0.4, h: 0.3, fontSize: 11, color: hex(BRAND.text), fontFace: JP_FONT, fit: "shrink" });
  });
  slide.addText("各区分は下限以上・上限未満です", {
    x: LEGEND.x, y: LEGEND.y + 0.5 + entries.length * LEGEND_ROW_H, w: LEGEND.w, h: 0.3, fontSize: 9, color: hex(BRAND.subtext), fontFace: JP_FONT,
  });
  const missing = ds.values.filter((v) => v.value === null).length;
  if (missing > 0) {
    slide.addText(`値の無い ${missing} 県は灰色です（0 ではありません）`, {
      x: LEGEND.x, y: LEGEND.y + 0.8 + entries.length * LEGEND_ROW_H, w: LEGEND.w, h: 0.5, fontSize: 9, color: hex(BRAND.subtext), fontFace: JP_FONT,
    });
  }
  addMapFooter(slide, ds);
}

/** 塗り分け地図の PowerPoint を outPath に書き出す。 */
export async function buildMapPptx(
  datasets: readonly Dataset[],
  geo: PrefectureGeometry,
  outPath: string,
  opts: MapPptxOptions,
): Promise<void> {
  if (datasets.length === 0) throw new Error("buildMapPptx: datasets が空です");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "stats47";
  pptx.company = "stats47";
  pptx.title = opts.title;

  const mapPoints = buildMapPoints(geo);

  const cover = pptx.addSlide();
  cover.background = { color: "0b1f3a" };
  cover.addText(opts.title, { x: 0.8, y: 2.4, w: 11.7, h: 1.4, fontSize: 30, bold: true, color: "ffffff", fontFace: JP_FONT, fit: "shrink" });
  cover.addText(opts.subtitle, { x: 0.8, y: 3.5, w: 11.7, h: 0.6, fontSize: 16, color: "cbd5e1", fontFace: JP_FONT });
  cover.addText(`${SITE.domain} ／ 収録 ${datasets.length} 指標・1 指標 1 スライド`, { x: 0.8, y: 6.6, w: 11.7, h: 0.4, fontSize: 12, color: "94a3b8", fontFace: JP_FONT });

  addTextSlide(pptx, "使い方：地図の色を変える", [
    "各スライドの地図は、都道府県ごとに独立した図形です。クリックして選択できます（選択ウィンドウには県名が出ます）。",
    "図形を選び「図形の塗りつぶし」から任意の色に変更できます。複数県をまとめて選んで変えることもできます。",
    "凡例の色は、値の区分（分位 5 区分）に対応しています。色を変えたときは凡例も合わせて直してください。",
    "値の無い県は灰色です。欠測・秘匿・非該当を 0 として塗ってはいません。",
    "出典・基準年・単位は各スライドの下部と、同梱の SOURCES.csv に書いています。",
    `地図の境界: ${PREFECTURE_BOUNDARY_NOTICE}。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。`,
  ]);

  const first = opts.firstNumber ?? 1;
  datasets.forEach((ds, i) => addIndicatorMapSlide(pptx, ds, mapPoints, String(first + i).padStart(3, "0")));

  // 地図の頂点は XML で大きい (1 スライドあたり約 160KB)。pptxgenjs 4.0.1 の writeFile は compression を渡しても
  // Node では無視して無圧縮 (STORE) で書くので、compression が効く stream() で取り出して書く。
  const data = (await pptx.stream({ compression: true })) as Buffer;
  writeFileSync(outPath, data);
}
