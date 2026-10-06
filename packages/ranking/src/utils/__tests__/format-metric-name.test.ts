import { describe, expect, it } from "vitest";

import { metricDisplayName, metricNameQualifier, metricShortName } from "../format-metric-name";

describe("metricDisplayName", () => {
  it("分母・内訳の subtitle を名前に付ける (落とすと人口当たりの値が総数に見える)", () => {
    expect(metricDisplayName({ title: "図書館数", subtitle: "人口100万人当たり" })).toBe("図書館数（人口100万人当たり）");
    expect(metricDisplayName({ title: "在留外国人数（中国）", readerLabel: "在留外国人数（中国）", subtitle: "総数" })).toBe("在留外国人数（中国）（総数）");
  });

  it("readerLabel があればそれを名前にし、subtitle は付けたまま", () => {
    expect(metricDisplayName({ title: "公衆電話設置台数", readerLabel: "公衆電話の数", subtitle: "総数" })).toBe("公衆電話の数（総数）");
  });

  it("注釈・名前の言い換え・家計調査の定型文は付けない", () => {
    expect(metricNameQualifier({ title: "漁獲量", subtitle: "※ 内陸8県は調査対象外 (value=0)" })).toBeNull();
    expect(metricNameQualifier({ title: "納豆消費支出額", subtitle: "都道府県庁所在市の二人以上世帯の年間納豆消費支出額" })).toBeNull();
    expect(metricNameQualifier({ title: "情報通信関係費", subtitle: "都道府県庁所在市の二人以上世帯の年間支出額（固定電話通信料ほか）" })).toBeNull();
    expect(metricDisplayName({ title: "死産数", subtitle: "死産数" })).toBe("死産数");
  });

  it("名前だけを返す関数は subtitle を見ない", () => {
    expect(metricShortName({ title: "図書館数", readerLabel: null, subtitle: "人口100万人当たり" })).toBe("図書館数");
  });
});
