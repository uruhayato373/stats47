/**
 * page-data-batch — TS-config 駆動の e-Stat → R2 直行バッチ
 *
 * data-configs registry を walk して各 MetricConfig の source から data を fetch し、
 * R2 namespace (app/stats/<metric>/values.json 等) へ書き込む。
 *
 * Phase 6.4 の核心バッチ。Phase 6.3 で D1 → R2 一括移行が済んでいる前提で、
 * 本バッチは「以後の data 更新」(新規 metric / 年度更新) を D1 をスキップして実行する。
 *
 * 使い方:
 *   tsx packages/data-configs/scripts/page-data-batch.ts                    # 全 metric
 *   tsx packages/data-configs/scripts/page-data-batch.ts --metric <key>     # 単一
 *   tsx packages/data-configs/scripts/page-data-batch.ts --kind city        # entity 限定 (city 出力)
 *   tsx packages/data-configs/scripts/page-data-batch.ts --since 2024-01    # 更新が古いものだけ
 *   tsx packages/data-configs/scripts/page-data-batch.ts --dry-run          # fetch + 形状検証 (書かない)
 *
 * ★ローカルで dry-run するときは R2_PUBLIC_FETCH_URL を必ず設定する:
 *     R2_PUBLIC_FETCH_URL=https://storage.stats47.jp npx tsx ... --dry-run
 *   これが無いと公開済みデータを引けず、「0 件への退行」と「県数の減少」を検知できない
 *   (どちらも既存データとの比較でしか判定できないため、静かに warn へ落ちる)。
 *   CI (data-refresh.yml) では env に設定済み。
 *
 * 出力 (entities に応じて):
 *   - prefecture → app/stats/<metric>/values.json (47 県)
 *   - city       → app/stats/<metric>/cities.json (全市区町村、pref 表→city 表を自動解決)
 *
 * 制約:
 *   - 計算系 metric (source.kind === "calculated") は本バッチでは対応しない (別 skill)
 *   - mlit / external source も別 fetcher 必要
 *   - 現状サポート source: estat (prefecture + city) / kakei-chousa (prefecture、estat 経路に写像)
 *   - city は社会・人口統計体系 (00000101xx/00000102xx) のみ対応 (prefToCityStatsDataId 参照)
 */
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listAllMetrics } from "../src/registry.js";
import { buildRecipe, type MetricRecipe } from "../src/recipe.js";
import {
  resolveAreaAxis,
  surveyYearFromDate,
  type AreaAxisMember,
} from "../src/area-axis.js";
import { classifyEmptyOutcome } from "../src/expected-empty.js";
import { applyValueScale } from "../src/money-unit.js";
import { fillMissingTimeFromSurveyDate } from "../src/estat-time.js";
import {
  combineLinear,
  ratioPercent,
  round1,
  sumMembers,
  toEstatValue,
} from "../src/estat-transform.js";
// 既知破損 allowlist。★書いてよいかの判定には使わず、run を fail させるかだけに使う
import { EXPECTED_SHAPE_ANOMALY } from "../src/expected-shape-anomaly.js";
import {
  PREFECTURE_COUNT,
  classifyShape,
  findExpectedShapeAnomaly,
  hasShapeError,
  summarizeShape,
  type ShapeSummary,
} from "../src/shape-gate.js";
import type { MetricConfig, SourceConfig } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const R2_LOCAL = resolve(REPO_ROOT, ".local/r2");

interface Args {
  metric?: string;
  kind?: string;
  since?: string;
  dryRun: boolean;
  concurrency: number;
  /** 0 件を警告に降格する metric key (一回きりの検証用) */
  allowEmpty: Set<string>;
  /** 形状違反を警告に降格する metric key (一回きりの検証用) */
  allowShape: Set<string>;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = {
    dryRun: false,
    concurrency: 4,
    allowEmpty: new Set(),
    allowShape: new Set(),
  };
  const addKeys = (target: Set<string>, raw: string | undefined) => {
    for (const k of (raw ?? "").split(",").map((x) => x.trim()).filter(Boolean)) target.add(k);
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--metric") out.metric = argv[++i];
    else if (a === "--kind") out.kind = argv[++i];
    else if (a === "--since") out.since = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--concurrency") out.concurrency = Number(argv[++i]);
    else if (a === "--allow-empty") addKeys(out.allowEmpty, argv[++i]);
    else if (a === "--allow-shape") addKeys(out.allowShape, argv[++i]);
  }
  return out;
}

function readAppId(): string {
  // クラウド環境では env を直接注入 (.env.local ファイルは無い) ため process.env を優先
  if (process.env.NEXT_PUBLIC_ESTAT_APP_ID) {
    return process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  }
  const envPath = resolve(REPO_ROOT, ".env.local");
  if (existsSync(envPath)) {
    const line = readFileSync(envPath, "utf8")
      .split("\n")
      .find((l) => l.startsWith("NEXT_PUBLIC_ESTAT_APP_ID="));
    const id = line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    if (id) return id;
  }
  throw new Error("NEXT_PUBLIC_ESTAT_APP_ID not set (process.env nor .env.local)");
}

/** R2 file 最終更新時刻を取得 (since フィルタ用) */
function getR2FileMtime(key: string): number | null {
  const filePath = resolve(R2_LOCAL, key);
  if (!existsSync(filePath)) return null;
  return statSync(filePath).mtimeMs;
}

interface EstatValue {
  "@area": string;
  "@time": string;
  $: string;
  /** pin していない分類軸は @cat01〜@cat05 / @tab として返る (areaAxis の写像に使う) */
  [axisAttr: string]: string | undefined;
}

/** e-Stat API から data を fetch */
const ESTAT_LIMIT = 100_000;

/** e-Stat 応答のうち「取り切れたか」を判定するための情報 */
interface EstatFetchResult {
  values: EstatValue[];
  /** RESULT_INF。総数が取得数を上回っていれば打ち切られている */
  raw: { totalNumber: number; toNumber: number };
}

/**
 * 複数 tab を線形結合して 1 系列にする (年収 = 月額×12 + 賞与 など)。
 *
 * tab ごとに個別取得して (area, time) で合算する。まとめて取って後で分ける方式は
 * `@tab` が返る保証を前提にするうえ limit 打ち切りの risk があるので採らない。
 * どれか 1 つでも欠測なら "-" (欠測) として返す。部分和を配信すると
 * 「賞与だけの年収」のような無意味な値になるため。
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
  const meta = new Map<string, { area: string; time: string }>();

  for (const { cdTab, factor } of combination) {
    const part = await fetchEstatData(appId, { ...config, cdTab, tabCombination: undefined });
    totalNumber += part.raw.totalNumber;
    toNumber += part.raw.toNumber;
    const byKey = new Map<string, string>();
    for (const v of part.values) {
      const key = `${v["@area"]}|${v["@time"]}`;
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

  return { values, raw: { totalNumber, toNumber } };
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

type EstatAxisName = keyof typeof AXIS_PARAM;

/** 軸メンバーを個別取得して (area, time) ごとに合算した結果 */
interface AxisMemberSum {
  /** key = `area|time`。全メンバー欠測なら null (0 を捏造しない) */
  byKey: Map<string, number | null>;
  /** 出現順のキー列 (出力順の安定用) */
  order: string[];
  meta: Map<string, { area: string; time: string }>;
  raw: { totalNumber: number; toNumber: number };
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
  const meta = new Map<string, { area: string; time: string }>();

  for (const code of codes) {
    const part = await fetchEstatData(appId, {
      ...config,
      [key]: code,
      axisSum: undefined,
      axisRatio: undefined,
    });
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

  return { byKey, order, meta, raw: { totalNumber, toNumber } };
}

async function fetchEstatAxisSum(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
  axisSum: NonNullable<Extract<SourceConfig, { kind: "estat" }>["axisSum"]>,
): Promise<EstatFetchResult> {
  const { byKey, order, meta, raw } = await sumAxisMembers(
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

  return { values, raw };
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
    raw: {
      totalNumber: numerator.raw.totalNumber + denominator.raw.totalNumber,
      toNumber: numerator.raw.toNumber + denominator.raw.toNumber,
    },
  };
}

/**
 * getMetaInfo で分類軸のメンバー一覧と調査年を取る (areaAxis 用)。
 *
 * 調査年も一緒に返すのは、都道府県を cat 軸に持つ表が **time 軸を持たない**ため
 * (応答の値に `@time` が付かない)。年は `TABLE_INF.SURVEY_DATE` から採る。
 */
async function fetchAxisMembers(
  appId: string,
  statsDataId: string,
  axis: EstatAxisName,
): Promise<{ members: AreaAxisMember[]; surveyYear: string | null; hasTimeAxis: boolean }> {
  const params = new URLSearchParams({ appId, lang: "J", statsDataId });
  const res = await fetch(`https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?${params}`);
  if (!res.ok) throw new Error(`e-Stat getMetaInfo HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, any>;
  const metadata = json?.GET_META_INFO?.METADATA_INF;
  const objs = metadata?.CLASS_INF?.CLASS_OBJ;
  const list = Array.isArray(objs) ? objs : objs ? [objs] : [];
  const target = list.find((o: any) => String(o["@id"]) === axis);
  if (!target) throw new Error(`getMetaInfo に軸 ${axis} が無い (statsDataId=${statsDataId})`);
  const cls = Array.isArray(target.CLASS) ? target.CLASS : target.CLASS ? [target.CLASS] : [];
  return {
    members: cls.map((c: any) => ({ code: String(c["@code"]), name: String(c["@name"]) })),
    surveyYear: surveyYearFromDate(metadata?.TABLE_INF?.SURVEY_DATE),
    hasTimeAxis: list.some((o: any) => String(o["@id"]) === "time"),
  };
}

/**
 * SSDS の分類名から先頭のコード接頭辞を落とす。
 *
 * e-Stat の CLASS 名は `#A03503_65歳以上人口割合` の形で、**コードが名前に埋まっている**。
 * 都道府県表と市区町村表で同じ指標に別コードが振られているため、コードのまま突き合わせると
 * 一致しない。名前部分だけを比較の鍵にする。
 */
export function stripCatCodePrefix(name: string): string {
  return name.replace(/^#?[A-Za-z0-9]+_/, "").trim();
}

/**
 * 市区町村表の cdCat01 を**指標名の完全一致**で解決する (2026-07-31)。
 *
 * ## なぜ要るか
 *
 * `prefToCityStatsDataId` は「同一 cdCat01 で city 表から取れる」前提だったが、実測すると
 * SSDS は表ごとにコードを振り直している:
 *
 *   都道府県表 0000010201: #A03501 15歳未満 / #A03502 15〜64歳 / #A03503 65歳以上
 *   市区町村表 0000020301: #A03504 15歳未満 / #A03505 15〜64歳 / #A03506 65歳以上
 *
 * 同じ指標に別コードが割り当たっているため、pref のコードを city 表に渡すと 0 行になる
 * (該当データなし)。一致する指標もあるので前提が長く成立して見えていた。
 *
 * ## 安全側の設計
 *
 * - **接頭辞を落とした名前の完全一致だけ**を採る。曖昧一致はしない
 *   (「15歳未満」を「65歳以上」に取り違えたら、47 行そろって値も妥当なので
 *    形状ゲートでは捕まらない。空のままの方がはるかに安全)
 * - 候補が 1 件に定まらなければ null を返す
 * - **コードでの取得が 0 行だったときだけ**呼ぶ。今動いている metric の経路は変わらない
 */
export function resolveCat01ByName(
  prefMembers: readonly AreaAxisMember[],
  cityMembers: readonly AreaAxisMember[],
  prefCat01: string,
): string | null {
  const pref = prefMembers.find((m) => m.code === prefCat01);
  if (!pref) return null;
  const want = stripCatCodePrefix(pref.name);
  if (!want) return null;
  const hits = cityMembers.filter((m) => stripCatCodePrefix(m.name) === want);
  return hits.length === 1 ? hits[0].code : null;
}

/**
 * pref/city 両方の cat01 メンバーを取り、名前一致で city 側のコードを解決する。
 *
 * getMetaInfo が落ちたら **null を返して空のまま進む** (推測で別コードを当てない)。
 */
async function resolveCityCat01(
  appId: string,
  prefStatsDataId: string,
  cityStatsDataId: string,
  prefCat01: string,
): Promise<string | null> {
  try {
    const [prefMeta, cityMeta] = await Promise.all([
      fetchAxisMembers(appId, prefStatsDataId, "cat01"),
      fetchAxisMembers(appId, cityStatsDataId, "cat01"),
    ]);
    return resolveCat01ByName(prefMeta.members, cityMeta.members, prefCat01);
  } catch {
    return null;
  }
}

/**
 * 都道府県が area 軸ではなく cat 軸に入っている表を取り込む。
 *
 * その軸を **pin せずに**取得し、応答の `@cat0N` を都道府県コードに写して `@area` に置く。
 * 写像は必ず getMetaInfo の CLASS 名で検証し、47 県そろわなければ **fail** する
 * (黙って 40 県で配信すると、形状ゲートのカバレッジ検査に頼ることになり、
 * 「そもそも写像が間違っている」のか「その県にデータが無い」のか区別できなくなる)。
 */
async function fetchEstatAreaAxis(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
  areaAxis: NonNullable<Extract<SourceConfig, { kind: "estat" }>["areaAxis"]>,
): Promise<EstatFetchResult> {
  const { members, surveyYear, hasTimeAxis } = await fetchAxisMembers(
    appId,
    config.statsDataId,
    areaAxis.axis,
  );
  const mapping = resolveAreaAxis(members, areaAxis.scheme);

  // time 軸が無い表は値に @time が付かないので、調査年をメタから補う。
  // 推測はしない — 取り出せなければ fail する (年が違えば別の統計になってしまう)。
  if (!hasTimeAxis && !surveyYear) {
    throw new Error(
      `time 軸が無く TABLE_INF.SURVEY_DATE からも年を決められません (statsDataId=${config.statsDataId})`,
    );
  }

  if (mapping.missingPrefectures.length > 0) {
    throw new Error(
      `areaAxis (${areaAxis.axis}/${areaAxis.scheme}) が ${mapping.byCode.size} 県しか解決できません。` +
        `未解決: ${mapping.missingPrefectures.slice(0, 5).join(",")}${mapping.missingPrefectures.length > 5 ? "…" : ""}` +
        (mapping.unresolved.length > 0
          ? ` / 名前が一致しないメンバー: ${mapping.unresolved.slice(0, 3).map((m) => `${m.code}=${m.name}`).join(", ")}`
          : ""),
    );
  }

  // 対象軸は pin せずに取得する (pin すると 1 県分しか返らない)
  const fetched = await fetchEstatData(appId, { ...config, areaAxis: undefined });
  const attr = `@${areaAxis.axis}` as const;

  const values: EstatValue[] = [];
  for (const v of fetched.values) {
    const axisCode = (v as Record<string, unknown>)[attr];
    if (typeof axisCode !== "string") continue;
    const areaCode = mapping.byCode.get(axisCode);
    if (!areaCode) continue; // 全国・地域ブロック等
    values.push({
      ...v,
      "@area": areaCode,
      "@time": v["@time"] ?? `${surveyYear}000000`,
    });
  }

  return { values, raw: fetched.raw };
}

async function fetchEstatData(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
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
  const params = new URLSearchParams({
    appId,
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
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`e-Stat HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
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
    return { values: [], raw: { totalNumber: 0, toNumber: 0 } };
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
    return { values: values.filter((v) => /^\d{4}0{6}$/.test(String(v["@time"] ?? ""))), raw };
  }
  return { values, raw };
}

/**
 * e-Stat の値文字列を数値 or null に変換。
 * 欠損・秘匿マーカー ("***" 秘匿 / "-" 該当なし / "X" 秘匿 / "…" 等) は null。
 */
function parseEstatValue(raw: string): number | null {
  if (raw === "***" || raw === "-" || raw === "X" || raw === "…") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * 家計調査 (0003348235/0003348239) の @area は都道府県コードではなく
 * 県庁所在市コード (原則 NN003、例外: 福岡市=40004。40003 は北九州市)。
 * サイトの慣行 (既存 675 metric) に合わせ、県庁所在市の値を都道府県コード NN000 に写像する。
 * 全国 (00000) と県庁所在市以外の大都市 (川崎/相模原/浜松/堺/北九州) は対象外として捨てる。
 */
const KAKEI_CITY_TO_PREF = new Map<string, string>();
for (let i = 1; i <= 47; i++) {
  const nn = String(i).padStart(2, "0");
  KAKEI_CITY_TO_PREF.set(i === 40 ? "40004" : `${nn}003`, `${nn}000`);
}
function remapKakeiAreas(values: EstatValue[]): EstatValue[] {
  const out: EstatValue[] = [];
  for (const v of values) {
    const pref = KAKEI_CITY_TO_PREF.get(v["@area"]);
    if (!pref) continue;
    out.push({ ...v, "@area": pref });
  }
  return out;
}

/** 5 桁エリアコード判定 (都道府県集計行 NN000) */
function isPrefCode5(code: string): boolean {
  if (!/^\d{2}000$/.test(code)) return false;
  const n = Number(code.slice(0, 2));
  return n >= 1 && n <= 47;
}

/** 5 桁市区町村コード判定 (NNxyz, xyz≠000, 県 01-47) */
function isCityCode5(code: string): boolean {
  if (!/^\d{5}$/.test(code)) return false;
  const pref = Number(code.slice(0, 2));
  if (pref < 1 || pref > 47) return false;
  return code.slice(2) !== "000";
}

/**
 * 社会・人口統計体系: 都道府県表 statsDataId → 市区町村表 statsDataId を解決。
 *
 * metric は pref 表 (00000101xx / 00000102xx) のみを source に持つため、city データは
 * 同一 cdCat01 で対応する city 表から取得する。マッピング (2026-05-29 実測で確定):
 *   - pref 基礎データ      00000101CC → city 基礎データ(廃置分合処理済)   00000202CC
 *   - pref 社会生活統計指標 00000102CC → city 社会生活統計指標(廃置分合処理済) 00000203CC
 *     (いずれも廃置分合処理済を採用。area マスタ cities.json=1913 件と件数一致し areaName join が
 *      完全になるため。オリジナル(00000201CC,1917件)は master に無い 4 件が join 漏れになる。
 *      値は同一: C3109 0000020203→札幌519, #A05307 0000010201→0000020301 で確認済)
 *   - CC=12(家計)/13(生活時間) は city 表が存在しない → null
 */
function prefToCityStatsDataId(prefId: string): string | null {
  const m = /^0000010([12])(\d{2})$/.exec(prefId);
  if (!m) return null;
  const series = m[1]; // "1"=基礎データ, "2"=社会生活統計指標
  const catStr = m[2]; // "01".."13"
  const cat = Number(catStr);
  if (cat < 1 || cat > 11) return null; // 12,13 は city 表なし
  return series === "1" ? `0000020${"2"}${catStr}` : `0000020${"3"}${catStr}`;
}

// ---- area マスタ (areaName 付与用) -------------------------------------
interface AreaMasters {
  pref: Map<string, string>; // prefCode(5桁) → prefName
  city: Map<string, string>; // cityCode(5桁) → cityName
}
let _masters: AreaMasters | null = null;
function loadAreaMasters(): AreaMasters {
  if (_masters) return _masters;
  const prefRaw = JSON.parse(
    readFileSync(resolve(REPO_ROOT, "packages/area/src/data/prefectures.json"), "utf8"),
  ) as Array<{ prefCode: string; prefName: string }>;
  const cityRaw = JSON.parse(
    readFileSync(resolve(REPO_ROOT, "packages/area/src/data/cities.json"), "utf8"),
  ) as Array<{ cityCode: string; cityName: string }>;
  _masters = {
    pref: new Map(prefRaw.map((p) => [p.prefCode, p.prefName])),
    city: new Map(cityRaw.map((c) => [c.cityCode, c.cityName])),
  };
  return _masters;
}

/** config.yearFormat に応じた yearName ("YYYY年度" / "YYYY年") */
function yearNameOf(yearCode: string, config: MetricConfig): string {
  return config.yearFormat === "fiscal" ? `${yearCode}年度` : `${yearCode}年`;
}

/**
 * config.years の範囲内か判定 (e-Stat 規約: cdTimeFrom/To を使わずメモリ内でフィルタ)。
 * years 未指定なら全年通す。
 */
function inYearRange(yearCode: string, config: MetricConfig): boolean {
  const y = Number(yearCode);
  if (!Number.isFinite(y)) return false;
  const spec = config.years;
  if (spec === "all" || spec == null) return true;
  // config.years が稀にフルタイムコード (例 2009100000) を含むため 4 桁年に正規化して比較
  const to4 = (n: number): number => (n > 9999 ? Number(String(n).slice(0, 4)) : n);
  if ("years" in spec) return spec.years.map(to4).includes(y);
  // { from, to }
  return y >= to4(spec.from) && y <= to4(spec.to);
}

interface ShapedRow {
  areaCode: string;
  areaName: string;
  yearCode: string;
  yearName: string;
  value: number | null;
  unit: string;
  rank: number | null;
  prefectureCode?: string;
}

/** 年ごとに value 降順で rank を付与 (1=最大値)。null は rank null。同値は同順位 (競争順位)。 */
function assignRanks(rows: ShapedRow[]): void {
  const byYear = new Map<string, ShapedRow[]>();
  for (const r of rows) {
    if (!byYear.has(r.yearCode)) byYear.set(r.yearCode, []);
    byYear.get(r.yearCode)!.push(r);
  }
  for (const group of byYear.values()) {
    const ranked = group
      .filter((r) => r.value != null)
      .sort((a, b) => (b.value as number) - (a.value as number));
    let prevValue: number | null = null;
    let prevRank = 0;
    ranked.forEach((r, i) => {
      if (prevValue !== null && r.value === prevValue) {
        r.rank = prevRank; // 同値は同順位
      } else {
        r.rank = i + 1;
        prevRank = i + 1;
        prevValue = r.value;
      }
    });
  }
}

/**
 * 書き出す payload の meta。
 *
 * ★`recipe` を **必須**にしている。値を書く経路で焼き忘れると型エラーになり、
 * 「値はあるがどう作ったか分からない」状態を構造的に作れなくする。
 * (`StatsValuesPayload` 側は旧 payload を読めるよう optional。書き手だけが必須)
 */
interface WrittenStatsMeta {
  rowCount: number;
  yearRange: [string, string] | null;
  areaCount: number;
  generatedAt: string;
  recipe: MetricRecipe;
}

/** meta を組み立てる共通処理 */
function buildMeta(config: MetricConfig, rows: ShapedRow[]): WrittenStatsMeta {
  const years = Array.from(new Set(rows.map((r) => r.yearCode))).sort();
  const areas = new Set(rows.map((r) => r.areaCode));
  return {
    rowCount: rows.length,
    yearRange: (years.length > 0 ? [years[0], years[years.length - 1]] : null) as
      | [string, string]
      | null,
    areaCount: areas.size,
    generatedAt: new Date().toISOString(),
    // 値の隣にレシピを焼く。監査 (検査 k) がこの configHash と現在の config を突き合わせる
    recipe: buildRecipe(config),
  };
}

/**
 * config が宣言している単位換算倍率 (金額族専用・`10^k`)。
 * 未宣言 / estat 以外は 1 = 換算しない。判定は `audit-money-unit-scale.ts` が全数監査する。
 */
function valueScaleOf(config: MetricConfig): number | undefined {
  return config.source.kind === "estat" ? config.source.valueScale : undefined;
}

/** 取得 raw values → StatsValues 構造 (prefecture)。areaName/unit/yearName/rank を付与し本番投入可能形に。 */
function shapeForPrefecture(config: MetricConfig, values: EstatValue[]) {
  const masters = loadAreaMasters();
  const scale = valueScaleOf(config);
  const rows: ShapedRow[] = values
    .filter((v) => isPrefCode5(v["@area"]) && inYearRange(v["@time"].slice(0, 4), config))
    .map((v) => {
      const yearCode = v["@time"].slice(0, 4);
      return {
        areaCode: v["@area"],
        areaName: masters.pref.get(v["@area"]) ?? "",
        yearCode,
        yearName: yearNameOf(yearCode, config),
        value: applyValueScale(parseEstatValue(v.$), scale),
        unit: config.unit,
        rank: null as number | null,
      };
    })
    .sort((a, b) =>
      a.yearCode === b.yearCode
        ? a.areaCode.localeCompare(b.areaCode)
        : a.yearCode.localeCompare(b.yearCode),
    );
  assignRanks(rows);
  return { metricKey: config.key, entityKind: "prefecture" as const, rows, meta: buildMeta(config, rows) };
}

/** 取得 raw values → StatsValues 構造 (city)。areaName(市区町村マスタ join)/unit/yearName/rank を付与。 */
function shapeForCity(config: MetricConfig, values: EstatValue[]) {
  const masters = loadAreaMasters();
  const scale = valueScaleOf(config);
  const rows: ShapedRow[] = values
    .filter((v) => isCityCode5(v["@area"]) && inYearRange(v["@time"].slice(0, 4), config))
    .map((v) => {
      const yearCode = v["@time"].slice(0, 4);
      return {
        areaCode: v["@area"],
        areaName: masters.city.get(v["@area"]) ?? "",
        yearCode,
        yearName: yearNameOf(yearCode, config),
        value: applyValueScale(parseEstatValue(v.$), scale),
        unit: config.unit,
        rank: null as number | null,
        prefectureCode: v["@area"].slice(0, 2),
      };
    })
    .sort((a, b) =>
      a.yearCode === b.yearCode
        ? a.areaCode.localeCompare(b.areaCode)
        : a.yearCode.localeCompare(b.yearCode),
    );
  assignRanks(rows);
  return { metricKey: config.key, entityKind: "city" as const, rows, meta: buildMeta(config, rows) };
}

type ProcessStatus =
  | "ok"
  | "fail"
  | "skip"
  | "empty"
  | "empty-allowed"
  /** 形状が壊れている (重複行 / 打ち切り / 単位矛盾 / 県の欠損)。書かずに既存を温存した */
  | "shape"
  /** 形状違反はあるが allowlist で許可済み */
  | "shape-allowed";

interface ProcessResult {
  key: string;
  ok: boolean;
  /**
   * 明示的な結果種別。
   *
   * 旧実装は `result.message.includes("skipped")` の文字列一致で skip を判定しており
   * (文言を変えると静かに壊れる)、さらに「0 件」を表す種別が無かったため
   * rows=0 が ok に紛れて exit code に一切現れなかった (2026-07-29 の 6 件事故)。
   */
  status: ProcessStatus;
  message: string;
  rows?: number;
  /** 空だった artifact の説明 (ログ用) */
  emptyNotes?: string[];
  /** 形状違反の説明 (ログ用) */
  shapeNotes?: string[];
}

/**
 * 公開済み R2 の同 artifact の rowCount を読む (0 件になったときだけ呼ぶ)。
 *
 * 「既存データを空で潰す」= regression を判定するためだけの照会なので、空は稀 =
 * 全体コストは無視できる。R2_PUBLIC_FETCH_URL は data-refresh.yml の env に既にある。
 * 取得できない (未設定 / 404 / ネットワーク断) 場合は null を返し、
 * regression ではなく first-empty として扱わせる (誤って「破壊」と誇張しない)。
 */
async function readPublishedRowCount(key: string, artifact: string): Promise<number | null> {
  const base = process.env.R2_PUBLIC_FETCH_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/app/stats/${key}/${artifact}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { meta?: { rowCount?: number }; rows?: unknown[] };
    return json.meta?.rowCount ?? json.rows?.length ?? null;
  } catch {
    return null;
  }
}

/**
 * 公開済み R2 の同 artifact の県カバレッジを読む (**47 県に満たない年があるときだけ呼ぶ**)。
 *
 * 「以前 47 県あった年が減った」= 欠損の発生を判定するためだけの照会。
 * 全 metric で呼ぶと R2 GET が metric 数だけ増えるので、shortfall を検出したときに限る
 * (実測で該当は 2,179 件中 24 件なのでコストは無視できる)。
 * 取得できない場合は null を返し、warn 止まりにさせる (誤って「欠損発生」と誇張しない)。
 */
async function readPublishedCoverage(
  key: string,
  artifact: string,
): Promise<Pick<ShapeSummary, "perYearAreaCount"> | null> {
  const base = process.env.R2_PUBLIC_FETCH_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/app/stats/${key}/${artifact}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { rows?: { areaCode: string; yearCode: string }[] };
    if (!json.rows) return null;
    const areasByYear = new Map<string, Set<string>>();
    for (const row of json.rows) {
      let set = areasByYear.get(row.yearCode);
      if (!set) {
        set = new Set();
        areasByYear.set(row.yearCode, set);
      }
      set.add(row.areaCode);
    }
    const perYearAreaCount: Record<string, number> = {};
    for (const [year, areas] of areasByYear) perYearAreaCount[year] = areas.size;
    return { perYearAreaCount };
  } catch {
    return null;
  }
}

async function processOne(
  config: MetricConfig,
  appId: string,
  dryRun: boolean,
  allowEmpty: ReadonlySet<string> = new Set(),
  allowShape: ReadonlySet<string> = new Set(),
): Promise<ProcessResult> {
  if (config.source.kind === "calculated") {
    return { key: config.key, ok: false, status: "skip", message: "calculated metric skipped (deps required)" };
  }
  if (config.source.kind === "external" || config.source.kind === "mlit") {
    return { key: config.key, ok: false, status: "skip", message: `${config.source.kind} source skipped (fetcher not implemented yet)` };
  }
  // kakei-chousa は e-Stat API の通常テーブル (statsDataId + cdCat01/cdCat02 filter)。
  // filter に格納されたパラメータを estat source と同形に写して同一経路で fetch する。
  let src: Extract<SourceConfig, { kind: "estat" }>;
  if (config.source.kind === "kakei-chousa") {
    const filter = (config.source.filter ?? {}) as {
      statsDataId?: string;
      cdCat01?: string;
      cdCat02?: string;
    };
    if (!filter.statsDataId) {
      return { key: config.key, ok: false, status: "skip", message: "kakei-chousa missing filter.statsDataId skipped" };
    }
    src = {
      kind: "estat",
      statsDataId: filter.statsDataId,
      cdCat01: filter.cdCat01,
      cdCat02: filter.cdCat02,
    };
  } else {
    src = config.source;
  }
  const wantPref = config.entities.includes("prefecture");
  const wantCity = config.entities.includes("city");
  if (!wantPref && !wantCity) {
    return { key: config.key, ok: false, status: "skip", message: "no prefecture/city entity skipped (port/migration not in scope)" };
  }

  try {
    const notes: string[] = [];
    const emptyNotes: string[] = [];
    const shapeNotes: string[] = [];
    let totalRows = 0;
    let hardEmpty = false;
    let softEmpty = false;
    let hardShape = false;
    let softShape = false;

    /**
     * 形状 (重複行 / 打ち切り / 単位と値の矛盾 / 県のカバレッジ) を判定し、書いてよいかを返す。
     *
     * `gateEmpty` と同じく **error なら書かない**。壊れたデータで上書きするより、
     * 古いデータが残る方がまし (diff-push-r2 は .local/r2 を walk するだけなので
     * 書かなければ R2 の既存データが温存される)。
     *
     * 2026-07-30 導入。それまで「行が多すぎる」側は全層で無検証で、
     * 分類軸の絞り忘れで 194 metric が壊れた数値を配信していた。
     */
    async function gateShape(
      entity: "prefecture" | "city",
      payload: { rows: ShapedRow[] },
      raw: { totalNumber: number; toNumber: number },
      artifact: string,
    ): Promise<boolean> {
      const summary = summarizeShape(payload.rows);

      // 47 県に満たない年があるときだけ公開済みを引く (縮小専用ラチェットの基準)。
      // 全 metric で引くと R2 GET が metric 数だけ増えるため遅延評価にする。
      const hasShortfall =
        entity === "prefecture" &&
        Object.values(summary.perYearAreaCount).some((n) => n < PREFECTURE_COUNT);
      const priorSummary = hasShortfall ? await readPublishedCoverage(config.key, artifact) : null;

      const violations = classifyShape({
        key: config.key,
        entity,
        summary,
        unit: config.unit,
        raw,
        priorSummary,
        now: new Date(),
        // ★取り込み時は allowlist を **書いてよいかの判定には使わない**。
        //
        //   allowlist の意味は「**いま R2 にある公開済みデータ**が壊れているのを知っている」
        //   であって「新しく取ってくるデータも壊れていてよい」ではない。ここで適用すると、
        //   config を是正したのに分子分母を取り違えた、といった**新しい壊れ方**が
        //   `allowed` に落ちてそのまま書き込まれる (2026-07-30 に空き家率の陰性対照で
        //   実際に確認: 1076% が allowlist の重症度 896500 を下回るため素通りした)。
        //   重症度ラチェットは「悪化」しか見ないので、この穴は塞げない。
        //
        //   allowlist は下で **run を fail させるかどうか**にだけ使う (既知の破損で
        //   毎晩 CI を赤くしない)。意図的な書き込み例外は --allow-shape で 1 回ずつ明示する。
        cliAllowed: allowShape,
      });
      if (violations.length === 0) return true;

      for (const v of violations) {
        // 既知の破損か = run を fail させないでよいか。**書くかどうかとは別の判断**。
        // 既知か = run を fail させないでよいか。**書くかどうかとは別の判断**。
        const allow = v.isError
          ? findExpectedShapeAnomaly(EXPECTED_SHAPE_ANOMALY, config.key, v.check, entity, new Date())
          : null;
        if (v.isError && !allow) {
          hardShape = true;
          console.error(`  [shape] ${v.message}`);
        } else if (v.isError) {
          softShape = true;
          // ★disposition をそのまま出す。legitimate を known-broken と表示すると
          //   「壊れている」と誤読させる (2026-07-31)。
          console.warn(
            `  [shape:${allow!.disposition}] ${v.message} (allowlist 済のため run は継続。` +
              `書き込みはしない — allowlist は fail 判定専用で、書き込み例外は --allow-shape)`,
          );
        } else {
          softShape = true;
          console.warn(`  [shape:allowed] ${v.message}`);
        }
        shapeNotes.push(`${entity}:${v.check}${v.isError ? (allow ? `:${allow.disposition}` : "") : ":allowed"}`);
      }
      // ★既知でも壊れていれば書かない (R2 の既存データが温存されるだけ)
      return !hasShapeError(violations);
    }

    /**
     * 0 件の artifact を判定し、書いてよいかを返す。
     *
     * ★rows=0 のとき **書かない**のが要点。書かなければ diff-push-r2 は .local/r2 を
     * walk するだけなので R2 の既存データが自動的に温存される (データ破壊の防止)。
     * artifact 単位で判定するのは、pref=0 / city=1900 のような部分欠落が
     * 合算値では素通りするため (旧実装の totalRows はこれを見逃した)。
     */
    async function gateEmpty(
      entity: "prefecture" | "city",
      rawCount: number,
      rowCount: number,
      artifact: string,
    ): Promise<boolean> {
      if (rowCount > 0) {
        // allowlist に残っているのに復活した場合を知らせる (fatal にはしない)
        const revived = classifyEmptyOutcome({
          key: config.key, entity, rawCount, rowCount, priorRowCount: null, now: new Date(),
        });
        if (revived.outcome === "stale-allowlist") console.warn(`  [stale-allowlist] ${revived.message}`);
        return true;
      }
      const priorRowCount = await readPublishedRowCount(config.key, artifact);
      const verdict = classifyEmptyOutcome({
        key: config.key, entity, rawCount, rowCount,
        priorRowCount, now: new Date(), cliAllowed: allowEmpty,
      });
      if (verdict.isError) {
        hardEmpty = true;
        console.error(`  [empty] ${verdict.message}`);
      } else {
        softEmpty = true;
        console.warn(`  [empty:allowed] ${verdict.message}`);
      }
      emptyNotes.push(`${entity}:${verdict.outcome}`);
      return false; // 0 件は書かない (既存データを温存する)
    }

    if (wantPref) {
      const fetched = await fetchEstatData(appId, src);
      const values =
        config.source.kind === "kakei-chousa" ? remapKakeiAreas(fetched.values) : fetched.values;
      const payload = shapeForPrefecture(config, values);
      const notEmpty = await gateEmpty("prefecture", values.length, payload.rows.length, "values.json");
      // 0 件なら形状は見ない (expected-empty の担当。二重に鳴らさない)
      const shapeOk = notEmpty
        ? await gateShape("prefecture", payload, fetched.raw, "values.json")
        : true;
      const writable = notEmpty && shapeOk;
      if (!dryRun && writable) {
        const outPath = resolve(R2_LOCAL, `app/stats/${config.key}/values.json`);
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, JSON.stringify(payload));
      }
      notes.push(`pref=${payload.rows.length}`);
      totalRows += payload.rows.length;
    }

    if (wantCity) {
      const cityStatsDataId = prefToCityStatsDataId(src.statsDataId);
      if (!cityStatsDataId) {
        notes.push("city=skip(no-city-table)");
      } else {
        let fetched = await fetchEstatData(appId, { ...src, statsDataId: cityStatsDataId });
        // ★city 表はコードを振り直していることがある (2026-07-31 実測)。
        //   コードで 0 行だったときだけ、指標名の完全一致で cdCat01 を引き直す。
        //   取得できている metric の経路は通らないので、既存の挙動は変わらない。
        if (fetched.values.length === 0 && src.cdCat01) {
          const alt = await resolveCityCat01(appId, src.statsDataId, cityStatsDataId, src.cdCat01);
          if (alt) {
            notes.push(`city-cat01=${src.cdCat01}->${alt}`);
            fetched = await fetchEstatData(appId, {
              ...src,
              statsDataId: cityStatsDataId,
              cdCat01: alt,
            });
          }
        }
        const values = fetched.values;
        const payload = shapeForCity(config, values);
        const notEmpty = await gateEmpty("city", values.length, payload.rows.length, "cities.json");
        const shapeOk = notEmpty
          ? await gateShape("city", payload, fetched.raw, "cities.json")
          : true;
        const writable = notEmpty && shapeOk;
        if (!dryRun && writable) {
          const outPath = resolve(R2_LOCAL, `app/stats/${config.key}/cities.json`);
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, JSON.stringify(payload));
        }
        notes.push(`city=${payload.rows.length}`);
        totalRows += payload.rows.length;
      }
    }

    // 重い順に判定する。empty (データ消失) > shape (壊れたデータ) > 許可済み > ok。
    const status: ProcessStatus = hardEmpty
      ? "empty"
      : hardShape
        ? "shape"
        : softEmpty
          ? "empty-allowed"
          : softShape
            ? "shape-allowed"
            : "ok";
    return {
      key: config.key,
      ok: status !== "empty" && status !== "shape",
      status,
      message: `${dryRun ? "would write" : "wrote"} ${notes.join(",")}`,
      rows: totalRows,
      ...(emptyNotes.length > 0 ? { emptyNotes } : {}),
      ...(shapeNotes.length > 0 ? { shapeNotes } : {}),
    };
  } catch (e) {
    return { key: config.key, ok: false, status: "fail", message: (e as Error).message };
  }
}

async function main() {
  const args = parseArgs();
  const appId = readAppId();
  const all = listAllMetrics();
  console.log(`[batch] registry size: ${all.length}`);

  let targets = all;
  const isExplicitMetric = Boolean(args.metric);
  if (args.metric) {
    // --metric はカンマ区切りで複数指定できる (欠落キーの一括復旧用。単一指定は従来どおり)
    const wanted = new Set(
      args.metric
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    );
    const unknown = [...wanted].filter((k) => !all.some((c) => c.key === k));
    if (unknown.length > 0) {
      throw new Error(`--metric に registry 未登録のキーがあります: ${unknown.join(", ")}`);
    }
    targets = targets.filter((c) => wanted.has(c.key));
  }
  if (args.kind) targets = targets.filter((c) => c.entities.includes(args.kind as MetricConfig["entities"][number]));
  if (args.since) {
    const sinceMs = new Date(args.since).getTime();
    targets = targets.filter((c) => {
      const mtime = getR2FileMtime(`app/stats/${c.key}/values.json`);
      return mtime == null || mtime < sinceMs;
    });
  }

  console.log(`[batch] targets after filter: ${targets.length}`);
  if (args.dryRun) {
    // ★2026-07-30 変更: 旧実装は先頭 10 件を表示して return するだけで **fetch すらしなかった**。
    // data-refresh.yml の既定 dispatch は dry_run=true なので、実質何も検証できていなかった。
    // 実際に e-Stat を叩いて形状まで判定し、書き込みだけを行わないようにする
    // (座標ミス・重複・打ち切りを本番反映の前に見つけられるようにするため)。
    console.log(
      `[dry-run] e-Stat を ${targets.length} 件 fetch して形状を検証します (書き込みはしません)。` +
        `${targets.length > 50 ? " 件数が多い場合は --metric で絞ってください。" : ""}`,
    );
  }

  let ok = 0;
  let fail = 0;
  let skip = 0;
  let empty = 0;
  let emptyAllowed = 0;
  let shape = 0;
  let shapeAllowed = 0;
  const failedKeys: string[] = [];
  const emptyKeys: string[] = [];
  const shapeKeys: string[] = [];

  // concurrency-limited execution
  const queue = [...targets];
  const workers = Array.from({ length: args.concurrency }, async () => {
    while (queue.length > 0) {
      const c = queue.shift();
      if (!c) break;
      const result = await processOne(c, appId, args.dryRun, args.allowEmpty, args.allowShape);
      // status で分岐する (旧実装の message.includes("skipped") は文言依存で脆く、
      // かつ 0 件を表す種別が無いため rows=0 が ok に紛れ込んでいた)
      switch (result.status) {
        case "ok":
          ok++;
          if (ok % 20 === 0) console.log(`  ok=${ok} fail=${fail} skip=${skip} empty=${empty} shape=${shape} remaining=${queue.length}`);
          break;
        case "empty-allowed":
          emptyAllowed++;
          break;
        case "empty":
          empty++;
          emptyKeys.push(result.key);
          break;
        case "shape-allowed":
          shapeAllowed++;
          break;
        case "shape":
          shape++;
          shapeKeys.push(result.key);
          break;
        case "skip":
          skip++;
          break;
        default:
          fail++;
          failedKeys.push(result.key);
          console.error(`  [fail] ${result.key}: ${result.message}`);
      }
    }
  });
  await Promise.all(workers);

  console.log(
    `\n[done] ok=${ok}, fail=${fail}, skip=${skip}, empty=${empty}, empty-allowed=${emptyAllowed}` +
      `, shape=${shape}, shape-allowed=${shapeAllowed}`,
  );
  if (failedKeys.length > 0) {
    console.log(`[done] failed keys (${failedKeys.length}): ${failedKeys.join(", ")}`);
  }
  if (emptyKeys.length > 0) {
    console.log(`[done] empty keys (${emptyKeys.length}): ${emptyKeys.join(", ")}`);
  }
  if (shapeKeys.length > 0) {
    console.log(`[done] shape keys (${shapeKeys.length}): ${shapeKeys.join(", ")}`);
  }
  console.log(
    `Next: npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/stats`,
  );

  // silent partial failure の再発防止 (2026-07-27 障害): 従来は fail>0 でも exit 0 を返し、
  // CI (data-refresh.yml) が成功と誤認していた (55 metric 中 25 件失敗しても workflow green)。
  // --metric 明示指定 (特定キーの復旧目的の実行) は 1 件でも fail したら exit 1。
  // 全量実行 (metric 未指定 = 月次 cron) は fail 比率が 10% を超えたら exit 1
  // (少数の恒常的失敗だけで毎月 cron を赤くしないための閾値)。
  if (isExplicitMetric && fail > 0) {
    console.error(
      `[fatal] --metric 指定実行で ${fail} 件失敗しました (復旧対象キーが未完了です)`,
    );
    process.exit(1);
  }
  // 観測値 0 件の再発防止 (2026-07-29 障害): rows=0 は fail と違い「恒常的に少数出る」性質の
  // ものではないため、比率閾値で薄めず 1 件でも exit 1 にする。0 件の artifact は書いていない
  // ので R2 の旧データは温存されており、exit 1 により push / 派生生成も走らない。
  if (empty > 0) {
    console.error(
      `[fatal] 観測値が 0 件の metric が ${empty} 件あります: ${emptyKeys.join(", ")}\n` +
        `        意図した 0 件なら packages/data-configs/src/expected-empty.ts の EXPECTED_EMPTY に` +
        ` 理由・追跡先・期限を添えて登録してください (一回きりの検証は --allow-empty <keys>)`,
    );
    process.exit(1);
  }
  // 形状違反の再発防止 (2026-07-30 導入): 重複行・打ち切り・単位矛盾・県の欠損。
  // 0 件と同じく「恒常的に少数出る」性質のものではないので比率で薄めず 1 件でも exit 1。
  // 違反 artifact は書いていないので R2 の旧データは温存され、push も派生生成も走らない。
  if (shape > 0) {
    console.error(
      `[fatal] 形状が壊れた metric が ${shape} 件あります: ${shapeKeys.join(", ")}\n` +
        `        原因の大半は分類軸 (cdCat01-05 / cdTab) か timeScope の絞り忘れです。` +
        `未指定軸は diagnose-unpinned-axes.ts で列挙できます。\n` +
        `        既知の是正待ちなら packages/data-configs/src/expected-shape-anomaly.ts に` +
        ` 理由・追跡先・期限を添えて登録してください (一回きりの検証は --allow-shape <keys>)`,
    );
    process.exit(1);
  }
  if (!isExplicitMetric) {
    const total = ok + fail + skip;
    const failRatio = total > 0 ? fail / total : 0;
    if (failRatio > 0.1) {
      console.error(
        `[fatal] 全量実行で fail 比率が閾値超過: fail=${fail}/${total} (${(failRatio * 100).toFixed(1)}%) > 10%`,
      );
      process.exit(1);
    }
  }
}

// ★直接実行されたときだけ走らせる (2026-07-31)。
//   純粋関数をテストから import しただけで全 metric の取り込みが始まってしまい、
//   e-Stat へ数千リクエストを投げかけた。import は副作用を持ってはいけない。
const invokedDirectly = process.argv[1]
  ? resolve(process.argv[1]).includes("page-data-batch")
  : false;

if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
