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
 * WP7 の read-only 机上評価。実データ未取得のため `hasJapanRow` 等の実測フィールドは
 * 持たない (推測しない)。各 provider の実データ取得可否は、実装着手時に metric ごとの
 * getStatsData 相当の実 fetch で確認する (WP0/WP6 と同じ「行の存在だけでなく値レベルで
 * 確認する」規律を踏襲する)。
 */
export const WORLD_DATA_PROVIDER_EVALUATIONS: readonly WorldDataProviderEvaluation[] = [
  {
    provider: "world-bank",
    displayName: "World Bank Open Data (World Development Indicators)",
    license: "CC BY 4.0 (商用利用可・要出典表示)",
    sourceUrl: "https://data.worldbank.org/summary-terms-of-use",
    accessedAt: "2026-08-20",
    notes:
      "3候補中最も許諾が明確 (CC BY 4.0)。World Development Indicators は日本を含む全加盟国を" +
      "収録。API は無料・レート制限の明記は見当たらないが常識的な利用が前提。第一候補。",
  },
  {
    provider: "oecd",
    displayName: "OECD Data Explorer",
    license: "OECD Terms & Conditions に基づく無料 API (再配布条件は要個別確認)",
    sourceUrl: "https://www.oecd.org/en/about/terms-conditions.html",
    accessedAt: "2026-08-20",
    notes:
      "SDMX ベースの構造化 API (e-Stat と親和性が高い)。60 件/時間のレート制限あり・" +
      "VPN/匿名トラフィック不可。日本は OECD 加盟国なので収録される可能性が高いが、" +
      "指標ごとの日本行の有無は個別確認が要る。OECD 加盟国限定のため世界全体比較には不向き。",
  },
  {
    provider: "un-data",
    displayName: "UNdata (UN Statistics Division)",
    license: "無料・「UNdata を出典として引用すること」が条件。CC 等の明示ライセンスではない",
    sourceUrl: "https://data.un.org/Host.aspx?Content=UNdataUse",
    accessedAt: "2026-08-20",
    notes:
      "3候補中カバレッジは最も広い可能性があるが、ライセンス文言が CC BY のような明確な" +
      "商用利用許諾ではなく「正確性を保証しない」旨の免責が強い。採用する場合は利用規約の" +
      "再読と、商用サイトでの利用可否の確認が別途要る。",
  },
];

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
 * ★Phase 1 では意図的に空。ここへ 1 件でも追加する前に、対象 metric の日本行を
 * 実 fetch で値レベル確認すること (推測で埋めない。WP0/WP6 と同じ規律)。
 * `/world` route・middleware・sitemap は、このカタログが非空になってから WP8 以降で追加する
 * (空カタログの route を先に公開すると thin content になる)。
 */
export const WORLD_CATALOGS: Record<string, WorldCatalogTheme> = {};

export function getWorldCatalogTheme(themeSlug: string): WorldCatalogTheme | undefined {
  return WORLD_CATALOGS[themeSlug];
}

export function listWorldCatalogThemes(): WorldCatalogTheme[] {
  return Object.values(WORLD_CATALOGS);
}
