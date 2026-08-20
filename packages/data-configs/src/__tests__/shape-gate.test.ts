import { describe, expect, it } from "vitest";

import {
  PREFECTURE_COUNT,
  classifyShape,
  findExpectedShapeAnomaly,
  hasShapeError,
  summarizeShape,
  type ClassifyShapeInput,
  type ExpectedShapeAnomalyEntry,
  type ShapeRow,
} from "../shape-gate";

/** allowlist の期限内 / 期限後 */
const NOW_IN = new Date("2026-08-01T00:00:00Z");
const NOW_OUT = new Date("2026-12-01T00:00:00Z");

/**
 * 47 県 × 指定年の健全な行を作る。
 *
 * **値は県ごとに変える**。全県が同じ値なら順位が存在しないので constant-value 違反であり、
 * 「健全」ではない (2026-08-04 に検査を追加した時点でこの fixture の前提が変わった)。
 * `maxValue` を渡すと 1 県だけがその値を取り、残りは 1 小さい値になる
 * (valueMax は maxValue のまま・distinct は 2 なので percent 系の検査だけを単離できる)。
 */
function healthyRows(years: string[] = ["2023"], maxValue?: number): ShapeRow[] {
  const rows: ShapeRow[] = [];
  for (const yearCode of years) {
    for (let i = 1; i <= PREFECTURE_COUNT; i++) {
      const value = maxValue === undefined ? 10 + i : i === 1 ? maxValue : maxValue - 1;
      rows.push({ areaCode: `${String(i).padStart(2, "0")}000`, yearCode, value });
    }
  }
  return rows;
}

const base = (over: Partial<ClassifyShapeInput> = {}): ClassifyShapeInput => ({
  key: "some-metric",
  entity: "prefecture",
  summary: summarizeShape(healthyRows()),
  unit: "人",
  now: NOW_IN,
  allowlist: [],
  ...over,
});

describe("summarizeShape", () => {
  it("健全な 47 県 1 年を重複なしと判定する", () => {
    const s = summarizeShape(healthyRows());
    expect(s.rowCount).toBe(47);
    expect(s.duplicatePairCount).toBe(0);
    expect(s.maxMultiplicity).toBe(1);
    expect(s.perYearAreaCount).toEqual({ "2023": 47 });
    expect(s.yearCount).toBe(1);
  });

  it("同一 (県, 年) の重複を数える", () => {
    // swimming 型: 各県が 3 系列ぶん重複している
    const rows = [...healthyRows(), ...healthyRows(), ...healthyRows()];
    const s = summarizeShape(rows);
    expect(s.rowCount).toBe(141);
    expect(s.duplicatePairCount).toBe(47);
    expect(s.maxMultiplicity).toBe(3);
    // distinct な県数は 47 のまま = areaCount だけ見ても気づけない
    expect(s.perYearAreaCount["2023"]).toBe(47);
  });

  it("null 値を値域集計から除外する", () => {
    const s = summarizeShape([
      { areaCode: "01000", yearCode: "2023", value: null },
      { areaCode: "02000", yearCode: "2023", value: 5 },
    ]);
    expect(s.valueMax).toBe(5);
    expect(s.valueMin).toBe(5);
  });

  it("行が空でも壊れない", () => {
    const s = summarizeShape([]);
    expect(s.rowCount).toBe(0);
    expect(s.maxMultiplicity).toBe(0);
    expect(s.valueMax).toBeNull();
  });
});

describe("classifyShape — 健全なデータ", () => {
  it("違反を出さない", () => {
    expect(classifyShape(base())).toEqual([]);
  });

  it("複数年でも 47 県揃っていれば違反を出さない", () => {
    const summary = summarizeShape(healthyRows(["2021", "2022", "2023"]));
    expect(classifyShape(base({ summary }))).toEqual([]);
  });
});

describe("classifyShape — 重複行 (分類軸の絞り忘れ)", () => {
  it("error にする", () => {
    const summary = summarizeShape([...healthyRows(), ...healthyRows()]);
    const v = classifyShape(base({ summary }));
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe("duplicate-area-year");
    expect(v[0].isError).toBe(true);
    expect(hasShapeError(v)).toBe(true);
  });

  it("severity に最大重複数を入れる", () => {
    const summary = summarizeShape([...healthyRows(), ...healthyRows(), ...healthyRows()]);
    expect(classifyShape(base({ summary }))[0].severity).toBe(3);
  });

  it("市区町村でも同じく error にする (一意性に例外はない)", () => {
    const rows: ShapeRow[] = [
      { areaCode: "01100", yearCode: "2023", value: 1 },
      { areaCode: "01100", yearCode: "2023", value: 2 },
    ];
    const v = classifyShape(base({ entity: "city", summary: summarizeShape(rows) }));
    expect(v[0].isError).toBe(true);
  });
});

describe("classifyShape — 打ち切り", () => {
  it("TOTAL_NUMBER > TO_NUMBER を error にする", () => {
    const v = classifyShape(base({ raw: { totalNumber: 11_965_824, toNumber: 100_000 } }));
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe("raw-truncated");
    expect(v[0].isError).toBe(true);
  });

  it("全件取得できていれば違反にしない", () => {
    expect(classifyShape(base({ raw: { totalNumber: 47, toNumber: 47 } }))).toEqual([]);
  });

  it("raw が無ければ (監査経路) 判定しない", () => {
    expect(classifyShape(base({ raw: undefined }))).toEqual([]);
  });
});

describe("classifyShape — 単位と値の矛盾", () => {
  it("% で 896,500 は error (vacant-housing-rate の実例)", () => {
    const summary = summarizeShape(healthyRows(["2023"], 896_500));
    const v = classifyShape(base({ unit: "％", summary }));
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe("percent-out-of-range");
    expect(v[0].isError).toBe(true);
    expect(v[0].severity).toBe(896_500);
  });

  it("% で 120 は warn に留める (対前年比などで正当)", () => {
    const summary = summarizeShape(healthyRows(["2023"], 120));
    const v = classifyShape(base({ unit: "%", summary }));
    expect(v).toHaveLength(1);
    expect(v[0].isError).toBe(false);
  });

  it("% で 100 以下なら違反を出さない", () => {
    const summary = summarizeShape(healthyRows(["2023"], 99.9));
    expect(classifyShape(base({ unit: "%", summary }))).toEqual([]);
  });

  it("単位が % でなければ値がいくら大きくても見ない", () => {
    const summary = summarizeShape(healthyRows(["2023"], 896_500));
    expect(classifyShape(base({ unit: "人", summary }))).toEqual([]);
  });
});

describe("classifyShape — 県のカバレッジ", () => {
  /** 内陸 8 県が無い港湾統計を模す */
  const portRows = (years: string[]) => {
    const rows: ShapeRow[] = [];
    const landlocked = new Set(["09000", "10000", "11000", "19000", "20000", "21000", "25000", "29000"]);
    for (const yearCode of years) {
      for (let i = 1; i <= PREFECTURE_COUNT; i++) {
        const areaCode = `${String(i).padStart(2, "0")}000`;
        if (landlocked.has(areaCode)) continue;
        // 値は県ごとに変える (全県同値だと constant-value が同時に出て coverage を単離できない)
        rows.push({ areaCode, yearCode, value: i });
      }
    }
    return rows;
  };

  it("★港湾統計 (内陸 8 県が無い) を error にしない — 誤検知を出すゲートは無効化される", () => {
    const summary = summarizeShape(portRows(["2022", "2023"]));
    const v = classifyShape(base({ summary }));
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe("area-coverage");
    expect(v[0].isError).toBe(false); // warn 止まり。allowlist すら要らない
    expect(v[0].severity).toBe(8);
  });

  it("以前 47 県あった年が減ったら error に昇格する (縮小専用ラチェット)", () => {
    const summary = summarizeShape(portRows(["2023"]));
    const v = classifyShape(
      base({ summary, priorSummary: { perYearAreaCount: { "2023": 47 } } }),
    );
    expect(v[0].isError).toBe(true);
    expect(v[0].message).toContain("2023:47→39");
  });

  it("以前も同じ県数なら warn のまま", () => {
    const summary = summarizeShape(portRows(["2023"]));
    const v = classifyShape(
      base({ summary, priorSummary: { perYearAreaCount: { "2023": 39 } } }),
    );
    expect(v[0].isError).toBe(false);
  });

  it("★47 未満どうしでも減っていれば error (39 → 34)", () => {
    // port-cargo-total は元から 39 県 (内陸 8 県が無い)。分類軸を pin した結果 34 県に
    // 減ったが、「以前 47 だった年だけ」を条件にするとこの 5 県の欠落を見逃す。
    const rows: ShapeRow[] = [];
    for (let i = 1; i <= 34; i++) {
      rows.push({ areaCode: `${String(i).padStart(2, "0")}000`, yearCode: "2023", value: i });
    }
    const v = classifyShape(
      base({ summary: summarizeShape(rows), priorSummary: { perYearAreaCount: { "2023": 39 } } }),
    );
    expect(v[0].isError).toBe(true);
    expect(v[0].message).toContain("39→34");
  });

  it("前のデータにその年が無ければ減少と判定しない", () => {
    const summary = summarizeShape(portRows(["2024"]));
    const v = classifyShape(
      base({ summary, priorSummary: { perYearAreaCount: { "2023": 39 } } }),
    );
    expect(v[0].isError).toBe(false);
  });

  it("市区町村では県カバレッジを判定しない", () => {
    const rows: ShapeRow[] = [{ areaCode: "01100", yearCode: "2023", value: 1 }];
    expect(classifyShape(base({ entity: "city", summary: summarizeShape(rows) }))).toEqual([]);
  });

  it("特定年だけの部分欠損を検出する (nursery-education-diffusion-rate の実例)", () => {
    // 他の年は 47 県、2014 年だけ 2 県
    const rows = [
      ...healthyRows(["2013", "2015"]),
      { areaCode: "01000", yearCode: "2014", value: 1 },
      { areaCode: "02000", yearCode: "2014", value: 2 },
    ];
    const v = classifyShape(base({ summary: summarizeShape(rows) }));
    expect(v[0].check).toBe("area-coverage");
    expect(v[0].severity).toBe(45);
    expect(v[0].message).toContain("2014:2");
  });
});

describe("allowlist", () => {
  const entry: ExpectedShapeAnomalyEntry = {
    key: "some-metric",
    check: "duplicate-area-year",
    disposition: "known-broken",
    observedSeverity: 3,
    reason: "cdCat03 (スポーツの種類 24 件) 未指定。是正 wave 2 で対応",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-10-31",
  };

  const dupSummary = (multiplicity: number) =>
    summarizeShape(Array.from({ length: multiplicity }, () => healthyRows()).flat());

  it("期限内なら error を warn に降格する", () => {
    const v = classifyShape(base({ summary: dupSummary(3), allowlist: [entry] }));
    expect(v[0].isError).toBe(false);
    expect(v[0].allowedBy).toBe(entry);
    expect(v[0].message).toContain("RANKING-VALUES-PARTITION-INTEGRITY-01");
  });

  it("期限切れなら降格しない", () => {
    const v = classifyShape(
      base({ summary: dupSummary(3), allowlist: [entry], now: NOW_OUT }),
    );
    expect(v[0].isError).toBe(true);
  });

  it("★観測値より悪化していたら降格しない (allowlist が新たな劣化を隠さない)", () => {
    const v = classifyShape(base({ summary: dupSummary(5), allowlist: [entry] }));
    expect(v[0].isError).toBe(true);
    expect(v[0].message).toContain("悪化");
  });

  it("観測値以下なら降格する", () => {
    const v = classifyShape(base({ summary: dupSummary(2), allowlist: [entry] }));
    expect(v[0].isError).toBe(false);
  });

  it("検査の種類が違えば適用しない", () => {
    const percentEntry = { ...entry, check: "percent-out-of-range" as const };
    const v = classifyShape(base({ summary: dupSummary(3), allowlist: [percentEntry] }));
    expect(v[0].isError).toBe(true);
  });

  it("entity が違えば適用しない", () => {
    const prefOnly = { ...entry, entities: ["prefecture"] as const };
    const rows: ShapeRow[] = [
      { areaCode: "01100", yearCode: "2023", value: 1 },
      { areaCode: "01100", yearCode: "2023", value: 2 },
    ];
    const v = classifyShape(
      base({ entity: "city", summary: summarizeShape(rows), allowlist: [prefOnly] }),
    );
    expect(v[0].isError).toBe(true);
  });

  it("--allow-shape は allowlist に無くても降格する (緊急時の逃げ道)", () => {
    const v = classifyShape(
      base({ summary: dupSummary(3), cliAllowed: new Set(["some-metric"]) }),
    );
    expect(v[0].isError).toBe(false);
    expect(v[0].message).toContain("--allow-shape");
  });
});

describe("findExpectedShapeAnomaly", () => {
  const entries: ExpectedShapeAnomalyEntry[] = [
    {
      key: "a",
      check: "duplicate-area-year",
      disposition: "known-broken",
      observedSeverity: 2,
      reason: "テスト用のエントリ",
      issue: "TEST-01",
      until: "2026-10-31",
    },
  ];

  it("期限内は見つかる", () => {
    expect(findExpectedShapeAnomaly(entries, "a", "duplicate-area-year", "prefecture", NOW_IN))
      .not.toBeNull();
  });

  it("期限切れは null", () => {
    expect(findExpectedShapeAnomaly(entries, "a", "duplicate-area-year", "prefecture", NOW_OUT))
      .toBeNull();
  });

  it("不正な日付は null (壊れたエントリを許可に使わない)", () => {
    const broken = [{ ...entries[0], until: "not-a-date" }];
    expect(findExpectedShapeAnomaly(broken, "a", "duplicate-area-year", "prefecture", NOW_IN))
      .toBeNull();
  });
});

describe("複数違反の同時検出", () => {
  it("重複と単位矛盾を両方出す", () => {
    const summary = summarizeShape([
      ...healthyRows(["2023"], 896_500),
      ...healthyRows(["2023"], 896_500),
    ]);
    const v = classifyShape(base({ unit: "％", summary }));
    expect(v.map((x) => x.check).sort()).toEqual(["duplicate-area-year", "percent-out-of-range"]);
    expect(hasShapeError(v)).toBe(true);
  });
});

/* ========================================================================== */
/* 値の分布検査 (2026-08-04 追加)                                             */
/* ========================================================================== */

/** 全県が同じ値の 1 年ぶん */
const constantYear = (yearCode: string, value: number): ShapeRow[] =>
  Array.from({ length: PREFECTURE_COUNT }, (_, i) => ({
    areaCode: `${String(i + 1).padStart(2, "0")}000`,
    yearCode,
    value,
  }));

/** 指定した件数だけ 0、残りは相異なる正の値 */
const zeroHeavyYear = (yearCode: string, zeros: number): ShapeRow[] =>
  Array.from({ length: PREFECTURE_COUNT }, (_, i) => ({
    areaCode: `${String(i + 1).padStart(2, "0")}000`,
    yearCode,
    value: i < zeros ? 0 : i,
  }));

describe("summarizeShape — 年ごとの値の分布", () => {
  it("年ごとに distinct / zeroCount / negativeCount を数える", () => {
    const s = summarizeShape([
      ...constantYear("2020", 0),
      ...zeroHeavyYear("2021", 3),
      { areaCode: "01000", yearCode: "2022", value: -5 },
      { areaCode: "02000", yearCode: "2022", value: 7 },
    ]);
    expect(s.perYearValueStats["2020"]).toMatchObject({ finite: 47, distinct: 1, zeroCount: 47 });
    expect(s.perYearValueStats["2021"]).toMatchObject({ zeroCount: 3 });
    expect(s.perYearValueStats["2022"]).toMatchObject({ negativeCount: 1, finite: 2 });
    expect(s.latestYearCode).toBe("2022");
  });

  it("null / NaN / Infinity は finite に数えない", () => {
    const s = summarizeShape([
      { areaCode: "01000", yearCode: "2023", value: null },
      { areaCode: "02000", yearCode: "2023", value: Number.NaN },
      { areaCode: "03000", yearCode: "2023", value: Number.POSITIVE_INFINITY },
      { areaCode: "04000", yearCode: "2023", value: 5 },
    ]);
    expect(s.perYearValueStats["2023"]).toMatchObject({ finite: 1, distinct: 1 });
  });

  it("latestYearCode は文字列順でなく数値の最大", () => {
    const s = summarizeShape([
      ...healthyRows(["999"]),
      ...healthyRows(["1000"]),
    ]);
    expect(s.latestYearCode).toBe("1000"); // 文字列順なら "999" が最大になってしまう
  });
});

describe("classifyShape — 全県が同じ値 (constant-value)", () => {
  it("健全なデータでは出ない (陰性対照)", () => {
    expect(classifyShape(base())).toEqual([]);
  });

  it("★最新年だけ全県同値なら error — bowling-alley-public の実形", () => {
    // 通算では distinct=2 (2018 年に値 1 の県がある) なので、グローバル min/max 比較では
    // すり抜ける。年ごとに数えて初めて「最新年 2021 の 47 県が全部 0」を捕まえられる。
    const rows = [
      ...constantYear("2018", 0).map((r, i) => (i === 0 ? { ...r, value: 1 } : r)),
      ...constantYear("2021", 0),
    ];
    const summary = summarizeShape(rows);
    expect(summary.valueMin).toBe(0);
    expect(summary.valueMax).toBe(1); // 通算の distinct は 2 = 通算判定では気づけない

    const v = classifyShape(base({ summary }));
    expect(v.map((x) => x.check)).toEqual(["constant-value"]);
    expect(v[0].isError).toBe(true);
    expect(v[0].message).toContain("2021");
    expect(v[0].message).toContain("順位が成立しない");
  });

  it("過去年だけ同値なら warn (既に配信済みで書き込みを止めても直らない)", () => {
    const summary = summarizeShape([...constantYear("2019", 0), ...healthyRows(["2023"])]);
    const v = classifyShape(base({ summary }));
    expect(v.map((x) => x.check)).toEqual(["constant-value"]);
    expect(v[0].isError).toBe(false);
    expect(v[0].message).toContain("過去年のみ");
  });

  it("値 0 決め打ちにしない (非ゼロの全県同値でも出る)", () => {
    const v = classifyShape(base({ summary: summarizeShape(constantYear("2023", 3.5)) }));
    expect(v[0].check).toBe("constant-value");
    expect(v[0].isError).toBe(true);
    expect(v[0].message).toContain("3.5");
  });

  it("1 県しか値が無い年は判定しない (比べる相手がいない)", () => {
    const rows: ShapeRow[] = [{ areaCode: "01100", yearCode: "2023", value: 1 }];
    const v = classifyShape(base({ entity: "city", summary: summarizeShape(rows) }));
    expect(v.map((x) => x.check)).not.toContain("constant-value");
  });

  it("allowlist で降格できる / severity が悪化したら降格しない", () => {
    const summary = summarizeShape(constantYear("2023", 0));
    const allow: ExpectedShapeAnomalyEntry[] = [
      {
        key: "some-metric",
        check: "constant-value",
        disposition: "known-broken",
        observedSeverity: 1,
        reason: "実態が 0 で isActive 見直し対象",
        issue: ".claude/todo/backlog.md",
        until: "2026-10-31", // NOW_OUT (2026-12-01) より前 = 期限切れを試せる
      },
    ];
    const v = classifyShape(base({ summary, allowlist: allow }));
    expect(v[0].isError).toBe(false);
    expect(v[0].allowedBy).toBeDefined();

    // 期限切れなら降格しない
    const expired = classifyShape(base({ summary, allowlist: allow, now: NOW_OUT }));
    expect(expired[0].isError).toBe(true);
  });
});

describe("classifyShape — ほぼ全県がゼロ (zero-heavy)", () => {
  it("42/47 (89%) は出さない — 原発・地熱など正当なデータを巻き込まない", () => {
    const v = classifyShape(base({ summary: summarizeShape(zeroHeavyYear("2023", 42)) }));
    expect(v.map((x) => x.check)).toEqual([]);
  });

  it("43/47 (91%) で warn", () => {
    const v = classifyShape(base({ summary: summarizeShape(zeroHeavyYear("2023", 43)) }));
    expect(v.map((x) => x.check)).toEqual(["zero-heavy"]);
    expect(v[0].isError).toBe(false);
    expect(v[0].severity).toBe(43);
  });

  it("全県 0 のときは constant-value だけを出す (二重発火しない)", () => {
    const v = classifyShape(base({ summary: summarizeShape(constantYear("2023", 0)) }));
    expect(v.map((x) => x.check)).toEqual(["constant-value"]);
  });

  it("最新年だけを見る (過去年がゼロ過多でも出さない)", () => {
    const summary = summarizeShape([...zeroHeavyYear("2019", 46), ...healthyRows(["2023"])]);
    const v = classifyShape(base({ summary }));
    expect(v.map((x) => x.check)).toEqual([]);
  });
});

describe("classifyShape — 個数なのに負値 (negative-count)", () => {
  const withNegative = (yearCode: string) =>
    healthyRows([yearCode]).map((r, i) => (i === 0 ? { ...r, value: -3 } : r));

  it("unit が「店」なら warn — convenience-store-count-commercial の実例", () => {
    const v = classifyShape(
      base({ unit: "店", summary: summarizeShape(withNegative("2023")) }),
    );
    expect(v.map((x) => x.check)).toEqual(["negative-count"]);
    expect(v[0].isError).toBe(false);
    expect(v[0].severity).toBe(1);
  });

  it("★unit が ％ / 人 なら出さない — 増減率・転入超過の負は正当 (陰性対照)", () => {
    for (const unit of ["％", "%", "人", "‰", "℃", "円"]) {
      const v = classifyShape(base({ unit, summary: summarizeShape(withNegative("2023")) }));
      expect(v.map((x) => x.check), `unit=${unit}`).not.toContain("negative-count");
    }
  });

  it("負値が無ければ出さない", () => {
    const v = classifyShape(base({ unit: "店", summary: summarizeShape(healthyRows()) }));
    expect(v.map((x) => x.check)).toEqual([]);
  });
});
