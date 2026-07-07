/**
 * 統計ランキング → 公務員AI ファネル CTA の設定 (単一ソース)。
 *
 * 遷移先 URL・UTM・表示対象カテゴリをここ 1 箇所で管理する。
 * 文言・リンク・対象面を変えるときは本ファイルだけを編集すればよい。
 */

/**
 * 買い切りガイド (note マガジン) の遷移先 URL。
 * 「自治体職員の e-Stat × Claude Code 完全ガイド」マガジン。
 *
 * 差し替えるときはこの定数を編集する (UTM は buildKomuinAiGuideUrl が付与)。
 * 環境変数 `NEXT_PUBLIC_KOMUIN_AI_GUIDE_URL` があればそれを優先する
 * (Cloudflare 側で一時的に差し替えたい場合の逃げ道)。
 */
const KOMUIN_AI_GUIDE_URL =
  process.env.NEXT_PUBLIC_KOMUIN_AI_GUIDE_URL?.trim() ||
  "https://note.com/stats47/m/m1b836e4c8dce";

/**
 * 遷移先 URL に UTM を付与して返す。
 * GA4 の `cta_click` イベントと二重で計測できるようにする
 * (イベント = サイト内即時、UTM = 遷移先セッションの流入元)。
 *
 * @param rankingKey どのランキングページからの流入か (utm_content)
 */
export function buildKomuinAiGuideUrl(rankingKey: string): string {
  const url = new URL(KOMUIN_AI_GUIDE_URL);
  url.searchParams.set("utm_source", "stats47");
  url.searchParams.set("utm_medium", "ranking_cta");
  url.searchParams.set("utm_campaign", "komuin_ai_guide");
  if (rankingKey) {
    url.searchParams.set("utm_content", rankingKey);
  }
  return url.toString();
}

/**
 * CTA を表示する対象カテゴリ (17 軸の categoryKey)。
 *
 * `null` = 全ランキングページに表示する (現在の運用: まず全面展開して
 * GA4 でカテゴリ別 CTR を観測する)。特定カテゴリに絞りたくなったら、
 * ここに categoryKey を列挙するだけで対象面を狭められる。
 *
 * 例 (公務員・データ業務が濃い面に絞る場合):
 *   ["population", "laborwage", "economy", "administrativefinancial", "socialsecurity"]
 */
export const FUNNEL_CTA_TARGET_CATEGORIES: readonly string[] | null = null;

/**
 * 指定カテゴリで CTA を表示すべきか判定する。
 */
export function shouldShowFunnelCta(categoryKey?: string): boolean {
  if (FUNNEL_CTA_TARGET_CATEGORIES === null) return true;
  if (!categoryKey) return false;
  return FUNNEL_CTA_TARGET_CATEGORIES.includes(categoryKey);
}
