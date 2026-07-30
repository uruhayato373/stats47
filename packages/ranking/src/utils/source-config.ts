import { parseRecipe, type EstatQueryParams, type MetricRecipe } from "@stats47/data-configs";

import type { RankingItem } from "../types";

/**
 * item.json の `sourceConfig` から e-Stat クエリ部を取り出す (オンデマンド取得経路の共通入口)。
 *
 * ## なぜ共通化するか
 *
 * オンデマンド経路 (テーマダッシュボード等 4 箇所) は従来 `sourceConfig` を**丸ごと spread**
 * して e-Stat に渡していた。`sourceConfig` は builder が手選びで作った表示用サブセットで
 * cdCat03/04/05・cdTab を含まないため、
 *
 *   1. 軸を絞り忘れた状態のクエリが実行され、多系列が混入する
 *   2. `source` / `note` のような非クエリキーが param に混ざる
 *
 * という 2 つの穴があった。2026-07-30 に 155 metric の config を是正しても、
 * この経路には届いていなかった。
 *
 * ## 新旧両対応
 *
 * 新形 (`{ estatParams, recipe, derived, source }`) を優先し、まだ再生成されていない
 * 旧 flat 形 (`{ statsDataId, cdCat01, cdCat02, source, ... }`) にフォールバックする。
 * R2 の全面再生成が終わったら旧形の分岐を落とす。
 */

/** e-Stat に渡してよいクエリキー。ここに無いキーは param に混ぜない。 */
const ESTAT_QUERY_KEYS = [
  "statsDataId",
  "cdCat01",
  "cdCat02",
  "cdCat03",
  "cdCat04",
  "cdCat05",
  "cdTab",
] as const;

type SourceConfigLike = RankingItem["sourceConfig"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** 旧 flat 形からクエリキーだけを拾う (source / note / itemCode 等は落とす) */
function fromLegacyFlat(config: Record<string, unknown>): EstatQueryParams | null {
  const statsDataId = config.statsDataId;
  if (typeof statsDataId !== "string" || statsDataId.length === 0) return null;

  const params: Record<string, string> = { statsDataId };
  for (const key of ESTAT_QUERY_KEYS) {
    if (key === "statsDataId") continue;
    const v = config[key];
    if (typeof v === "string" && v.length > 0) params[key] = v;
  }
  return params as unknown as EstatQueryParams;
}

/** sourceConfig に焼かれたレシピ (新形のみ)。旧形は null。 */
export function readRecipe(sourceConfig: SourceConfigLike): MetricRecipe | null {
  if (!isRecord(sourceConfig)) return null;
  return parseRecipe(sourceConfig.recipe);
}

/**
 * 単発の e-Stat クエリでは再現できない値か。
 *
 * true のとき **e-Stat を叩いてはならない** (叩くと変換前の生値が出る)。
 * 例: 年収 = 月額 × 12 + 賞与 / 軸合算 / 率 / 県庁所在市の写像。
 * 呼び元は正典 `app/stats/<key>/values.json` から読む。
 *
 * ★旧形 (レシピ未焼き込み) は判定できないので false を返す。これは従来の挙動と同じで、
 *   全面再生成が終われば全 item が新形になり判定できるようになる。
 */
export function isDerivedSource(sourceConfig: SourceConfigLike): boolean {
  return readRecipe(sourceConfig)?.derived === true;
}

/**
 * e-Stat に spread して渡せるクエリ params。取得不能なら null。
 *
 * `isDerivedSource` が true のときも params 自体は返す (生値が要る呼び元のため)。
 * **derived の判定は呼び元が別途行う。**
 */
export function resolveEstatParams(sourceConfig: SourceConfigLike): EstatQueryParams | null {
  if (!isRecord(sourceConfig)) return null;

  // 新形: 実行可能部が分離されている
  const estatParams = sourceConfig.estatParams;
  if (isRecord(estatParams)) return fromLegacyFlat(estatParams);

  // 旧形: flat に混ざっているのでクエリキーだけ拾う
  return fromLegacyFlat(sourceConfig as Record<string, unknown>);
}
