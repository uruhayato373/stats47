/**
 * 金額単位族のスケール整合判定 (純関数)。
 *
 * ## なぜ要るか
 *
 * e-Stat は**倍率を単位文字列に埋め込む** (賃金構造基本統計の tab 08/12 は `@unit=千円`、
 * 労働者数は `@unit=十人`)。取り込みは値をそのまま書き、`unit` は config の文字列を貼るだけなので、
 * config が「万円」と書いていても値は千円のまま配信される。2026-08-05 に職業別平均年収 39 件が
 * この状態で 10 倍過大表示になっていた (東京の調理従事者が 4,153.9「万円」)。
 *
 * shape-gate は「config.unit は表示都合の値で e-Stat の @unit と一致しない正当な例が多いため
 * メタとの突合はしない (誤検知の温床)」という設計をとっている。これは**任意単位についての一般論**
 * としては正しい。しかし金額だけを閉じた族として見れば、族内の関係は 10^k の 1 対 1 対応で
 * 決定的に決まる。よって「両方が金額族に解釈できるときに限り」突合する、と限定して上書きする。
 *
 * ## 判定に載せないもの (誤検知を出すゲートは運用で無効化されるため)
 *
 * - どちらかが族外・空・未提供 → スキップ。「人」「％」「時間」等は倍率の有無が文字列から確定できない
 * - `十人` `百人` のような**金額以外の倍率つき単位** → 今回は対象外。族の全数が不明なまま
 *   広げると誤検知が出る (同型のバグは起こりうるので、必要になったら族を足す)
 */

/** 金額単位 → 10 の指数。円 = 0 を基準にする */
const MONEY_UNIT_EXPONENT: Readonly<Record<string, number>> = {
  円: 0,
  千円: 3,
  万円: 4,
  十万円: 5,
  百万円: 6,
  千万円: 7,
  億円: 8,
  兆円: 12,
};

/** 金額族として解釈できる unit なら 10 の指数を返す。族外・空なら null */
export function moneyUnitExponent(unit: string | null | undefined): number | null {
  if (typeof unit !== "string") return null;
  const trimmed = unit.trim();
  if (trimmed === "") return null;
  return MONEY_UNIT_EXPONENT[trimmed] ?? null;
}

export type MoneyUnitVerdict =
  /** どちらかが金額族外・未提供。判定しない */
  | { kind: "skip"; reason: "source-not-money" | "config-not-money" | "no-source-unit" }
  /** 期待スケールと宣言スケールが一致 */
  | { kind: "ok"; expectedScale: number }
  /** 不一致。`expectedScale` を宣言すれば直る */
  | {
      kind: "mismatch";
      sourceUnit: string;
      configUnit: string;
      declaredScale: number;
      expectedScale: number;
    };

/**
 * e-Stat の原単位 (`@unit`) と config の unit、宣言済み変換倍率の整合を見る。
 *
 * `declaredScale` は recipe の実効 scale (`valueScale ?? 1`)。tabCombination の factor は
 * **単位を変えない** (千円を 12 倍しても千円) ので数えない。
 */
export function checkMoneyUnitScale(params: {
  sourceUnit: string | null | undefined;
  configUnit: string | null | undefined;
  declaredScale: number;
}): MoneyUnitVerdict {
  const { sourceUnit, configUnit, declaredScale } = params;

  if (sourceUnit == null || String(sourceUnit).trim() === "") {
    return { kind: "skip", reason: "no-source-unit" };
  }
  const srcExp = moneyUnitExponent(sourceUnit);
  if (srcExp === null) return { kind: "skip", reason: "source-not-money" };
  const cfgExp = moneyUnitExponent(configUnit);
  if (cfgExp === null) return { kind: "skip", reason: "config-not-money" };

  // 原単位 10^src の値を 10^cfg 単位で表すには 10^(src-cfg) 倍する
  const expectedScale = 10 ** (srcExp - cfgExp);

  // 浮動小数の比較。10^-k は 2 進で厳密に表せないので相対誤差で見る
  const ok =
    Math.abs(declaredScale - expectedScale) <=
    Math.max(Math.abs(expectedScale), 1) * 1e-9;

  return ok
    ? { kind: "ok", expectedScale }
    : {
        kind: "mismatch",
        sourceUnit: String(sourceUnit).trim(),
        configUnit: String(configUnit).trim(),
        declaredScale,
        expectedScale,
      };
}

/**
 * 線形結合する tab がすべて同じ単位かを見る。
 *
 * 千円と十人は足せない。単位が混ざる結合は、係数が正しくても意味のない数になる。
 * 単位が取れない tab は判定から外す (取れたものだけで矛盾を見る)。
 */
export function checkCombinationUnitsAgree(
  units: ReadonlyArray<string | null | undefined>,
): { kind: "ok" | "skip" } | { kind: "mismatch"; units: string[] } {
  const known = units
    .filter((u): u is string => typeof u === "string" && u.trim() !== "")
    .map((u) => u.trim());
  if (known.length < 2) return { kind: "skip" };
  const distinct = [...new Set(known)];
  return distinct.length === 1 ? { kind: "ok" } : { kind: "mismatch", units: distinct };
}
