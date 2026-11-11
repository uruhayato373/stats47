/**
 * KSJ 登録済みデータセットのメタデータの読み込み口。
 *
 * 記録の正本は台帳 `geo.ksj-datasets` (data/geo/ksj/datasets.json + Schema)。stats47 が稼働対象とする
 * KSJ データセットの純メタ (name / category / geometryType / coverage / license / stats47Category /
 * ranking 定義) を持つ。ここは型を付けて export するだけで、記録を持たない。
 * 技術設定 (downloadUrlPattern / propertyMap / simplifyOptions) は `registry.ts` (KSJ_CODE_CONFIG)。
 * 候補メタの superset は `packages/database/seed/ksj-catalog.json`。
 * 新規データセット追加: JSON に 1 件足し、`registry.ts` に技術設定を足して
 * `npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts` で再 seed する。
 *
 * 正典: `.claude/rules/gis-data.md` / `packages/gis/src/mlit-ksj/README.md`
 */

import data from "../../../../data/geo/ksj/datasets.json";
import type { KsjCategory, KsjCoverage, KsjGeometryType, KsjLicense } from "./types";

export interface GisDatasetRankingConfig {
  rankingKey: string;
  rankingName: string;
  unit: string;
  /** stats47 ranking の categoryKey (17 軸) */
  categoryKey: string;
  filename?: string;
  filenamePattern?: string;
  /** 4 桁年 (estat-api.md の year 正規化に準拠) */
  yearCode: string;
  description?: string;
  /**
   * 「1 件」を数える単位を feature ではなく、この属性群の組で決める (県内で重複排除)。
   *
   * KSJ には 1 施設が複数 feature に分かれるデータセットがある。P03 発電施設は
   * **号機ごとに 1 レコード**で、原発は 68 レコード = 21 施設。`unit: "か所"` に
   * 対して feature を数えると 3 倍以上に膨らみ、福井県が「15 か所」になってしまう
   * (実際の発電所は高浜・大飯・美浜・敦賀の 4 か所)。
   *
   * **施設名だけでは足りない**。青森県の東通原子力発電所は東北電力と東京電力の
   * 2 か所が同名で別住所にあり、名前だけで畳むと 1 か所に潰れる。名前 + 住所で持つ。
   *
   * 属性のいずれかが空の feature は畳まず 1 件として数える (身元を確認できないものを
   * まとめると黙って過少計上になるため)。省略時は feature 数をそのまま数える。
   */
  dedupeByProperties?: readonly string[];
}

/**
 * 使い方。国土数値情報は同じデータでも使い方で利用条件が変わることがある
 * (N06 高速道路時系列は「最新年の現況」なら CC BY 4.0、「時系列」なら非商用)。
 */
export type GisDatasetUsage = "current" | "time-series";

/** ある使い方に適用される利用条件と、その根拠 (公式ページの文言) */
export interface GisDatasetUsageTerms {
  readonly license: KsjLicense;
  /** 公式の個別データページの該当文言 (短い引用) */
  readonly evidence: string;
  /** 公式ページで確認した日 (YYYY-MM-DD) */
  readonly verifiedAt: string;
}

export interface GisDatasetMeta {
  dataId: string;
  /** データ名 (日本語) */
  name: string;
  category: KsjCategory;
  geometryType: KsjGeometryType;
  coverage: KsjCoverage;
  license: KsjLicense;
  /** stats47 カテゴリ (17 軸の CategoryKey)。地図のみで ranking 化しない場合は null */
  stats47Category: string | null;
  isRankingTarget: boolean;
  /** ranking 対象データセットの ranking 定義 (旧 seed-from-registry.ts RANKINGS を統合) */
  rankingConfig?: readonly GisDatasetRankingConfig[];
  /** ranking 集計の基準バージョン (旧 RANKINGS.version)。pipeline download の {VERSION} 既定値 */
  latestVersion?: string;
  /** 国土数値情報の公式データ詳細ページ。配布単位の自動検出にも使う。 */
  sourcePageUrl?: string;
  /** 候補カタログ側で別IDになっている場合のID。 */
  candidateAliases?: readonly string[];
  /**
   * 使い方ごとの利用条件。`license` (データ全体の判定) と違う条件が公式ページにある使い方だけを書く。
   * 書いていない使い方は `license` に従う。読むときは `resolveKsjUsageTerms` を使い、条件を別の台帳へ複製しない。
   */
  usageTerms?: Partial<Record<GisDatasetUsage, GisDatasetUsageTerms>>;
}

/** 登録済みの dataId。台帳にない ID は型検査で落ちる (パッケージをまたぐ参照は `__tests__/dataset-references.test.ts` が検査する) */
export type KsjDataId = keyof typeof data.datasets;

/** 登録済みデータセット。件数は台帳から導出し、文書へ固定値を複製しない。dataId は台帳のキーから戻す */
export const GIS_DATASETS: GisDatasetMeta[] = Object.entries(data.datasets as Record<string, Omit<GisDatasetMeta, "dataId">>).map(
  ([dataId, meta]) => ({ dataId, ...meta }),
);

/** dataId → メタ の索引 */
export const GIS_DATASETS_BY_ID: Map<string, GisDatasetMeta> = new Map(
  GIS_DATASETS.map((d) => [d.dataId, d]),
);

/**
 * 使い方に適用される利用条件。`usageTerms` に書かれた使い方はその条件、無ければデータ全体の `license`。
 * 根拠 (evidence) が無い条件は null を返す (`license` だけでは「どの使い方で確認したか」が分からないため、
 * 呼び出し側は根拠の無い条件で公開判断をしない)。
 */
export function resolveKsjUsageTerms(
  dataId: KsjDataId,
  usage: GisDatasetUsage,
): GisDatasetUsageTerms | null {
  const meta = GIS_DATASETS_BY_ID.get(dataId);
  return meta?.usageTerms?.[usage] ?? null;
}
