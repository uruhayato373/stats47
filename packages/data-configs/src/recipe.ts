/**
 * データ取得レシピ (MetricRecipe) — 「その値がどう作られたか」の機械可読な単一定義。
 *
 * ## なぜ要るか
 *
 * 配信データの正しさは出典 (statsDataId) だけでは決まらない。**分類軸の pin (cdCat01-05)・
 * tab の選択・線形結合・軸合算・時間粒度・地域軸の形**が揃って初めて決まる。
 * 2026-07-30 に 194 metric が「出典は正しいが軸を絞り忘れて別系列の合計を配信していた」
 * 事故を起こしたのはこのためで、出典だけを R2 に焼いても再現性は得られない。
 *
 * ## 設計原則: 両端で同一定義
 *
 * `buildRecipe` を **値を書く側 (page-data-batch)・item を組む側 (builder)・監査側** が
 * そろって import する。手選びのコピーを作らないので、片方だけ更新して食い違うことが
 * 構造的に起きない (`shape-gate.ts` / `expected-empty.ts` と同じパターン)。
 *
 * ## SSOT は git TS のまま
 *
 * R2 に焼くのは「この値を書いた時点の config から機械生成したコピー」であって真実源では
 * ない。監査 (検査 k) が `meta.recipe.configHash` と現在の config から作った hash を
 * 突き合わせ、ズレていれば「R2 が stale」と判定する。
 *
 * ## `years` を含めない理由
 *
 * レシピは **クエリと変換** を表す。取得年窓 (`config.years`) を hash に含めると、
 * 年を 1 年伸ばしただけで全件が「不整合」になり、「config が壊れている」と
 * 「新しい年のデータをまだ取っていない」が混ざる。後者は data-refresh の仕事で、
 * カバレッジは `meta.yearRange` と shape-gate が別に見ている。
 */

import type { MetricConfig, SourceConfig } from "./types";

/** e-Stat API へそのまま渡せる flat なクエリ部 (spread しても安全) */
export interface EstatQueryParams {
  statsDataId: string;
  cdCat01?: string;
  cdCat02?: string;
  cdCat03?: string;
  cdCat04?: string;
  cdCat05?: string;
  cdTab?: string;
}

/**
 * 宣言的な変換部。1 回のクエリでは再現できない演算がここに入る。
 * これが 1 つでもあれば `derived: true` になり、オンデマンド経路は e-Stat を叩かず
 * 正典 (`app/stats/<key>/values.json`) から読む。
 */
export interface RecipeOps {
  /** 複数 tab の線形結合 (例: 年収 = 月額 × 12 + 賞与 × 1) */
  tabCombination?: ReadonlyArray<{ cdTab: string; factor: number }>;
  /** 指定軸のメンバー合算 (総数コードが無い / 一部県にしか出ない軸用) */
  axisSum?: { axis: EstatAxis; codes: readonly string[] };
  /** 同一軸のメンバーから率を作る (分子の和 / 分母の和 × 100)。1 コードでも配列 */
  axisRatio?: { axis: EstatAxis; numeratorCodes: readonly string[]; denominatorCodes: readonly string[] };
  /** 年計のみ採用 (月次・四半期を同じ表に持つ統計用) */
  timeScope?: "annual";
  /**
   * 金額単位族の換算倍率 (原単位 → config.unit)。`10^k` のみ。
   *
   * `tabCombination.factor` と違い**配信される値そのものを変える**ので必ずレシピに載せる。
   * 宣言を直せば configHash が動き、監査 (検査 k) が「R2 が stale」と自動検出する。
   */
  valueScale?: number;
  /** 地域が area 軸ではなく cat 軸に入っている表の写像 */
  areaAxis?: { axis: EstatAxis; scheme: "seq-pref" | "name" };
  /** 家計調査の県庁所在市 → 都道府県 写像 */
  areaRemap?: "kakei-capital-city";
  /**
   * 他 metric から計算して作る値 (`fetcherKey:"calculated"`)。
   *
   * ★ここに入れる理由: 期間換算 (`periodAlign`) や `scaleFactor` を変えると**配信される
   * 数値そのものが変わる**のに、`buildOps` が source しか見ていなかったので configHash が
   * 動かず、監査 (検査 k) が R2 の stale を検出できなかった。演算の一部としてレシピに
   * 載せることで、宣言を直せば自動的に「再生成が要る」と検出される。
   */
  calc?: {
    type: "ratio" | "per_capita" | "subtraction";
    numeratorKey: string;
    denominatorKey?: string;
    periodAlign?: { numerator: string; denominator: string; result: string };
    scaleFactor?: number;
    /** 書き込み時の丸め桁 (値が変わるのでレシピに含める) */
    decimalPlaces?: number;
  };
}

export type EstatAxis = "cat01" | "cat02" | "cat03" | "cat04" | "cat05";

/** external / mlit の再取得キー (機械再取得できる source だけが値を持つ) */
export interface RefetchKeys {
  statsDataId?: string;
  cdCat01?: string;
  ksjDataId?: string;
  ksjVersion?: string;
  resourceId?: string;
  /** 手動抽出 (fetcherKey:"manual") の一次資料 URL */
  sourceUrl?: string;
}

export interface MetricRecipe {
  /** 取り込み経路。kakei-chousa も estat 経路に写るが、写像の存在を残すため kind は保つ */
  kind: SourceConfig["kind"];
  /** e-Stat 系のみ。オンデマンド消費者はこれ **だけ** を spread する */
  estatParams?: EstatQueryParams;
  /** 宣言演算。無ければ省略 */
  ops?: RecipeOps;
  /** 宣言演算があるか = 単発クエリで再現不能か */
  derived: boolean;
  /** external / mlit の再取得キー */
  refetch?: RefetchKeys;
  /** external のみ */
  fetcherKey?: string;
  /** config から機械導出したレシピの指紋 (非暗号学的・ドリフト検知用) */
  configHash: string;
}

// ---------------------------------------------------------------------------
// 正準化 + hash
// ---------------------------------------------------------------------------

/**
 * プロトタイプ汚染を起こすキー。
 *
 * ★任意入力のキーを `{}` へ書き戻す関数でこれらを弾かないと、`__proto__` を含む JSON が
 * オブジェクトのプロトタイプを書き換える (CodeQL の prototype-pollution-utility)。
 * 本モジュールは R2 payload 由来の JSON を扱うので、実際に到達しうる経路がある。
 */
const POLLUTING_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * 決定的直列化。オブジェクトのキーを再帰的に整列し、undefined を落とす。
 *
 * 配列は順序を保つ。順序が意味を持たない配列 (`axisSum.codes` / `tabCombination`) は
 * **buildRecipe 側で整列済み**なので、ここで特別扱いしない (正準形は recipe そのもの)。
 *
 * 出力は `Object.create(null)` 由来のプロトタイプ無しオブジェクト。任意のキーを
 * 書き戻す再帰ユーティリティなので、プロトタイプを持たせない + 汚染キーを落とす、の
 * 二重で防ぐ (`JSON.stringify` はプロトタイプ無しオブジェクトをそのまま直列化できる)。
 */
function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const out = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    if (POLLUTING_KEYS.has(key)) continue;
    const v = (value as Record<string, unknown>)[key];
    if (v === undefined) continue;
    out[key] = canonicalize(v);
  }
  return out;
}

const FNV_PRIME_32 = 0x01000193;
const FNV_OFFSET_32 = 0x811c9dc5;
/** 2 本目のパス用に別のオフセット (同じ入力で同じ値にならないようにする) */
const FNV_OFFSET_32_ALT = 0x9dc5811c;

function fnv1a32(bytes: Uint8Array, offset: number): number {
  let hash = offset >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    hash = (hash ^ bytes[i]) >>> 0;
    hash = Math.imul(hash, FNV_PRIME_32) >>> 0;
  }
  return hash >>> 0;
}

/**
 * 64 bit の指紋 → 16 桁 hex。FNV-1a 32bit を 2 本 (別オフセット・順方向と逆方向) 走らせて連結する。
 *
 * ★暗号学的ハッシュではない。用途は「config が変わったか」のドリフト検知だけで、
 * 攻撃者が衝突を作る動機が無い (実 registry 2,295 件で衝突ゼロを機械検証している)。
 *
 * ## 実装上の制約
 *
 * - **node:crypto を使わない**: この関数は Cloudflare Workers バンドルに載りうる
 *   `packages/ranking` からも import される。同期 API の互換を実行環境に依存させない。
 * - **BigInt リテラルを使わない**: 素直な 64bit FNV-1a は BigInt が要るが、リポジトリの
 *   tsconfig target が ES2020 未満のパッケージがあり `TS2737` になる。target を横断で
 *   引き上げるより、32bit 2 本で同じ出力幅を作る方が影響範囲が小さい。
 * - **UTF-8 バイト列で回す**: JS の code unit だと絵文字・サロゲートで環境差が出うる。
 */
export function hash64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const forward = fnv1a32(bytes, FNV_OFFSET_32);
  // 逆順で 2 本目を回し、前半と後半の相関を減らす
  const backward = fnv1a32(bytes.slice().reverse(), FNV_OFFSET_32_ALT);
  return forward.toString(16).padStart(8, "0") + backward.toString(16).padStart(8, "0");
}

/** recipe (configHash 抜き) の正準 JSON */
export function canonicalRecipeJson(recipe: Omit<MetricRecipe, "configHash">): string {
  return JSON.stringify(canonicalize(recipe));
}

// ---------------------------------------------------------------------------
// buildRecipe
// ---------------------------------------------------------------------------

function pickString(source: Record<string, unknown>, key: string): string | undefined {
  const v = source[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function buildEstatParams(
  src: Partial<Record<string, unknown>> & { statsDataId?: unknown },
): EstatQueryParams | undefined {
  const statsDataId = pickString(src as Record<string, unknown>, "statsDataId");
  if (!statsDataId) return undefined;
  const s = src as Record<string, unknown>;
  return stripUndefined({
    statsDataId,
    cdCat01: pickString(s, "cdCat01"),
    cdCat02: pickString(s, "cdCat02"),
    cdCat03: pickString(s, "cdCat03"),
    cdCat04: pickString(s, "cdCat04"),
    cdCat05: pickString(s, "cdCat05"),
    cdTab: pickString(s, "cdTab"),
  }) as EstatQueryParams;
}

/**
 * undefined のキーを落とす。汚染キーも落とす (canonicalize と同じ理由)。
 *
 * ここは呼び元がリテラルキーしか渡さないが、汎用ユーティリティの形をしているので
 * 将来任意キーを渡されても壊れないようにしておく。
 */
function stripUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (POLLUTING_KEYS.has(k)) continue;
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

type CalcType = NonNullable<RecipeOps["calc"]>["type"];

/** 命名ゆれを含む自由文字列 → 実行できる計算種別。未知は undefined (= calc を焼かない) */
function asCalcType(raw: unknown): CalcType | undefined {
  return raw === "ratio" || raw === "per_capita" || raw === "subtraction" ? raw : undefined;
}

function buildOps(config: MetricConfig): RecipeOps | undefined {
  const s = config.source;
  const ops: RecipeOps = {};

  if (s.kind === "estat") {
    if (s.tabCombination?.length) {
      // 線形結合は可換なので cdTab で整列して正準形にする
      ops.tabCombination = [...s.tabCombination]
        .map((t) => ({ cdTab: t.cdTab, factor: t.factor }))
        .sort((a, b) => a.cdTab.localeCompare(b.cdTab));
    }
    if (s.axisSum) {
      // 合算も可換なのでコードを整列する
      ops.axisSum = { axis: s.axisSum.axis, codes: [...s.axisSum.codes].sort() };
    }
    if (s.axisRatio) {
      // 分子・分母とも和なのでコードを整列して正準形にする
      ops.axisRatio = {
        axis: s.axisRatio.axis,
        numeratorCodes: [...s.axisRatio.numeratorCodes].sort(),
        denominatorCodes: [...s.axisRatio.denominatorCodes].sort(),
      };
    }
    if (s.timeScope) ops.timeScope = s.timeScope;
    // 1 は「換算しない」= 未宣言と同じなので載せない (既存 2,000 件超の configHash を動かさない)
    if (typeof s.valueScale === "number" && Number.isFinite(s.valueScale) && s.valueScale !== 1) {
      ops.valueScale = s.valueScale;
    }
    if (s.areaAxis) ops.areaAxis = { axis: s.areaAxis.axis, scheme: s.areaAxis.scheme };
  }

  if (s.kind === "kakei-chousa") {
    // 家計調査は県庁所在市の値を都道府県へ写す (page-data-batch の remapKakeiAreas)。
    // 単発クエリの生値とは違うので必ずレシピに残す。
    ops.areaRemap = "kakei-capital-city";
    // filter.axisSum (品目合算) は estat と同じ経路で fetch されるので同じ正準形で残す
    const axisSum = (s.filter as { axisSum?: unknown } | undefined)?.axisSum;
    if (isRecord(axisSum)) {
      const axis = parseAxis(axisSum.axis);
      const codes = parseCodeList(axisSum.codes);
      if (axis && codes.length > 0) ops.axisSum = { axis, codes: [...codes].sort() };
    }
  }

  // 計算型 (fetcherKey:"calculated") — 分子・分母から作る値。
  // ★対象を calculated fetcher に絞るのは、estat metric の `calculation` が
  //   ランタイム正規化 (per_population 等) の設定であって app/stats の値を作らないため。
  //   全 metric に広げると 2,000 件超の configHash が一斉に動き、drift の意味が消える。
  if (s.kind === "external" && s.fetcherKey === "calculated") {
    const c = config.calculation;
    const type = asCalcType(c?.type ?? c?.calculationType);
    const numeratorKey = c?.numeratorKey ?? c?.numeratorRankingKey ?? c?.numerator;
    if (c && type && numeratorKey) {
      ops.calc = stripUndefined({
        type,
        numeratorKey,
        denominatorKey: c.denominatorKey ?? c.denominatorRankingKey ?? c.denominator,
        periodAlign: c.periodAlign
          ? {
              numerator: c.periodAlign.numerator,
              denominator: c.periodAlign.denominator,
              result: c.periodAlign.result,
            }
          : undefined,
        scaleFactor: c.scaleFactor,
        decimalPlaces: config.display?.decimalPlaces,
      });
    }
  }

  return Object.keys(ops).length > 0 ? ops : undefined;
}

function buildRefetch(config: MetricConfig): RefetchKeys | undefined {
  const s = config.source;
  if (s.kind === "mlit") {
    return stripUndefined({ resourceId: s.resourceId });
  }
  if (s.kind !== "external") return undefined;

  const cfg = (s.config ?? {}) as Record<string, unknown>;
  const nestedEstat = (cfg.estat ?? {}) as Record<string, unknown>;
  const provenance = (cfg.provenance ?? {}) as Record<string, unknown>;

  const refetch = stripUndefined({
    statsDataId: pickString(cfg, "statsDataId") ?? pickString(nestedEstat, "statsDataId"),
    cdCat01: pickString(cfg, "cdCat01") ?? pickString(nestedEstat, "cdCat01"),
    ksjDataId: pickString(cfg, "ksjDataId"),
    ksjVersion: pickString(cfg, "ksjVersion"),
    sourceUrl: pickString(provenance, "pdfUrl") ?? pickString(provenance, "url"),
  });

  return Object.keys(refetch).length > 0 ? refetch : undefined;
}

/**
 * MetricConfig → MetricRecipe。純関数・決定的。
 *
 * ★この関数だけがレシピを作る。取り込み・builder・監査が同じ結果を得ることが
 * 「値の隣のレシピ = 現在の config」という不変条件の土台になる。
 */
export function buildRecipe(config: MetricConfig): MetricRecipe {
  const s = config.source;

  let estatParams: EstatQueryParams | undefined;
  if (s.kind === "estat") {
    estatParams = buildEstatParams(s as unknown as Record<string, unknown>);
  } else if (s.kind === "kakei-chousa") {
    // filter に statsDataId/cdCat01/cdCat02 が入る (nested な source:{name,url} は除外)
    estatParams = buildEstatParams((s.filter ?? {}) as Record<string, unknown>);
  }

  const ops = buildOps(config);
  const refetch = buildRefetch(config);

  const base: Omit<MetricRecipe, "configHash"> = stripUndefined({
    kind: s.kind,
    estatParams,
    ops,
    derived: ops !== undefined,
    refetch,
    fetcherKey: s.kind === "external" ? s.fetcherKey : undefined,
  });

  return { ...base, configHash: hash64(canonicalRecipeJson(base)) };
}

// ---------------------------------------------------------------------------
// parseRecipe (読み側)
// ---------------------------------------------------------------------------

const AXES = new Set<string>(["cat01", "cat02", "cat03", "cat04", "cat05"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function optString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function parseAxis(v: unknown): EstatAxis | undefined {
  return typeof v === "string" && AXES.has(v) ? (v as EstatAxis) : undefined;
}

function parseCodeList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((c): c is string => typeof c === "string") : [];
}

function parseOps(value: unknown): RecipeOps | undefined {
  if (!isRecord(value)) return undefined;
  const ops: RecipeOps = {};

  if (Array.isArray(value.tabCombination)) {
    const parts = value.tabCombination
      .filter(isRecord)
      .map((t) => ({ cdTab: optString(t.cdTab), factor: t.factor }))
      .filter((t): t is { cdTab: string; factor: number } => Boolean(t.cdTab) && typeof t.factor === "number");
    if (parts.length > 0) ops.tabCombination = parts;
  }

  if (isRecord(value.axisSum)) {
    const axis = parseAxis(value.axisSum.axis);
    const codes = parseCodeList(value.axisSum.codes);
    if (axis && codes.length > 0) ops.axisSum = { axis, codes };
  }

  if (isRecord(value.axisRatio)) {
    const axis = parseAxis(value.axisRatio.axis);
    const numeratorCodes = parseCodeList(value.axisRatio.numeratorCodes);
    const denominatorCodes = parseCodeList(value.axisRatio.denominatorCodes);
    if (axis && numeratorCodes.length > 0 && denominatorCodes.length > 0) {
      ops.axisRatio = { axis, numeratorCodes, denominatorCodes };
    }
  }

  if (value.timeScope === "annual") ops.timeScope = "annual";

  if (typeof value.valueScale === "number" && Number.isFinite(value.valueScale) && value.valueScale !== 1) {
    ops.valueScale = value.valueScale;
  }

  if (isRecord(value.areaAxis)) {
    const axis = parseAxis(value.areaAxis.axis);
    const scheme = value.areaAxis.scheme;
    if (axis && (scheme === "seq-pref" || scheme === "name")) {
      ops.areaAxis = { axis, scheme };
    }
  }

  if (value.areaRemap === "kakei-capital-city") ops.areaRemap = "kakei-capital-city";

  if (isRecord(value.calc)) {
    const type = asCalcType(value.calc.type);
    const numeratorKey = optString(value.calc.numeratorKey);
    if (type && numeratorKey) {
      const pa = isRecord(value.calc.periodAlign) ? value.calc.periodAlign : undefined;
      ops.calc = stripUndefined({
        type,
        numeratorKey,
        denominatorKey: optString(value.calc.denominatorKey),
        periodAlign:
          pa && optString(pa.numerator) && optString(pa.denominator) && optString(pa.result)
            ? {
                numerator: pa.numerator as string,
                denominator: pa.denominator as string,
                result: pa.result as string,
              }
            : undefined,
        scaleFactor: typeof value.calc.scaleFactor === "number" ? value.calc.scaleFactor : undefined,
        decimalPlaces:
          typeof value.calc.decimalPlaces === "number" ? value.calc.decimalPlaces : undefined,
      });
    }
  }

  return Object.keys(ops).length > 0 ? ops : undefined;
}

const KINDS = new Set<string>(["estat", "kakei-chousa", "mlit", "external", "calculated"]);

/**
 * R2 payload から読んだ unknown → MetricRecipe。
 *
 * ★不正・未焼き込みは throw せず null を返す。旧 payload (レシピ以前) を読めなくすると
 * 全消費者が同時に壊れるため、「まだ焼かれていない」は監査の残数 (unbaked) として
 * 数えるだけにして、読み取りは degrade させる。
 */
export function parseRecipe(value: unknown): MetricRecipe | null {
  if (!isRecord(value)) return null;
  const kind = optString(value.kind);
  const configHash = optString(value.configHash);
  if (!kind || !KINDS.has(kind) || !configHash) return null;

  const params = isRecord(value.estatParams) ? value.estatParams : undefined;
  const statsDataId = params ? optString(params.statsDataId) : undefined;
  const estatParams: EstatQueryParams | undefined =
    params && statsDataId
      ? (stripUndefined({
          statsDataId,
          cdCat01: optString(params.cdCat01),
          cdCat02: optString(params.cdCat02),
          cdCat03: optString(params.cdCat03),
          cdCat04: optString(params.cdCat04),
          cdCat05: optString(params.cdCat05),
          cdTab: optString(params.cdTab),
        }) as EstatQueryParams)
      : undefined;

  const refetchSrc = isRecord(value.refetch) ? value.refetch : undefined;
  const refetch = refetchSrc
    ? stripUndefined({
        statsDataId: optString(refetchSrc.statsDataId),
        cdCat01: optString(refetchSrc.cdCat01),
        ksjDataId: optString(refetchSrc.ksjDataId),
        ksjVersion: optString(refetchSrc.ksjVersion),
        resourceId: optString(refetchSrc.resourceId),
        sourceUrl: optString(refetchSrc.sourceUrl),
      })
    : undefined;

  return stripUndefined({
    kind: kind as MetricRecipe["kind"],
    estatParams,
    ops: parseOps(value.ops),
    derived: value.derived === true,
    refetch: refetch && Object.keys(refetch).length > 0 ? refetch : undefined,
    fetcherKey: optString(value.fetcherKey),
    configHash,
  }) as MetricRecipe;
}
