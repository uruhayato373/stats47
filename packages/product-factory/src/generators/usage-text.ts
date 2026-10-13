/**
 * 「グラフのデータを差し替える」の案内文。PowerPoint の使い方スライド (単一指標・データブック) と
 * 使い方マニュアル PDF が同じ文を使う。
 *
 * 記載は実装に合わせる: ランキング棒グラフが参照する埋め込み Excel の範囲は上位 10 件
 * (A2:B11 = 都道府県名・値の 10 行) だけで、47 県すべてを描くグラフではない。
 * data.csv は 47 県 × 指標を横に並べた一覧用で、貼り付けても 10 件を超える範囲は反映されない。
 * (チャートを 47 県に変える場合は pptx.ts の items と、この文、tests/delivery-integrity.test.ts を同時に変える。)
 */
export const CHART_ROW_COUNT = 10;

export const CHART_DATA_REPLACE_LINES: readonly string[] = [
  "グラフを選び「グラフのデザイン → データの編集」で埋め込み Excel を開きます。",
  `ランキングのグラフが参照するのは上位 ${CHART_ROW_COUNT} 件（A 列＝都道府県名、B 列＝値の ${CHART_ROW_COUNT} 行）です。この ${CHART_ROW_COUNT} 行を書き換えるとグラフが自動で更新されます。`,
  `47 都道府県すべての値は「一覧」スライドと data.csv にあります。data.csv は 47 県×指標の一覧用で、貼り付けてもグラフが参照する ${CHART_ROW_COUNT} 行を超える範囲は反映されません。`,
  "基準年・出典は SOURCES.csv を参照してください。",
];

/** 使い方マニュアル PDF の 1 段落版。 */
export const CHART_DATA_REPLACE_PARAGRAPH = CHART_DATA_REPLACE_LINES.join("");
