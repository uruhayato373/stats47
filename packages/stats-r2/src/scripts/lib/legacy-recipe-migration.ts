import { createHash } from "node:crypto";

import {
  buildRecipe,
  parseRecipe,
  type MetricConfig,
} from "@stats47/data-configs";

import { parseStatsValuesPayload } from "../../schemas";
import type { StatsValuesPayload } from "../../types";

/**
 * Recipe 導入前に公開された payload の行 fingerprint。
 *
 * 値を再取得せずに recipe だけを移すため、対象は 2026-08-27 に公開 R2 で全行を
 * 再監査したこの完全一致集合に限定する。1 byte 相当でも行が変われば migration は停止する。
 */
export const LEGACY_RECIPE_ROW_HASHES = {
  "ambulance-hospital-arrival-time": "6ae9306a61bf979e13e03777dd9e66584f0dd4b84b3b110603332e5b7bb8c2c8",
  "avg-age-admin-prefecture": "00f033ee0cf96f82f0b84a76e954a0539cb20e77b5b137a6258b768bc3777520",
  "avg-salary-admin-prefecture": "0979d9d01498419b500fee572e3ab9511a969fcdad37cc640faef82b9034c45b",
  "avg-salary-all-prefecture": "f465e5aef13122e7c288ea9f2c2cae6fc45310c1219fbb998ac08860547d76c3",
  "avg-salary-education-prefecture": "e24be9b12f785e7f1a09482d60f5b836a582cb3c42c173753c74883ebb115e8b",
  "avg-salary-police-prefecture": "948c6ee60b29688499f93b6b90f600b48cca679c634202e8a53b2b3c50cf874d",
  "bonus-admin-prefecture": "934becacaddfe41ff296dce292c4040f93266c71957685b7c7ba5eba544d34b6",
  "fishing-port-count": "29b084fb674ee0fba16ddf21fc8ef78f0e3f64cfcfdad47d83c41f885eb81408",
  "future-population": "762e0af20903367d1fb5338a429ffb0ded4e77b5c375d90bfecad162d8722956",
  "future-population-change-rate-2050": "0a718866052d9ee7ef326e541a7f97de9377c40f4cd2632d903cbf53b5b2df64",
  "governor-salary-prefecture": "0dd7f03662600254efc709bfc63681ac1199eb48741858a522cce5ef420bd57a",
  "healthy-life-expectancy-female": "39a1723369f71b48413b2375cf85cc9c3770985f50194ce8475bdb17e261b53a",
  "healthy-life-expectancy-male": "829db436df2698e4064db406995e04f77e58fcdd4a46a059215c17cc618fd51b",
  "junior-high-club-per100-badminton": "e5b40e3feb214898ad1311beb20bbca7cce632539efb3f30ef0773c42330bb46",
  "junior-high-club-per100-baseball-soft": "1a818a57b0f91380a81d28d85ce7cade2a24aeae88a75fd626feae3a1c444d86",
  "junior-high-club-per100-basketball": "d0f35ec844d0d81533197617cf0b2713d2c986d0985281bda93eba746c4b28ed",
  "junior-high-club-per100-kendo": "1a49622c496c6890e92b1f8dc31a937fd3eed4e6453069460bd29493e53fcaf2",
  "junior-high-club-per100-soccer": "de0cdbaf84421f966a69bcfcb6a336c92b4a0ceeb8980594ca0dcfc265959fb8",
  "junior-high-club-per100-soft-tennis": "55846c915c6bfe0565a979c981b3d27992aab7ebb86a491c63f58fba38eea50b",
  "junior-high-club-per100-swimming": "cd953808610730499125f186e2d69c81391688839a6d311fab66f70a8f01d2b5",
  "junior-high-club-per100-table-tennis": "f50b4673c2503208cf270a75bbf4365bfb69abb060e5171ed511e09f52ef478c",
  "junior-high-club-per100-track-and-field": "1a8dadcf99b83d54a44def84d4b6db48918618bd11e824192527360b385185cb",
  "junior-high-club-per100-volleyball": "4691fc382c54a6aa6067f682a5ed77d3f59a918f0b1264acdb11ab7ca4c59910",
  "kindergarten-education-diffusion-rate": "ed239053dcc19b6e1337a328208e72cb9813372fc2b583e4a89bab93800aa6cb",
  "laspeyres-index-prefecture": "c3512a64513cbb031687d8a5260cffe4b7f85a3268dca255db210b4ca449fdfd",
  "nursery-education-diffusion-rate": "c15ea8a83cc4f5cd1b97db739fefa8558f5fbac5087b31b1453b7a8cdd2e069b",
  "overtime-pay-admin-prefecture": "02e5f82a4c80f6ae7d18a868e1dc8bb2238ba6323de8cd37e16b6cc6016982a0",
  "pachinko-shop-density-per-10k": "767620521c4681a5507b93ed38bbe57ab65e9b730c29aa5b5cb3c93614584dec",
  "port-count": "d08d93e3c0b6a6b74d4551a80447d40eea8abec3b47c099f27f758bf5a21628f",
  "railway-passengers": "90648e7d7726f90596335a633c71685bcd9232bf3d58ca98d079a51398c19264",
  "retirement-allowance-admin-prefecture": "02ccb53a47376f1bf5fefff31b64ca6d06aceaa1622133f3bf615caaa4c43b3b",
} as const;

export type LegacyRecipeMetricKey = keyof typeof LEGACY_RECIPE_ROW_HASHES;

export type LegacyRecipeMigrationResult =
  | { status: "migrated"; payload: StatsValuesPayload }
  | { status: "current"; payload: StatsValuesPayload };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hashLegacyRows(rows: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

/**
 * 公開値を変えず recipe だけを追加する。既存 recipe、行 fingerprint、metric key の
 * いずれかが想定外なら fail-closed で停止する。
 */
export function migrateLegacyRecipe(
  rawPayload: unknown,
  config: MetricConfig,
  expectedRowsHash: string,
): LegacyRecipeMigrationResult {
  if (!isRecord(rawPayload) || !Array.isArray(rawPayload.rows) || !isRecord(rawPayload.meta)) {
    throw new Error(`${config.key}: legacy payload shape is invalid`);
  }

  const parsed = parseStatsValuesPayload(rawPayload);
  if (parsed.metricKey !== config.key) {
    throw new Error(`${config.key}: metricKey mismatch (${parsed.metricKey})`);
  }
  if (parsed.entityKind !== "prefecture") {
    throw new Error(`${config.key}: only prefecture values.json can be migrated`);
  }
  if (parsed.meta.rowCount !== parsed.rows.length) {
    throw new Error(
      `${config.key}: rowCount mismatch (${parsed.meta.rowCount} != ${parsed.rows.length})`,
    );
  }

  const currentRecipe = buildRecipe(config);
  const bakedRecipe = parseRecipe(rawPayload.meta.recipe);
  if (bakedRecipe) {
    if (bakedRecipe.configHash !== currentRecipe.configHash) {
      throw new Error(
        `${config.key}: existing recipe drift (${bakedRecipe.configHash} != ${currentRecipe.configHash})`,
      );
    }
    return { status: "current", payload: parsed };
  }

  // fingerprint は「recipe が無い旧payload」にだけ適用する。移行後に正規producerが
  // 値を更新した payload は current recipe を持つため、過去の行hashで止めてはいけない。
  const actualRowsHash = hashLegacyRows(rawPayload.rows);
  if (actualRowsHash !== expectedRowsHash) {
    throw new Error(
      `${config.key}: row fingerprint changed (${actualRowsHash} != ${expectedRowsHash})`,
    );
  }

  const migrated = {
    ...rawPayload,
    meta: {
      ...rawPayload.meta,
      recipe: currentRecipe,
    },
  };
  return { status: "migrated", payload: parseStatsValuesPayload(migrated) };
}
