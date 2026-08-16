/**
 * 章コンポーザの検出力テスト。
 *
 * ★固定したいのは 2 つの逆方向:
 *   ① 実データと整合する文は**採用する** (誤検知を出すゲートは運用で無効化される)
 *   ② 実データの範囲外・漢数字は**採用しない** (捏造を書籍に載せない)
 *   ②が無いと「全フィールド採用」を返すだけの無検査コンポーザに化ける。
 *
 * 判定は `.claude/scripts/ai-content/lib/number-audit.mjs` を import して
 * ai-content 側とまったく同じ規則を使う。ここで独自の閾値を作らない。
 */
import { describe, it, expect } from "vitest";
import {
  composeChapterBody,
  extractRegionBlock,
  isAnalyticalFaq,
  judgeField,
  type FieldGateInput,
} from "../ai-content-composer";

/** 米消費量 2024 の実データ形 (40.2〜87.54 kg)。 */
const GATE: FieldGateInput = {
  unit: "kg",
  yearCode: "2024",
  values: [
    { areaName: "福島県", areaCode: "07000", value: 87.54, rank: 1 },
    { areaName: "新潟県", areaCode: "15000", value: 80.1, rank: 2 },
    { areaName: "東京都", areaCode: "13000", value: 55.3, rank: 30 },
    { areaName: "山口県", areaCode: "35000", value: 40.2, rank: 47 },
  ],
};

describe("judgeField — ★実データの範囲外は採用しない", () => {
  const bad = [
    { name: "桁違い", text: "福島県の米消費量は999999kgでした。" },
    { name: "小数点欠落 (87.54 → 8754)", text: "福島県の米消費量は8754kgです。" },
    { name: "上限超過", text: "全国トップは120000kgに達します。" },
  ];
  for (const c of bad) {
    it(`★${c.name}`, () => {
      const v = judgeField(c.text, GATE);
      expect(v.ok).toBe(false);
      expect(v.reason).toMatch(/範囲外/);
    });
  }

  it("★漢数字は変換して採用する (捨てると使える解説を失う)", () => {
    // 書籍は算用数字に統一する規約だが、変換できるものを落とす理由はない。
    // 実測: 製造品出荷額の regionalAnalysis が漢数字 6 件で丸ごと捨てられていた。
    const v = judgeField("一位は福島県で八十七円でした。", GATE);
    expect(v.ok).toBe(true);
    expect(v.text).toBe("1位は福島県で87円でした。");
    expect(v.text).not.toMatch(/[一二三四五六七八九十百千]位/);
  });

  it("★変換後の数値で照合する (漢数字のまま素通りさせない)", () => {
    // 変換器は 円 / 位 / 倍 / ％ を扱う (書籍が算用数字に統一したい単位)。
    // 「九十九万円」→ 990,000 は実データ (2,179〜5,204) の範囲外なので弾かれる。
    const yen: FieldGateInput = {
      unit: "円",
      yearCode: "2024",
      values: [
        { areaName: "東京都", areaCode: "13000", value: 5204, rank: 1 },
        { areaName: "沖縄県", areaCode: "47000", value: 2179, rank: 47 },
      ],
    };
    const bad = judgeField("東京都は九十九万円でした。", yen);
    expect(bad.ok).toBe(false);
    expect(bad.reason).toMatch(/範囲外/);

    // 整合する漢数字は変換して採用する。
    const good = judgeField("東京都は五千二百四円です。", yen);
    expect(good.ok).toBe(true);
    expect(good.text).toBe("東京都は5,204円です。");
  });
});

describe("judgeField — 整合する文は採用する", () => {
  for (const text of [
    "福島県の米消費量は87.54kgです。",
    "山口県は40.2kgとなっています。",
    "東京都は55.3kgで中位に位置します。",
  ]) {
    it(text.slice(0, 20), () => {
      expect(judgeField(text, GATE).ok).toBe(true);
    });
  }

  it("空文字は採用しないが、理由は empty (欠落であって欠陥ではない)", () => {
    const v = judgeField("", GATE);
    expect(v.ok).toBe(false);
    expect(v.reason).toBe("empty");
  });

  it("観測値が無いときは fail-open (ai-content 側の監査と同じ扱い)", () => {
    expect(judgeField("何らかの数値 12345 を含む文。", { values: [] }).ok).toBe(true);
  });
});

describe("extractRegionBlock — S3 の地方ブロック抽出", () => {
  const md = "## 北海道・東北\n青森県は消費量が多い傾向。\n\n## 関東\n東京都は中位に集中。";

  it("★節の中で言及されている県名で選ぶ (見出し語に頼らない)", () => {
    // ai-content の見出しは固定の地方区分ではなく内容ベースの自由文なので、
    // 見出し照合だと「北海道・東北」が「北海道・北東北」に一致せず取りこぼす。
    expect(extractRegionBlock(md, ["青森県"])).toBe("青森県は消費量が多い傾向。");
    expect(extractRegionBlock(md, ["東京都"])).toBe("東京都は中位に集中。");
  });

  it("★内容ベースの見出しでも県名で拾える (実際の ai-content の形)", () => {
    const real =
      "## 上位帯：九州と沖縄に集中する高温地域\n沖縄県が突出しています。\n\n## 下位帯：冷涼地の北海道・北東北\n北海道は最下位です。";
    expect(extractRegionBlock(real, ["沖縄県"])).toBe("沖縄県が突出しています。");
    expect(extractRegionBlock(real, ["北海道"])).toBe("北海道は最下位です。");
  });

  it("県/府/都/道 を落とした表記でも照合する", () => {
    expect(extractRegionBlock("## 傾向\n青森は寒冷です。", ["青森県"])).toBe("青森は寒冷です。");
  });

  it("見つからなければ undefined (でっち上げない)", () => {
    expect(extractRegionBlock(md, ["沖縄県"])).toBeUndefined();
    expect(extractRegionBlock(undefined, ["東京都"])).toBeUndefined();
    expect(extractRegionBlock(md, [])).toBeUndefined();
  });
});

describe("isAnalyticalFaq — 1位/最下位の重複を落とす", () => {
  it("順位を尋ねるだけの問いは落とす (章冒頭の定型文と重複)", () => {
    expect(isAnalyticalFaq({ question: "2024年度の米消費量で第1位の都道府県はどこですか？", answer: "" })).toBe(false);
    expect(isAnalyticalFaq({ question: "最も少ない都道府県はどこですか？", answer: "" })).toBe(false);
  });

  it("分析系の問いは残す", () => {
    expect(isAnalyticalFaq({ question: "なぜ東日本で消費量が多いのですか？", answer: "" })).toBe(true);
  });
});

describe("composeChapterBody", () => {
  const ai = {
    rankingKey: "x",
    yearCode: "2024",
    insights: "## 格差\n1位と最下位で2倍以上の開きがあります。",
    regionalAnalysis: "## 北海道・東北\n福島県は上位です。\n\n## 関東\n東京都は中位。",
    faq: [
      { question: "第1位の都道府県はどこですか？", answer: "福島県です。" },
      { question: "なぜ差が生まれるのですか？", answer: "食習慣の違いが背景にあります。" },
    ],
    prefectureCommentary: [
      { areaCode: "07000", areaName: "福島県", rank: 1, commentary: "全国1位の水準です。" },
      { areaCode: "13000", areaName: "東京都", rank: 30, commentary: "中位に位置します。" },
    ],
  };

  it("S2 (全国) は insights + regionalAnalysis 全文 + 分析FAQ を採る", () => {
    const r = composeChapterBody({ ai, gate: GATE });
    expect(r.used).toContain("insights");
    expect(r.used).toContain("regionalAnalysis");
    expect(r.used).toContain("faq");
    expect(r.md).not.toContain("第1位の都道府県はどこですか"); // 重複FAQは落ちる
    expect(r.md).toContain("なぜ差が生まれるのですか");
  });

  it("★S3 (地域) は該当ブロックと地域の県だけを採る — 全冊同一本文の再発防止", () => {
    const r = composeChapterBody({
      ai,
      gate: GATE,
      regionCodes: ["07000"],
      regionNames: ["福島県"],
      regionBlockLabel: "北海道・東北",
    });
    expect(r.used).toContain("regionalAnalysis(block)");
    expect(r.used).toContain("prefectureCommentary(region)");
    expect(r.md).toContain("福島県は上位です");
    expect(r.md).not.toContain("東京都は中位"); // 他ブロックは混ざらない
    expect(r.md).toContain("福島県");
    expect(r.md).not.toContain("東京都"); // 地域外の県は出さない
  });

  it("★不採用のフィールドは理由が残る (黙って捨てない)", () => {
    const r = composeChapterBody({
      ai: { ...ai, insights: "1位は福島県で999999kgでした。" },
      gate: GATE,
    });
    expect(r.used).not.toContain("insights");
    expect(r.dropped.some((d) => d.field === "insights" && /範囲外/.test(d.reason))).toBe(true);
    // ★キーごと捨てず、残りのフィールドは採用する
    expect(r.used).toContain("regionalAnalysis");
  });

  it("ai-content が無ければ空を返す (定型文だけで章を組む)", () => {
    const r = composeChapterBody({ ai: null, gate: GATE });
    expect(r.md).toBe("");
  });
});

describe("judgeField — ★スケール接頭辞が単位の一部かは SSOT の unit で決める", () => {
  // 実測 (2026-08-12): 「労働費は45,596,934千円」の千を ×1000 と読むと 455 億になり、
  // **値が完全に一致しているのに不合格**になっていた。同じ誤りは地図照合でも起きており、
  // 結論は「SSOT の unit がその短縮単位で始まるかで判定する」(unit-semantics-standards.md §4)。
  const values = [
    { areaName: "東京都", areaCode: "13000", value: 45596934, rank: 1 },
    { areaName: "和歌山県", areaCode: "30000", value: 1083021, rank: 46 },
  ];

  it("単位が千円なら、千は単位の一部として扱い通す", () => {
    expect(judgeField("労働費は東京都が45,596,934千円で1位です。", { values, units: ["千円"] }).ok).toBe(true);
    expect(judgeField("和歌山県は1,083,021千円で46位でした。", { values, units: ["千円"] }).ok).toBe(true);
  });

  it("★接頭辞を外しても範囲外なら弾く (桁違いの捏造は通さない)", () => {
    const v = judgeField("東京都は999,999,999千円でした。", { values, units: ["千円"] });
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/範囲外/);
  });

  it("★単位に千円が無ければ従来どおり弾く (無条件の緩和にしない)", () => {
    const v = judgeField("東京都は45,596,934千円でした。", { values, units: ["人"] });
    expect(v.ok).toBe(false);
  });

  it("単位を渡さなければ従来どおり厳しく弾く (緩和は unit を根拠にしたときだけ)", () => {
    // 緩和の根拠は SSOT の unit なので、それが無ければ緩和しない。
    // 呼び出し側 (composer は metric の unit、verify-fresh は書籍の単位集合) が必ず渡すため、
    // 実運用でこの経路には入らない。「単位を調べずに緩める」を構造的に不可能にするための挙動。
    expect(judgeField("東京都は45,596,934千円でした。", { values }).ok).toBe(false);
  });
});
