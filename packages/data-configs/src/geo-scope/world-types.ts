import evaluationsData from "../../../../data/open-data/world/provider-evaluations.json";
import catalogsData from "../../../../data/open-data/world/catalogs.json";

/**
 * `/world` (国際比較) の型契約 (GEO-SCOPE-SEPARATION-01 WP7)。
 *
 * ★このファイルは契約の確定のみを目的とし、データ取得・生成・route 実装は含まない
 *   (doc 43 §7 WP7 step 1「国際データ取得は別 backlog へ分離する」)。`WORLD_CATALOGS` は
 *   意図的に空のまま残す — 空でなければ「採用済みテーマがある」という誤ったシグナルになる。
 *
 * ★`/japan` (`JapanAvailability`/`JapanSeriesArtifact`) との構造上の違い:
 *   Japan は「47都道府県の観測値を 1 つの全国値に集約する」(0 or 1 行/年)。
 *   World は「各国 (ISO コード) を横並びで比較する」(N 行/年、Japan はその中の 1 行)。
 *   つまり `/world` は `/japan` (集約) ではなく `/themes` (比較) に近い形をとる
 *   (国 = 都道府県の役割)。この非対称性を型で明示するため、`JapanAvailability` を
 *   流用・拡張せず独立した型を持つ (doc 43 §5「将来の world は ISO 国コードと
 *   source provenance を持たせる」)。
 */

/**
 * ある metric について、日本の値を国際比較可能な形で取得できるか。
 * `JapanAvailability` と役割は同じ (推測でデータを埋めない判別可能 union) だが、
 * 問うている内容が異なる: 「e-Stat の全国行があるか」ではなく
 * 「国際機関 (OECD/World Bank/UN 等) が日本を含む比較可能な行を公表しているか」。
 */
export type WorldAvailability =
  | { status: "official"; provider: WorldDataProvider }
  | { status: "derived-additive"; provider: WorldDataProvider; recipeKey: string }
  | { status: "derived-ratio"; provider: WorldDataProvider; recipeKey: string }
  | { status: "unsupported"; reason: string }
  | { status: "unknown" };

/**
 * 国際データ源の候補 (read-only 机上評価のみ・2026-08-20)。
 * 実データ取得は別 backlog (未着手)。ライセンス・カバレッジは WebSearch による
 * 実測済み一次情報 (アクセス日 2026-08-20) — `.claude/rules/evidence-based-judgment.md` 準拠。
 * 再検証せず古い記憶で機能追加しないこと (ライセンス・レート制限は変わりうる)。
 */
export const WORLD_DATA_PROVIDER_CANDIDATES = ["oecd", "world-bank", "un-data"] as const;
export type WorldDataProvider = (typeof WORLD_DATA_PROVIDER_CANDIDATES)[number];

export interface WorldDataProviderEvaluation {
  provider: WorldDataProvider;
  displayName: string;
  license: string;
  /** read-only 机上評価の根拠 URL (アクセス日を併記) */
  sourceUrl: string;
  accessedAt: string;
  /** カバレッジ・更新頻度・注意点 */
  notes: string;
}

/**
 * WP7 の read-only 机上評価。記録の正本は台帳 `open-data.world-provider-evaluations` (data/open-data/world/provider-evaluations.json)。
 * 実データ未取得のため `hasJapanRow` 等の実測フィールドは
 * 持たない (推測しない)。各 provider の実データ取得可否は、実装着手時に metric ごとの
 * getStatsData 相当の実 fetch で確認する (WP0/WP6 と同じ「行の存在だけでなく値レベルで
 * 確認する」規律を踏襲する)。
 */
export const WORLD_DATA_PROVIDER_EVALUATIONS: readonly WorldDataProviderEvaluation[] =
  evaluationsData.evaluations as WorldDataProviderEvaluation[];

export interface WorldCatalogMetric {
  metricKey: string;
  shortLabel: string;
}

/** `JapanCatalogTheme` と同型 (意図的な対称性)。空のまま Phase 1 を終える。 */
export interface WorldCatalogTheme {
  themeSlug: string;
  title: string;
  description: string;
  keywords: string[];
  metrics: WorldCatalogMetric[];
}

/**
 * 記録の正本は台帳 `open-data.world-catalogs` (data/open-data/world/catalogs.json)。
 * ★Phase 1 では意図的に空。ここへ 1 件でも追加する前に、対象 metric の日本行を
 * 実 fetch で値レベル確認すること (推測で埋めない。WP0/WP6 と同じ規律)。
 * `/world` route・middleware・sitemap は、このカタログが非空になってから WP8 以降で追加する
 * (空カタログの route を先に公開すると thin content になる)。
 */
export const WORLD_CATALOGS: Record<string, WorldCatalogTheme> = catalogsData.themes;

export function getWorldCatalogTheme(themeSlug: string): WorldCatalogTheme | undefined {
  return WORLD_CATALOGS[themeSlug];
}

export function listWorldCatalogThemes(): WorldCatalogTheme[] {
  return Object.values(WORLD_CATALOGS);
}
