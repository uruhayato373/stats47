import { describe, expect, it } from "vitest";

import { appendDataSourceSection, rewriteWebSelfReference } from "../fetch-content";

describe("rewriteWebSelfReference", () => {
  it("Web 記事の自己言及を章の言い方に揃える (書籍版のみ)", () => {
    const body = "この記事のデータは意外に映るかもしれません。本記事で家賃を月換算する際は年額を12で割っています。";
    expect(rewriteWebSelfReference(body)).toBe(
      "この章のデータは意外に映るかもしれません。本章で家賃を月換算する際は年額を12で割っています。",
    );
  });

  it("記事という語そのものや出典表記は変えない", () => {
    const body = "新聞記事の見出し。stats47.jp/blog の記事一覧。";
    expect(rewriteWebSelfReference(body)).toBe(body);
  });
});

import { stripWebNavigation } from "../fetch-content";

describe("stripWebNavigation", () => {
  it("回遊行とテーマページ案内段落を外し、県名リンクを含む分析文は残す", () => {
    const body = [
      "**1位は[神奈川県](/areas/14000)の約1,822万円**。僅差で愛知県が続きます。",
      "あわせて見る: [緑茶消費支出額ランキング](/ranking/green-tea)・[コーヒー](/ranking/coffee)",
      "本記事の対象データ: [関連カテゴリ](/category/economy)",
      "より広い切り口で比較したい場合は[実質収入・購買力](/themes/real-income)のテーマページも参考にしてください。",
      "本文の続き。",
    ].join("\n");
    expect(stripWebNavigation(body)).toBe(
      ["**1位は[神奈川県](/areas/14000)の約1,822万円**。僅差で愛知県が続きます。", "本文の続き。"].join("\n"),
    );
  });
});

describe("rewriteWebSelfReference — 社内用語", () => {
  it("R2 を「収録データ」に置き、R2年・R2- は触らない", () => {
    expect(rewriteWebSelfReference("同じR2系列に収録。R2では年コードを年度と表示。令和R2年度。R2-storage。")).toBe(
      "同じ収録データ系列に収録。収録データでは年コードを年度と表示。令和R2年度。R2-storage。",
    );
  });
});

describe("appendDataSourceSection", () => {
  it("adds a データ出典 section from source cards only when the chapter has none", () => {
    const md = '本文\n\n<data-source url="https://x" label="総務省 社会生活基本調査" year="2021年"></data-source>\n\n## まとめ\n\n<data-source url="https://x" label="総務省 社会生活基本調査" year="2021年"></data-source>\n';
    const out = appendDataSourceSection(md);
    expect(out.endsWith("## データ出典\n\n- 総務省 社会生活基本調査（2021年）\n")).toBe(true);
    expect(out.match(/総務省 社会生活基本調査（2021年）/g)).toHaveLength(1);
  });
  it("leaves chapters that already write their sources untouched", () => {
    const md = '本文\n\n<data-source label="e-Stat"></data-source>\n\n## データ出典\n\n本章のデータは e-Stat。\n';
    expect(appendDataSourceSection(md)).toBe(md);
  });
  it("treats deeper 出典 headings (###/####) as an existing sources section", () => {
    const md = '本文\n\n<data-source label="e-Stat"></data-source>\n\n### データ出典\n\n- e-Stat\n';
    expect(appendDataSourceSection(md)).toBe(md);
  });
});
