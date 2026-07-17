/**
 * ホーム「注目のランキング」専用の編集設定 (SSOT)。
 *
 * 正典: docs/02_実装計画/28_ホーム注目ランキングCTR改善仕様.md §4
 *
 * - metric config の `isFeatured` / `featuredOrder` は category/survey 等でも使われるため残すが、
 *   **ホームの選定・順番・hook・visual variant は本ファイルが単一ソース**。
 * - `hook` はホーム専用の編集 copy であり、ranking の `title` / `seoTitle` を上書きしない。
 * - hook へ観測値・データ年度を固定埋め込みしない (値・順位は snapshot 派生値が担う)。
 *   指標定義に含まれる年 (例: 2050 年推計) のみ許容 — validateHomeFeaturedRankings が機械判定する。
 * - Experiment V1 (home-featured-v1) は現行 8 指標を維持し表示だけを比較する (§1.3)。
 *   掲載テーマの入れ替えは V2 (§10) で行う。
 */

export const HOME_FEATURED_CARD_VARIANTS = [
  "question",
  "comparison",
  "territory",
  "top-three",
] as const;

export type HomeFeaturedCardVariant = (typeof HOME_FEATURED_CARD_VARIANTS)[number];

export interface HomeFeaturedRankingDefinition {
  /** METRICS_REGISTRY に実在する rankingKey (isActive・prefecture 必須) */
  rankingKey: string;
  /** 1 始まりの連番 (表示順・slot) */
  order: number;
  /** ホーム専用の問い copy。改行なし・8〜28 文字 */
  hook: string;
  /** editorial 側の card variant */
  variant: HomeFeaturedCardVariant;
}

export const HOME_FEATURED_RANKINGS: readonly HomeFeaturedRankingDefinition[] = [
  {
    rankingKey: "annual-sunshine-duration",
    order: 1,
    hook: "日照時間が最も長い県は？",
    variant: "question",
  },
  {
    // 「全国の何割」は snapshot 未算出のため出さない (§4.3 短縮形)
    rankingKey: "total-population",
    order: 2,
    hook: "人口上位3県は？",
    variant: "top-three",
  },
  {
    // 2050 は将来推計の対象年 (指標定義の一部) でありデータ年度ではない
    rankingKey: "future-population-change-rate-2050",
    order: 3,
    hook: "2050年、人口が増える県は？",
    variant: "question",
  },
  {
    rankingKey: "agricultural-output",
    order: 4,
    hook: "農業産出額の上位3県は？",
    variant: "top-three",
  },
  {
    rankingKey: "fiscal-strength-index-prefecture",
    order: 5,
    hook: "財政力が高い県と低い県",
    variant: "comparison",
  },
  {
    rankingKey: "annual-clear-days",
    order: 6,
    hook: "快晴日数1位は沖縄？",
    variant: "question",
  },
  {
    rankingKey: "retirement-allowance-admin-prefecture",
    order: 7,
    hook: "退職手当は県でいくら違う？",
    variant: "comparison",
  },
  {
    rankingKey: "consumption-expenditure-multi-person-households-per-month",
    order: 8,
    hook: "最も消費支出が多い県は？",
    variant: "question",
  },
];

/** validateHomeFeaturedRankings が参照する registry の最小形 (循環 import 回避のため注入する)。
 * MetricConfig と互換にするため isActive は optional (未定義 = inactive 扱い)。 */
export interface HomeFeaturedRegistryEntry {
  isActive?: boolean;
  entities: readonly string[];
  title: string;
}

/**
 * ホーム注目ランキング設定の決定的 validation (仕様 §4.2)。
 * build/test 時に呼び、違反があれば理由の配列を返す (空配列 = 妥当)。
 */
export function validateHomeFeaturedRankings(
  definitions: readonly HomeFeaturedRankingDefinition[],
  registry: Record<string, HomeFeaturedRegistryEntry | undefined>,
): string[] {
  const errors: string[] = [];

  if (definitions.length !== 8) {
    errors.push(`初期実装は 8 件固定 (実際: ${definitions.length})`);
  }

  const seenKeys = new Set<string>();
  const seenOrders = new Set<number>();
  for (const def of definitions) {
    if (seenKeys.has(def.rankingKey)) errors.push(`rankingKey 重複: ${def.rankingKey}`);
    seenKeys.add(def.rankingKey);
    if (seenOrders.has(def.order)) errors.push(`order 重複: ${def.order}`);
    seenOrders.add(def.order);

    const entry = registry[def.rankingKey];
    if (!entry) {
      errors.push(`METRICS_REGISTRY に不在: ${def.rankingKey}`);
    } else {
      if (!entry.isActive) errors.push(`isActive でない: ${def.rankingKey}`);
      if (!entry.entities.includes("prefecture")) {
        errors.push(`entities に prefecture が無い: ${def.rankingKey}`);
      }
    }

    if (def.hook.includes("\n")) errors.push(`hook に改行: ${def.rankingKey}`);
    const hookLength = [...def.hook].length;
    if (hookLength < 8 || hookLength > 28) {
      errors.push(`hook 長 ${hookLength} (8〜28 のみ): ${def.rankingKey}`);
    }
    if (!(HOME_FEATURED_CARD_VARIANTS as readonly string[]).includes(def.variant)) {
      errors.push(`variant が allowlist 外: ${def.rankingKey} (${def.variant})`);
    }

    // 観測値の固定埋め込み検知: 桁区切り数値 / 数値+単位。順位表現 (1位・上位3県) は許容
    if (/\d{1,3}(,\d{3})+/.test(def.hook) || /\d+(\.\d+)?(%|％|円|人|世帯|時間|kg|km)/.test(def.hook)) {
      errors.push(`hook に観測値らしき数値: ${def.rankingKey} (${def.hook})`);
    }
    // データ年度の固定埋め込み検知: 4 桁年は rankingKey (指標定義) に含まれる場合のみ許容
    for (const year of def.hook.match(/(19|20)\d{2}/g) ?? []) {
      if (!def.rankingKey.includes(year)) {
        errors.push(`hook にデータ年度らしき年: ${def.rankingKey} (${year})`);
      }
    }
  }

  // order は 1 始まりの連番
  const orders = definitions.map((d) => d.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) {
      errors.push(`order が 1 始まりの連番でない: ${orders.join(",")}`);
      break;
    }
  }

  return errors;
}
