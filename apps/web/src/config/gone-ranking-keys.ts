/**
 * 退役した ranking キー一覧（410 Gone を返す）
 *
 * 実体は key SSOT として `@stats47/ranking/config` に移設済み
 * (2026-08-05)。**中身の編集は移設先で行う**。
 *
 * 移設した理由: middleware が 410 を返すキーは、同時に
 * **一覧・サイドバー・sitemap からリンクを消す**必要がある。そのリンク生成は
 * packages/ranking の R2 リーダが担っており、apps/web の定数を import できない。
 * 定数が apps 側にしか無かった間は「middleware は 410 / R2 snapshot はまだリンクを載せている」
 * という窓が退役のたびに生まれていた (R2 は main へのデプロイ後にしか更新できないため構造的に不可避)。
 * KNOWN_RANKING_KEYS が同じ理由で先に移設済みで、本ファイルはその対の片割れ。
 *
 * 本ファイルは後方互換の re-export。importer は従来どおり `@/config/gone-ranking-keys` で可。
 */
export { GONE_RANKING_KEYS } from "@stats47/ranking/config";
