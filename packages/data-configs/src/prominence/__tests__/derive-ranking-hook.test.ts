import { describe, expect, it } from "vitest";

import {
  adjectiveFromTitle,
  adjectiveFromUnit,
  deriveRankingReaderLabel,
  deriveRankingHook,
} from "../derive-ranking-hook";
import {
  normalizeTitleForDedup,
  normalizeTitleForHook,
} from "../normalize-title";
import { RANKING_HOOK_OVERRIDES } from "../ranking-hook-overrides";
import {
  auditDerivedHooks,
  resolveRankingHook,
  resolveRankingReaderLabel,
} from "../resolve-ranking-hook";

describe("normalizeTitleForHook", () => {
  it("「県は？」と重複する冗長サフィックスを落とす", () => {
    expect(normalizeTitleForHook("30日以内交通事故死者数（都道府県別）")).toBe(
      "30日以内交通事故死者数",
    );
    expect(normalizeTitleForHook("農業産出額（全国）")).toBe("農業産出額");
  });

  it("半角・全角の空白を詰める", () => {
    expect(normalizeTitleForHook("救急搬送 病院収容所要時間")).toBe(
      "救急搬送病院収容所要時間",
    );
    expect(normalizeTitleForHook("平均　身長")).toBe("平均身長");
  });

  it("意味を持つ括弧は残す（dedup 用の正規化とは違う）", () => {
    expect(normalizeTitleForHook("平均初婚年齢（夫）")).toBe("平均初婚年齢（夫）");
    // dedup 用は逆に落とす
    expect(normalizeTitleForDedup("平均初婚年齢（夫）")).toBe("平均初婚年齢");
  });
});

describe("adjectiveFromTitle", () => {
  it("率・指数の類は unit に関係なく「高い」", () => {
    // 素朴に unit だけで決めると ‰ / 人口千対 が「多い」に落ちる回帰の再発防止
    expect(adjectiveFromTitle("人工妊娠中絶実施率")).toBe("高い");
    expect(adjectiveFromTitle("年齢別死亡率")).toBe("高い");
    expect(adjectiveFromTitle("有効求人倍率")).toBe("高い");
    expect(adjectiveFromTitle("老年化指数")).toBe("高い");
  });

  it("末尾の括弧に邪魔されずに末尾語を見る", () => {
    expect(adjectiveFromTitle("平均初婚年齢（夫）")).toBe("高い");
  });

  it("量・件数・金額は「多い」", () => {
    expect(adjectiveFromTitle("総人口")).toBe("多い");
    expect(adjectiveFromTitle("農業産出額")).toBe("多い");
    expect(adjectiveFromTitle("年間快晴日数")).toBe("多い");
    expect(adjectiveFromTitle("宿泊料消費支出額")).toBe("多い");
  });

  it("時間・面積は専用の述語", () => {
    expect(adjectiveFromTitle("年間日照時間")).toBe("長い");
    expect(adjectiveFromTitle("救急搬送 病院収容所要時間")).toBe("長い");
    expect(adjectiveFromTitle("耕地放棄面積")).toBe("広い");
  });

  it("「時間数」が末尾の「数」に食われない", () => {
    // 実データ回帰: 月間平均実労働時間数 が「最も多い」になっていた
    expect(adjectiveFromTitle("月間平均実労働時間数")).toBe("長い");
    // 「日数」は件数なので「多い」のままが正しい
    expect(adjectiveFromTitle("年間雪日数")).toBe("多い");
  });

  it("長い接尾辞を短いものより先に判定する", () => {
    // 「倍率」が「率」に、「日数」が「数」に食われないこと
    expect(adjectiveFromTitle("人口密度")).toBe("高い");
    expect(adjectiveFromTitle("1人当たり県民所得")).toBe("高い");
  });

  it("該当する末尾語が無ければ null", () => {
    expect(adjectiveFromTitle("製造品出荷額等")).toBeNull();
  });
});

describe("adjectiveFromUnit", () => {
  it("title で決まらないときのフォールバックとして働く", () => {
    expect(adjectiveFromUnit("万円")).toBe("多い");
    expect(adjectiveFromUnit("％")).toBe("高い");
    expect(adjectiveFromUnit("時間")).toBe("長い");
    expect(adjectiveFromUnit("ｈａ")).toBe("広い");
  });

  it("面積 unit が「長い」に食われない", () => {
    expect(adjectiveFromUnit("m2")).toBe("広い");
    expect(adjectiveFromUnit("km²")).toBe("広い");
  });

  it("空 unit は null", () => {
    expect(adjectiveFromUnit("")).toBeNull();
    expect(adjectiveFromUnit("  ")).toBeNull();
  });
});

describe("deriveRankingHook", () => {
  it("title と述語から問いかけを組み立てる", () => {
    expect(deriveRankingHook({ title: "年間日照時間", unit: "時間" })).toBe(
      "年間日照時間が最も長い県は？",
    );
    expect(deriveRankingHook({ title: "空き家率", unit: "％" })).toBe(
      "空き家率が最も高い県は？",
    );
  });

  it("title で決まらないときは unit を使う", () => {
    expect(deriveRankingHook({ title: "製造品出荷額等", unit: "万円" })).toBe(
      "製造品出荷額等が最も多い県は？",
    );
  });

  it("どちらでも決まらなければ「多い」に落とす", () => {
    expect(deriveRankingHook({ title: "なんらかの指標", unit: "個" })).toBe(
      "なんらかの指標が最も多い県は？",
    );
  });

  it("行動者率は調査用語を残さず、人を主語にした問いへ変換する", () => {
    expect(
      deriveRankingHook({ title: "日曜大工の行動者率", unit: "％" }),
    ).toBe("日曜大工をした人が多い県は？");
    expect(
      deriveRankingHook({ title: "海外旅行の年間行動者率", unit: "％" }),
    ).toBe("海外旅行をした人が多い県は？");
    expect(
      deriveRankingHook({ title: "マンガを読む行動者率", unit: "％" }),
    ).toBe("マンガを読んだ人が多い県は？");
    expect(
      deriveRankingHook({
        title:
          "スマートフォン・パソコン使用者の趣味・娯楽行動者率（10歳以上・週全体・総数）",
        unit: "％",
      }),
    ).toBe("スマホ等利用者で趣味をした人が多い県は？");
  });
});

describe("deriveRankingReaderLabel", () => {
  it("行動者率を意味を保った平易なラベルへ変換する", () => {
    expect(deriveRankingReaderLabel("日曜大工の行動者率")).toBe(
      "日曜大工をした人の割合",
    );
    expect(deriveRankingReaderLabel("海外旅行の年間行動者率")).toBe(
      "海外旅行をした人の割合",
    );
    expect(deriveRankingReaderLabel("マンガを読む行動者率")).toBe(
      "マンガを読んだ人の割合",
    );
    expect(
      deriveRankingReaderLabel(
        "スマートフォン・パソコン使用者の趣味・娯楽行動者率（10歳以上・週全体・総数）",
      ),
    ).toBe("スマホ等利用者のうち趣味・娯楽をした人の割合");
  });

  it("平易化規則の対象外は正準名を維持する", () => {
    expect(deriveRankingReaderLabel("空き家率")).toBe("空き家率");
  });
});

describe("resolveRankingHook", () => {
  it("override があればそれを返す", () => {
    expect(
      resolveRankingHook({
        rankingKey: "total-population",
        title: "総人口",
        unit: "人",
      }),
    ).toBe("人口が最も多い県は？");
  });

  it("override が無ければ導出する", () => {
    expect(
      resolveRankingHook({
        rankingKey: "vacant-housing-rate",
        title: "空き家率",
        unit: "％",
      }),
    ).toBe("空き家率が最も高い県は？");
  });

  it("導出では作れない編集コピーが override に残っている", () => {
    // 将来推計の「増える」は規則では表現できない。override を消すと情報が失われる
    expect(RANKING_HOOK_OVERRIDES["future-population-change-rate-2050"]).toBe(
      "2050年、人口が増える県は？",
    );
    expect(RANKING_HOOK_OVERRIDES["annual-clear-days"]).toBe(
      "快晴日数1位は沖縄？",
    );
  });

  it("旧 HOME_FEATURED_RANKINGS の 8 本すべてを引き継いでいる", () => {
    const legacyKeys = [
      "annual-sunshine-duration",
      "total-population",
      "future-population-change-rate-2050",
      "agricultural-output",
      "fiscal-strength-index-prefecture",
      "annual-clear-days",
      "retirement-allowance-admin-prefecture",
      "consumption-expenditure-multi-person-households-per-month",
    ];
    for (const key of legacyKeys) {
      expect(RANKING_HOOK_OVERRIDES[key]).toBeTruthy();
    }
    for (const hook of Object.values(RANKING_HOOK_OVERRIDES)) {
      const length = [...hook].length;
      expect(length).toBeGreaterThanOrEqual(8);
      expect(length).toBeLessThanOrEqual(28);
      expect(hook).not.toContain("\n");
    }
  });
});

describe("resolveRankingReaderLabel", () => {
  it("編集例外を共通導出より優先する", () => {
    expect(
      resolveRankingReaderLabel({
        rankingKey: "fiscal-strength-index-prefecture",
        title: "財政力指数",
      }),
    ).toBe("自治体の財政力");
  });

  it("例外が無ければ行動者率の共通規則を使う", () => {
    expect(
      resolveRankingReaderLabel({
        rankingKey: "hobby-participation-rate-diy",
        title: "日曜大工の行動者率",
      }),
    ).toBe("日曜大工をした人の割合");
  });
});

describe("auditDerivedHooks", () => {
  it("素直に導出できるものは報告しない", () => {
    expect(
      auditDerivedHooks([
        { rankingKey: "vacant-housing-rate", title: "空き家率", unit: "％" },
        { rankingKey: "total-fertility-rate", title: "合計特殊出生率", unit: "－" },
      ]),
    ).toEqual([]);
  });

  it("override 済みは人が書いた確定コピーなので対象外", () => {
    // title が長くても override があれば報告しない
    expect(
      auditDerivedHooks([
        {
          rankingKey: "consumption-expenditure-multi-person-households-per-month",
          title: "二人以上の世帯における1世帯当たり1か月間の消費支出額",
          unit: "円",
        },
      ]),
    ).toEqual([]);
  });

  it("長すぎる hook を length で報告する", () => {
    const [finding] = auditDerivedHooks([
      {
        rankingKey: "very-long",
        title: "二人以上の世帯における1世帯当たり1か月間の消費支出額",
        unit: "円",
      },
    ]);
    expect(finding.reasons).toContain("length");
  });

  it("括弧の外の記号を symbol で報告する", () => {
    const [finding] = auditDerivedHooks([
      { rankingKey: "slashy", title: "面積/人口", unit: "人" },
    ]);
    expect(finding.reasons).toContain("symbol");
  });

  it("括弧の中の記号は注釈なので報告しない", () => {
    // 実データ: 男女間賃金格差（女性/男性）。スラッシュは注釈内で読みを損なわない
    expect(
      auditDerivedHooks([
        { rankingKey: "wage-gap", title: "男女間賃金格差（女性/男性）", unit: "%" },
      ]),
    ).toEqual([]);
  });

  it("次元をまたぐ述語の食い違いを報告し、両方の判定を添える", () => {
    // title は「率 → 高い (magnitude)」、unit は「km → 長い (extent)」
    const [finding] = auditDerivedHooks([
      { rankingKey: "conflict", title: "道路実延長率", unit: "km" },
    ]);
    expect(finding.reasons).toContain("adjective-conflict");
    expect(finding.titleAdjective).toBe("高い");
    expect(finding.unitAdjective).toBe("長い");
    // 食い違っても title 優先で導出は成立している
    expect(finding.hook).toBe("道路実延長率が最も高い県は？");
  });

  it("同じ次元での「高い ↔ 多い」の揺れは報告しない", () => {
    // 実データ回帰: 「〜の平均年収」(title=高い / unit=万円=多い) が 60 件まとめて
    // 誤検知されていた。どちらの言い方も正しいので矛盾ではない
    expect(
      auditDerivedHooks([
        { rankingKey: "income", title: "バス運転者の平均年収", unit: "万円" },
        { rankingKey: "income2", title: "1人当たり県民所得", unit: "千円" },
      ]),
    ).toEqual([]);
  });

  it("平易化できず調査用語が残った問いを jargon で報告する", () => {
    const [finding] = auditDerivedHooks([
      {
        rankingKey: "unmatched-participation-rate",
        title: "行動者率（再掲）",
        unit: "％",
      },
    ]);
    expect(finding.reasons).toContain("jargon");
  });
});

describe("実データの代表例（規則の回帰防止）", () => {
  // 実際の metric config から各述語・各修正済みバグを 1 件ずつ拾ったもの。
  // 規則をいじったときにここが壊れたら、2,000 件超の導出が広く影響を受けている。
  const CASES: ReadonlyArray<readonly [string, string, string]> = [
    ["年間日照時間", "時間", "年間日照時間が最も長い県は？"],
    ["耕地放棄面積", "ｈａ", "耕地放棄面積が最も広い県は？"],
    ["離婚率", "‰", "離婚率が最も高い県は？"],
    ["有効求人倍率", "倍", "有効求人倍率が最も高い県は？"],
    ["老年化指数", "指数", "老年化指数が最も高い県は？"],
    ["年齢別死亡率", "人口千対", "年齢別死亡率が最も高い県は？"],
    ["人工妊娠中絶実施率", "‰", "人工妊娠中絶実施率が最も高い県は？"],
    ["一般病院常勤医師数", "人", "一般病院常勤医師数が最も多い県は？"],
    ["宿泊料消費支出額", "円", "宿泊料消費支出額が最も多い県は？"],
    ["製造品出荷額等", "万円", "製造品出荷額等が最も多い県は？"],
    ["月間平均実労働時間数", "時間", "月間平均実労働時間数が最も長い県は？"],
    ["救急搬送 病院収容所要時間", "分", "救急搬送病院収容所要時間が最も長い県は？"],
    [
      "30日以内交通事故死者数（都道府県別）",
      "人",
      "30日以内交通事故死者数が最も多い県は？",
    ],
  ];

  it.each(CASES)("%s → %s", (title, unit, expected) => {
    expect(deriveRankingHook({ title, unit })).toBe(expected);
  });
});
