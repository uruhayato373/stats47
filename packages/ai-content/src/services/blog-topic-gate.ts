/**
 * blog-topic-gate — 記事を書き始める前に「そのネタのデータが健全か」を決定的に判定する。
 *
 * ## なぜ生成の前に要るか
 *
 * 記事の数値は本文の信頼性そのものなので、壊れた観測値から書き始めると**捏造記事を量産する**。
 * これは公開前ゲート (quality-gate) では止まらない: quality-gate は「本文の数値が data/*.json と
 * 一致するか」を見るだけで、その data 自体が壊れていれば一致してしまう。
 *
 * 実例 (2026-07-31 に topic-queue 上位で実際に踏んだ): `convenience-store-count-commercial` は
 * 分類軸の絞り忘れで **94 行 (47県 × 2系列)** あり、下位が「-1.7 店」という負の増減率だった。
 * このまま書けば「コンビニ店舗数が最下位の県は -1.7 店」という記事ができる。
 *
 * ## 判定
 *
 * 1. **既知の壊れ (allowlist)** — `EXPECTED_SHAPE_ANOMALY` に `known-broken` で載っている key は
 *    書かない。`legitimate` (統計の性質上その形が正しい) は通す。判定は取り込み側・週次監査と
 *    同じ `findExpectedShapeAnomaly` を使う (両端で同一定義にし、片方だけ緩まないようにする)。
 * 2. **接地したデータそのもの** — 記事が引用する行を直接見る。県の重複・47 県から外れた件数・
 *    非有限値・全件同値を弾く。allowlist に載る前の新しい壊れ方はここで捕まる。
 *
 * ## 正典側にも同じ検査がある (2026-08-04)
 *
 * shape-gate の `constant-value` / `zero-heavy` / `negative-count` が取り込み・週次監査・
 * 全件走査で同じことを見る。ここは**記事が実際に引用する行**を見るので、正典が直る前でも
 * 執筆を止められる (allowlist で降格された既知の壊れも 1. で弾く)。
 * **判定を変えるときは shape-gate と合わせる。** 40 行未満の扱いだけ意図的に違う
 * (ここは reject・ai-content 側は warn。理由は .claude/scripts/ai-content/lib/value-health.mjs)。
 *
 * 正典: .claude/rules/metric-config-standards.md §分類軸は必ず 1 系列に絞る
 */

import {
  EXPECTED_SHAPE_ANOMALY,
  PREFECTURE_COUNT,
  findExpectedShapeAnomaly,
} from "@stats47/data-configs";
import type { ExpectedShapeAnomalyEntry } from "@stats47/data-configs";

/** 接地済みデータ 1 行 (fetch-ranking-data-r2.mjs が書く data/*.json の要素) */
export interface GroundedRow {
  areaName?: string;
  value?: number;
  rank?: number;
}

export interface TopicGateVerdict {
  ok: boolean;
  /** 人が原因を切り分けられる 1 行。ok のときは空 */
  reasons: string[];
}

/**
 * allowlist に `known-broken` で載っている key か。
 *
 * `legitimate` は「統計の性質上その形が正しい」ので記事を書いてよい。期限切れの entry は
 * `findExpectedShapeAnomaly` が null を返すため、ここでも許可されない (= 書かない側に倒れる)。
 */
export function findKnownBrokenChecks(
  rankingKey: string,
  now: Date,
  anomalies: readonly ExpectedShapeAnomalyEntry[] = EXPECTED_SHAPE_ANOMALY,
): string[] {
  const checks = [
    "duplicate-area-year",
    "raw-truncated",
    "percent-out-of-range",
    "area-coverage",
  ] as const;
  const hits: string[] = [];
  for (const check of checks) {
    const entry = findExpectedShapeAnomaly(
      anomalies,
      rankingKey,
      check,
      "prefecture",
      now,
    );
    if (entry && entry.disposition === "known-broken") {
      hits.push(`${check} (${entry.reason})`);
    }
  }
  return hits;
}

/**
 * 接地したデータが記事の土台として使えるか判定する。
 *
 * 件数の下限を 47 ちょうどに固定しない: 港湾・漁港系のように内陸県が対象外で 40 県台になる
 * metric が実在する (`port-*` / `fishery-*` 系)。「47 でなければ違反」は誤検知になり、
 * 誤検知を出すゲートは運用で無効化される。**確実に違反と言えるもの**だけを弾く。
 */
export function checkGroundedRows(rows: readonly GroundedRow[]): TopicGateVerdict {
  const reasons: string[] = [];

  if (rows.length === 0) {
    return { ok: false, reasons: ["接地データが 0 行"] };
  }

  const names = rows.map((r) => r.areaName).filter((n): n is string => typeof n === "string");
  const dup = new Map<string, number>();
  for (const n of names) dup.set(n, (dup.get(n) ?? 0) + 1);
  const duplicated = [...dup].filter(([, c]) => c > 1);
  if (duplicated.length > 0) {
    // 同じ県が複数行 = 分類軸の絞り忘れ。どの行が正なのか決められない。
    reasons.push(
      `同一県が複数行: ${duplicated.length} 県 (例 ${duplicated
        .slice(0, 3)
        .map(([n, c]) => `${n}×${c}`)
        .join(", ")}) — 分類軸の絞り忘れ`,
    );
  }

  if (names.length !== rows.length) {
    reasons.push(`areaName の無い行が ${rows.length - names.length} 件`);
  }

  // 47 を超えるのは必ずおかしい (都道府県は 47 しかない)。下回るのは対象外県がある metric で
  // 正常なことがあるため、極端に少ないときだけ弾く。
  if (rows.length > PREFECTURE_COUNT) {
    reasons.push(`${rows.length} 行 (47 県を超えている)`);
  } else if (rows.length < 40) {
    reasons.push(`${rows.length} 行しかない (記事にするには県の網羅が足りない)`);
  }

  const values = rows.map((r) => r.value);
  if (values.some((v) => typeof v !== "number" || !Number.isFinite(v))) {
    reasons.push("非有限値 (null / NaN / Infinity) を含む");
  } else {
    const nums = values as number[];
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    if (min === max) {
      reasons.push(`全県が同じ値 (${min}) — 差を論じる記事にならない`);
    }
  }

  return { ok: reasons.length === 0, reasons };
}

/** allowlist と接地データの両方を見た最終判定 */
export function gateTopicData(
  rankingKey: string,
  rows: readonly GroundedRow[],
  now: Date,
  anomalies: readonly ExpectedShapeAnomalyEntry[] = EXPECTED_SHAPE_ANOMALY,
): TopicGateVerdict {
  const known = findKnownBrokenChecks(rankingKey, now, anomalies).map(
    (c) => `既知の壊れ (allowlist known-broken): ${c}`,
  );
  const grounded = checkGroundedRows(rows);
  const reasons = [...known, ...grounded.reasons];
  return { ok: reasons.length === 0, reasons };
}
