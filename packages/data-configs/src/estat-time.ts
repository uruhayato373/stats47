import { surveyYearFromDate } from "./area-axis";

/**
 * time 軸を持たない e-Stat 表の年を補う (2026-07-31 新設)。
 *
 * ## なぜ要るか
 *
 * 単年調査の表 (漁業センサス 2003 等) は `CLASS_OBJ` が tab/cat01/area だけで **time 軸を持たない**。
 * このとき応答の各値に `@time` が付かず、`v["@time"].slice(0, 4)` が
 * `TypeError: Cannot read properties of undefined (reading 'slice')` で落ちる。
 * 原因が読み取れない失敗メッセージのまま、実測で 8 metric が毎回失敗していた。
 *
 * ## 年の出典は config ではなく表のメタ
 *
 * 年は `TABLE_INF.SURVEY_DATE` から採る (areaAxis 経路と同じ規則)。**config.years は使わない**。
 * config は「どの年を採用したいか」の希望であって出典ではないため、年の根拠にすると
 * 出典と違う年でデータを配信してしまう。実際この 8 件は config が 2018 なのに
 * 表は 2003 年調査で、config を根拠にすると 2003 年のデータが 2018 年として出る。
 *
 * 取り出せなければ**推測せず throw** する (年が違えば別の統計になる)。
 */
export function fillMissingTimeFromSurveyDate<T extends { "@time"?: string }>(
  values: T[],
  surveyDate: unknown,
  statsDataId: string,
): T[] {
  if (!values.some((v) => v["@time"] === undefined)) return values;

  const surveyYear = surveyYearFromDate(surveyDate);
  if (!surveyYear) {
    throw new Error(
      `time 軸が無く TABLE_INF.SURVEY_DATE からも年を決められません (statsDataId=${statsDataId})`,
    );
  }

  for (const v of values) {
    if (v["@time"] === undefined) v["@time"] = `${surveyYear}000000`;
  }
  return values;
}
