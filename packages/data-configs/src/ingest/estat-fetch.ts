import { readSnapshot, assertLiveEstatAllowed, type SourceEvidence } from "../../scripts/lib/estat-table-reader.js";
import { fillMissingTimeFromSurveyDate } from "../estat-time.js";
import { combineLinear, ratioPercent, round1, sumMembers, toEstatValue } from "../estat-transform.js";
import type { SourceConfig } from "../types.js";
import { readAppId } from "./batch-context.js";
import { fetchEstatAreaAxis } from "./area-axis-fetch.js";
import { ESTAT_API, ESTAT_ENDPOINTS } from "../../../estat-api/src/ingest";

/** e-Stat の取得 (表の写しを先に読み、無ければ live)。CLI の使い方は scripts/page-data-batch.ts の冒頭。 */

export interface EstatValue {
  "@area": string;
  "@time": string;
  $: string;
  /** pin していない分類軸は @cat01〜@cat05 / @tab として返る (areaAxis の写像に使う) */
  [axisAttr: string]: string | undefined;
}

/** e-Stat API から data を fetch */
const ESTAT_LIMIT = 100_000;

/** e-Stat 応答のうち「取り切れたか」を判定するための情報 */
export interface EstatFetchResult {
  values: EstatValue[];
  /** RESULT_INF。総数が取得数を上回っていれば打ち切られている */
  raw: { totalNumber: number; toNumber: number };
  sources: SourceEvidence[];
}

/**
 * 複数 tab を線形結合して 1 系列にする (年収 = 月額×12 + 賞与 など)。
 *
 * tab ごとに個別取得して (area, time) で合算する。まとめて取って後で分ける方式は
 * `@tab` が返る保証を前提にするうえ limit 打ち切りの risk があるので採らない。
 * どれか 1 つでも欠測なら "-" (欠測) として返す。部分和を配信すると
 * 「賞与だけの年収」のような無意味な値になるため。
 *
 * 1 つの項目の cdTab にはカンマ区切りで複数コードを書ける (e-Stat API の仕様)。表章項目コードが
 * 年によって違う表で、同じ定義の項目を年代ごとにつなぐために使う。同じ年に 2 つ値が来たら停止する。
 */
async function fetchEstatCombination(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
  combination: ReadonlyArray<{ cdTab: string; factor: number }>,
): Promise<EstatFetchResult> {
  const parts: Array<{ factor: number; byKey: Map<string, string> }> = [];
  let totalNumber = 0;
  let toNumber = 0;
  const order: string[] = [];
  const sources: SourceEvidence[] = [];
  const meta = new Map<string, { area: string; time: string }>();

  for (const { cdTab, factor } of combination) {
    const part = await fetchEstatData(appId, { ...config, cdTab, tabCombination: undefined });
    sources.push(...part.sources);
    totalNumber += part.raw.totalNumber;
    toNumber += part.raw.toNumber;
    const byKey = new Map<string, string>();
    for (const v of part.values) {
      const key = `${v["@area"]}|${v["@time"]}`;
      // cdTab に年代違いのコードを並べる表 (賃金構造基本統計 0003445758 は 2022 年だけ 08/12、
      // 他の年は 40/44) では、同じ (area, time) に 2 つ値が来たら定義が重なっている。黙って上書きしない
      if (byKey.has(key)) {
        throw new Error(`tabCombination の cdTab "${cdTab}" が ${key} に複数の値を返した (年代違いのコードが同じ年に重なっている)`);
      }
      byKey.set(key, v.$);
      if (!meta.has(key)) {
        meta.set(key, { area: v["@area"], time: v["@time"] });
        order.push(key);
      }
    }
    parts.push({ factor, byKey });
  }

  const values: EstatValue[] = order.map((key) => {
    const { area, time } = meta.get(key)!;
    const combined = combineLinear(
      parts.map(({ factor, byKey }) => {
        const raw = byKey.get(key);
        return { value: raw === undefined ? null : parseEstatValue(raw), factor };
      }),
    );
    return { "@area": area, "@time": time, $: toEstatValue(combined) };
  });

  return { values, raw: { totalNumber, toNumber }, sources };
}

/**
 * cat 軸のメンバーを合算する (総数コードが無い / 一部の県にしか出ない軸用)。
 *
 * 欠測メンバーは 0 として扱う (その県にその区分が無いだけ)。ただし全メンバーが欠測なら
 * 合算せず欠測にする — 0 を捏造すると「貨物量 0 トンの県」を作ってしまう。
 */
const AXIS_PARAM = {
  cat01: "cdCat01",
  cat02: "cdCat02",
  cat03: "cdCat03",
  cat04: "cdCat04",
  cat05: "cdCat05",
} as const;

export type EstatAxisName = keyof typeof AXIS_PARAM;

/** 軸メンバーを個別取得して (area, time) ごとに合算した結果 */
interface AxisMemberSum {
  /** key = `area|time`。全メンバー欠測なら null (0 を捏造しない) */
  byKey: Map<string, number | null>;
  /** 出現順のキー列 (出力順の安定用) */
  order: string[];
  meta: Map<string, { area: string; time: string }>;
  raw: { totalNumber: number; toNumber: number };
  sources: SourceEvidence[];
}

/**
 * 指定軸の複数コードを個別に取得し、(area, time) をキーに合算する。
 *
 * 欠測メンバーは 0 として扱う (その県にその区分が無いだけ)。ただし全メンバーが欠測なら
 * null にする — 0 を捏造すると「貨物量 0 トンの県」を作ってしまう。
 *
 * `axisSum` と `axisRatio` (分子・分母) が共有する。まとめて取って後で分ける方式は
 * `@cat0N` が返る保証を前提にするうえ limit 打ち切りの risk があるので採らない。
 */
async function sumAxisMembers(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
  axis: EstatAxisName,
  codes: readonly string[],
): Promise<AxisMemberSum> {
  const key = AXIS_PARAM[axis];
  const parts: Array<Map<string, string>> = [];
  let totalNumber = 0;
  let toNumber = 0;
  const order: string[] = [];
  const sources: SourceEvidence[] = [];
  const meta = new Map<string, { area: string; time: string }>();

  for (const code of codes) {
    const part = await fetchEstatData(appId, {
      ...config,
      [key]: code,
      axisSum: undefined,
      axisRatio: undefined,
    });
    sources.push(...part.sources);
    totalNumber += part.raw.totalNumber;
    toNumber += part.raw.toNumber;
    const byKey = new Map<string, string>();
    for (const v of part.values) {
      const k = `${v["@area"]}|${v["@time"]}`;
      byKey.set(k, v.$);
      if (!meta.has(k)) {
        meta.set(k, { area: v["@area"], time: v["@time"] });
        order.push(k);
      }
    }
    parts.push(byKey);
  }

  const byKey = new Map<string, number | null>();
  for (const k of order) {
    byKey.set(
      k,
      sumMembers(
        parts.map((partMap) => {
          const raw = partMap.get(k);
          return raw === undefined ? null : parseEstatValue(raw);
        }),
      ),
    );
  }

  return { byKey, order, meta, raw: { totalNumber, toNumber }, sources };
}

async function fetchEstatAxisSum(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
  axisSum: NonNullable<Extract<SourceConfig, { kind: "estat" }>["axisSum"]>,
): Promise<EstatFetchResult> {
  const { byKey, order, meta, raw, sources } = await sumAxisMembers(
    appId,
    config,
    axisSum.axis,
    axisSum.codes,
  );

  const values: EstatValue[] = order.map((k) => {
    const { area, time } = meta.get(k)!;
    const sum = byKey.get(k) ?? null;
    return { "@area": area, "@time": time, $: toEstatValue(sum === null ? null : round1(sum)) };
  });

  return { values, raw, sources };
}

/**
 * 同一軸のメンバーから率を作る (分子の和 / 分母の和 × 100)。
 *
 * 「率」の表章項目を持たず実数だけを載せる表が多いのでこれが要る。
 * 分母は「総数コード」でも「部分の合計」でもよい (どちらも配列で書く)。
 *
 * 欠測の扱い:
 *   - 分母が null / 0 以下 → 欠測 `"-"` (0 除算も 0% も捏造しない)
 *   - 分子が null → 欠測 `"-"` (分子不明を 0% と言い切らない)
 *
 * 分子と分母を取り違えると 100 を大きく超えるので、
 * shape-gate の percent 検査 (unit が % のとき値域を見る) が自動で弾く。
 */
async function fetchEstatAxisRatio(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
  axisRatio: NonNullable<Extract<SourceConfig, { kind: "estat" }>["axisRatio"]>,
): Promise<EstatFetchResult> {
  const numerator = await sumAxisMembers(
    appId,
    config,
    axisRatio.axis,
    axisRatio.numeratorCodes,
  );
  const denominator = await sumAxisMembers(
    appId,
    config,
    axisRatio.axis,
    axisRatio.denominatorCodes,
  );

  // 分母がある (area, time) だけが率を持ちうる
  const values: EstatValue[] = denominator.order.map((k) => {
    const { area, time } = denominator.meta.get(k)!;
    const pct = ratioPercent(numerator.byKey.get(k) ?? null, denominator.byKey.get(k) ?? null);
    return { "@area": area, "@time": time, $: toEstatValue(pct) };
  });

  return {
    values,
    sources: [...numerator.sources, ...denominator.sources],
    raw: {
      totalNumber: numerator.raw.totalNumber + denominator.raw.totalNumber,
      toNumber: numerator.raw.toNumber + denominator.raw.toNumber,
    },
  };
}
export async function fetchEstatData(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
  forceApi = false,
): Promise<EstatFetchResult> {
  if (config.tabCombination && config.tabCombination.length > 0) {
    return fetchEstatCombination(appId, config, config.tabCombination);
  }
  if (config.axisRatio) {
    return fetchEstatAxisRatio(appId, config, config.axisRatio);
  }
  if (config.axisSum && config.axisSum.codes.length > 0) {
    return fetchEstatAxisSum(appId, config, config.axisSum);
  }
  if (config.areaAxis) {
    return fetchEstatAreaAxis(appId, config, config.areaAxis);
  }
  const snapshot = forceApi ? null : await readSnapshot(config);
  let json: Record<string, unknown>;
  const sources: SourceEvidence[] = [];
  if (snapshot) {
    json = snapshot.response;
    sources.push(snapshot.source);
  } else {
    assertLiveEstatAllowed(config.statsDataId);
    const source: SourceEvidence = { kind: "estat-api", statsDataId: config.statsDataId, catalogVersion: null, sliceKeys: [], manifestSha256: null };
    sources.push(source);
    console.log(`[estat-api] ${config.statsDataId}: ${forceApi ? "unsupported snapshot shape" : "no pushed snapshot"}`);
    const params = new URLSearchParams({
      appId: appId || readAppId(),
      statsDataId: config.statsDataId,
      limit: String(ESTAT_LIMIT),
    });
    if (config.cdCat01) params.set("cdCat01", config.cdCat01);
    if (config.cdCat02) params.set("cdCat02", config.cdCat02);
    if (config.cdCat03) params.set("cdCat03", config.cdCat03);
    // 4 軸目以降と表章項目 (tab)。絞り忘れると同じ県が複数行になり rank が通し番号化する
    if (config.cdCat04) params.set("cdCat04", config.cdCat04);
    if (config.cdCat05) params.set("cdCat05", config.cdCat05);
    if (config.cdTab) params.set("cdTab", config.cdTab);
    const url = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_DATA}?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`e-Stat HTTP ${res.status}`);
    json = (await res.json()) as Record<string, unknown>;
  }
  const getStatsData = json.GET_STATS_DATA as Record<string, unknown> | undefined;

  // ★RESULT.STATUS を見る。HTTP 200 でもアプリケーションレベルのエラー
  // (存在しない statsDataId / 不正な cdCat / API キー超過) はここにしか出ない。
  // 旧実装は STATISTICAL_DATA の有無しか見ず、原因がログに残らなかった。
  const result = getStatsData?.RESULT as Record<string, unknown> | undefined;
  const statusCode = Number(result?.STATUS ?? 0);
  // STATUS=1 は「正常に終了したが該当データなし」。座標の絞り込みが空振りしただけで
  // API エラーではないので 0 件として返し、0 件ゲート (expected-empty) に判定させる。
  // axisSum のようにメンバーごとに叩く経路では、一部メンバーが空なのは正常なこともある
  // (港湾調査の入港船舶表は cdCat01=100/cdCat02=100 では外国航路にデータが無い)。
  if (statusCode === 1) {
    return { values: [], raw: { totalNumber: 0, toNumber: 0 }, sources };
  }
  if (statusCode !== 0) {
    throw new Error(
      `e-Stat error STATUS=${statusCode} ${String(result?.ERROR_MSG ?? "")} (statsDataId=${config.statsDataId})`,
    );
  }

  const stat = getStatsData?.STATISTICAL_DATA as Record<string, unknown> | undefined;
  if (!stat) {
    throw new Error(`e-Stat response invalid for ${config.statsDataId}`);
  }
  // ★VALUE は 1 行のときオブジェクト、複数行のとき配列で返る。
  //   軸を細かく絞ると 1 行になることがあり、配列前提だと "not iterable" で落ちる
  //   (2026-07-30 に axisSum の実装で実際に発生)。
  const rawValue = (stat.DATA_INF as Record<string, unknown> | undefined)?.VALUE;
  const values: EstatValue[] = Array.isArray(rawValue)
    ? (rawValue as EstatValue[])
    : rawValue
      ? [rawValue as EstatValue]
      : [];

  // RESULT_INF: {TOTAL_NUMBER, FROM_NUMBER, TO_NUMBER, NEXT_KEY}
  // 分類軸の絞り忘れで数百万セルになる表があり、limit で静かに切られたまま配信されていた。
  const resultInf = stat.RESULT_INF as Record<string, unknown> | undefined;
  const totalNumber = Number(resultInf?.TOTAL_NUMBER ?? values.length);
  const toNumber = Number(resultInf?.TO_NUMBER ?? values.length);
  const raw = {
    totalNumber: Number.isFinite(totalNumber) ? totalNumber : values.length,
    toNumber: Number.isFinite(toNumber) ? toNumber : values.length,
  };

  // ★time 軸を持たない表は値に `@time` が付かない (2026-07-31 実測)。
  //
  // 単年調査の表 (漁業センサス等) は CLASS_OBJ が tab/cat01/area だけで time を持たない。
  // 旧実装はこれを想定しておらず `v["@time"].slice(0,4)` が **TypeError で落ちていた**
  // (「Cannot read properties of undefined (reading 'slice')」= 原因が分からない失敗メッセージ)。
  // 実測で 8 metric がこの経路で毎回失敗していた。
  //
  // 年は areaAxis 経路と**同じ規則**で `TABLE_INF.SURVEY_DATE` から採る。config.years から
  // 採らないのは、config は「どの年を採用するか」の希望であって出典ではないため
  // (実際この 8 件は config が 2018 なのに表は 2003 年調査で、config を年の根拠にすると
  //  2003 年のデータを 2018 年として配信してしまう)。取り出せなければ推測せず失敗させる。
  fillMissingTimeFromSurveyDate(
    values,
    (stat.TABLE_INF as Record<string, unknown> | undefined)?.SURVEY_DATE,
    config.statsDataId,
  );

  // timeScope: "annual" — 月次・四半期を落として年計だけを残す。
  // 商業動態統計のように 1 年あたり 年計1 + 四半期4 + 月次12 を同居させる表があり、
  // extractYearCode で 4 桁年へ正規化すると同じ年に 17 行が潰れて重複する。
  if (config.timeScope === "annual") {
    return { values: values.filter((v) => /^\d{4}0{6}$/.test(String(v["@time"] ?? ""))), raw, sources };
  }
  return { values, raw, sources };
}

/**
 * e-Stat の値文字列を数値 or null に変換。
 * 欠損・秘匿マーカー ("***" 秘匿 / "-" 該当なし / "X" 秘匿 / "…" 等) は null。
 */
export function parseEstatValue(raw: string): number | null {
  if (raw === "***" || raw === "-" || raw === "X" || raw === "…") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
