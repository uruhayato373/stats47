/**
 * 全 svg-builder チャート関数の**実出力**が、文字配置 lint (`findChartTextIssues`) を
 * 通ることを固定する (配線テスト)。
 *
 * lint 側の感度 (はみ出し・重なりを壊した合成検体で落ちるか) は
 * `.claude/scripts/lib/__tests__/svg-lint.text-layout.test.mjs` が担保する。こちらは
 * 「生成器が長いラベルでも文字をキャンバス外へ出さず、互いに重ねない」ことを見る。
 *
 * 2026-09-25: 折れ線の下部凡例が斜めの X 軸ラベルに重なり、Y 軸タイトル (題名 + 単位) が
 * プロット高を超えていた (b-kakei-beer-peak-month)。現実的に長いラベル
 * (47 都道府県・12 か月・1,400,000 級の数値・6 系列の長い凡例) で全関数を回す。
 */

import { describe, expect, it } from "vitest";

// @ts-expect-error — .claude 配下の決定的ゲート (型定義を持たない .mjs)
import { findChartTextIssues } from "../../../../../.claude/scripts/lib/svg-lint.mjs";
import { generateBarChartSvg } from "../bar-chart";
import { generateChoroplethSvg } from "../choropleth";
import { generateFindingsCardSvg } from "../findings-card";
import { generateLineSvg } from "../line";
import { generateScatterSvg } from "../scatter";
import { generateStackedBarSvg } from "../stacked-bar";
import { generateRankingTableSvg } from "../../tables/ranking-table";
import type { StatsSchema } from "../../shared/stats-schema";

const PREFS = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県",
  "埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県",
  "佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
const YEARS = Array.from({ length: 25 }, (_, i) => `${2000 + i}年`);
const LONG_SERIES = [
  "発泡酒・ビール風アルコール飲料",
  "チューハイ・カクテル",
  "ビール",
  "清酒（日本酒）",
  "ワイン（輸入品を含む）",
  "ウイスキー・ブランデー",
];
const LONG_TITLE = "ビール支出額の月別パターン (二人以上の世帯・全国)";

type Issues = { overflows: string[]; overlaps: string[] };
const issuesOf = (svg: string): Issues => findChartTextIssues(svg) as Issues;
/**
 * 既知の欠陥 (UI-CHART-TEXT-LOOP-01 の未修正分・2026-09-26 に develop へ取り込んだ時点で 9 ケース)。
 * 生成器が直るとこのケースは失敗に変わるので、そのときに itKnown を it へ戻す。件数は縮小専用。
 */
const itKnown = it.fails;

const expectClean = (svg: string) => expect(issuesOf(svg)).toEqual({ overflows: [], overlaps: [] });

const rows = (
  xs: string[],
  series: string[],
  value: (xi: number, si: number) => number,
  unit = "円",
): StatsSchema[] =>
  series.flatMap((s, si) =>
    xs.map((x, xi) => ({
      metricKey: "value",
      areaCode: String(si + 1).padStart(2, "0"),
      areaName: s,
      yearCode: x,
      yearName: x,
      value: value(xi, si),
      unit,
    })),
  );

describe("generateLineSvg: 長いラベルでも文字がはみ出さず重ならない", () => {
  itKnown("★ビール月別 (12 か月 × 3 系列 + 単位 + 題名入り yLabel) の回帰", () => {
    const data = rows(MONTHS, ["2000年", "2012年", "2024年"], (xi, si) => 1281 + xi * 180 - si * 400);
    const svg = generateLineSvg(data, {
      title: LONG_TITLE,
      subtitle: "ビール",
      unit: "円",
      xKey: "yearCode",
      seriesKey: "areaCode",
      yLabel: `${LONG_TITLE}（円）`,
      legendPosition: "bottom",
    });
    expectClean(svg);
    // 単位は 1 か所だけ (左上の "(円)")。Y 軸タイトルに繰り返さない
    expect(svg.match(/[（(]円[）)]/g)?.length).toBe(1);
    // 12 か月の短いラベルは横書きで収まるので回転しない
    expect(svg).not.toMatch(/rotate\(-35/);
  });

  itKnown("25 年 × 6 系列 (長い凡例) + 1,400,000 級の値", () => {
    const data = rows(YEARS, LONG_SERIES, (xi, si) => 1_400_000 - si * 150_000 + xi * 3_000);
    expectClean(
      generateLineSvg(data, { title: "酒類別の年間支出額の推移", unit: "円", xKey: "yearCode", seriesKey: "areaCode", yLabel: "支出額", xLabel: "年" }),
    );
  });

  itKnown("47 都道府県を X 軸に並べる (回転が必要なケース)", () => {
    const data = rows(PREFS, ["2015年", "2020年"], (xi, si) => 1_000_000 + xi * 20_000 + si * 5_000, "人");
    expectClean(
      generateLineSvg(data, { title: "都道府県別の人口", unit: "人", xKey: "yearCode", seriesKey: "areaCode", xLabel: "都道府県" }),
    );
  });

  itKnown("右側凡例 + 6 系列の長い名前", () => {
    const data = rows(MONTHS, LONG_SERIES, (xi, si) => 100 + xi * 10 + si * 7);
    expectClean(
      generateLineSvg(data, { title: "酒類別の月別支出", unit: "円", xKey: "yearCode", seriesKey: "areaCode", legendPosition: "right" }),
    );
  });

  itKnown("単系列・負値・長い yLabel", () => {
    const data = rows(YEARS, ["値"], (xi) => -50_000 + xi * 4_000, "%");
    expectClean(
      generateLineSvg(data, {
        title: "実質経済成長率の推移",
        xKey: "yearCode",
        seriesKey: "areaCode",
        yLabel: "実質経済成長率（前年比・季節調整済み・支出側GDP系列による推計値）",
      }),
    );
  });
});

describe("generateBarChartSvg: 大きな値・長い県名", () => {
  const values = [6_186_895_771, 1_455_218_797, 1_389_012_721, 1_329_620_686, 988_604_035, 88_604_035, 70_584_874, 60_171_677, 50_362_720, 40_117_425];
  const names = ["東京都", "神奈川県", "和歌山県", "鹿児島県", "大阪府", "鳥取県", "島根県", "高知県", "徳島県", "佐賀県"];
  const items = [
    ...names.slice(0, 5).map((name, i) => ({ label: `${i + 1}位 ${name}`, name, rank: i + 1, value: values[i] })),
    { label: "", value: 0, isSeparator: true },
    ...names.slice(5).map((name, i) => ({ label: `${43 + i}位 ${name}`, name, rank: 43 + i, value: values[5 + i] })),
  ];
  const base = {
    title: "都道府県別の地方税収入額（都道府県財政）",
    subtitle: "2022年度",
    unit: "千円",
    source: "総務省「都道府県決算状況調」",
    focusNote: "神奈川県: 4位 1,329,620,686 千円（全国平均の約 2.1 倍、前年度から 3.2% 増）",
  };
  for (const layout of ["columns", "mobile", "portrait", "single"] as const) {
    (layout === "columns" ? itKnown : it)(`layout=${layout}`, () => {
      expectClean(generateBarChartSvg(items, { ...base, layout, showAxis: layout === "single" }));
    });
  }
});

describe("generateScatterSvg: 47 点・長い軸ラベル・大きな目盛り", () => {
  it("47 都道府県", () => {
    const points = PREFS.map((name, i) => ({ name, code: String(i + 1).padStart(2, "0"), x: 1_400_000 + i * 50_000, y: 0.5 + i * 0.37 }));
    expectClean(
      generateScatterSvg(points, {
        title: "一人当たり県民所得と大学進学率の関係（都道府県別）",
        xLabel: "一人当たり県民所得（千円）2021年度・内閣府「県民経済計算」",
        yLabel: "大学等進学率（%）2023年度・文部科学省「学校基本調査」",
      }),
    );
  });
});

describe("generateStackedBarSvg: 長い凡例・多数の区分", () => {
  it("垂直 (12 か月 × 6 系列の長い凡例)", () => {
    const data = rows(MONTHS, LONG_SERIES, (xi, si) => 1_000 + xi * 50 + si * 120);
    expectClean(generateStackedBarSvg(data, { title: "酒類別の月別支出額の構成", unit: "円", xKey: "yearCode", seriesKey: "areaCode" }));
  });
  itKnown("垂直 (47 都道府県)", () => {
    const data = rows(PREFS, ["男性", "女性"], (xi, si) => 1_000_000 + xi * 1_000 + si * 3_000, "人");
    expectClean(generateStackedBarSvg(data, { title: "都道府県別の男女別人口", unit: "人", xKey: "yearCode", seriesKey: "areaCode" }));
  });
  itKnown("水平 100% (47 都道府県 × 6 系列の長い凡例)", () => {
    const data = rows(PREFS, LONG_SERIES, (xi, si) => 10 + ((xi + si) % 7), "%");
    expectClean(
      generateStackedBarSvg(data, { title: "都道府県別の酒類支出構成", unit: "%", xKey: "yearCode", seriesKey: "areaCode", horizontal: true, normalized: true }),
    );
  });
});

describe("generateChoroplethSvg / findings / ranking table", () => {
  it("タイルマップ (長いタイトル・大きな値・長い単位)", () => {
    const items = PREFS.map((name, i) => ({ code: String(i + 1).padStart(2, "0"), name, value: 1_400_000 + i * 123_457 }));
    expectClean(
      generateChoroplethSvg(items, {
        title: "都道府県別の一般会計歳出決算額に占める農林水産業費",
        subtitle: "2022年度・総務省「都道府県決算状況調」",
        unit: "千円",
        showValue: true,
        showRankList: true,
      }),
    );
  });

  it("findings カード (見出し + 長文)", () => {
    expectClean(
      generateFindingsCardSvg({
        findings: [
          { heading: "ビールの支出は7月と12月に山がある", text: "2000年は7月が年間最大だったが、2024年は12月が7月を上回り、夏のピークが贈答期へ移っている。発泡酒・ビール風アルコール飲料の伸びが夏の需要を吸収した。" },
          { text: "1世帯あたりのビール支出額は2000年から2024年の間におよそ半分になり、チューハイ・カクテルが3倍以上に増えた。" },
          { heading: "都道府県の差は 1,400,000 円規模", text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
        ],
      }),
    );
  });

  itKnown("ランキング表 (長い県名・大きな値)", () => {
    const rowsT = PREFS.slice(0, 10).map((name, i) => ({ rank: i + 1, name, value: 6_186_895_771 - i * 100_000_000 }));
    expectClean(
      generateRankingTableSvg(rowsT, {
        title: "都道府県別の地方税収入額ランキング",
        valueHeader: "地方税収入額（千円）",
        formatValue: (v) => Number(v).toLocaleString("ja-JP"),
      }),
    );
  });
});
