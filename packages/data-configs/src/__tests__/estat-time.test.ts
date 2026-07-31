/**
 * time 軸なし表の年補完 (2026-07-31)。
 *
 * 元の欠陥は `v["@time"].slice(0,4)` の TypeError で、失敗メッセージから原因が
 * 一切読み取れなかった。全 PASS はゲートが何も見ていない状態と区別がつかないので、
 * 補完する側・補完しない側・失敗する側の 3 方向を固定する。
 */
import { describe, expect, it } from "vitest";

import { fillMissingTimeFromSurveyDate } from "../estat-time";

describe("fillMissingTimeFromSurveyDate", () => {
  it("★@time が無い値を SURVEY_DATE の年で埋める", () => {
    // 実測: 漁業センサス 0003262285 は CLASS_OBJ が tab/cat01/area のみで time 軸を持たない
    const values: Array<{ "@area": string; $: string; "@time"?: string }> = [
      { "@area": "01000", $: "322" },
      { "@area": "02000", $: "10" },
    ];
    fillMissingTimeFromSurveyDate(values, "200301-200312", "0003262285");
    expect(values.map((v) => v["@time"])).toEqual(["2003000000", "2003000000"]);
  });

  it("既に @time を持つ値は書き換えない (通常の表を壊さない)", () => {
    const values = [{ "@time": "2020000000" }, { "@time": "2021000000" }];
    fillMissingTimeFromSurveyDate(values, "199901-199912", "x");
    expect(values.map((v) => v["@time"])).toEqual(["2020000000", "2021000000"]);
  });

  it("欠けている値だけを埋める (混在)", () => {
    const values: Array<{ "@time"?: string }> = [{ "@time": "2020000000" }, {}];
    fillMissingTimeFromSurveyDate(values, "200301-200312", "x");
    expect(values.map((v) => v["@time"])).toEqual(["2020000000", "2003000000"]);
  });

  it("★SURVEY_DATE から年を決められなければ throw (推測しない)", () => {
    for (const bad of [undefined, null, "", "不明", 12, {}]) {
      expect(() => fillMissingTimeFromSurveyDate([{}], bad, "0003262285"), String(bad)).toThrow(
        /SURVEY_DATE からも年を決められません/,
      );
    }
  });

  it("SURVEY_DATE が壊れていても、埋める必要が無ければ throw しない", () => {
    const values = [{ "@time": "2020000000" }];
    expect(() => fillMissingTimeFromSurveyDate(values, undefined, "x")).not.toThrow();
  });

  it("mutation: 年を config 由来にすると出典と違う年で配信される", () => {
    // config.years=2018 / 表は 2003 年調査。config を年の根拠にした場合の姿を固定しておく
    const fromConfig = (configYear: number) => `${configYear}000000`;
    expect(fromConfig(2018)).toBe("2018000000");
    const values: Array<{ "@time"?: string }> = [{}];
    fillMissingTimeFromSurveyDate(values, "200301-200312", "0003262285");
    expect(values[0]["@time"]).toBe("2003000000");
    expect(values[0]["@time"]).not.toBe(fromConfig(2018));
  });
});
