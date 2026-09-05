import { describe, expect, it } from "vitest";

import { buildRecipe, canonicalRecipeJson, hash64, parseRecipe } from "../recipe";
import type { MetricConfig } from "../types";

function metric(source: MetricConfig["source"], overrides: Partial<MetricConfig> = {}): MetricConfig {
  return {
    key: "test-metric",
    title: "テスト指標",
    unit: "人",
    category: "population",
    source,
    entities: ["prefecture"],
    years: "all",
    ...overrides,
  };
}

describe("buildRecipe — estat", () => {
  it("軸 pin を estatParams に flat で載せる (spread して e-Stat に渡せる形)", () => {
    const r = buildRecipe(
      metric({
        kind: "estat",
        statsDataId: "0003456573",
        cdCat01: "A",
        cdCat03: "02",
        cdTab: "01",
      }),
    );
    expect(r.kind).toBe("estat");
    expect(r.estatParams).toEqual({
      statsDataId: "0003456573",
      cdCat01: "A",
      cdCat03: "02",
      cdTab: "01",
    });
    expect(r.derived).toBe(false);
    expect(r.ops).toBeUndefined();
  });

  it("空文字の軸は載せない (spread したとき e-Stat に空 param を送らない)", () => {
    const r = buildRecipe(metric({ kind: "estat", statsDataId: "0003456573", cdCat01: "" }));
    expect(r.estatParams).toEqual({ statsDataId: "0003456573" });
  });

  it("statsDataId が無ければ estatParams ごと落とす", () => {
    const r = buildRecipe(metric({ kind: "estat" } as never));
    expect(r.estatParams).toBeUndefined();
  });
});

describe("buildRecipe — 宣言演算 (derived)", () => {
  it("tabCombination があれば derived (単発クエリで再現不能)", () => {
    const r = buildRecipe(
      metric({
        kind: "estat",
        statsDataId: "0003426933",
        tabCombination: [
          { cdTab: "12", factor: 1 },
          { cdTab: "08", factor: 12 },
        ],
      }),
    );
    expect(r.derived).toBe(true);
    // 線形結合は可換なので cdTab で整列された正準形になる
    expect(r.ops?.tabCombination).toEqual([
      { cdTab: "08", factor: 12 },
      { cdTab: "12", factor: 1 },
    ]);
  });

  it("axisSum の codes は整列される (順序は意味を持たない)", () => {
    const r = buildRecipe(
      metric({
        kind: "estat",
        statsDataId: "0003130773",
        axisSum: { axis: "cat02", codes: ["20", "10"] },
      }),
    );
    expect(r.ops?.axisSum).toEqual({ axis: "cat02", codes: ["10", "20"] });
  });

  it("axisRatio / areaAxis / timeScope を載せる", () => {
    const r = buildRecipe(
      metric({
        kind: "estat",
        statsDataId: "0004021440",
        axisRatio: { axis: "cat01", numeratorCodes: ["22"], denominatorCodes: ["0"] },
        areaAxis: { axis: "cat03", scheme: "seq-pref" },
        timeScope: "annual",
      }),
    );
    expect(r.ops).toEqual({
      axisRatio: { axis: "cat01", numeratorCodes: ["22"], denominatorCodes: ["0"] },
      areaAxis: { axis: "cat03", scheme: "seq-pref" },
      timeScope: "annual",
    });
    expect(r.derived).toBe(true);
  });
});

describe("buildRecipe — kakei-chousa", () => {
  it("filter を estatParams に写し、県庁所在市の写像を ops に残す", () => {
    const r = buildRecipe(
      metric({
        kind: "kakei-chousa",
        filter: {
          // ★nested な source:{name,url} は estatParams に混ぜない
          source: { name: "家計調査", url: "https://example.invalid" },
          statsDataId: "0003348239",
          cdCat01: "100133010",
          cdCat02: "03",
        },
      }),
    );
    expect(r.estatParams).toEqual({
      statsDataId: "0003348239",
      cdCat01: "100133010",
      cdCat02: "03",
    });
    // 県庁所在市 → 都道府県の写像があるので単発クエリの生値とは違う
    expect(r.ops?.areaRemap).toBe("kakei-capital-city");
    expect(r.derived).toBe(true);
  });

  it("filter.axisSum (品目合算) を estat と同じ正準形で ops に残し、estatParams には混ぜない", () => {
    const r = buildRecipe(
      metric({
        kind: "kakei-chousa",
        filter: {
          statsDataId: "0003348239",
          axisSum: { axis: "cat01", codes: ["090441010", "070300020"] },
          cdCat02: "03",
        },
      }),
    );
    expect(r.ops?.axisSum).toEqual({ axis: "cat01", codes: ["070300020", "090441010"] });
    expect(r.estatParams).toEqual({ statsDataId: "0003348239", cdCat02: "03" });
    // 合算の有無で configHash が変わる (監査 (k) が stale を追える)
    const plain = buildRecipe(
      metric({ kind: "kakei-chousa", filter: { statsDataId: "0003348239", cdCat02: "03" } }),
    );
    expect(r.configHash).not.toBe(plain.configHash);
  });
});

describe("buildRecipe — external / mlit", () => {
  it("KSJ は再取得キーを残す", () => {
    const r = buildRecipe(
      metric({
        kind: "external",
        fetcherKey: "mlit_ksj",
        config: { ksjDataId: "C28", ksjVersion: "07", source: { name: "国土数値情報" } },
      }),
    );
    expect(r.fetcherKey).toBe("mlit_ksj");
    expect(r.refetch).toEqual({ ksjDataId: "C28", ksjVersion: "07" });
    expect(r.estatParams).toBeUndefined();
  });

  it("入れ子の config.estat から statsDataId を拾う", () => {
    const r = buildRecipe(
      metric({
        kind: "external",
        fetcherKey: "estat",
        config: { estat: { statsDataId: "0000010109", cdCat01: "I1601" } },
      }),
    );
    expect(r.refetch).toEqual({ statsDataId: "0000010109", cdCat01: "I1601" });
  });

  it("手動抽出は provenance の一次資料 URL を残す", () => {
    const r = buildRecipe(
      metric({
        kind: "external",
        fetcherKey: "manual",
        config: { provenance: { pdfUrl: "https://example.invalid/a.pdf", accessedAt: "2026-07-30" } },
      }),
    );
    expect(r.refetch?.sourceUrl).toBe("https://example.invalid/a.pdf");
  });

  it("config が空でも fetcherKey は残る (出典薄を後で追える)", () => {
    const r = buildRecipe(metric({ kind: "external", fetcherKey: "calculated", config: {} }));
    expect(r.fetcherKey).toBe("calculated");
    expect(r.refetch).toBeUndefined();
  });
});

describe("buildRecipe — 計算型 (calc op)", () => {
  const calculated = (calculation: MetricConfig["calculation"], display?: MetricConfig["display"]) =>
    metric(
      { kind: "external", fetcherKey: "calculated", config: {} },
      { calculation, ...(display ? { display } : {}) },
    );

  it("計算の宣言を ops.calc に載せ、derived になる", () => {
    const r = buildRecipe(
      calculated(
        {
          isCalculated: true,
          type: "subtraction",
          numeratorKey: "income",
          denominatorKey: "rent",
          periodAlign: { numerator: "monthly", denominator: "annual", result: "monthly" },
        },
        { decimalPlaces: 0 },
      ),
    );
    expect(r.ops?.calc).toEqual({
      type: "subtraction",
      numeratorKey: "income",
      denominatorKey: "rent",
      periodAlign: { numerator: "monthly", denominator: "annual", result: "monthly" },
      decimalPlaces: 0,
    });
    expect(r.derived).toBe(true);
  });

  it("★期間換算を変えると configHash が変わる (R2 の stale を監査が検出できる)", () => {
    const base = {
      isCalculated: true,
      type: "subtraction",
      numeratorKey: "income",
      denominatorKey: "rent",
    } as const;
    const wrong = buildRecipe(calculated({ ...base })).configHash;
    const fixed = buildRecipe(
      calculated({
        ...base,
        periodAlign: { numerator: "monthly", denominator: "annual", result: "monthly" },
      }),
    ).configHash;
    expect(fixed).not.toBe(wrong);
  });

  it("★scaleFactor と丸め桁も hash に効く (どちらも配信値を変えるため)", () => {
    const base = { isCalculated: true, type: "ratio", numeratorKey: "a", denominatorKey: "b" } as const;
    const plain = buildRecipe(calculated({ ...base })).configHash;
    expect(buildRecipe(calculated({ ...base, scaleFactor: 100 })).configHash).not.toBe(plain);
    expect(buildRecipe(calculated({ ...base }, { decimalPlaces: 1 })).configHash).not.toBe(plain);
  });

  it("計算型でない metric の calculation は calc を作らない (2000 件超の一斉 drift を避ける)", () => {
    const r = buildRecipe(
      metric(
        { kind: "estat", statsDataId: "0000010112", cdCat01: "L3130" },
        {
          calculation: {
            isCalculated: false,
            normalizationOptions: [
              { type: "per_population", label: "人口10万人あたり", unit: "円/10万人", scaleFactor: 100000, decimalPlaces: 1 },
            ],
          },
        },
      ),
    );
    expect(r.ops?.calc).toBeUndefined();
  });

  it("実行できない計算種別は焼かない (未知 type / 分子欠落)", () => {
    expect(
      buildRecipe(calculated({ isCalculated: true, type: "unknown-op", numeratorKey: "a" })).ops?.calc,
    ).toBeUndefined();
    expect(
      buildRecipe(calculated({ isCalculated: true, type: "ratio" })).ops?.calc,
    ).toBeUndefined();
  });

  it("round-trip で calc が失われない", () => {
    const r = buildRecipe(
      calculated({
        isCalculated: true,
        type: "ratio",
        numeratorKey: "a",
        denominatorKey: "b",
        scaleFactor: 100,
      }),
    );
    expect(parseRecipe(JSON.parse(JSON.stringify(r)))?.ops?.calc).toEqual(r.ops?.calc);
  });
});

describe("configHash — 決定性とドリフト検知", () => {
  const base = metric({ kind: "estat", statsDataId: "0003456573", cdCat03: "02" });

  it("同じ config なら何度作っても同じ hash", () => {
    expect(buildRecipe(base).configHash).toBe(buildRecipe(base).configHash);
  });

  it("★軸 pin が変われば hash が変わる (これが検知したい drift そのもの)", () => {
    const changed = metric({ kind: "estat", statsDataId: "0003456573", cdCat03: "03" });
    expect(buildRecipe(changed).configHash).not.toBe(buildRecipe(base).configHash);
  });

  it("★軸 pin が消えても hash が変わる (絞り忘れの復活を見逃さない)", () => {
    const unpinned = metric({ kind: "estat", statsDataId: "0003456573" });
    expect(buildRecipe(unpinned).configHash).not.toBe(buildRecipe(base).configHash);
  });

  it("years は hash に含めない (年を伸ばしただけで全件不整合にしない)", () => {
    const y1 = metric({ kind: "estat", statsDataId: "0003456573", cdCat03: "02" }, { years: { from: 2000, to: 2020 } });
    const y2 = metric({ kind: "estat", statsDataId: "0003456573", cdCat03: "02" }, { years: { from: 2000, to: 2024 } });
    expect(buildRecipe(y1).configHash).toBe(buildRecipe(y2).configHash);
  });

  it("title / unit など表示メタは hash に含めない", () => {
    const renamed = metric({ kind: "estat", statsDataId: "0003456573", cdCat03: "02" }, { title: "別名" });
    expect(buildRecipe(renamed).configHash).toBe(buildRecipe(base).configHash);
  });

  it("axisSum の codes の順序違いは同じ hash (合算は可換)", () => {
    const a = metric({ kind: "estat", statsDataId: "X", axisSum: { axis: "cat02", codes: ["10", "20"] } });
    const b = metric({ kind: "estat", statsDataId: "X", axisSum: { axis: "cat02", codes: ["20", "10"] } });
    expect(buildRecipe(a).configHash).toBe(buildRecipe(b).configHash);
  });

  it("正準 JSON はキー順に依存しない", () => {
    const j1 = canonicalRecipeJson({ kind: "estat", derived: false, estatParams: { statsDataId: "X", cdCat01: "A" } });
    const j2 = canonicalRecipeJson({ derived: false, estatParams: { cdCat01: "A", statsDataId: "X" }, kind: "estat" });
    expect(j1).toBe(j2);
  });
});

describe("hash64", () => {
  it("16 桁 hex を返す", () => {
    expect(hash64("abc")).toMatch(/^[0-9a-f]{16}$/);
  });

  it("空文字は 2 本のオフセットの連結 (前半と後半が別値になっている)", () => {
    expect(hash64("")).toBe("811c9dc59dc5811c");
  });

  it("同じ入力なら安定・違う入力なら別値 (日本語マルチバイト)", () => {
    expect(hash64("美術鑑賞")).toBe(hash64("美術鑑賞"));
    expect(hash64("美術鑑賞")).not.toBe(hash64("演劇鑑賞"));
  });

  it("★アナグラムを区別する (逆順パスがある理由)", () => {
    // 単一の FNV-1a では区別できるが、順序に鈍い hash だと衝突しうる組み合わせ
    expect(hash64("cdCat03")).not.toBe(hash64("cdCat30"));
    expect(hash64("ab")).not.toBe(hash64("ba"));
  });
});

describe("parseRecipe — round-trip", () => {
  const configs: MetricConfig[] = [
    metric({ kind: "estat", statsDataId: "A", cdCat01: "1", cdCat05: "5", cdTab: "T" }),
    metric({
      kind: "estat",
      statsDataId: "B",
      tabCombination: [
        { cdTab: "08", factor: 12 },
        { cdTab: "12", factor: 1 },
      ],
    }),
    metric({ kind: "estat", statsDataId: "C", axisSum: { axis: "cat03", codes: ["1", "2"] } }),
    metric({
      kind: "estat",
      statsDataId: "D",
      axisRatio: { axis: "cat01", numeratorCodes: ["22"], denominatorCodes: ["0"] },
    }),
    metric({ kind: "estat", statsDataId: "E", areaAxis: { axis: "cat03", scheme: "seq-pref" }, timeScope: "annual" }),
    metric({ kind: "kakei-chousa", filter: { statsDataId: "F", cdCat01: "x" } }),
    metric({ kind: "external", fetcherKey: "mlit_ksj", config: { ksjDataId: "C28", ksjVersion: "07" } }),
    metric({ kind: "mlit", resourceId: "R1" }),
  ];

  it.each(configs.map((c) => [c.source.kind, c] as const))(
    "%s: JSON を通しても同じレシピに戻る",
    (_kind, config) => {
      const built = buildRecipe(config);
      // R2 payload を経由する = JSON シリアライズを通る
      const parsed = parseRecipe(JSON.parse(JSON.stringify(built)));
      expect(parsed).toEqual(built);
      expect(parsed?.configHash).toBe(built.configHash);
    },
  );

  it("★未焼き込み (undefined) は throw せず null (旧 payload を読めなくしない)", () => {
    expect(parseRecipe(undefined)).toBeNull();
    expect(parseRecipe(null)).toBeNull();
    expect(parseRecipe({})).toBeNull();
  });

  it("configHash 欠落は null (指紋のないレシピは検証に使えない)", () => {
    expect(parseRecipe({ kind: "estat", derived: false })).toBeNull();
  });

  it("未知の kind は null", () => {
    expect(parseRecipe({ kind: "telepathy", configHash: "x" })).toBeNull();
  });

  it("不正な軸名は落として残りを通す (壊れた 1 フィールドで全体を捨てない)", () => {
    const parsed = parseRecipe({
      kind: "estat",
      configHash: "abc",
      derived: true,
      ops: { axisSum: { axis: "cat99", codes: ["1"] }, timeScope: "annual" },
    });
    expect(parsed?.ops?.axisSum).toBeUndefined();
    expect(parsed?.ops?.timeScope).toBe("annual");
  });
});

describe("実 registry での健全性", () => {
  // 2,300 超の metric を回すので既定 5s では足りない (registry の初回 import も含む)。
  // 単独実行は約 36s だが、suite 全体を並列実行すると 60s を超えて timeout した (2026-09-05 実測) ので余裕を持たせる
  const REGISTRY_TIMEOUT = 180_000;

  it(
    "全 metric でレシピが決定的に作れ、JSON を通しても失われない",
    async () => {
      const { METRICS_REGISTRY } = await import("../registry");
      const configs = Object.values(METRICS_REGISTRY);
      expect(configs.length).toBeGreaterThan(1000);

      // 2,295 件を toEqual で回すと遅いので、正準 JSON 文字列で比較して
      // 落ちた件だけを列挙する (失敗時の情報量は落とさない)
      const nondeterministic: string[] = [];
      const lossy: string[] = [];

      for (const config of configs) {
        const r = buildRecipe(config);
        if (!/^[0-9a-f]{16}$/.test(r.configHash) || buildRecipe(config).configHash !== r.configHash) {
          nondeterministic.push(config.key);
        }
        const parsed = parseRecipe(JSON.parse(JSON.stringify(r)));
        // canonicalRecipeJson はキーを整列するので、挿入順の差を無視して内容だけ比べられる
        if (!parsed || canonicalRecipeJson(parsed) !== canonicalRecipeJson(r)) {
          lossy.push(config.key);
        }
      }

      expect(nondeterministic).toEqual([]);
      expect(lossy).toEqual([]);
    },
    REGISTRY_TIMEOUT,
  );

  it(
    "e-Stat 系は statsDataId を持つ (spread しても空クエリにならない)",
    async () => {
      const { METRICS_REGISTRY } = await import("../registry");
      const missing = Object.values(METRICS_REGISTRY)
        .filter((c) => c.source.kind === "estat" || c.source.kind === "kakei-chousa")
        .filter((c) => !buildRecipe(c).estatParams)
        .map((c) => c.key);
      expect(missing).toEqual([]);
    },
    REGISTRY_TIMEOUT,
  );

  it(
    "hash 衝突が無い (異なるレシピが同じ指紋にならない)",
    async () => {
      const { METRICS_REGISTRY } = await import("../registry");
      const byHash = new Map<string, string>();
      const collisions: string[] = [];
      for (const config of Object.values(METRICS_REGISTRY)) {
        const r = buildRecipe(config);
        const { configHash: _hash, ...withoutHash } = r;
        const canonical = canonicalRecipeJson(withoutHash);
        const seen = byHash.get(r.configHash);
        // 同じレシピを共有する metric は普通にある (完全に同一のクエリ)。
        // 衝突と呼ぶのは「レシピが違うのに hash が同じ」場合だけ。
        if (seen !== undefined && seen !== canonical) collisions.push(r.configHash);
        byHash.set(r.configHash, canonical);
      }
      expect(collisions).toEqual([]);
    },
    REGISTRY_TIMEOUT,
  );
});

describe("プロトタイプ汚染キーの扱い (★任意 JSON を扱う再帰ユーティリティの防御)", () => {
  // 正確な影響範囲: `out[key] = v` で key が "__proto__" のとき、壊れるのは
  // **出力オブジェクトのプロトタイプ**であって Object.prototype ではない
  // (JSON.parse は own property を作るが、代入側は継承 setter を踏む)。
  // グローバル汚染ではないが、正準形が入力次第で別物になるので落とす。
  it("★__proto__ を含む入力でも出力のプロトタイプが差し替わらない", () => {
    const malicious = JSON.parse('{"kind":"estat","derived":false,"__proto__":{"polluted":"yes"}}');
    const json = canonicalRecipeJson(malicious);
    // 汚染キーは正準 JSON に出ない
    expect(json).not.toContain("polluted");
    expect(json).toBe('{"derived":false,"kind":"estat"}');
    // グローバルは元々影響を受けないが、念のため確認しておく
    expect(Object.prototype).not.toHaveProperty("polluted");
  });

  it("★汚染キーは正準 JSON から落ちる (防御を外すと落ちる回帰テスト)", () => {
    const json = canonicalRecipeJson(
      JSON.parse('{"kind":"estat","derived":false,"constructor":"x","prototype":"y"}'),
    );
    expect(json).not.toContain("constructor");
    expect(json).not.toContain("prototype");
    expect(json).toContain("estat");
  });

  it("入れ子の汚染キーも落ちる", () => {
    const json = canonicalRecipeJson(
      JSON.parse('{"kind":"estat","derived":false,"ops":{"timeScope":"annual","constructor":"bad"}}'),
    );
    expect(json).not.toContain("bad");
    expect(json).toContain("annual");
  });

  it("汚染キーを落としても通常キーの正準化は不変", () => {
    expect(canonicalRecipeJson({ kind: "estat", derived: false })).toBe(
      '{"derived":false,"kind":"estat"}',
    );
  });
});
